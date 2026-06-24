import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../../components/BackButton';
import PrimaryButton from '../../../components/PrimaryButton';
import {
    ApiError,
    CharacterSpeed,
    CharacterImages,
    generateSocialStoryTts,
    toApiAssetUrl,
    updateChildProfile,
} from '../../../constants/Api';
import { getGeneratedCharacterImages } from '../../../constants/CharacterImageStore';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

const speedMap: Record<string, CharacterSpeed> = {
    '느리게': 'slow',
    '중간': 'normal',
    '빠르게': 'fast',
};

const hasFinalConsonant = (value: string) => {
    const lastChar = value.trim().charAt(value.trim().length - 1);
    const code = lastChar.charCodeAt(0);

    if (code < 0xac00 || code > 0xd7a3) return false;

    return (code - 0xac00) % 28 !== 0;
};

const getCharacterGreetingScript = (characterName: string) => {
    const nameSuffix = hasFinalConsonant(characterName) ? '이에요' : '예요';

    return `안녕하세요. 저는 ${characterName}${nameSuffix}. 만나서 반가워요. 앞으로 우리 천천히 함께 해봐요.`;
};

export default function MakeCharacterComplete() {
    const params = useLocalSearchParams<{
        name?: string;
        profileImage?: string;
        profileSections?: string;
        childId?: string;
        characterImageKey?: string;
        characterName?: string;
        gender?: 'female' | 'male';
        tone?: 'kind' | 'strict';
        speed?: string;
        story?: string;
    }>();

    const childName = params.name || '아이';
    const characterName = params.characterName || '캐릭터';
    const characterImages = getGeneratedCharacterImages(params.characterImageKey);
    const characterImageUri = characterImages?.idle ?? '';
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [voiceError, setVoiceError] = useState('');
    const [isPreparingVoice, setIsPreparingVoice] = useState(false);
    const [voiceAudioUrl, setVoiceAudioUrl] = useState('');
    const [shouldPlayVoice, setShouldPlayVoice] = useState(false);
    const audioPlayer = useAudioPlayer(voiceAudioUrl ? { uri: voiceAudioUrl } : null, { updateInterval: 250 });
    const audioStatus = useAudioPlayerStatus(audioPlayer);

    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
        }).catch(() => undefined);
    }, []);

    useEffect(() => {
        if (!shouldPlayVoice || !voiceAudioUrl || !audioStatus.isLoaded || audioStatus.isBuffering) {
            return undefined;
        }

        let active = true;

        const playPreview = async () => {
            try {
                await audioPlayer.seekTo(0);
                if (!active) return;

                audioPlayer.play();
                setShouldPlayVoice(false);
            } catch {
                if (!active) return;

                setShouldPlayVoice(false);
                setVoiceError('음성 파일을 재생할 수 없어요.');
            }
        };

        playPreview();

        return () => {
            active = false;
        };
    }, [
        audioPlayer,
        audioStatus.isBuffering,
        audioStatus.isLoaded,
        shouldPlayVoice,
        voiceAudioUrl,
    ]);

    const handleVoicePreview = async () => {
        if (isPreparingVoice) return;

        try {
            setVoiceError('');

            if (audioStatus.playing) {
                audioPlayer.pause();
                return;
            }

            if (voiceAudioUrl) {
                setShouldPlayVoice(true);
                return;
            }

            setIsPreparingVoice(true);
            const previewScript = getCharacterGreetingScript(characterName);
            const response = await generateSocialStoryTts({
                script: previewScript,
                tone: params.tone ?? 'kind',
                speed: speedMap[params.speed ?? '중간'] ?? 'normal',
                voice: params.gender ?? 'female',
                checked_items: [],
                threshold: 0.5,
            });
            const nextAudioUrl = toApiAssetUrl(response.audio_url);

            if (!nextAudioUrl) {
                throw new Error('생성된 음성 파일을 찾지 못했어요.');
            }

            setVoiceAudioUrl(nextAudioUrl);
            setShouldPlayVoice(true);
        } catch (error) {
            setShouldPlayVoice(false);
            setVoiceError(error instanceof ApiError || error instanceof Error
                ? error.message
                : '음성을 재생하지 못했어요.');
        } finally {
            setIsPreparingVoice(false);
        }
    };

    const goHome = async () => {
        if (isSaving) return;

        setSaveError('');
        setIsSaving(true);

        try {
            if (params.childId) {
                const nextCharacterImages: CharacterImages | undefined = characterImages
                    ? {
                        ...characterImages,
                        idle: characterImages.idle || characterImageUri,
                    }
                    : characterImageUri
                        ? { idle: characterImageUri }
                        : undefined;

                await updateChildProfile(params.childId, {
                    character_image_url: nextCharacterImages,
                    character_name: characterName,
                    character_tone: params.tone ?? 'kind',
                    character_speed: speedMap[params.speed ?? '중간'] ?? 'normal',
                    character_voice: params.gender ?? 'female',
                });
            }

            router.replace({
                pathname: '/paraent_home',
                params: {
                    updatedChildName: childName,
                    updatedProfileImage: params.profileImage ?? '',
                    updatedProfileSections: params.profileSections ?? '',
                    updatedCharacterImages: characterImages
                        ? JSON.stringify(characterImages)
                        : '',
                    updatedCharacterTone: params.tone ?? 'kind',
                    updatedCharacterSpeed: speedMap[params.speed ?? '중간'] ?? 'normal',
                    updatedCharacterVoice: params.gender ?? 'female',
                },
            } as any);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : '캐릭터 설정 저장에 실패했어요.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoArea}>
                <View style={styles.logoRow}>
                    <BackButton />
                    <Text style={styles.logoTitle}>월동</Text>
                    <Image
                        source={require('../../../assets/images/canola_flower_small.png')}
                        style={styles.logoFlower}
                        resizeMode="contain"
                    />
                </View>
            </View>

            <View style={styles.progressArea}>
                <Text style={styles.progressText}>3/3</Text>
                <View style={styles.progressTrack}>
                    <View style={styles.progressFill} />
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>
                    우리 아이에게 이야기를{'\n'}전달할 캐릭터가 만들어졌어요!
                </Text>

                <Image
                    source={
                        characterImageUri
                            ? { uri: characterImageUri }
                            : require('../../../assets/images/mock_character.png')
                    }
                    style={styles.characterImage}
                    resizeMode="contain"
                />

                <Text style={styles.characterName}>{characterName}</Text>
                <Text style={styles.description}>{childName}에게 들려줄 목소리를 준비했어요.</Text>

                <Pressable
                    style={[
                        styles.voiceButton,
                        isPreparingVoice && styles.voiceButtonDisabled,
                    ]}
                    onPress={handleVoicePreview}
                    disabled={isPreparingVoice}
                >
                    <Text style={styles.voiceIcon}>{audioStatus.playing ? 'Ⅱ' : '▶'}</Text>
                    <Text style={styles.voiceText}>
                        {isPreparingVoice
                            ? '음성 준비 중'
                            : audioStatus.playing
                                ? '음성 멈추기'
                                : '음성 듣기'}
                    </Text>
                </Pressable>
                {voiceError ? <Text style={styles.errorText}>{voiceError}</Text> : null}
                {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
            </View>

            <View style={styles.buttonArea}>
                <PrimaryButton
                    label={isSaving ? '저장 중...' : '홈'}
                    width="100%"
                    onPress={goHome}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.pageBg,
        paddingTop: 10,
        paddingHorizontal: 32,
        paddingBottom: 54,
    },

    logoArea: {
        alignItems: 'flex-start',
        marginBottom: 18,
        marginLeft: -20,
    },

    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    logoTitle: {
        fontFamily: Fonts.title,
        fontSize: 32,
        color: Colors.text,
    },

    logoFlower: {
        width: 24,
        height: 24,
        marginLeft: -4,
        marginTop: -20,
        transform: [{ rotate: '-18deg' }],
    },

    progressArea: {
        width: '100%',
        marginBottom: 20,
    },

    progressText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'right',
        marginBottom: 8,
    },

    progressTrack: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.pageBg2,
    },

    progressFill: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.highlight1,
    },

    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 22,
        fontWeight: '900',
        lineHeight: 32,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 34,
    },

    characterImage: {
        width: 210,
        height: 250,
        marginBottom: 8,
    },

    characterName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
        marginBottom: 18,
    },

    voiceButton: {
        minWidth: 142,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F7F4E8',
        borderWidth: 1,
        borderColor: '#E8DDC8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
    },

    voiceButtonDisabled: {
        opacity: 0.62,
    },

    voiceIcon: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        color: Colors.text,
        marginRight: 8,
    },

    voiceText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },

    errorText: {
        marginTop: 14,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.highlight3,
        textAlign: 'center',
    },

    buttonArea: {
        width: '100%',
    },
});
