import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import BackButton from '../components/BackButton';
import PrimaryButton from '../components/PrimaryButton';
import {
    ApiError,
    SocialStoryResponse,
    SocialStorySpeed,
    SocialStoryTone,
    SocialStoryVoice,
    generateScheduleSocialStory,
    generateSocialStoryTts,
    toApiAssetUrl,
} from '../constants/Api';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

const toneOptions: { label: string; value: SocialStoryTone }[] = [
    { label: '다정', value: 'kind' },
    { label: '엄격', value: 'strict' },
];

const speedOptions: { label: string; value: SocialStorySpeed }[] = [
    { label: '느리게', value: 'slow' },
    { label: '중간', value: 'normal' },
    { label: '빠르게', value: 'fast' },
];

const voiceOptions: { label: string; value: SocialStoryVoice }[] = [
    { label: '여자', value: 'female' },
    { label: '남자', value: 'male' },
];

const parseCheckedItems = (value?: string) => {
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter((item) => typeof item === 'string' && item.trim());
    } catch {
        return [];
    }
};

export default function SocialStoryScreen() {
    const params = useLocalSearchParams<{
        scheduleId?: string;
        title?: string;
        childName?: string;
        script?: string;
        checkedItems?: string;
    }>();
    const checkedItems = useMemo(() => parseCheckedItems(params.checkedItems), [params.checkedItems]);
    const [script, setScript] = useState(
        params.script || (params.title ? `오늘은 ${params.title} 일정이 있어요.` : '오늘은 병원에 가요.')
    );
    const [tone, setTone] = useState<SocialStoryTone>('kind');
    const [speed, setSpeed] = useState<SocialStorySpeed>('normal');
    const [voice, setVoice] = useState<SocialStoryVoice>('female');
    const [result, setResult] = useState<SocialStoryResponse | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const audioUrl = toApiAssetUrl(result?.audio_url);

    const generateStory = async () => {
        const trimmedScript = script.trim();
        if (!trimmedScript || loading) {
            setError('아이에게 들려줄 기본 문장을 입력해주세요.');
            return;
        }

        Keyboard.dismiss();
        setLoading(true);
        setError('');

        try {
            const response = params.scheduleId
                ? await generateScheduleSocialStory(params.scheduleId, {
                    script: trimmedScript,
                    tone,
                    speed,
                    voice,
                })
                : await generateSocialStoryTts({
                    script: trimmedScript,
                    tone,
                    speed,
                    voice,
                    checked_items: checkedItems,
                    threshold: 0.5,
                });

            setResult(response);
        } catch (storyError) {
            setResult(null);
            setError(storyError instanceof ApiError
                ? storyError.message
                : '소셜 스토리를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const openAudio = async () => {
        if (!audioUrl) return;

        const canOpen = await Linking.canOpenURL(audioUrl);
        if (canOpen) {
            await Linking.openURL(audioUrl);
            return;
        }

        setError('음성 파일을 열 수 없어요.');
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
                            source={require('../assets/images/canola_flower_small.png')}
                            style={styles.logoFlower}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                <View style={styles.headerArea}>
                    <Text style={styles.title}>소셜 스토리 만들기</Text>
                    <Text style={styles.description}>
                        {params.childName || '아이'}에게 들려줄 외출 이야기를 준비해요.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 문장</Text>
                    <TextInput
                        style={styles.textArea}
                        value={script}
                        onChangeText={(text) => {
                            setScript(text);
                            if (error) setError('');
                        }}
                        placeholder="ex) 오늘은 병원에 가요."
                        placeholderTextColor={Colors.textShadow}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>말투</Text>
                    <View style={styles.optionRow}>
                        {toneOptions.map((option) => (
                            <Pressable
                                key={option.value}
                                style={[styles.optionButton, tone === option.value && styles.optionButtonSelected]}
                                onPress={() => setTone(option.value)}
                            >
                                <Text style={styles.optionText}>{option.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>빠르기</Text>
                    <View style={styles.optionRow}>
                        {speedOptions.map((option) => (
                            <Pressable
                                key={option.value}
                                style={[styles.optionButton, speed === option.value && styles.optionButtonSelected]}
                                onPress={() => setSpeed(option.value)}
                            >
                                <Text style={styles.optionText}>{option.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>목소리</Text>
                    <View style={styles.optionRow}>
                        {voiceOptions.map((option) => (
                            <Pressable
                                key={option.value}
                                style={[styles.optionButton, voice === option.value && styles.optionButtonSelected]}
                                onPress={() => setVoice(option.value)}
                            >
                                <Text style={styles.optionText}>{option.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {checkedItems.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>반영할 정보</Text>
                        <View style={styles.infoCard}>
                            {checkedItems.map((item) => (
                                <View key={item} style={styles.infoRow}>
                                    <Ionicons name="checkmark-circle" size={17} color={Colors.highlight1} />
                                    <Text style={styles.infoText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <PrimaryButton
                    label={loading ? '만드는 중...' : '소셜 스토리 만들기'}
                    width="100%"
                    onPress={generateStory}
                />

                {result ? (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>완성된 이야기</Text>
                        <Text style={styles.resultScript}>{result.converted_script}</Text>

                        {result.predicted_warnings?.length ? (
                            <View style={styles.warningArea}>
                                <Text style={styles.warningTitle}>주의할 점</Text>
                                {result.predicted_warnings.map((warning) => (
                                    <View key={warning} style={styles.warningRow}>
                                        <Ionicons name="alert-circle-outline" size={17} color={Colors.highlight3} />
                                        <Text style={styles.warningText}>{warning}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : null}

                        <View style={styles.metaRow}>
                            {result.story_category ? (
                                <Text style={styles.metaPill}>{result.story_category}</Text>
                            ) : null}
                            {result.story_difficulty ? (
                                <Text style={styles.metaPill}>{result.story_difficulty}</Text>
                            ) : null}
                        </View>

                        {audioUrl ? (
                            <Pressable style={styles.audioButton} onPress={openAudio}>
                                <Ionicons name="volume-high-outline" size={20} color={Colors.text} />
                                <Text style={styles.audioButtonText}>음성으로 듣기</Text>
                            </Pressable>
                        ) : null}
                    </View>
                ) : null}
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
        marginBottom: 26,
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
        marginBottom: 22,
    },

    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },

    textArea: {
        minHeight: 118,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 14,
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
    },

    optionRow: {
        flexDirection: 'row',
        gap: 10,
    },

    optionButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    optionButtonSelected: {
        backgroundColor: Colors.highlight1,
        borderColor: Colors.highlight1,
    },

    optionText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },

    infoCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 14,
        gap: 9,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },

    infoText: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.text,
    },

    errorText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.highlight3,
        marginBottom: 14,
    },

    resultCard: {
        marginTop: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 18,
    },

    resultTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 12,
    },

    resultScript: {
        fontFamily: Fonts.body,
        fontSize: 16,
        lineHeight: 25,
        color: Colors.text,
    },

    warningArea: {
        marginTop: 18,
        gap: 8,
    },

    warningTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    warningRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 7,
    },

    warningText: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.text,
    },

    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 18,
    },

    metaPill: {
        overflow: 'hidden',
        borderRadius: 999,
        backgroundColor: Colors.pageBg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.textShadow,
    },

    audioButton: {
        marginTop: 18,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.highlight1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    audioButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },
});
