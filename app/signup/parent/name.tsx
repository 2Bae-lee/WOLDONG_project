import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import SmallButton from '../../../components/SmallButton';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

export default function ParentSignupName() {
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState('');

    const handleNext = () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setNameError('이름을 입력해 주세요.');
            return;
        }

        setNameError('');
        router.push({
            pathname: '/signup/parent/email',
            params: {
                name: trimmedName,
            },
        } as any);
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
                <Text style={styles.screenTitle}>보호자 이름 입력</Text>
                <Text style={styles.description}>
                    회원가입에 사용할 보호자 이름을 입력해 주세요
                </Text>

                <TextInput
                    style={[
                        styles.input,
                        nameError ? styles.inputError : null,
                    ]}
                    placeholder="예) 이가현"
                    placeholderTextColor={Colors.textShadow}
                    autoCapitalize="none"
                    value={name}
                    onChangeText={(text) => {
                        setName(text);
                        if (nameError) {
                            setNameError('');
                        }
                    }}
                    returnKeyType="done"
                    onSubmitEditing={handleNext}
                />

                {nameError ? (
                    <Text style={styles.errorText}>{nameError}</Text>
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
        fontWeight: '900',
        fontSize: 20,
        color: Colors.text,
        marginBottom: 8,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textShadow,
        marginBottom: 24,
    },

    input: {
        width: 320,
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.pageBg3,
        paddingHorizontal: 14,
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.text,
        backgroundColor: Colors.pageBg,
        marginBottom: 8,
    },

    inputError: {
        borderColor: Colors.highlight3,
    },

    errorText: {
        width: 320,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.highlight3,
        marginBottom: 8,
    },

    policyText: {
        marginTop: 'auto',
        fontFamily: Fonts.body,
        fontSize: 11,
        lineHeight: 18,
        color: Colors.textShadow,
        textAlign: 'center',
    },

    policyBoldText: {
        fontFamily: Fonts.bodyBold,
        fontWeight: '900',
        color: Colors.text,
    },
});
