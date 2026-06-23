import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
    CharacterImages,
    SocialStoryResponse,
    generateScheduleSocialStory,
    generateSocialStoryTts,
    getChildProfile,
    toApiAssetUrl,
} from '../constants/Api';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

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

const parseCharacterImages = (value?: string): CharacterImages | null => {
    if (!value) return null;

    try {
        const parsed = JSON.parse(value) as Partial<CharacterImages>;
        if (!parsed || typeof parsed.idle !== 'string' || !parsed.idle) return null;

        return {
            idle: parsed.idle,
            blink: typeof parsed.blink === 'string' ? parsed.blink : undefined,
            mouth_open: typeof parsed.mouth_open === 'string' ? parsed.mouth_open : undefined,
            mouth_wide: typeof parsed.mouth_wide === 'string' ? parsed.mouth_wide : undefined,
            smile: typeof parsed.smile === 'string' ? parsed.smile : undefined,
        };
    } catch {
        return null;
    }
};

const normalizeCharacterImages = (images?: CharacterImages | null): CharacterImages | null => {
    if (!images?.idle) return null;

    return {
        idle: toApiAssetUrl(images.idle),
        blink: images.blink ? toApiAssetUrl(images.blink) : undefined,
        mouth_open: images.mouth_open ? toApiAssetUrl(images.mouth_open) : undefined,
        mouth_wide: images.mouth_wide ? toApiAssetUrl(images.mouth_wide) : undefined,
        smile: images.smile ? toApiAssetUrl(images.smile) : undefined,
    };
};

const estimateSpeechDuration = (text: string) => {
    const compactLength = text.replace(/\s/g, '').length;

    return Math.min(18000, Math.max(4200, compactLength * 170));
};

export default function SocialStoryScreen() {
    const params = useLocalSearchParams<{
        scheduleId?: string;
        title?: string;
        childName?: string;
        childId?: string;
        characterImages?: string;
        script?: string;
        checkedItems?: string;
    }>();
    const checkedItems = useMemo(() => parseCheckedItems(params.checkedItems), [params.checkedItems]);
    const initialCharacterImages = useMemo(
        () => parseCharacterImages(params.characterImages),
        [params.characterImages]
    );
    const [script, setScript] = useState(
        params.script || (params.title ? `오늘은 ${params.title} 일정이 있어요.` : '오늘은 병원에 가요.')
    );
    const [result, setResult] = useState<SocialStoryResponse | null>(null);
    const [profileCharacterImages, setProfileCharacterImages] = useState<CharacterImages | null>(initialCharacterImages);
    const [speakingFrameIndex, setSpeakingFrameIndex] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const audioUrl = toApiAssetUrl(result?.audio_url);
    const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const characterImages = normalizeCharacterImages(result?.character_images ?? profileCharacterImages);
    const speakingFrames = useMemo(() => {
        if (!characterImages) return [];

        return [
            characterImages.idle,
            characterImages.mouth_open || characterImages.smile || characterImages.idle,
            characterImages.mouth_wide || characterImages.mouth_open || characterImages.smile || characterImages.idle,
            characterImages.mouth_open || characterImages.smile || characterImages.idle,
        ];
    }, [characterImages]);
    const currentCharacterFrame = speakingFrames[speakingFrameIndex] || characterImages?.idle || '';

    useEffect(() => {
        let active = true;

        const loadCharacterImages = async () => {
            if (initialCharacterImages || !params.childId) return;

            try {
                const response = await getChildProfile(params.childId);
                if (!active) return;

                setProfileCharacterImages(response.data?.character_image_url ?? null);
            } catch {
                if (active) {
                    setProfileCharacterImages(null);
                }
            }
        };

        loadCharacterImages();

        return () => {
            active = false;
        };
    }, [initialCharacterImages, params.childId]);

    useEffect(() => () => {
        if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
    }, []);

    const stopSpeakingAnimation = () => {
        if (speakingIntervalRef.current) {
            clearInterval(speakingIntervalRef.current);
            speakingIntervalRef.current = null;
        }
        if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = null;
        }
        setSpeakingFrameIndex(0);
        setIsSpeaking(false);
    };

    const startSpeakingAnimation = () => {
        if (speakingFrames.length === 0) return;

        stopSpeakingAnimation();
        setIsSpeaking(true);
        setSpeakingFrameIndex(0);

        speakingIntervalRef.current = setInterval(() => {
            setSpeakingFrameIndex((current) => (current + 1) % speakingFrames.length);
        }, 180);

        speakingTimeoutRef.current = setTimeout(() => {
            stopSpeakingAnimation();
        }, estimateSpeechDuration(result?.converted_script || script));
    };

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
                })
                : await generateSocialStoryTts({
                    script: trimmedScript,
                    checked_items: checkedItems,
                    threshold: 0.5,
                });

            setResult(response);
        } catch (storyError) {
            setResult(null);
            setError(storyError instanceof ApiError
                ? storyError.message
                : storyError instanceof Error
                    ? `소셜 스토리를 만들지 못했어요. ${storyError.message}`
                    : '소셜 스토리를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const openAudio = async () => {
        if (!audioUrl) return;

        const canOpen = await Linking.canOpenURL(audioUrl);
        if (canOpen) {
            startSpeakingAnimation();
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

                <View style={styles.characterStage}>
                    <View style={styles.characterHalo}>
                        {currentCharacterFrame ? (
                            <Image
                                source={{ uri: currentCharacterFrame }}
                                style={styles.characterImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <Image
                                source={require('../assets/images/mock_character.png')}
                                style={styles.characterImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>
                    <View style={styles.speechBubble}>
                        <Text style={styles.speechBubbleText} numberOfLines={2}>
                            {isSpeaking ? '이야기를 들려주는 중이에요.' : '준비되면 이야기를 들려줄게요.'}
                        </Text>
                    </View>
                </View>

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
                                <Text style={styles.audioButtonText}>
                                    {isSpeaking ? '음성 재생 중...' : '음성으로 듣기'}
                                </Text>
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

    characterStage: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },

    characterHalo: {
        width: '100%',
        maxWidth: 280,
        height: 260,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF8DF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        overflow: 'hidden',
    },

    characterImage: {
        width: 230,
        height: 230,
    },

    speechBubble: {
        maxWidth: 260,
        minHeight: 40,
        borderRadius: 20,
        backgroundColor: Colors.realwhite,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        paddingHorizontal: 14,
        paddingVertical: 9,
        marginTop: -14,
        alignItems: 'center',
        justifyContent: 'center',
    },

    speechBubbleText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        lineHeight: 18,
        color: Colors.text,
        textAlign: 'center',
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
