import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import SmallButton from '../../../components/SmallButton';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

export default function ParentSignupPhoneNumber() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const formatPhoneNumber = (text: string) => {
        const numbersOnly = text.replace(/[^0-9]/g, '');

        if (numbersOnly.length <= 3) {
        return numbersOnly;
        }

        if (numbersOnly.length <= 7) {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
        }

        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
    };

    const handlePhoneChange = (text: string) => {
        const formattedPhoneNumber = formatPhoneNumber(text);
        setPhoneNumber(formattedPhoneNumber);

        if (phoneError) {
        setPhoneError('');
        }
    };

    const handleNext = () => {
        console.log('전화번호 계속 버튼 눌림');
        console.log('현재 전화번호:', phoneNumber);
    
        const phoneRegex = /^010-\d{4}-\d{4}$/;
    
        if (phoneNumber.trim() === '') {
        setPhoneError('전화번호를 입력해 주세요.');
        return;
        }
    
        if (!phoneRegex.test(phoneNumber)) {

        setPhoneError('전화번호 형식을 확인해 주세요.');
        return;
        }
    
        setPhoneError('');
        router.push('/signup/parent/signupsuccess' as any);
    };
    

    return (
        <View style={styles.container}>
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
            <Text style={styles.screenTitle}>전화번호 입력</Text>
            <Text style={styles.description}>
            원활한 서비스 이용을 위해 전화번호를 입력해 주세요
            </Text>

            <TextInput
            style={[
                styles.input,
                phoneError ? styles.inputError : null,
            ]}
            placeholder="010-0000-0000"
            placeholderTextColor={Colors.textShadow}
            keyboardType="phone-pad"
            value={phoneNumber}
            maxLength={13}
            onChangeText={handlePhoneChange}
            />

            {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}

            <SmallButton
            label="계속"
            onPress={handleNext}
            />
        </View>

        <Text style={styles.policyText}>
            계속을 클릭하면 당사의 <Text style={styles.policyBoldText}>서비스 이용 약관</Text> 및 <Text style={styles.policyBoldText}>개인정보 처리방침</Text>에{'\n'}
            동의하는 것으로 간주됩니다.
        </Text>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.pageBg,
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
        fontSize: 11,
        color: Colors.highlight3,
        marginBottom: 10,
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