import { router } from 'expo-router';
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
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

export default function CompanionSignupPassword() {
    const [password, setPassword] = useState('');
    const [passwordagain, setPasswordAgain] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [againError, setAgainError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isPasswordAgainVisible, setIsPasswordAgainVisible] = useState(false);

    const handleNext = () => {
        const trimmedpassword = password.trim();
        const trimmedagain = passwordagain.trim();

        if (trimmedpassword === '') {
            setPasswordError('비밀번호을 입력해 주세요.');
            return;
        }
        if (trimmedagain === '') {
            setAgainError('비밀번호 재확인이 필요합니다.');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).+$/;

        if (!passwordRegex.test(trimmedpassword)){
                setPasswordError('비밀번호 형식을 확인해 주세요');
                return ;
        }
        if (trimmedpassword !== trimmedagain ){
            setAgainError('입력하신 비밀번호가 일치하지않습니다.');
            return;
        }
        setPasswordError('');
        setAgainError('');
        
        router.push('/signup/companion/phonenumber' as any);
        }
    
    return (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style = {styles.inner}>
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
                    <Text style={styles.screenTitle}>비밀번호 설정</Text>
            
                    <View
                    style={[
                        styles.passwordInputBox,
                        passwordError ? styles.inputError : null,
                    ]}
                    >
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="ex) woldong2026!"
                        placeholderTextColor={Colors.textShadow}
                        autoCapitalize="none"
                        secureTextEntry={!isPasswordVisible}
                        value={password}
                        onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) {
                            setPasswordError('');
                        }
                        }}
                    />
            
                    <Text
                        style={styles.eyeText}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                        {isPasswordVisible ? '가리기' : '보기'}
                    </Text>
                    </View>
            
                    <Text style={styles.description}>
                    비밀번호는 소문자, 숫자, 특수문자가 들어가야 합니다.
                    </Text>
            
                    {passwordError ? (
                    <Text style={styles.errorText}>{passwordError}</Text>
                    ) : null}
                </View>
            
                <View style={styles.content}>
                    <Text style={styles.screenTitle}>비밀번호 재확인</Text>
            
                    <View
                    style={[
                        styles.passwordInputBox,
                        againError ? styles.inputError : null,
                    ]}
                    >
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="ex) woldong2026!"
                        placeholderTextColor={Colors.textShadow}
                        autoCapitalize="none"
                        secureTextEntry={!isPasswordAgainVisible}
                        value={passwordagain}
                        onChangeText={(text) => {
                        setPasswordAgain(text);
                        if (againError) {
                            setAgainError('');
                        }
                        }}
                    />
            
                    <Text
                        style={styles.eyeText}
                        onPress={() =>
                        setIsPasswordAgainVisible(!isPasswordAgainVisible)
                        }
                    >
                        {isPasswordAgainVisible ? '가리기' : '보기'}
                    </Text>
                    </View>
            
                    {againError ? (
                    <Text style={styles.errorText}>{againError}</Text>
                    ) : null}
                </View>
                <View style={styles.buttonArea}>
                    <SmallButton label="계속" onPress={handleNext} />
                </View>
                <Text style={styles.policyText}>
                    계속을 클릭하면 당사의{' '}
                    <Text style={styles.policyBoldText}>서비스 이용 약관</Text> 및{' '}
                    <Text style={styles.policyBoldText}>개인정보 처리방침</Text>에{'\n'}
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
        width: '100%',
        alignItems: 'center',
        paddingTop: 30,
        paddingBottom: 54,
      },
  
    logoArea: {
      alignItems: 'center',
      marginBottom: 30,
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
      marginLeft: -10,
      marginTop: -60,
      transform: [{ rotate: '-18deg' }],
    },
  
    content: {
      width: '100%',
      alignItems: 'center',
    },
  
    screenTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      fontWeight: '900',
      color: Colors.text,
      marginBottom: -5,
    },
  
    description: {
      fontFamily: Fonts.body,
      fontSize: 14,
      color: Colors.textShadow,
      marginTop: -10,
      marginBottom: 22,
      textAlign: 'left',
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
  
    policyText: {
      marginTop: 'auto',
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: Colors.textShadow,
      textAlign: 'center',
    },
    policyBoldText: {
        marginTop: 'auto',
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
        color: Colors.textShadow,
        textAlign: 'center',
      },
    inputError: {
        borderColor: Colors.highlight3,
      },
      
    errorText: {
        width: 300,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.highlight3,
        marginTop: -10,
        marginBottom: 10,
      },
      passwordInputBox: {
        width: '82%',
        height: 40,
        backgroundColor: Colors.white,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.pageBg3,
        paddingHorizontal: 12,
        marginTop: 15,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
      },
      
      passwordInput: {
        flex: 1,
        height: '100%',
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.text,
        padding: 0,
      },
      buttonArea: {
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
      },
      
      eyeText: {
        fontSize: 14,
        color: Colors.textShadow,
        marginLeft: 8,
      },
    
  });