import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import BackButton from '../../components/BackButton';
import {
    ApiError,
    ScheduleDetail,
    ScheduleJournal,
    TodayScheduleSummary,
    getSchedule,
    getSchedules,
} from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

const formatDate = (date: string) => date.replaceAll('-', '.');

const listOrEmpty = (items?: string[]) => (
    items?.filter((item) => item.trim()) ?? []
);

type DayOuting = {
    scheduleId: string;
    title: string;
    date: string;
    startTime: string;
};

const getTimeValue = (time?: string) => {
    const [hourText, minuteText] = (time || '').split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (Number.isNaN(hour) || Number.isNaN(minute)) return Number.MAX_SAFE_INTEGER;
    return hour * 60 + minute;
};

const toDayOuting = (schedule: TodayScheduleSummary): DayOuting => ({
    scheduleId: schedule.schedule_id,
    title: schedule.title,
    date: schedule.date,
    startTime: schedule.start_time,
});

const sortDayOutings = (outings: DayOuting[]) => (
    [...outings].sort((a, b) => (
        getTimeValue(a.startTime) - getTimeValue(b.startTime) ||
        a.title.localeCompare(b.title)
    ))
);

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
                <Ionicons name={icon} size={17} color={Colors.text} />
            </View>
            <View style={styles.infoTextArea}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

function ItemList({ items, emptyText }: { items: string[]; emptyText: string }) {
    if (items.length === 0) {
        return <Text style={styles.emptyText}>{emptyText}</Text>;
    }

    return (
        <View style={styles.listArea}>
            {items.map((item) => (
                <View key={item} style={styles.listRow}>
                    <Ionicons name="checkmark-circle" size={17} color={Colors.highlight1} />
                    <Text style={styles.listText}>{item}</Text>
                </View>
            ))}
        </View>
    );
}

function JournalCard({ journal }: { journal?: ScheduleJournal | null }) {
    if (!journal) {
        return (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>동행일지</Text>
                <Text style={styles.emptyText}>아직 기록된 동행일지가 없어요.</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>동행일지</Text>
            <View style={styles.journalBlock}>
                <Text style={styles.journalLabel}>아이 반응</Text>
                <Text style={styles.journalText}>{journal.reaction || '기록 없음'}</Text>
            </View>
            <View style={styles.journalBlock}>
                <Text style={styles.journalLabel}>힘들었던 점</Text>
                <Text style={styles.journalText}>{journal.difficulties || '기록 없음'}</Text>
            </View>
            <View style={styles.journalBlock}>
                <Text style={styles.journalLabel}>메모</Text>
                <Text style={styles.journalText}>{journal.memo || '기록 없음'}</Text>
            </View>
            {journal.recorded_at ? (
                <Text style={styles.recordedAt}>{journal.recorded_at}</Text>
            ) : null}
        </View>
    );
}

export default function OutingRecordScreen() {
    const params = useLocalSearchParams<{
        scheduleId?: string;
        title?: string;
        childName?: string;
        commentUpdated?: string;
    }>();
    const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
    const [activeScheduleId, setActiveScheduleId] = useState(params.scheduleId ?? '');
    const [dayOutings, setDayOutings] = useState<DayOuting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setActiveScheduleId(params.scheduleId ?? '');
    }, [params.scheduleId]);

    useEffect(() => {
        let active = true;

        const loadSchedule = async () => {
            if (!activeScheduleId) {
                setError('일정 ID가 없어 외출 기록을 불러올 수 없어요.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const response = await getSchedule(activeScheduleId);
                const nextSchedule = response.data ?? null;

                if (active) {
                    setSchedule(nextSchedule);
                }

                if (!nextSchedule) {
                    if (active) setDayOutings([]);
                    return;
                }

                try {
                    const schedulesResponse = await getSchedules();
                    const sameDayOutings = (schedulesResponse.data ?? [])
                        .filter((item) => (
                            item.date === nextSchedule.date &&
                            (!nextSchedule.child_id || item.child_id === nextSchedule.child_id)
                        ))
                        .map(toDayOuting);
                    const hasActiveOuting = sameDayOutings.some((item) => (
                        item.scheduleId === nextSchedule.schedule_id
                    ));
                    const nextDayOutings = sortDayOutings(hasActiveOuting
                        ? sameDayOutings
                        : [
                            ...sameDayOutings,
                            {
                                scheduleId: nextSchedule.schedule_id,
                                title: nextSchedule.title,
                                date: nextSchedule.date,
                                startTime: nextSchedule.start_time,
                            },
                        ]);

                    if (active) setDayOutings(nextDayOutings);
                } catch {
                    if (active) {
                        setDayOutings([{
                            scheduleId: nextSchedule.schedule_id,
                            title: nextSchedule.title,
                            date: nextSchedule.date,
                            startTime: nextSchedule.start_time,
                        }]);
                    }
                }
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
    }, [activeScheduleId, params.commentUpdated]);

    const childTraits = schedule?.child_traits;
    const checklist = schedule?.checklist ?? [];
    const place = schedule?.destination || schedule?.place_type || '장소 정보 없음';
    const transport = schedule?.transport || schedule?.transport_type || '이동수단 정보 없음';
    const activeOutingIndex = dayOutings.findIndex((outing) => outing.scheduleId === schedule?.schedule_id);
    const outingPosition = activeOutingIndex >= 0 ? activeOutingIndex + 1 : 1;
    const outingCount = Math.max(dayOutings.length, schedule ? 1 : 0);
    const canGoPrevious = activeOutingIndex > 0;
    const canGoNext = activeOutingIndex >= 0 && activeOutingIndex < dayOutings.length - 1;

    const moveOuting = (direction: -1 | 1) => {
        const nextIndex = activeOutingIndex + direction;
        const nextOuting = dayOutings[nextIndex];

        if (!nextOuting) return;
        setActiveScheduleId(nextOuting.scheduleId);
    };

    const openCommentEditor = () => {
        if (!schedule?.child_id) return;

        router.push({
            pathname: '/paraent_home/child_comment_edit',
            params: {
                childId: schedule.child_id,
                scheduleId: schedule.schedule_id,
                childName: params.childName ?? '',
                traits: JSON.stringify(childTraits ?? {}),
                journal: JSON.stringify(schedule.journal ?? null),
            },
        } as any);
    };

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
                <Text style={styles.title}>외출 기록</Text>
                <Text style={styles.description}>
                    동행일지와 이번 외출에서 확인한 아이 정보를 함께 봐요.
                </Text>
            </View>

            {loading ? (
                <View style={styles.card}>
                    <Text style={styles.emptyText}>외출 기록을 불러오고 있어요.</Text>
                </View>
            ) : error ? (
                <View style={styles.card}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : schedule ? (
                <>
                    <View style={styles.heroCard}>
                        <View style={styles.heroMainRow}>
                            <View style={styles.heroIcon}>
                                <Ionicons name="calendar-outline" size={24} color={Colors.text} />
                            </View>
                            <View style={styles.heroTextArea}>
                                <Text style={styles.heroTitle}>{schedule.title}</Text>
                                <Text style={styles.heroMeta}>
                                    {formatDate(schedule.date)} · {schedule.start_time} · {schedule.status}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.outingPager}>
                            <Pressable
                                style={[styles.pagerButton, !canGoPrevious && styles.pagerButtonDisabled]}
                                onPress={() => moveOuting(-1)}
                                disabled={!canGoPrevious}
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={20}
                                    color={canGoPrevious ? Colors.text : Colors.textShadow}
                                />
                            </Pressable>
                            <Text style={styles.pagerText}>
                                {formatDate(schedule.date)} {outingPosition}/{outingCount}
                            </Text>
                            <Pressable
                                style={[styles.pagerButton, !canGoNext && styles.pagerButtonDisabled]}
                                onPress={() => moveOuting(1)}
                                disabled={!canGoNext}
                            >
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={canGoNext ? Colors.text : Colors.textShadow}
                                />
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>외출 정보</Text>
                        <InfoRow icon="location-outline" label="장소" value={place} />
                        <InfoRow icon="bus-outline" label="이동수단" value={transport} />
                        <InfoRow
                            icon="time-outline"
                            label="환경"
                            value={[
                                schedule.wait_possible ? '대기 가능성 있음' : '',
                                schedule.crowd_possible ? '혼잡 가능성 있음' : '',
                            ].filter(Boolean).join(' · ') || '특이사항 없음'}
                        />
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>준비물</Text>
                        <ItemList items={listOrEmpty(schedule.preparations)} emptyText="등록된 준비물이 없어요." />
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>체크리스트</Text>
                        {checklist.length > 0 ? (
                            <View style={styles.listArea}>
                                {checklist.map((item) => (
                                    <View key={item.item_id} style={styles.listRow}>
                                        <Ionicons
                                            name={item.is_checked ? 'checkmark-circle' : 'ellipse-outline'}
                                            size={17}
                                            color={item.is_checked ? Colors.highlight1 : Colors.textShadow}
                                        />
                                        <Text style={[
                                            styles.listText,
                                            item.is_checked && styles.checkedText,
                                        ]}>
                                            {item.content}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>등록된 체크리스트가 없어요.</Text>
                        )}
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>아동 특성</Text>
                            <Pressable style={styles.smallButton} onPress={openCommentEditor}>
                                <Ionicons name="pencil" size={15} color={Colors.text} />
                                <Text style={styles.smallButtonText}>코멘트 수정</Text>
                            </Pressable>
                        </View>
                        <ItemList
                            items={[
                                ...listOrEmpty(childTraits?.caution_situations),
                                childTraits?.required_actions ? `필수 행동: ${childTraits.required_actions}` : '',
                                ...listOrEmpty(childTraits?.calming_methods).map((item) => `진정법: ${item}`),
                                childTraits?.avoid_behaviors ? `피해야 할 행동: ${childTraits.avoid_behaviors}` : '',
                                ...listOrEmpty(childTraits?.difficult_environments).map((item) => `힘든 환경: ${item}`),
                                childTraits?.notice_time ? `예고 시간: ${childTraits.notice_time}` : '',
                            ].filter(Boolean)}
                            emptyText="아동 특성 정보가 아직 없어요."
                        />
                    </View>

                    <JournalCard journal={schedule.journal} />
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
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 16,
        marginBottom: 14,
    },

    heroMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
        fontSize: 19,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
    },

    heroMeta: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
    },

    outingPager: {
        minHeight: 42,
        borderRadius: 21,
        backgroundColor: Colors.pageBg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingHorizontal: 8,
    },

    pagerButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.pageBg2,
    },

    pagerButtonDisabled: {
        opacity: 0.45,
    },

    pagerText: {
        flex: 1,
        textAlign: 'center',
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },

    card: {
        borderRadius: 18,
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
        marginBottom: 12,
    },

    cardTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 17,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 12,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    infoIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.pageBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    infoTextArea: {
        flex: 1,
    },

    infoLabel: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textShadow,
        marginBottom: 2,
    },

    infoValue: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    listArea: {
        gap: 9,
    },

    listRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },

    listText: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.text,
    },

    checkedText: {
        color: '#A9A196',
    },

    emptyText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textShadow,
    },

    errorText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.highlight3,
    },

    smallButton: {
        minHeight: 34,
        borderRadius: 17,
        backgroundColor: Colors.pageBg2,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 11,
        gap: 5,
    },

    smallButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.text,
    },

    journalBlock: {
        marginBottom: 12,
    },

    journalLabel: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
    },

    journalText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.text,
    },

    recordedAt: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textShadow,
        marginTop: 2,
    },
});
