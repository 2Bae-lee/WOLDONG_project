import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import {
    ApiError,
    ScheduleDetail,
    getSchedule,
    updateScheduleChecklist,
} from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

const formatDate = (date: string) => date.replaceAll('-', '.');

export default function CompanionOutingRecord() {
    const params = useLocalSearchParams<{
        scheduleId?: string;
        childName?: string;
        journalUpdated?: string;
    }>();
    const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingItemId, setUpdatingItemId] = useState('');

    useEffect(() => {
        let active = true;

        const loadSchedule = async () => {
            if (!params.scheduleId) {
                setError('일정 ID가 없어 외출 기록을 불러올 수 없어요.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const response = await getSchedule(params.scheduleId);
                if (active) setSchedule(response.data ?? null);
            } catch (loadError) {
                if (active) {
                    setError(loadError instanceof ApiError
                        ? loadError.message
                        : '외출 기록을 불러오지 못했어요.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadSchedule();

        return () => {
            active = false;
        };
    }, [params.scheduleId, params.journalUpdated]);

    const toggleChecklist = async (itemId: string, nextChecked: boolean) => {
        if (!schedule || updatingItemId) return;

        const previousChecklist = schedule.checklist;
        setUpdatingItemId(itemId);
        setError('');
        setSchedule({
            ...schedule,
            checklist: schedule.checklist.map((item) => (
                item.item_id === itemId ? { ...item, is_checked: nextChecked } : item
            )),
        });

        try {
            await updateScheduleChecklist(schedule.schedule_id, itemId, nextChecked);
        } catch (updateError) {
            setSchedule({ ...schedule, checklist: previousChecklist });
            setError(updateError instanceof ApiError
                ? updateError.message
                : '체크리스트를 업데이트하지 못했어요.');
        } finally {
            setUpdatingItemId('');
        }
    };

    const openCommentEditor = () => {
        if (!schedule) return;

        router.push({
            pathname: '/companion_home/child_comment_edit',
            params: {
                scheduleId: schedule.schedule_id,
                childName: params.childName ?? '',
                journal: JSON.stringify(schedule.journal ?? null),
            },
        } as any);
    };

    const place = schedule?.destination || schedule?.place_type || '장소 정보 없음';
    const transport = schedule?.transport || schedule?.transport_type || '이동수단 정보 없음';

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.inner}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.logoArea}>
                <View style={styles.logoRow}>
                    <BackButton />
                    <Text style={styles.logoTitle}>월동</Text>
                    <Image
                        source={require('../../assets/images/canola_flower_small.png')}
                        style={styles.logoFlower}
                        resizeMode="contain"
                    />
                </View>
            </View>

            <View style={styles.headerArea}>
                <Text style={styles.title}>외출 후 기록</Text>
                <Text style={styles.description}>체크리스트와 아이의 이동 반응을 정리해요.</Text>
            </View>

            {loading ? (
                <View style={styles.card}>
                    <Text style={styles.emptyText}>외출 기록을 불러오는 중이에요.</Text>
                </View>
            ) : error && !schedule ? (
                <View style={styles.card}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : schedule ? (
                <>
                    <View style={styles.heroCard}>
                        <View style={styles.heroIcon}>
                            <Ionicons name="calendar-outline" size={23} color={Colors.text} />
                        </View>
                        <View style={styles.heroTextArea}>
                            <Text style={styles.heroTitle}>{schedule.title}</Text>
                            <Text style={styles.heroMeta}>
                                {formatDate(schedule.date)} · {schedule.start_time}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>외출 정보</Text>
                        <Text style={styles.infoText}>장소: {place}</Text>
                        <Text style={styles.infoText}>이동수단: {transport}</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>체크리스트</Text>
                        {schedule.checklist.length > 0 ? (
                            <View style={styles.listArea}>
                                {schedule.checklist.map((item) => (
                                    <Pressable
                                        key={item.item_id}
                                        style={styles.checkRow}
                                        onPress={() => toggleChecklist(item.item_id, !item.is_checked)}
                                    >
                                        <Ionicons
                                            name={item.is_checked ? 'checkmark-circle' : 'ellipse-outline'}
                                            size={20}
                                            color={item.is_checked ? Colors.highlight1 : Colors.textShadow}
                                        />
                                        <Text style={[
                                            styles.checkText,
                                            item.is_checked && styles.checkedText,
                                        ]}>
                                            {item.content}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>등록된 체크리스트가 없어요.</Text>
                        )}
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>동행일지</Text>
                            <Pressable style={styles.smallButton} onPress={openCommentEditor}>
                                <Ionicons name="pencil" size={15} color={Colors.text} />
                                <Text style={styles.smallButtonText}>
                                    {schedule.journal ? '코멘트 수정' : '코멘트 작성'}
                                </Text>
                            </Pressable>
                        </View>
                        {schedule.journal ? (
                            <View style={styles.journalArea}>
                                <Text style={styles.journalLabel}>아이 반응</Text>
                                <Text style={styles.journalText}>{schedule.journal.reaction || '기록 없음'}</Text>
                                <Text style={styles.journalLabel}>어려웠던 점</Text>
                                <Text style={styles.journalText}>{schedule.journal.difficulties || '기록 없음'}</Text>
                                <Text style={styles.journalLabel}>메모</Text>
                                <Text style={styles.journalText}>{schedule.journal.memo || '기록 없음'}</Text>
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>아직 동행일지가 없어요.</Text>
                        )}
                    </View>
                </>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: Colors.pageBg,
    },
    inner: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 18,
        paddingBottom: 90,
    },
    logoArea: {
        alignItems: 'flex-start',
        marginBottom: 26,
        marginLeft: -20,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoTitle: {
        fontFamily: Fonts.title,
        fontSize: 38,
        color: Colors.black,
    },
    logoFlower: {
        width: 22,
        height: 22,
        marginLeft: -5,
        marginTop: -26,
        transform: [{ rotate: '-18deg' }],
    },
    headerArea: {
        marginBottom: 24,
    },
    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },
    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.textShadow,
    },
    heroCard: {
        minHeight: 82,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 14,
    },
    heroIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: Colors.pageBg2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    heroTextArea: {
        flex: 1,
    },
    heroTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 5,
    },
    heroMeta: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 16,
        marginBottom: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    cardTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },
    infoText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.text,
    },
    listArea: {
        gap: 10,
    },
    checkRow: {
        minHeight: 34,
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkText: {
        flex: 1,
        marginLeft: 8,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.text,
    },
    checkedText: {
        color: Colors.textShadow,
    },
    smallButton: {
        minHeight: 32,
        borderRadius: 16,
        backgroundColor: Colors.pageBg2,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    smallButtonText: {
        marginLeft: 5,
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
    },
    journalArea: {
        gap: 6,
    },
    journalLabel: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.textShadow,
    },
    journalText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.text,
        marginBottom: 6,
    },
    emptyText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textShadow,
    },
    errorText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.highlight3,
        marginBottom: 12,
    },
});
