import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
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
    View,
} from 'react-native';
import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

const relationOptions = ['담임 선생님', '활동지원사', '치료사', '가족', '기타'];

const formatPhoneNumber = (text: string) => {
    const onlyNumbers = text.replace(/[^0-9]/g, '').slice(0, 11);

    if (onlyNumbers.length <= 3) {
        return onlyNumbers;
    }

    if (onlyNumbers.length <= 7) {
        return `${onlyNumbers.slice(0, 3)}-${onlyNumbers.slice(3)}`;
    }

    return `${onlyNumbers.slice(0, 3)}-${onlyNumbers.slice(3, 7)}-${onlyNumbers.slice(7)}`;
};

export default function CompanionProfileSetup() {
    const params = useLocalSearchParams<{
        companionName?: string;
        companionRelation?: string;
        companionPhone?: string;
        companionProfileImage?: string;
    }>();
    const [name, setName] = useState(params.companionName || '');
    const [relation, setRelation] = useState(params.companionRelation || '');
    const [phone, setPhone] = useState(params.companionPhone || '');
    const [profileImage, setProfileImage] = useState<string | null>(params.companionProfileImage || null);
    const [nameError, setNameError] = useState('');
    const [relationError, setRelationError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

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
    };

    const handleSave = () => {
        const trimmedName = name.trim();
        const trimmedRelation = relation.trim();
        const trimmedPhone = phone.trim();

        if (!trimmedName) {
            setNameError('이름을 입력해주세요.');
            return;
        }

        if (!trimmedRelation) {
            setRelationError('동행인 분류를 선택해주세요.');
            return;
        }

        if (!trimmedPhone) {
            setPhoneError('연락처를 입력해주세요.');
            return;
        }

        Keyboard.dismiss();
        router.replace({
            pathname: '/companion_home',
            params: {
                companionName: trimmedName,
                companionRelation: trimmedRelation,
                companionPhone: trimmedPhone,
                companionProfileImage: profileImage ?? '',
            },
        } as any);
    };

    return (
        <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.inner}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
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

                    <View style={styles.headerArea}>
                        <Text style={styles.title}>동행인 프로필 설정</Text>
                        <Text style={styles.description}>보호자에게 보여질 동행인 정보를 정리해주세요.</Text>
                    </View>

                    <View style={styles.profileArea}>
                        <Pressable style={styles.profileImageButton} onPress={pickImage}>
                            <Image
                                source={
                                    profileImage
                                        ? { uri: profileImage }
                                        : require('../../assets/images/icon_companion.png')
                                }
                                style={profileImage ? styles.profileImageFilled : styles.profileImage}
                                resizeMode={profileImage ? 'cover' : 'contain'}
                            />
                            <View style={styles.cameraBadge}>
                                <Ionicons name={profileImage ? 'pencil' : 'add'} size={18} color={Colors.text} />
                            </View>
                        </Pressable>
                    </View>

                    <View style={styles.fieldArea}>
                        <Text style={styles.fieldTitle}>이름<Text style={styles.essential}> *</Text></Text>
                        <TextInput
                            style={[styles.input, nameError && styles.inputError]}
                            placeholder="예) 박민지"
                            placeholderTextColor={Colors.textShadow}
                            value={name}
                            onChangeText={(text) => {
                                setName(text);
                                if (nameError) setNameError('');
                            }}
                            autoCapitalize="none"
                            returnKeyType="done"
                        />
                        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                    </View>

                    <View style={styles.fieldArea}>
                        <Text style={styles.fieldTitle}>동행인 분류<Text style={styles.essential}> *</Text></Text>
                        <View style={styles.relationGrid}>
                            {relationOptions.map((option) => {
                                const selected = relation === option;

                                return (
                                    <Pressable
                                        key={option}
                                        style={[styles.relationButton, selected && styles.relationButtonSelected]}
                                        onPress={() => {
                                            setRelation(option);
                                            if (relationError) setRelationError('');
                                        }}
                                    >
                                        <Text style={[
                                            styles.relationButtonText,
                                            selected && styles.relationButtonTextSelected,
                                        ]}>
                                            {option}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        {relationError ? <Text style={styles.errorText}>{relationError}</Text> : null}
                    </View>

                    <View style={styles.fieldArea}>
                        <Text style={styles.fieldTitle}>연락처<Text style={styles.essential}> *</Text></Text>
                        <TextInput
                            style={[styles.input, phoneError && styles.inputError]}
                            placeholder="예) 010-1234-5678"
                            placeholderTextColor={Colors.textShadow}
                            value={phone}
                            onChangeText={(text) => {
                                setPhone(formatPhoneNumber(text));
                                if (phoneError) setPhoneError('');
                            }}
                            keyboardType="number-pad"
                            maxLength={13}
                        />
                        {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                    </View>

                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle-outline" size={20} color={Colors.text} />
                        <Text style={styles.infoText}>
                            저장한 정보는 부모님이 동행인 목록과 승인 정보에서 확인하는 목데이터로 연결돼요.
                        </Text>
                    </View>

                    <View style={styles.buttonArea}>
                        <PrimaryButton label="프로필 저장하기" width="100%" onPress={handleSave} />
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
        backgroundColor: Colors.pageBg,
    },

    inner: {
        flexGrow: 1,
        width: '100%',
        paddingTop: 10,
        paddingHorizontal: 32,
        paddingBottom: 54,
    },

    logoArea: {
        alignItems: 'flex-start',
        marginBottom: 24,
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

    headerArea: {
        marginBottom: 24,
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.textShadow,
    },

    profileArea: {
        alignItems: 'center',
        marginBottom: 26,
    },

    profileImageButton: {
        width: 118,
        height: 118,
        borderRadius: 59,
        borderWidth: 2,
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'visible',
    },

    profileImage: {
        width: 82,
        height: 82,
    },

    profileImageFilled: {
        width: '100%',
        height: '100%',
        borderRadius: 59,
    },

    cameraBadge: {
        position: 'absolute',
        right: 2,
        bottom: 2,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.highlight1,
        borderWidth: 2,
        borderColor: Colors.pageBg,
        alignItems: 'center',
        justifyContent: 'center',
    },

    fieldArea: {
        marginBottom: 22,
    },

    fieldTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },

    essential: {
        color: Colors.highlight3,
    },

    input: {
        width: '100%',
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.text,
    },

    inputError: {
        borderColor: Colors.highlight3,
    },

    relationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    relationButton: {
        minHeight: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },

    relationButtonSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: Colors.highlight1,
    },

    relationButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },

    relationButtonTextSelected: {
        color: Colors.text,
    },

    errorText: {
        marginTop: 7,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.highlight3,
    },

    infoCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        marginTop: 2,
        marginBottom: 26,
    },

    infoText: {
        flex: 1,
        marginLeft: 9,
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 20,
        color: Colors.textShadow,
    },

    buttonArea: {
        marginTop: 'auto',
    },
});
