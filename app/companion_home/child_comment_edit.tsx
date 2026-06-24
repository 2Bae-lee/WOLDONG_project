import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import {
    ApiError,
    ScheduleJournal,
    createScheduleJournal,
} from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

const parseJournal = (value?: string) => {
    if (!value) return null;

    try {
        return JSON.parse(value) as ScheduleJournal | null;
    } catch {
        return null;
    }
};

export default function CompanionChildCommentEdit() {
    const params = useLocalSearchParams<{
        scheduleId?: string;
        childName?: string;
        journal?: string;
    }>();
    const journal = useMemo(() => parseJournal(params.journal), [params.journal]);
    const [reaction, setReaction] = useState(journal?.reaction ?? '');
    const [difficulties, setDifficulties] = useState(journal?.difficulties ?? '');
    const [memo, setMemo] = useState(journal?.memo ?? '');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const saveJournal = async () => {
        const trimmedReaction = reaction.trim();
        const trimmedDifficulties = difficulties.trim();

        if (!params.scheduleId) {
            setError('일정 ID가 없어 동행일지를 저장할 수 없어요.');
            return;
        }

        if (!trimmedReaction || !trimmedDifficulties) {
            setError('아이 반응과 어려웠던 점을 모두 입력해주세요.');
            return;
        }

        if (saving) return;

        setSaving(true);
        setError('');
        Keyboard.dismiss();

        try {
            await createScheduleJournal(params.scheduleId, {
                reaction: trimmedReaction,
                difficulties: trimmedDifficulties,
                memo: memo.trim(),
            });

            router.replace({
                pathname: '/companion_home/outing_record',
                params: {
                    scheduleId: params.scheduleId,
                    childName: params.childName ?? '',
                    journalUpdated: String(Date.now()),
                },
            } as any);
        } catch (saveError) {
            setError(saveError instanceof ApiError
                ? saveError.message
                : '동행일지를 저장하지 못했어요.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.inner}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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
                    <Text style={styles.title}>아동 코멘트 수정</Text>
                    <Text style={styles.description}>
                        {params.childName || '아이'}의 외출 후 반응과 다음 동행에 필요한 메모를 남겨요.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>아이의 이동 반응</Text>
                    <TextInput
                        style={styles.textArea}
                        value={reaction}
                        onChangeText={(text) => {
                            setReaction(text);
                            if (error) setError('');
                        }}
                        placeholder="ex) 잘 따라왔어요"
                        placeholderTextColor={Colors.textShadow}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>어려웠던 점</Text>
                    <TextInput
                        style={styles.textArea}
                        value={difficulties}
                        onChangeText={(text) => {
                            setDifficulties(text);
                            if (error) setError('');
                        }}
                        placeholder="ex) 버스 탈 때 힘들어했어요"
                        placeholderTextColor={Colors.textShadow}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기타 메모</Text>
                    <TextInput
                        style={styles.textArea}
                        value={memo}
                        onChangeText={setMemo}
                        placeholder="ex) 다음엔 택시 이용 권장"
                        placeholderTextColor={Colors.textShadow}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <PrimaryButton
                    label={saving ? '저장 중...' : '동행일지 저장하기'}
                    width="100%"
                    onPress={saveJournal}
                />

                <View style={styles.noteCard}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.textShadow} />
                    <Text style={styles.noteText}>저장하면 보호자와 다음 동행인이 이 외출 기록을 함께 확인할 수 있어요.</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
        backgroundColor: Colors.pageBg,
    },
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
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },
    textArea: {
        minHeight: 104,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.text,
    },
    errorText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.highlight3,
        marginBottom: 12,
    },
    noteCard: {
        minHeight: 50,
        borderRadius: 14,
        backgroundColor: '#F7F4E8',
        borderWidth: 1,
        borderColor: '#E8DDC8',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginTop: 16,
    },
    noteText: {
        flex: 1,
        marginLeft: 8,
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.textShadow,
    },
});
