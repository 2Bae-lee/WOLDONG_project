import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import BackButton from '../../../components/BackButton';
import PrimaryButton from '../../../components/PrimaryButton';
import RequiredMark from '../../../components/RequiredMark';
import { getGeneratedCharacterImage } from '../../../constants/CharacterImageStore';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

const speedOptions = ['느리게', '중간', '빠르게'] as const;

type CharacterGender = 'female' | 'male';
type VoiceTone = 'kind' | 'strict';

type SpeedOption = typeof speedOptions[number];

type SnapSliderProps = {
    value: SpeedOption;
    onChange: (value: SpeedOption) => void;
};

function SnapSlider({ value, onChange }: SnapSliderProps) {
    const [trackWidth, setTrackWidth] = useState(0);
    const selectedIndex = speedOptions.indexOf(value);
    const leftPercent = (selectedIndex / (speedOptions.length - 1)) * 100;

    const handleTrackLayout = (event: LayoutChangeEvent) => {
        setTrackWidth(event.nativeEvent.layout.width);
    };

    const handlePress = (event: GestureResponderEvent) => {
        if (!trackWidth) return;

        const ratio = event.nativeEvent.locationX / trackWidth;
        const closestIndex = Math.max(
            0,
            Math.min(speedOptions.length - 1, Math.round(ratio * (speedOptions.length - 1)))
        );

        onChange(speedOptions[closestIndex]);
    };

    return (
        <View style={styles.sliderArea}>
            <Pressable
                style={styles.sliderTouchArea}
                onLayout={handleTrackLayout}
                onPress={handlePress}
            >
                <View style={styles.sliderTrack}>
                    <View style={[styles.sliderThumb, { left: `${leftPercent}%` }]} />
                </View>
            </Pressable>

            <View style={styles.sliderLabels}>
                {speedOptions.map((option, index) => (
                    <Pressable
                        key={option}
                        onPress={() => onChange(option)}
                    >
                        <Text style={[
                            styles.sliderLabel,
                            selectedIndex === index && styles.sliderLabelSelected,
                        ]}>
                            {option}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

export default function MakeCharacterCustomize() {
    const scrollViewRef = useRef<ScrollView>(null);
    const params = useLocalSearchParams<{
        name?: string;
        profileImage?: string;
        profileSections?: string;
        childId?: string;
        characterImageKey?: string;
        story?: string;
    }>();

    const childName = params.name || '아이';
    const profileImage = params.profileImage ?? '';
    const characterImageUri = getGeneratedCharacterImage(params.characterImageKey);
    const [characterName, setCharacterName] = useState('');
    const [gender, setGender] = useState<CharacterGender | null>(null);
    const [tone, setTone] = useState<VoiceTone | null>(null);
    const [speed, setSpeed] = useState<SpeedOption>('중간');
    const [nameError, setNameError] = useState('');
    const [genderError, setGenderError] = useState('');
    const [toneError, setToneError] = useState('');

    const handleNext = () => {
        const trimmedName = characterName.trim();

        if (!trimmedName) {
            setNameError('캐릭터 이름을 입력해주세요.');
            return;
        }

        if (!gender) {
            setGenderError('캐릭터 성별을 선택해주세요.');
            return;
        }

        if (!tone) {
            setToneError('목소리 톤을 선택해주세요.');
            return;
        }

        router.push({
            pathname: '/childprofile/makecharacter/complete',
            params: {
                name: childName,
                profileImage,
                profileSections: params.profileSections ?? '',
                childId: params.childId ?? '',
                characterImageKey: params.characterImageKey ?? '',
                characterName: trimmedName,
                gender,
                tone,
                speed,
                story: params.story ?? '',
            },
        } as any);
    };

    const scrollToNameInput = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({
                y: 260,
                animated: true,
            });
        }, 120);
    };

    return (
        <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.inner}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
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
                    <Text style={styles.progressText}>2/3</Text>
                    <View style={styles.progressTrack}>
                        <View style={styles.progressFill} />
                    </View>
                </View>

                <View style={styles.titleArea}>
                    <Text style={styles.title}>
                        우리 아이를 위한 캐릭터가{'\n'}만들어졌어요!
                    </Text>
                    <Text style={styles.description}>이름과 말투를 정해주세요.</Text>
                </View>

                <View style={styles.characterArea}>
                    <Image
                        source={
                            characterImageUri
                                ? { uri: characterImageUri }
                                : require('../../../assets/images/mock_character.png')
                        }
                        style={styles.characterImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.childCaption}>{childName}에게 이야기를 전할 캐릭터</Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>캐릭터 이름<RequiredMark /></Text>
                    <TextInput
                        style={[styles.input, nameError ? styles.inputError : null]}
                        placeholder="ex) 김공주"
                        placeholderTextColor={Colors.textShadow}
                        value={characterName}
                        onFocus={scrollToNameInput}
                        onChangeText={(text) => {
                            setCharacterName(text);
                            if (nameError) setNameError('');
                        }}
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                    />
                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>캐릭터 성별<RequiredMark /></Text>
                    <View style={styles.buttonRow}>
                        <Pressable
                            style={[styles.choiceButton, gender === 'female' && styles.choiceButtonSelected]}
                            onPress={() => {
                                setGender('female');
                                if (genderError) setGenderError('');
                            }}
                        >
                            <Text style={styles.choiceText}>여자</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.choiceButton, gender === 'male' && styles.choiceButtonSelected]}
                            onPress={() => {
                                setGender('male');
                                if (genderError) setGenderError('');
                            }}
                        >
                            <Text style={styles.choiceText}>남자</Text>
                        </Pressable>
                    </View>
                    {genderError ? <Text style={styles.errorText}>{genderError}</Text> : null}
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>목소리 톤<RequiredMark /></Text>
                    <View style={styles.buttonRow}>
                        <Pressable
                            style={[styles.choiceButton, tone === 'kind' && styles.choiceButtonSelected]}
                            onPress={() => {
                                setTone('kind');
                                if (toneError) setToneError('');
                            }}
                        >
                            <Text style={styles.choiceText}>다정</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.choiceButton, tone === 'strict' && styles.choiceButtonSelected]}
                            onPress={() => {
                                setTone('strict');
                                if (toneError) setToneError('');
                            }}
                        >
                            <Text style={styles.choiceText}>엄격</Text>
                        </Pressable>
                    </View>
                    {toneError ? <Text style={styles.errorText}>{toneError}</Text> : null}
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>빠르기<RequiredMark /></Text>
                    <SnapSlider value={speed} onChange={setSpeed} />
                </View>

                <View style={styles.buttonArea}>
                    <PrimaryButton label="완료" width="100%" onPress={handleNext} />
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
        width: '100%',
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
        marginBottom: 18,
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
        width: '66.7%',
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.highlight1,
    },

    titleArea: {
        alignItems: 'center',
        marginBottom: 16,
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 22,
        fontWeight: '900',
        lineHeight: 32,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textShadow,
        textAlign: 'center',
    },

    characterArea: {
        alignItems: 'center',
        marginBottom: 22,
    },

    characterImage: {
        width: 184,
        height: 220,
        marginBottom: 4,
    },

    childCaption: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
    },

    formSection: {
        width: '100%',
        marginBottom: 24,
    },

    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },

    input: {
        width: '100%',
        height: 44,
        borderWidth: 1,
        borderColor: Colors.pageBg3,
        borderRadius: 10,
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
    },

    inputError: {
        borderColor: Colors.highlight3,
    },

    errorText: {
        marginTop: 8,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.highlight3,
    },

    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },

    choiceButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        backgroundColor: Colors.pageBg2,
        alignItems: 'center',
        justifyContent: 'center',
    },

    choiceButtonSelected: {
        backgroundColor: Colors.highlight1,
    },

    choiceText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    sliderArea: {
        width: '100%',
        paddingTop: 14,
    },

    sliderTouchArea: {
        width: '100%',
        height: 34,
        justifyContent: 'center',
    },

    sliderTrack: {
        width: '100%',
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E8DDC8',
        justifyContent: 'center',
    },

    sliderThumb: {
        position: 'absolute',
        width: 26,
        height: 26,
        borderRadius: 13,
        marginLeft: -13,
        backgroundColor: Colors.highlight1,
        borderWidth: 3,
        borderColor: Colors.realwhite,
    },

    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },

    sliderLabel: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
    },

    sliderLabelSelected: {
        fontFamily: Fonts.bodyBold,
        fontWeight: '900',
        color: Colors.text,
    },

    buttonArea: {
        marginTop: 'auto',
        paddingTop: 18,
    },
});
