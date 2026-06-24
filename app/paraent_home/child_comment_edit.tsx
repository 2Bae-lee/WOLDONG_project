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
    updateChildProfile,
} from '../../constants/Api';
import { normalizeChildProfileLabel, normalizeChildProfileLabels } from '../../constants/ChildProfileLabels';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

type ChildTraits = {
    caution_situations?: string[];
    required_actions?: string;
    calming_methods?: string[];
    avoid_behaviors?: string;
    difficult_environments?: string[];
    notice_time?: string;
};

const parseJson = <T,>(value: string | undefined, fallback: T): T => {
    if (!value) return fallback;

    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
};

const toLines = (items?: string[]) => normalizeChildProfileLabels(items ?? []).join('\n');

const normalizeDelimitedText = (value?: string) => (
    normalizeChildProfileLabels(
        value
            ? value.split(/\n|,/).map((item) => item.trim()).filter(Boolean)
            : []
    ).join('\n')
);

const parseLines = (value: string) => (
    value
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
);

export default function ChildCommentEditScreen() {
    const params = useLocalSearchParams<{
        childId?: string;
        scheduleId?: string;
        childName?: string;
        traits?: string;
        journal?: string;
    }>();
    const traits = useMemo(() => parseJson<ChildTraits>(params.traits, {}), [params.traits]);
    const journal = useMemo(() => parseJson<ScheduleJournal | null>(params.journal, null), [params.journal]);
    const [cautionSituations, setCautionSituations] = useState(toLines(traits.caution_situations));
    const [requiredActions, setRequiredActions] = useState(normalizeDelimitedText(traits.required_actions));
    const [calmingMethods, setCalmingMethods] = useState(toLines(traits.calming_methods));
    const [avoidBehaviors, setAvoidBehaviors] = useState(normalizeDelimitedText(traits.avoid_behaviors));
    const [difficultEnvironments, setDifficultEnvironments] = useState(toLines(traits.difficult_environments));
    const [noticeTime, setNoticeTime] = useState(normalizeChildProfileLabel(traits.notice_time ?? ''));
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const saveComments = async () => {
        if (!params.childId) {
            setError('아동 ID가 없어 저장할 수 없어요.');
            return;
        }

        if (saving) return;

        setSaving(true);
        setError('');
        Keyboard.dismiss();

        try {
            await updateChildProfile(params.childId, {
                caution_situations: parseLines(cautionSituations),
                required_actions: requiredActions.trim(),
                calming_methods: parseLines(calmingMethods),
                avoid_behaviors: avoidBehaviors.trim(),
                difficult_environments: parseLines(difficultEnvironments),
                notice_time: noticeTime.trim(),
            });

            router.replace({
                pathname: '/paraent_home/outing_record',
                params: {
                    scheduleId: params.scheduleId ?? '',
                    childName: params.childName ?? '',
                    commentUpdated: String(Date.now()),
                },
            } as any);
        } catch (saveError) {
            setError(saveError instanceof ApiError
                ? saveError.message
                : '아동 코멘트를 저장하지 못했어요.');
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
                        이번 외출 기록을 바탕으로 다음 동행인이 볼 지침을 정리해요.
                    </Text>
                </View>

                {journal ? (
                    <View style={styles.journalCard}>
                        <Text style={styles.journalTitle}>이번 외출 메모</Text>
                        <View style={styles.journalRow}>
                            <Ionicons name="chatbubble-ellipses-outline" size={17} color={Colors.text} />
                            <Text style={styles.journalText}>{journal.reaction || '아이 반응 기록 없음'}</Text>
                        </View>
                        <View style={styles.journalRow}>
                            <Ionicons name="alert-circle-outline" size={17} color={Colors.text} />
                            <Text style={styles.journalText}>{journal.difficulties || '힘들었던 점 기록 없음'}</Text>
                        </View>
                        {journal.memo ? (
                            <View style={styles.journalRow}>
                                <Ionicons name="document-text-outline" size={17} color={Colors.text} />
                                <Text style={styles.journalText}>{journal.memo}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>주의 상황</Text>
                    <TextInput
                        style={styles.textArea}
                        value={cautionSituations}
                        onChangeText={setCautionSituations}
                        placeholder="ex) 갑자기 뛰어갈 수 있어요"
                        placeholderTextColor={Colors.textShadow}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>동행인이 해야 할 행동</Text>
                    <TextInput
                        style={styles.textArea}
                        value={requiredActions}
                        onChangeText={setRequiredActions}
                        placeholder="ex) 손을 꼭 잡고 이동해주세요"
                        placeholderTextColor={Colors.textShadow}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>진정 방법</Text>
                    <TextInput
                        style={styles.textArea}
                        value={calmingMethods}
                        onChangeText={setCalmingMethods}
                        placeholder="ex) 좋아하는 물건 보여주기"
                        placeholderTextColor={Colors.textShadow}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>피해야 할 행동</Text>
                    <TextInput
                        style={styles.textArea}
                        value={avoidBehaviors}
                        onChangeText={setAvoidBehaviors}
                        placeholder="ex) 큰 소리로 재촉하지 않기"
                        placeholderTextColor={Colors.textShadow}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>힘들어하는 환경</Text>
                    <TextInput
                        style={styles.textArea}
                        value={difficultEnvironments}
                        onChangeText={setDifficultEnvironments}
                        placeholder="ex) 큰 소리, 대기 시간"
                        placeholderTextColor={Colors.textShadow}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>미리 알림 시간</Text>
                    <TextInput
                        style={styles.input}
                        value={noticeTime}
                        onChangeText={setNoticeTime}
                        placeholder="ex) 10분 전"
                        placeholderTextColor={Colors.textShadow}
                    />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <PrimaryButton
                    label={saving ? '저장 중...' : '저장하기'}
                    width="100%"
                    onPress={saveComments}
                />
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
        marginBottom: 22,
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

    journalCard: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 15,
        marginBottom: 22,
        gap: 9,
    },

    journalTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 2,
    },

    journalRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },

    journalText: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.text,
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

    input: {
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.text,
    },

    textArea: {
        minHeight: 96,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 14,
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
    },

    errorText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.highlight3,
        marginBottom: 14,
    },
});
