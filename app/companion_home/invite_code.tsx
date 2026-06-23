import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import SmallButton from '../../components/SmallButton';
import { verifyInviteCode } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

const CODE_LENGTH = 4;

export default function CompanionInviteCode() {
    const params = useLocalSearchParams<{
        companionName?: string;
        companionJob?: string;
        companionIntro?: string;
        companionProfileImage?: string;
    }>();
    const companionName = params.companionName || '동행인';
    const [code, setCode] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    const handleChange = (text: string, index: number) => {
        const value = text.replace(/[^0-9]/g, '');
        const nextCode = [...code];
        nextCode[index] = value.slice(-1);

        setCode(nextCode);
        setError('');

        if (value && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const submitCode = async () => {
        if (isSubmitting) return;

        const fullCode = code.join('');

        if (fullCode.length < CODE_LENGTH) {
            setError('초대 코드를 모두 입력해주세요.');
            return;
        }

        setError('');
        setIsSubmitting(true);

        let requestedChildName = `초대 코드 ${fullCode}`;

        try {
            const response = await verifyInviteCode(fullCode);
            requestedChildName = response.data?.child_name || requestedChildName;
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : '승인 요청을 보내지 못했어요.');
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(false);

        router.replace({
            pathname: '/companion_home',
            params: {
                companionName,
                companionJob: params.companionJob,
                companionIntro: params.companionIntro,
                companionProfileImage: params.companionProfileImage,
                requestSent: 'true',
                requestedInviteCode: fullCode,
                requestedChildName,
            },
        } as any);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Pressable style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>‹</Text>
            </Pressable>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.inner}>
                    <View style={styles.logoArea}>
                        <View style={styles.logoWrap}>
                            <Text style={styles.logoText}>월동</Text>
                            <Image
                                source={require('../../assets/images/canola_flower_small.png')}
                                style={styles.logoFlower}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>초대 코드를 입력해주세요</Text>
                        <Text style={styles.description}>
                            보호자가 공유한 4자리 코드를 입력하면{'\n'}담당 어린이 승인 요청이 전송돼요.
                        </Text>

                        <View style={styles.codeRow}>
                            {code.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => {
                                        inputRefs.current[index] = ref;
                                    }}
                                    style={[
                                        styles.codeInput,
                                        error ? styles.codeInputError : null,
                                    ]}
                                    value={digit}
                                    onChangeText={(text) => handleChange(text, index)}
                                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    textAlign="center"
                                    returnKeyType={index === CODE_LENGTH - 1 ? 'done' : 'next'}
                                    onSubmitEditing={submitCode}
                                />
                            ))}
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <SmallButton
                            label={isSubmitting ? '요청 중' : '요청 보내기'}
                            onPress={submitCode}
                        />
                    </View>

                    <View style={styles.noticeArea}>
                        <Text style={styles.noticeText}>
                            보호자 승인 후 담당 어린이의 일정과{'\n'}주의사항을 확인할 수 있어요.
                        </Text>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flex: 1,
        backgroundColor: Colors.pageBg,
        paddingHorizontal: 32,
    },

    inner: {
        flex: 1,
    },

    logoArea: {
        alignItems: 'center',
        marginTop: 70,
    },

    logoWrap: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },

    logoText: {
        fontFamily: Fonts.title,
        fontSize: 60,
        color: Colors.text,
        includeFontPadding: false,
    },

    logoFlower: {
        position: 'absolute',
        top: -20,
        right: -18,
        width: 34,
        height: 34,
        transform: [{ rotate: '-18deg' }],
    },

    content: {
        width: '100%',
        marginTop: 130,
        alignItems: 'center',
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 19,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 10,
        marginTop: -70,
    },

    description: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 15,
        lineHeight: 23,
        textAlign: 'center',
        color: Colors.text,
        marginBottom: 34,
    },

    codeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 18,
    },

    codeInput: {
        width: 58,
        height: 64,
        borderRadius: 8,
        backgroundColor: Colors.white,
        fontFamily: Fonts.title,
        fontSize: 62,
        color: Colors.black,
        includeFontPadding: false,
    },

    codeInputError: {
        borderWidth: 1,
        borderColor: Colors.highlight3,
    },

    errorText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.highlight3,
        marginBottom: 12,
    },

    noticeArea: {
        marginTop: 92,
        alignItems: 'center',
    },

    noticeText: {
        fontSize: 12,
        lineHeight: 20,
        color: Colors.textShadow,
        textAlign: 'center',
    },

    backButton: {
        position: 'absolute',
        top: 30,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },

    backButtonText: {
        fontSize: 40,
        lineHeight: 40,
        color: Colors.textShadow,
        fontFamily: Fonts.body,
    },
});
