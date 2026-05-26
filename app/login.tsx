import { router } from 'expo-router';
import { useState } from 'react';
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
    View,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

export default function Login() {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [idError, setIdError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordMatchError, setPasswordMatchError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const mockid = 'woldong'
    const mockpw = 'wd1!'

    const handleNext = () => {
        const trimmedid = id.trim();
        const trimmedpassword = password.trim();

        if (trimmedid === '') {
            setIdError('아이디를 입력해주세요.');
            return;
        }
        if (trimmedpassword === '') {
            setPasswordError('비밀번호를 입력해주세요.');
            return;
        }

        if (trimmedid !== mockid) {
            setIdError('아이디를 재확인하세요.');
            return;
        }

        if (trimmedid == mockid  && trimmedpassword !== mockpw){
            setPasswordMatchError('비밀번호를 재확인하세요');
            return;
        }

        setIdError('');
        setPasswordError('');
        
        router.push('childprofile/childname' as any);
        }
    
    return (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
                contentContainerStyle={styles.inner}
                keyboardShouldPersistTaps="handled"
                >
                
                    <View style={styles.logoArea}>
                        <View style={styles.logoRow}>
                        <Text style={styles.logoTitle}>월동</Text>
                        <Image
                            source={require('../assets/images/canola_flower_small.png')}
                            style={styles.logoFlower}
                            resizeMode="contain"
                        />
                        </View>
                    </View>
                    <View style = {styles.descriptionArea}>
                        <Text style={styles.descriptiontitle}>로그인</Text>
                        <Text style={styles.description}>이메일과 비밀번호를 입력해주세요</Text>
                    </View>
                
                    <View style={styles.content}>
                        <Text style={styles.screenTitle}>이메일 </Text>
                
                        <View
                        style={[
                            styles.idInputBox,
                            idError ? styles.inputError : null,
                        ]}
                        >
                            <TextInput
                                style={styles.idInput}
                                autoCapitalize="none"
                                value={id}
                                onChangeText={(text) => {
                                setId(text);
                                if (idError) {
                                    setIdError('');
                                }
                                }}
                            />
                        </View>
                        {idError ? (
                        <Text style={styles.errorText}>{idError}</Text>
                        ) : null}
                    </View>
                
                    <View style={styles.content}>
                        <Text style={styles.screenTitle}>비밀번호 입력</Text>
                
                        <View
                        style={[
                            styles.passwordInputBox,
                            passwordError ? styles.inputError : null,
                            passwordMatchError ? styles.inputError : null,
                        ]}
                        >
                        <TextInput
                            style={styles.passwordInput}
                            autoCapitalize="none"
                            secureTextEntry={!isPasswordVisible}
                            value={password}
                            onChangeText={(text) => {
                            setPassword(text);
                            if (passwordError) {
                                setPasswordError('');
                            }
                            if (passwordMatchError) {
                                setPasswordMatchError('');
                            }
                            }}
                        />
                
                        <Text
                            style={styles.eyeText}
                            onPress={() =>
                            setIsPasswordVisible(!isPasswordVisible)
                            }
                        >
                            {isPasswordVisible ? '가리기' : '보기'}
                        </Text>
                        </View>
                
                        {passwordError ? (
                        <Text style={styles.errorText}>{passwordError}</Text>
                        ) : null}
                        {passwordMatchError ? (
                        <Text style={styles.errorText}>{passwordMatchError}</Text>
                        ) : null}
                    </View>
                    <View style={styles.buttonArea}>
                        <PrimaryButton label="계속" onPress={handleNext} />
                    </View>
                    <Text style={styles.policyText}>
                        계속을 클릭하면 당사의{' '}
                        <Text style={styles.policyBoldText}>서비스 이용 약관</Text> 및{' '}
                        <Text style={styles.policyBoldText}>개인정보 처리방침</Text>에{'\n'}
                        동의하는 것으로 간주됩니다.
                    </Text>
                    </ScrollView>
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
        flexGrow: 1,
        width: '100%',
        alignItems: 'center',
        paddingTop: 30,
        paddingBottom: 100,
      },
  
    logoArea: {
        alignItems: 'center',
        marginBottom: 50,
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
        paddingBottom: 20,
    },
  
    screenTitle: {
        width: '82%',
        fontFamily: Fonts.bodyBold,
        fontSize: 17,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: -5,
        textAlign:'left',
    },

    descriptionArea:{
        width: '100%',
        marginBottom: 50,
    },
    
    descriptiontitle:{
        fontFamily: Fonts.bodyBold,
        fontSize: 17,
        fontWeight: '900',
        color: Colors.black,
        marginTop: -10,
        marginBottom: 22,
        textAlign: 'center',
    }, 

    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.textShadow,
        marginTop: -10,
        marginBottom: 22,
        textAlign: 'center',
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
        marginBottom: -10,
      },

      idInputBox: {
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
      
      idInput: {
        flex: 1,
        height: '100%',
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.text,
        padding: 0,
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
        marginTop: 80,
      },
      
      eyeText: {
        fontSize: 14,
        color: Colors.textShadow,
        marginLeft: 8,
      },
    
  });