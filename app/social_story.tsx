import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    Image,
    ImageSourcePropType,
    Keyboard,
    KeyboardAvoidingView,
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

const fallbackCharacterImage = require('../assets/images/mock_character.png');

const parseCharacterImages = (value?: string): CharacterImages | null => {
    if (!value) return null;

    try {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== 'object') return null;

        return parsed as CharacterImages;
    } catch {
        return null;
    }
};

const toImageSource = (value?: string): ImageSourcePropType | null => {
    if (!value) return null;

    if (/^(data:|https?:\/\/|file:\/\/)/.test(value)) {
        return { uri: value };
    }

    return { uri: toApiAssetUrl(value) };
};

export default function SocialStoryScreen() {
    const params = useLocalSearchParams<{
        scheduleId?: string;
        title?: string;
        childName?: string;
        script?: string;
        checkedItems?: string;
        characterImages?: string;
    }>();
    const checkedItems = useMemo(() => parseCheckedItems(params.checkedItems), [params.checkedItems]);
    const [script, setScript] = useState(
        params.script || (params.title ? `오늘은 ${params.title} 일정이 있어요.` : '오늘은 병원에 가요.')
    );
    const [result, setResult] = useState<SocialStoryResponse | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingFrameIndex, setSpeakingFrameIndex] = useState(0);
    const audioUrl = toApiAssetUrl(result?.audio_url);
    const audioPlayer = useAudioPlayer(null, { updateInterval: 250 });
    const audioStatus = useAudioPlayerStatus(audioPlayer);
    const characterFrames = useMemo(() => {
        const parsedImages = parseCharacterImages(params.characterImages);
        const frameSources = [
            toImageSource(parsedImages?.idle),
            toImageSource(parsedImages?.mouth_open),
            toImageSource(parsedImages?.mouth_wide),
            toImageSource(parsedImages?.smile),
            toImageSource(parsedImages?.blink),
        ].filter((source): source is ImageSourcePropType => Boolean(source));

        return frameSources.length > 0 ? frameSources : [fallbackCharacterImage];
    }, [params.characterImages]);
    const activeCharacterFrame = characterFrames[speakingFrameIndex % characterFrames.length];

    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
        }).catch(() => undefined);
    }, []);

    useEffect(() => {
        if (!audioUrl) {
            audioPlayer.pause();
            setIsSpeaking(false);
            return;
        }

        audioPlayer.replace({ uri: audioUrl });
        setIsSpeaking(false);
    }, [audioPlayer, audioUrl]);

    useEffect(() => {
        if (audioStatus.playing) {
            setIsSpeaking(true);
            return;
        }

        if (audioStatus.didJustFinish) {
            setIsSpeaking(false);
        }
    }, [audioStatus.didJustFinish, audioStatus.playing]);

    useEffect(() => {
        if (!isSpeaking) {
            setSpeakingFrameIndex(0);
            return undefined;
        }

        const frameTimer = setInterval(() => {
            setSpeakingFrameIndex((current) => current + 1);
        }, 220);

        return () => {
            clearInterval(frameTimer);
        };
    }, [isSpeaking]);

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
                : '소셜 스토리를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const toggleAudio = async () => {
        if (!audioUrl) return;

        try {
            setError('');

            if (audioStatus.playing || isSpeaking) {
                audioPlayer.pause();
                setIsSpeaking(false);
                return;
            }

            await audioPlayer.seekTo(0);
            audioPlayer.play();
            setIsSpeaking(true);
        } catch {
            setIsSpeaking(false);
            setError('음성 파일을 재생할 수 없어요.');
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

                <PrimaryButton
                    label={loading ? '만드는 중...' : '소셜 스토리 만들기'}
                    width="100%"
                    onPress={generateStory}
                />

                {result ? (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>완성된 이야기</Text>

                        <View style={styles.characterStage}>
                            <Image
                                source={activeCharacterFrame}
                                style={[
                                    styles.characterImage,
                                    isSpeaking && speakingFrameIndex % 2 === 1 ? styles.characterImageSpeaking : null,
                                ]}
                                resizeMode="contain"
                            />
                        </View>
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
                            <Pressable style={styles.audioButton} onPress={toggleAudio}>
                                <Ionicons
                                    name={isSpeaking ? 'pause-circle-outline' : 'volume-high-outline'}
                                    size={20}
                                    color={Colors.text}
                                />
                                <Text style={styles.audioButtonText}>
                                    {isSpeaking ? '멈추기' : '소셜 스토리 듣기'}
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

    characterStage: {
        height: 230,
        borderRadius: 14,
        backgroundColor: Colors.pageBg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: 16,
    },

    characterImage: {
        width: '86%',
        height: '86%',
    },

    characterImageSpeaking: {
        transform: [{ scale: 1.035 }],
        opacity: 0.94,
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
