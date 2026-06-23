import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import SmallButton from '../../../components/SmallButton';
import { checkEmailAvailable, sendSignupCode } from '../../../constants/Api';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

export default function CompanionSignupEmail() {
    const params = useLocalSearchParams<{
        name?: string;
    }>();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleNext = async () => {
        if (isSending) return;

        const trimmedEmail = email.trim();
        if (trimmedEmail === '') {
            setEmailError('이메일을 입력해 주세요.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setEmailError('이메일 형식을 확인해 주세요');
            return;
        }

        setEmailError('');
        setIsSending(true);

        try {
            const checkResponse = await checkEmailAvailable(trimmedEmail);
            if (!checkResponse.data?.available) {
                setEmailError(checkResponse.message || '이미 사용 중인 이메일입니다.');
                setIsSending(false);
                return;
            }

            await sendSignupCode(trimmedEmail);
        } catch (error) {
            setEmailError(error instanceof Error ? error.message : '이메일 확인에 실패했어요.');
            setIsSending(false);
            return;
        }

        setIsSending(false);
        router.push({
            pathname: '/signup/companion/authenticate',
            params: {
                name: params.name ?? '',
                email: trimmedEmail,
            },
        } as any);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.inner}>
                    <View style={styles.logoArea}>
                        <View style={styles.logoRow}>
                            <Text style={styles.logoTitle}>월동</Text>
                            <Image
                                source={require('../../../assets/images/canola_flower_small.png')}
                                style={styles.logoFlower}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.screenTitle}>계정 만들기</Text>
                        <Text style={styles.description}>
                            이 앱에 가입하려면 이메일을 입력하세요
                        </Text>

                        <TextInput
                            style={[
                                styles.input,
                                emailError ? styles.inputError : null,
                            ]}
                            placeholder="ex) woldong@gmail.com"
                            placeholderTextColor={Colors.textShadow}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (emailError) {
                                    setEmailError('');
                                }
                            }}
                            returnKeyType="done"
                            onSubmitEditing={handleNext}
                        />

                        {emailError ? (
                            <Text style={styles.errorText}>{emailError}</Text>
                        ) : null}

                        <SmallButton
                            label={isSending ? '전송 중' : '계속'}
                            onPress={handleNext}
                        />
                    </View>

                    <Text style={styles.policyText}>
                        계속을 클릭하면 당사의 <Text style={styles.policyBoldText}>서비스 이용 약관</Text> 및 <Text style={styles.policyBoldText}>개인정보 처리방침</Text>에{'\n'}
                        동의하는 것으로 간주됩니다.
                    </Text>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.pageBg,
    },

    inner: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 54,
    },

    logoArea: {
        alignItems: 'center',
        marginBottom: 70,
    },

    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    logoTitle: {
        fontFamily: Fonts.title,
        fontSize: 60,
        color: Colors.text,
    },

    logoFlower: {
        width: 46,
        height: 46,
        marginLeft: -8,
        marginTop: -18,
        transform: [{ rotate: '-18deg' }],
    },

    content: {
        width: '100%',
        alignItems: 'center',
    },

    screenTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 19,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 5,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.text,
        marginBottom: 22,
    },

    input: {
        width: '82%',
        height: 40,
        backgroundColor: Colors.white,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.pageBg3,
        paddingHorizontal: 12,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.text,
        marginTop: 15,
        marginBottom: 20,
    },

    inputError: {
        borderColor: Colors.highlight3,
    },

    errorText: {
        width: 300,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.highlight3,
        marginTop: -18,
        marginBottom: 10,
        marginLeft: -5,
    },

    policyText: {
        marginTop: 'auto',
        fontFamily: Fonts.body,
        fontSize: 12,
        lineHeight: 16,
        color: Colors.textShadow,
        textAlign: 'center',
    },

    policyBoldText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
        color: Colors.textShadow,
        textAlign: 'center',
    },
});
