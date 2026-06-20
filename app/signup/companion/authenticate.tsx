import { router } from 'expo-router';
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
import SmallButton from '../../../components/SmallButton';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

const CODE_LENGTH = 4;
const MOCK_AUTH_CODE = '0618';

export default function CompanionSignupCodeScreen() {
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');

  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const value = text.replace(/[^0-9]/g, '');

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
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

  const handleSubmit = () => {
    const fullCode = code.join('');

    if (fullCode.length < CODE_LENGTH) {
      setError('인증번호를 모두 입력해주세요.');
      return;
    }

    if (fullCode != MOCK_AUTH_CODE){
        setError('인증번호가 일치하지 않습니다.');
        return;
    }

    setError('');
    router.push('/signup/companion/password' as any);
  };

    // TODO: 여기서 백엔드 인증번호 확인 API 연결
    // 예: await verifyCode(fullCode)



  const handleResend = () => {
    // TODO: 인증번호 재전송 API 연결
    setCode(['', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };
  const handleGoBack = () => {
    router.replace('/signup/companion/email' as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <Pressable style={styles.backButton} onPress={handleGoBack}>
  <Text style={styles.backButtonText}>‹</Text>
</Pressable>

<View style={styles.logoArea}>
  <View style={styles.logoWrap}>
    <Text style={styles.logoText}>월동</Text>
    <Image
      source={require('../../../assets/images/canola_flower_small.png')}
      style={styles.logoFlower}
      resizeMode="contain"
    />
  </View>
</View>

      <View style={styles.content}>
        <Text style={styles.title}>인증번호를 입력해주세요</Text>
        <Text style={styles.description}>
          원활한 서비스 이용을 위해 이메일 인증을 해주세요
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
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              returnKeyType="done"
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable onPress={handleResend} style={styles.resendButton}>
          <Text style={styles.resendText}>재전송</Text>
        </Pressable>

        <SmallButton
                  label="계속"
                  onPress={handleSubmit}
                />
        </View>

      <View style={styles.noticeArea}>
        <Text style={styles.noticeText}>
          계속을 클릭하면 당사의{' '}
          <Text style={styles.noticeBold}>서비스 이용 약관</Text> 및{' '}
          <Text style={styles.noticeBold}>개인정보 처리방침</Text>에
          {'\n'}동의하는 것으로 간주됩니다.
        </Text>
      </View>
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
    includeFontPadding: false,
  },

  logoFlower: {
    position: 'absolute',
    top: -20,
    right: -18,
    width: 34,
    height: 34,
  },

  content: {
    width: '100%',
    marginTop: 130,
    alignItems: 'center',
  },

  title: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
    marginTop: -70
  },

  description: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: Fonts.bodyMedium, 
    marginBottom: 34,
  },

  codeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },

  codeInput: {
    width: 64,
    height: 73,
    borderRadius: 8,
    backgroundColor: Colors.white,
    fontSize: 80,
    fontFamily: Fonts.title
  },

  codeInputError: {
    borderWidth: 1,
    borderColor: Colors.highlight3,
  },

  errorText: {
    fontSize: 13,
    color: Colors.highlight3,
    marginBottom: 12,
  },

  resendButton: {
    marginTop: 50,
    marginBottom: 30,
    
  },

  resendText: {
    fontSize: 15,
    color: Colors.textShadow,
    textDecorationLine: 'underline',
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

  noticeBold: {
    color: Colors.textShadow,
    fontWeight: '700',
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
  }
});
