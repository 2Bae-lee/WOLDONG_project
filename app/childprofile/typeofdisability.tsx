import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

export default function SignupRole() {
    const [typeofdisability, setTypeOfDisabilty] = useState<'intellectual' | 'autism' | null>(null);
    const [typeofdisabilityError, setTypeOfDisabiltyError] = useState('');
    const params = useLocalSearchParams<{
        name?: string;
        profileImage?: string;
      }>();
      const childName = params.name ?? '김월동';
      const profileImage = params.profileImage ?? '';
      
    const handleNext = () => {
        
        if (!typeofdisability) {
            setTypeOfDisabiltyError('장애 유형을 선택해주세요');
            return;
        }

        router.push({
            pathname: '/childprofile/characteristic',        
            params: {        
              name: childName,        
              profileImage,        
              typeofdisability,       
            },
        
          } as any);
        };


    return (
        

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
                        <View style={styles.profileImageWrapper}>
                            <Image
                                source={
                                profileImage
                                    ? { uri: profileImage }
                                    : require('../../assets/images/icon_child.png')
                                }
                                style={profileImage ? styles.profileImage : styles.iconChild}
                                resizeMode={profileImage ? 'cover' : 'contain'}
                            />
                        </View>
                        <Text style={styles.childName}>{childName}</Text>
                            
                </View>


                <View style={styles.fieldArea}>
                    <Text style={styles.screenTitle}>
                        장애 유형<Text style={styles.essential}> *</Text>
                    </Text>

                    <View style={styles.row}>
                        <Pressable
                        style={[
                            styles.selectButton,
                            typeofdisability === 'intellectual' && styles.selectButtonSelected,
                        ]}
                        onPress={() => {
                            setTypeOfDisabilty('intellectual');
                            setTypeOfDisabiltyError('');
                        }}
                        >
                            <Text style={styles.selectButtonText}>지적장애</Text>
                        </Pressable>

                        <Pressable
                        style={[
                            styles.selectButton,
                            typeofdisability === 'autism' && styles.selectButtonSelected,
                        ]}
                        onPress={() => {
                            setTypeOfDisabilty('autism');
                            setTypeOfDisabiltyError('');
                        }}
                        >
                            <Text style={styles.selectButtonText}>자폐스퍽트럼</Text>
                        </Pressable>
                    </View>

                    {typeofdisabilityError ? <Text style={styles.errorText}>{typeofdisabilityError}</Text> : null}
                </View>
                <View style={styles.buttonArea}>
                    <PrimaryButton
                        label="다음"
                        width="100%"
                        onPress={handleNext}/>
                </View>      
            </View>
        </View>
    );

}
const styles = StyleSheet.create({

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
      marginBottom: 60,
    },
  
    screenTitle: {
      fontFamily: Fonts.bodyBold,
      fontWeight: '900',
      fontSize: 16,
      color: Colors.text,
      marginBottom: 10,
    },

    childName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 40,
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
      
    profileImage: {
        width: 120,
        alignSelf: 'center',
        height: 120,
        borderRadius: 60,
      },
      
    profileImageWrapper: {
        width: 120,      
        height: 120,      
        alignSelf: 'center',      
        alignItems: 'center',      
        justifyContent: 'center',    
        marginBottom: 20,
      },
    buttonArea: {
        marginTop: 'auto',
        marginBottom: 60,
    }

  });