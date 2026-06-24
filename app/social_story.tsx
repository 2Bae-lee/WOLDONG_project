import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Image,
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
    CharacterSpeed,
    CharacterTone,
    CharacterVoice,
    CharacterImages,
    SocialStoryResponse,
    generateScheduleSocialStory,
    generateSocialStoryTts,
    getChildProfile,
    toApiAssetUrl,
} from '../constants/Api';
import { Colors } from '../constants/Colors';
import { getGeneratedCharacterImages } from '../constants/CharacterImageStore';
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

const getInfoItemLabel = (value: string) => (
    value
        .replace(/^일정_/, '일정: ')
        .replace(/^체크_/, '준비할 일: ')
        .replace(/^아동_주의_/, '주의사항: ')
);

const characterFrameOrder: (keyof CharacterImages)[] = ['idle', 'mouth_open', 'mouth_wide', 'blink', 'smile'];

const findImageValue = (value: unknown): string => {
    if (typeof value === 'string') return value.trim();
    if (!value || typeof value !== 'object') return '';

    if (Array.isArray(value)) {
        for (const item of value) {
            const image = findImageValue(item);
            if (image) return image;
        }
        return '';
    }

    const record = value as Record<string, unknown>;
    const directKeys = ['idle', 'default', 'neutral', 'url', 'uri', 'image_url', 'imageUrl', 'src', 'path', 'image'];

    for (const key of directKeys) {
        const image = findImageValue(record[key]);
        if (image) return image;
    }

    const nestedKeys = ['frames', 'images', 'character_images', 'characterImages', 'data', 'result'];

    for (const key of nestedKeys) {
        const image = findImageValue(record[key]);
        if (image) return image;
    }

    return '';
};

const normalizeCharacterImageSource = (value: string) => (
    /^(data:image\/|https?:\/\/|file:\/\/)/.test(value) ? value : toApiAssetUrl(value)
);

const parseCharacterFrames = (value?: string) => {
    if (!value) return [];

    const normalizeRecord = (payload: unknown): string[] => {
        if (!payload) return [];

        if (Array.isArray(payload)) {
            return payload
                .map(findImageValue)
                .filter((image, index, images) => image && images.indexOf(image) === index);
        }

        if (typeof payload === 'string') {
            const image = payload.trim();
            return image ? [image] : [];
        }

        if (typeof payload !== 'object') return [];

        const record = payload as Record<string, unknown>;
        const orderedFrames = characterFrameOrder
            .map((key) => findImageValue(record[key]))
            .filter(Boolean);

        if (orderedFrames.length > 0) {
            return orderedFrames.filter((image, index, images) => images.indexOf(image) === index);
        }

        const nestedKeys = ['frames', 'images', 'character_images', 'characterImages', 'data', 'result'];
        for (const key of nestedKeys) {
            const frames = normalizeRecord(record[key]);
            if (frames.length > 0) return frames;
        }

        const image = findImageValue(record);
        return image ? [image] : [];
    };

    try {
        return normalizeRecord(JSON.parse(value));
    } catch {
        const image = value.trim();
        return image ? [image] : [];
    }
};

export default function SocialStoryScreen() {
    const params = useLocalSearchParams<{
        scheduleId?: string;
        title?: string;
        childId?: string;
        childName?: string;
        script?: string;
        checkedItems?: string;
        characterImages?: string;
        characterImageKey?: string;
        characterTone?: CharacterTone;
        characterSpeed?: CharacterSpeed;
        characterVoice?: CharacterVoice;
    }>();
    const checkedItems = useMemo(() => parseCheckedItems(params.checkedItems), [params.checkedItems]);
    const [selectedInfoItems, setSelectedInfoItems] = useState<string[]>(checkedItems);
    const [script, setScript] = useState(
        params.script || (params.title ? `오늘은 ${params.title} 일정이 있어요.` : '오늘은 병원에 가요.')
    );
    const [result, setResult] = useState<SocialStoryResponse | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [characterFrameIndex, setCharacterFrameIndex] = useState(0);
    const [profileCharacterImages, setProfileCharacterImages] = useState<CharacterImages | null>(null);
    const floatY = useRef(new Animated.Value(0)).current;
    const audioUrl = toApiAssetUrl(result?.audio_url);
    const storedCharacterImages = useMemo(
        () => getGeneratedCharacterImages(params.characterImageKey),
        [params.characterImageKey]
    );
    const characterFrames = useMemo(() => (
        storedCharacterImages
            ? parseCharacterFrames(JSON.stringify(storedCharacterImages))
            : profileCharacterImages
                ? parseCharacterFrames(JSON.stringify(profileCharacterImages))
                : parseCharacterFrames(params.characterImages)
    ), [params.characterImages, profileCharacterImages, storedCharacterImages]);
    const activeCharacterFrame = characterFrames.length > 0
        ? characterFrames[characterFrameIndex % characterFrames.length]
        : '';
    const characterSource = activeCharacterFrame
        ? { uri: normalizeCharacterImageSource(activeCharacterFrame) }
        : null;
    const audioPlayer = useAudioPlayer(null, { updateInterval: 250 });
    const audioStatus = useAudioPlayerStatus(audioPlayer);

    useEffect(() => {
        setSelectedInfoItems(checkedItems);
    }, [checkedItems]);

    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
        }).catch(() => undefined);
    }, []);

    useEffect(() => {
        if (storedCharacterImages || params.characterImages || !params.childId) return;

        let active = true;
        const nextChildId = params.childId;

        const loadCharacterImages = async () => {
            try {
                const response = await getChildProfile(nextChildId);
                if (!active) return;
                setProfileCharacterImages(response.data?.character_image_url ?? null);
            } catch {
                if (active) setProfileCharacterImages(null);
            }
        };

        loadCharacterImages();

        return () => {
            active = false;
        };
    }, [params.characterImages, params.childId, storedCharacterImages]);

    useEffect(() => {
        const floatingAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(floatY, {
                    toValue: -10,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(floatY, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        );

        floatingAnimation.start();

        return () => {
            floatingAnimation.stop();
            floatY.setValue(0);
        };
    }, [floatY]);

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
        if (characterFrames.length <= 1) {
            setCharacterFrameIndex(0);
            return;
        }

        if (!isSpeaking) {
            setCharacterFrameIndex(0);
            return;
        }

        const frameTimer = setInterval(() => {
            setCharacterFrameIndex((current) => (current + 1) % characterFrames.length);
        }, 180);

        return () => clearInterval(frameTimer);
    }, [characterFrames.length, isSpeaking]);

    useEffect(() => {
        if (audioStatus.playing) {
            setIsSpeaking(true);
            return;
        }

        if (audioStatus.didJustFinish) {
            setIsSpeaking(false);
        }
    }, [audioStatus.didJustFinish, audioStatus.playing]);

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
            const hasSelectableInfo = checkedItems.length > 0;
            const response = params.scheduleId && !hasSelectableInfo
                ? await generateScheduleSocialStory(params.scheduleId, {
                    script: trimmedScript,
                    tone: params.characterTone,
                    speed: params.characterSpeed,
                    voice: params.characterVoice,
                })
                : await generateSocialStoryTts({
                    script: trimmedScript,
                    tone: params.characterTone,
                    speed: params.characterSpeed,
                    voice: params.characterVoice,
                    checked_items: selectedInfoItems,
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

    const toggleInfoItem = (item: string) => {
        setSelectedInfoItems((current) => (
            current.includes(item)
                ? current.filter((selectedItem) => selectedItem !== item)
                : [...current, item]
        ));
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
                                <Pressable
                                    key={item}
                                    style={styles.infoRow}
                                    onPress={() => toggleInfoItem(item)}
                                >
                                    <Ionicons
                                        name={selectedInfoItems.includes(item) ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={18}
                                        color={selectedInfoItems.includes(item) ? Colors.highlight1 : Colors.textShadow}
                                    />
                                    <Text style={[
                                        styles.infoText,
                                        !selectedInfoItems.includes(item) && styles.infoTextMuted,
                                    ]}>
                                        {getInfoItemLabel(item)}
                                    </Text>
                                </Pressable>
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
                            {characterSource ? (
                                <Animated.Image
                                    source={characterSource}
                                    style={[
                                        styles.characterImage,
                                        { transform: [{ translateY: floatY }] },
                                    ]}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Text style={styles.characterMissingText}>
                                    캐릭터 이미지를 불러오지 못했어요.
                                </Text>
                            )}
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

    infoTextMuted: {
        color: Colors.textShadow,
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
        width: 198,
        height: 198,
        borderRadius: 18,
    },

    characterMissingText: {
        paddingHorizontal: 18,
        textAlign: 'center',
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.textShadow,
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
