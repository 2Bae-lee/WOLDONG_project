import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
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

const jobOptions = [
    { label: '담임 선생님', description: '학교 일정과 생활 정보를 함께 확인해요.' },
    { label: '활동지원사', description: '외출, 이동, 일상 지원 일정을 함께 확인해요.' },
    { label: '치료사', description: '치료 일정과 아이 반응 메모를 함께 확인해요.' },
    { label: '가족', description: '가족 돌봄과 공유 일정을 함께 확인해요.' },
    { label: '기타', description: '직접 설명이 필요한 동행인이에요.' },
];

export default function CompanionProfileSetup() {
    const params = useLocalSearchParams<{
        companionName?: string;
        companionRelation?: string;
        companionJob?: string;
        companionIntro?: string;
        companionPhone?: string;
        companionProfileImage?: string;
    }>();
    const [name, setName] = useState(params.companionName || '');
    const [job, setJob] = useState(params.companionJob || params.companionRelation || '');
    const [intro, setIntro] = useState(params.companionIntro || '');
    const [profileImage, setProfileImage] = useState<string | null>(params.companionProfileImage || null);
    const [nameError, setNameError] = useState('');
    const [jobError, setJobError] = useState('');
    const [isJobSheetOpen, setIsJobSheetOpen] = useState(false);

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
        const trimmedJob = job.trim();
        const trimmedIntro = intro.trim();

        if (!trimmedName) {
            setNameError('이름을 입력해주세요.');
            return;
        }

        if (!trimmedJob) {
            setJobError('직업을 선택해주세요.');
            return;
        }

        Keyboard.dismiss();
        router.replace({
            pathname: '/companion_home',
            params: {
                companionName: trimmedName,
                companionJob: trimmedJob,
                companionRelation: trimmedJob,
                companionIntro: trimmedIntro,
                companionProfileImage: profileImage ?? '',
            },
        } as any);
    };

    return (
        <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.inner}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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
                        <Text style={styles.fieldTitle}>직업<Text style={styles.essential}> *</Text></Text>
                        <Pressable
                            style={[styles.selectField, jobError && styles.inputError]}
                            onPress={() => setIsJobSheetOpen(true)}
                        >
                            <Text style={[
                                styles.selectFieldText,
                                !job && styles.selectFieldPlaceholder,
                            ]}>
                                {job || '직업을 선택해주세요'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={Colors.textShadow} />
                        </Pressable>
                        {jobError ? <Text style={styles.errorText}>{jobError}</Text> : null}
                    </View>

                    <View style={styles.fieldArea}>
                        <Text style={styles.fieldTitle}>자기소개</Text>
                        <TextInput
                            style={styles.introInput}
                            placeholder="예) 아이가 편안하게 이동할 수 있도록 차분하게 안내해요."
                            placeholderTextColor={Colors.textShadow}
                            value={intro}
                            onChangeText={setIntro}
                            multiline
                            textAlignVertical="top"
                        />
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

            <Modal
                visible={isJobSheetOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsJobSheetOpen(false)}
            >
                <Pressable style={styles.sheetBackdrop} onPress={() => setIsJobSheetOpen(false)}>
                    <Pressable style={styles.sheet} onPress={() => undefined}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>직업 선택</Text>
                        <Text style={styles.sheetDescription}>부모님에게 보여질 동행인의 직업을 골라주세요.</Text>
                        {jobOptions.map((option) => {
                            const selected = job === option.label;

                            return (
                                <Pressable
                                    key={option.label}
                                    style={[
                                        styles.sheetOption,
                                        selected && styles.sheetOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setJob(option.label);
                                        if (jobError) setJobError('');
                                        setIsJobSheetOpen(false);
                                    }}
                                >
                                    <View style={styles.sheetTypeIcon}>
                                        <Ionicons name="briefcase-outline" size={18} color={Colors.text} />
                                    </View>
                                    <View style={styles.sheetOptionTextArea}>
                                        <Text style={styles.sheetOptionText}>{option.label}</Text>
                                        <Text style={styles.sheetOptionDescription}>{option.description}</Text>
                                    </View>
                                    {selected ? (
                                        <Ionicons name="checkmark-circle" size={22} color={Colors.highlight1} />
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>
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
        paddingBottom: 120,
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

    selectField: {
        width: '100%',
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
    },

    selectFieldText: {
        flex: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    selectFieldPlaceholder: {
        fontFamily: Fonts.body,
        fontWeight: '400',
        color: Colors.textShadow,
    },

    introInput: {
        width: '100%',
        minHeight: 112,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
    },

    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.18)',
        justifyContent: 'flex-end',
    },

    sheet: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: Colors.pageBg,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 34,
    },

    sheetHandle: {
        alignSelf: 'center',
        width: 44,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D8CFBE',
        marginBottom: 18,
    },

    sheetTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },

    sheetDescription: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.textShadow,
        marginBottom: 16,
    },

    sheetOption: {
        minHeight: 72,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 10,
    },

    sheetOptionSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF4CF',
    },

    sheetTypeIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    sheetOptionTextArea: {
        flex: 1,
    },

    sheetOptionText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
    },

    sheetOptionDescription: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 18,
        color: Colors.textShadow,
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
