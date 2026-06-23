import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

type DisabilityType = 'intellectual' | 'autism';

const disabilityLabels: Record<DisabilityType, string> = {
    intellectual: '지적장애',
    autism: '자폐스펙트럼',
};

const toDisabilityType = (value?: string): DisabilityType | null => {
    if (value === 'intellectual' || value === 'autism') {
        return value;
    }

    return null;
};

export default function SignupRole() {
    const params = useLocalSearchParams<{
        name?: string;
        profileImage?: string;
        gender?: string;
        birth?: string;
        relationship?: string;
        typeofdisability?: string;
      }>();
    const [typeofdisability, setTypeOfDisabilty] = useState<DisabilityType | null>(() => (
        toDisabilityType(params.typeofdisability)
    ));
    const [typeofdisabilityError, setTypeOfDisabiltyError] = useState('');
      const childName = params.name ?? '아이';
      const profileImage = params.profileImage ?? '';
      
    const handleNext = () => {
        
        if (!typeofdisability) {
            setTypeOfDisabiltyError('장애 유형을 선택해주세요');
            return;
        }

        router.push({
            pathname: '/childprofile/characteristics/howtointeracte',        
            params: {        
              name: childName,        
              profileImage,        
              gender: params.gender ?? '',
              birth: params.birth ?? '',
              relationship: params.relationship ?? '',
              typeofdisability,       
            },
        
          } as any);
        };


    return (
        

        <View style={styles.container}>
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
                        {(Object.keys(disabilityLabels) as DisabilityType[]).map((type) => {
                            const selected = typeofdisability === type;

                            return (
                                <Pressable
                                    key={type}
                                    style={[
                                        styles.selectButton,
                                        selected && styles.selectButtonSelected,
                                    ]}
                                    onPress={() => {
                                        setTypeOfDisabilty(type);
                                        setTypeOfDisabiltyError('');
                                    }}
                                >
                                    <Text style={[
                                        styles.selectButtonText,
                                        selected && styles.selectButtonTextSelected,
                                    ]}>
                                        {disabilityLabels[type]}
                                    </Text>
                                </Pressable>
                            );
                        })}
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

    selectButtonTextSelected: {
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
