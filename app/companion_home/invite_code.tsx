import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
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
    const companionName = params.companionName || '박민지';
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

        try {
            await verifyInviteCode(fullCode);
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
                requestedChildName: `초대 코드 ${fullCode}`,
            },
        } as any);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

            <View style={styles.content}>
                <View style={styles.centerLogoRow}>
                    <Text style={styles.centerLogo}>월동</Text>
                    <Image
                        source={require('../../assets/images/canola_flower_small.png')}
                        style={styles.centerFlower}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.title}>초대 코드를 입력해주세요</Text>
                <Text style={styles.description}>
                    보호자가 공유한 코드를 입력하면{'\n'}담당 어린이 승인 요청이 전송돼요.
                </Text>

                <View style={styles.codeRow}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => {
                                inputRefs.current[index] = ref;
                            }}
                            style={[styles.codeInput, error ? styles.codeInputError : null]}
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
            </View>

            <View style={styles.buttonArea}>
                <PrimaryButton label={isSubmitting ? '요청 중...' : '요청 보내기'} width="100%" onPress={submitCode} />
            </View>
        </KeyboardAvoidingView>
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

    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 42,
    },

    centerLogoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
    },

    centerLogo: {
        fontFamily: Fonts.title,
        fontSize: 64,
        color: Colors.black,
    },

    centerFlower: {
        width: 32,
        height: 32,
        marginLeft: -8,
        marginTop: -38,
        transform: [{ rotate: '-18deg' }],
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 19,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        color: Colors.text,
        marginBottom: 34,
    },

    codeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },

    codeInput: {
        width: 66,
        height: 76,
        borderRadius: 10,
        backgroundColor: Colors.realwhite,
        fontFamily: Fonts.title,
        fontSize: 72,
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
    },

    buttonArea: {
        width: '100%',
    },
});
