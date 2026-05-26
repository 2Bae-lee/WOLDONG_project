import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
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
    TouchableWithoutFeedback,
    View
} from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

export default function SignupRole() {
    const [name, setName] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | null>(null);
    const [birth, setBirth] = useState('');
    const [relationship, setRelationship] = useState('');
    const [nameError, setNameError] = useState('');
    const [genderError, setGenderError] = useState('');
    const [birthError, setBirthError] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);

    const formatBirthDate = (text: string) => {
        const onlyNumbers = text.replace(/[^0-9]/g, '');
      
        if (onlyNumbers.length <= 4) {
          return onlyNumbers;
        }
      
        if (onlyNumbers.length <= 6) {
          return `${onlyNumbers.slice(0, 4)}.${onlyNumbers.slice(4)}`;
        }
      
        return `${onlyNumbers.slice(0, 4)}.${onlyNumbers.slice(4, 6)}.${onlyNumbers.slice(6, 8)}`;
      };
    
    const isValidBirthDate = (birth: string) => {
        const birthRegex = /^\d{4}\.\d{2}\.\d{2}$/;

        const year = Number(birth.slice(0, 4));
        const month = Number(birth.slice(5, 7));
        const day = Number(birth.slice(8, 10));
      
        if (year < 1900) return false;
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
      
        const date = new Date(year, month - 1, day);
        return (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
        );
      };

    const handleNext = () => {
        const trimmedname = name.trim();
        
        if (trimmedname === '') {
            setNameError('이름을 입력해주세요');
            return;
        }
        if (!gender) {
            setGenderError('성별을 입력해주세요');
            return;
        }
        if (!birth.trim()) {
            setBirthError('생년월일을 입력해주세요.');
            return;
        }
        
        if (birth.length !== 10) {
            setBirthError('생년월일을 2026.05.16 형식으로 입력해주세요.');
            return;
        }

        if (!isValidBirthDate(birth)) {
            setBirthError('생년월일을 확인해주세요.');       
            return;       
        }

        router.push({
            pathname: '/childprofile/typeofdisability', 
            params: {
                name: trimmedname,                        
                profileImage: profileImage ?? '',
            
              }, 
            } as any);
        };

        const pickImage = async () => {
            const permissionResult =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
          
            if (!permissionResult.granted) {
              alert('사진을 선택하려면 앨범 접근 권한이 필요해요.');
              return;
            }
          
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
          
            if (!result.canceled) {
              setProfileImage(result.assets[0].uri);
            }
          
    }

    return (
        <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    contentContainerStyle={styles.inner}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    automaticallyAdjustKeyboardInsets={true}
                    >

                    <View style={styles.container}>
                        <View style={styles.logoArea}>
                            <View style={styles.logoRow}>
                                <Text style={styles.logoTitle}>월동</Text>
                                <Image
                                    source={require('../../assets/images/canola_flower_small.png')}
                                    style={styles.logoFlower}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        <View style={styles.content}>
                            <View style={styles.titleArea}>
                                <Text style={styles.title}><Text style={styles.titleBold}>월동</Text>에게 우리 아이를{'\n'}소개해주세요</Text>
                                <Pressable style={styles.profileImageButton} onPress={pickImage}>
                                    <Image
                                        source={
                                        profileImage
                                            ? { uri: profileImage }
                                            : require('../../assets/images/icon_child.png')
                                        }
                                        style={profileImage ? styles.profileImage : styles.iconChild}
                                        resizeMode={profileImage ? 'cover' : 'contain'}
                                    />
                                    <View style={styles.cameraBadge}>
                                        <Text style={styles.cameraText}>＋</Text>
                                    </View>

                                    </Pressable>
                            </View>

                            <View style={styles.fieldArea}>
                                <Text style={styles.screenTitle}>이름 <Text style={styles.screenText}>/</Text> 애칭<Text style={styles.essential}> *</Text> </Text>
                                        
                                <TextInput
                                    style={[styles.input, nameError ? styles.inputError : null]}
                                    autoCapitalize="none"
                                    value={name}
                                    placeholder="예) 김월동"
                                    placeholderTextColor={Colors.textShadow}
                                    onChangeText={(text) => {
                                        setName(text);
                                        if (nameError) setNameError('');
                                    }}
                                    />

                                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                            </View>

                            <View style={styles.fieldArea}>
                                <Text style={styles.screenTitle}>
                                    성별<Text style={styles.essential}> *</Text>
                                </Text>

                                <View style={styles.row}>
                                    <Pressable
                                    style={[
                                        styles.selectButton,
                                        gender === 'male' && styles.selectButtonSelected,
                                    ]}
                                    onPress={() => {
                                        setGender('male');
                                        setGenderError('');
                                    }}
                                    >
                                        <Text style={styles.selectButtonText}>남자아이</Text>
                                    </Pressable>

                                    <Pressable
                                    style={[
                                        styles.selectButton,
                                        gender === 'female' && styles.selectButtonSelected,
                                    ]}
                                    onPress={() => {
                                        setGender('female');
                                        setGenderError('');
                                    }}
                                    >
                                        <Text style={styles.selectButtonText}>여자아이</Text>
                                    </Pressable>
                                </View>

                                {genderError ? <Text style={styles.errorText}>{genderError}</Text> : null}
                            </View>

                            <View style={styles.fieldArea}>
                                <Text style={styles.screenTitle}>생년월일<Text style={styles.essential}> *</Text> </Text>
                                <TextInput
                                    style={[styles.input, birthError ? styles.inputError : null]}
                                    placeholder="예) 2026.05.16"
                                    placeholderTextColor={Colors.textShadow}
                                    value={birth}
                                    onChangeText={(text) => {
                                        setBirth(formatBirthDate(text));
                                        if (birthError) setBirthError('');
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={10}
                                />
                                {birthError ? <Text style={styles.errorText}>{birthError}</Text> : null}
                            </View>
                            
                            <View style={styles.fieldArea}>
                                <Text style={styles.screenTitle}>
                                    아동과의 관계
                                </Text>

                                <View style={styles.relationshipRow}>
                                    <Pressable
                                    style={[
                                        styles.relationshipButton,
                                        relationship === 'primarycaregiver' && styles.selectButtonSelected,
                                    ]}
                                    onPress={() => {
                                        setRelationship('primarycaregiver');
                                    }}
                                    >
                                    <Text style={styles.selectButtonText}>주양육자</Text>
                                    </Pressable>

                                    <Pressable
                                    style={[
                                        styles.relationshipButton,
                                        relationship === 'parent' && styles.selectButtonSelected,
                                    ]}
                                    onPress={() => {
                                        setRelationship('parent');
                                    }}
                                    >
                                    <Text style={styles.selectButtonText}>부모</Text>
                                    </Pressable>

                                    <Pressable
                                    style={[
                                        styles.relationshipButton,
                                        relationship === 'grandparent' && styles.selectButtonSelected,
                                    ]}
                                    onPress={() => {
                                        setRelationship('grandparent');
                                    }}
                                    >
                                    <Text style={styles.selectButtonText}>조부모</Text>
                                    </Pressable>
                                </View>

                            </View>

                            <View style={styles.buttonArea}>
                                <PrimaryButton
                                    label="다음"
                                    width="100%"
                                    onPress={handleNext}/>
                            </View>  
                        </View>
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
        width: '100%',
      },
    
    inner: {
        flexGrow: 1,
        width: '100%',
        paddingBottom: 100,
      },

    container: {
      width: '100%',
      minHeight:'100%',
      backgroundColor: Colors.pageBg,
      paddingTop: 10,
      paddingHorizontal: 32,
    },
  
    logoArea: {
      alignItems: 'flex-start',
      marginBottom: 20,
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

    buttonArea: {
        marginTop: 'auto',
        marginBottom: 60,
    },

    titleArea:{
        width: '100%',
        marginBottom: -20,
    },
  
    content: {
      flex: 1,
      width: '100%',
    },

  
    title: {
      fontFamily: Fonts.bodyBold,
      fontSize: 22,
      lineHeight: 32,
      color: Colors.text,
      textAlign: 'center',
      marginBottom: 24,
    },

    titleBold :{
      fontFamily: Fonts.bodyBold,
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 32,
      color: Colors.text,
      textAlign: 'center',
      marginBottom: 24,
    },
  
    iconChild: {
      width: 120,
      height: 120,
      alignSelf: 'center',
      marginBottom: 20,
    },
  
    fieldArea: {
      marginBottom: 15,
    },
  
    screenTitle: {
      fontFamily: Fonts.bodyBold,
      fontWeight: '900',
      fontSize: 16,
      color: Colors.text,
      marginBottom: 10,
    },

    screenText:{
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.text,
        marginBottom: 10,
    },
  
    essential: {
      color: Colors.highlight3,
    },
  
    input: {
      width: '100%',
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.textShadow,
      paddingHorizontal: 14,
      fontFamily: Fonts.body,
      fontSize: 14,
      color: Colors.text,
      backgroundColor: Colors.pageBg,
    },
  
    inputError: {
      borderColor: Colors.highlight3,
    },
  
    errorText: {
      marginTop: 6,
      fontFamily: Fonts.body,
      fontSize: 14,
      color: Colors.highlight3,
    },
  
    row: {
      flexDirection: 'row',
      gap: 10,
    },
  
    selectButton: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      backgroundColor: Colors.pageBg2,
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    selectButtonSelected: {
      backgroundColor: Colors.highlight1,
    },
  
    selectButtonText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      fontWeight: '900',
      color: Colors.text,
    },
  
    relationshipRow: {
      flexDirection: 'row',
      gap: 10,
    },
  
    relationshipButton: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      backgroundColor: Colors.pageBg2,
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    nextButton: {
        height: 62,
        borderRadius: 31,
        backgroundColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 28,
        marginBottom: 44,
      },
  
    nextText: {
      fontFamily: Fonts.bodyBold,
      fontWeight: '900',
      fontSize: 18,
      color: Colors.text,
    },
    profileImageButton: {
        width: 120,
        height: 120,
        alignSelf: 'center',
        marginBottom: 20,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
      },
      
      profileImage: {
        width: 120,
        height: 120,
        alignSelf: 'center',
        borderRadius: 60,
      },
      
      cameraBadge: {
        position: 'absolute',
        right: 2,
        bottom: 2,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.pageBg,
      },
      
      cameraText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 20,
        color: Colors.text,
        marginTop: -2,
      },
  });