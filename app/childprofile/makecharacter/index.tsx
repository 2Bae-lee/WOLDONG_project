import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import BackButton from '../../../components/BackButton';
import PrimaryButton from '../../../components/PrimaryButton';
import RequiredMark from '../../../components/RequiredMark';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

export default function MakeCharacterStory() {
    const scrollViewRef = useRef<ScrollView>(null);
    const params = useLocalSearchParams<{
        name?: string;
        profileImage?: string;
        profileSections?: string;
        childId?: string;
    }>();

    const childName = params.name || '아이';
    const profileImage = params.profileImage ?? '';
    const [story, setStory] = useState('');
    const [storyError, setStoryError] = useState('');

    const handleNext = () => {
        const trimmedStory = story.trim();

        if (!trimmedStory) {
            setStoryError('아이에게 전하고 싶은 이야기를 입력해주세요.');
            return;
        }

        Keyboard.dismiss();

        router.push({
            pathname: '/childprofile/makecharacter/customize',
            params: {
                name: childName,
                profileImage,
                profileSections: params.profileSections ?? '',
                childId: params.childId ?? '',
                story: trimmedStory,
            },
        } as any);
    };

    const scrollToStoryInput = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({
                y: 170,
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
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    ref={scrollViewRef}
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
                                source={require('../../../assets/images/canola_flower_small.png')}
                                style={styles.logoFlower}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    <View style={styles.progressArea}>
                        <Text style={styles.progressText}>1/3</Text>
                        <View style={styles.progressTrack}>
                            <View style={styles.progressFill} />
                        </View>
                    </View>

                    <View style={styles.titleArea}>
                        <Text style={styles.title}>
                            우리 아이에게 이야기를{'\n'}전달할 캐릭터를 만들어요!
                        </Text>
                        <Text style={styles.description}>
                            우리 아이가 좋아하는 캐릭터가 어떤 말을 해주면 좋을까요?
                        </Text>
                    </View>

                    <View style={styles.profileArea}>
                        <View style={styles.avatarFrame}>
                            <Image
                                source={
                                    profileImage
                                        ? { uri: profileImage }
                                        : require('../../../assets/images/icon_child.png')
                                }
                                style={profileImage ? styles.profileImage : styles.defaultProfileImage}
                                resizeMode={profileImage ? 'cover' : 'contain'}
                            />
                        </View>
                        <Text style={styles.childName}>{childName}</Text>
                    </View>

                    <View style={styles.inputArea}>
                        <Text style={styles.inputLabel}>전달할 이야기<RequiredMark /></Text>
                        <TextInput
                            style={[styles.textArea, storyError ? styles.inputError : null]}
                            multiline
                            textAlignVertical="top"
                            placeholder="ex) 지팡이를 든 공주"
                            placeholderTextColor={Colors.textShadow}
                            value={story}
                            onFocus={scrollToStoryInput}
                            onChangeText={(text) => {
                                setStory(text);
                                if (storyError) setStoryError('');
                            }}
                        />
                        {storyError ? <Text style={styles.errorText}>{storyError}</Text> : null}
                    </View>

                    <View style={styles.buttonArea}>
                        <PrimaryButton label="캐릭터 만들기" width="100%" onPress={handleNext} />
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
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
        width: '33.3%',
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.highlight1,
    },

    titleArea: {
        alignItems: 'center',
        marginBottom: 28,
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 22,
        fontWeight: '900',
        lineHeight: 32,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 10,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textShadow,
        textAlign: 'center',
    },

    profileArea: {
        alignItems: 'center',
        marginBottom: 26,
    },

    avatarFrame: {
        width: 86,
        height: 86,
        borderRadius: 43,
        borderWidth: 2,
        borderColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: 8,
    },

    profileImage: {
        width: '100%',
        height: '100%',
    },

    defaultProfileImage: {
        width: 62,
        height: 62,
    },

    childName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    inputArea: {
        width: '100%',
    },

    inputLabel: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },

    textArea: {
        width: '100%',
        minHeight: 132,
        borderWidth: 1,
        borderColor: Colors.pageBg3,
        borderRadius: 12,
        backgroundColor: '#F7F4E8',
        padding: 16,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
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

    buttonArea: {
        marginTop: 28,
    },
});
