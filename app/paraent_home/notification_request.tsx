import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import { approveInviteRequest, markNotificationRead } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

const relationOptions = ['담임 선생님', '활동지원사', '치료사', '가족'];
const permissionOptions = [
    '아이 프로필',
    '오늘 일정',
    '공유 캘린더',
    '주의사항',
];

export default function NotificationRequest() {
    const params = useLocalSearchParams<{
        requestId?: string;
        notificationId?: string;
        companionName?: string;
        childId?: string;
        requestMessage?: string;
        companionPhone?: string;
        companionIntro?: string;
        companionRelation?: string;
        companionProfileImage?: string;
    }>();
    const companionName = params.companionName || '동행인';
    const requestMessage = params.requestMessage || `${companionName}님이 아동 연결을 요청했어요.`;
    const companionPhone = params.companionPhone || '연락처는 회원가입 정보에서 확인돼요';
    const companionIntro = params.companionIntro || '';
    const companionProfileImage = params.companionProfileImage || '';
    const [selectedRelation, setSelectedRelation] = useState(params.companionRelation || '담임 선생님');
    const [selectedPermissions, setSelectedPermissions] = useState([
        '아이 프로필',
        '오늘 일정',
        '주의사항',
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorText, setErrorText] = useState('');

    const togglePermission = (permission: string) => {
        setSelectedPermissions((current) => (
            current.includes(permission)
                ? current.filter((item) => item !== permission)
                : [...current, permission]
        ));
    };

    const markCurrentNotificationRead = async () => {
        if (!params.notificationId) return;

        try {
            await markNotificationRead(params.notificationId);
        } catch {
            // 이미 읽음 처리되었어도 승인/거절은 계속 진행합니다.
        }
    };

    const approveCompanion = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setErrorText('');

        try {
            if (params.requestId) {
                await approveInviteRequest(params.requestId, true, {
                    relation: selectedRelation,
                    permissions: selectedPermissions,
                });
            }
            await markCurrentNotificationRead();

            router.replace({
                pathname: '/paraent_home/companions',
                params: {
                    childId: params.childId ?? '',
                },
            } as any);
        } catch (error) {
            setErrorText(error instanceof Error ? error.message : '동행인 승인에 실패했어요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const rejectCompanion = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setErrorText('');

        try {
            if (params.requestId) {
                await approveInviteRequest(params.requestId, false);
            }
            await markCurrentNotificationRead();
            router.replace('/paraent_home/notifications' as any);
        } catch (error) {
            setErrorText(error instanceof Error ? error.message : '동행인 요청 거절에 실패했어요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.inner}
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
                    <Text style={styles.title}>동행인 승인 요청</Text>
                    <Text style={styles.description}>{requestMessage}</Text>
                </View>

                <View style={styles.profileCard}>
                    <Image
                        source={
                            companionProfileImage
                                ? { uri: companionProfileImage }
                                : require('../../assets/images/icon_companion.png')
                        }
                        style={companionProfileImage ? styles.profileImageFilled : styles.profileImage}
                        resizeMode={companionProfileImage ? 'cover' : 'contain'}
                    />
                    <Text style={styles.name}>{companionName}</Text>
                    <Text style={styles.info}>{companionPhone}</Text>
                    {companionIntro ? <Text style={styles.intro}>{companionIntro}</Text> : null}
                    <Text style={styles.permissionText}>
                        승인 전 부모님이 이 동행인의 관계와 접근 권한을 정리할 수 있어요.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>동행인 분류</Text>
                    <View style={styles.optionGrid}>
                        {relationOptions.map((relation) => {
                            const selected = selectedRelation === relation;

                            return (
                                <Pressable
                                    key={relation}
                                    style={[styles.relationChip, selected && styles.relationChipSelected]}
                                    onPress={() => setSelectedRelation(relation)}
                                >
                                    <Text style={[
                                        styles.relationChipText,
                                        selected && styles.relationChipTextSelected,
                                    ]}>
                                        {relation}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>허용할 권한</Text>
                    <View style={styles.permissionCard}>
                        {permissionOptions.map((permission) => {
                            const selected = selectedPermissions.includes(permission);

                            return (
                                <Pressable
                                    key={permission}
                                    style={styles.permissionRow}
                                    onPress={() => togglePermission(permission)}
                                >
                                    <View style={[
                                        styles.permissionCheck,
                                        selected && styles.permissionCheckSelected,
                                    ]}>
                                        {selected ? (
                                            <Ionicons name="checkmark" size={15} color={Colors.realwhite} />
                                        ) : null}
                                    </View>
                                    <Text style={styles.permissionLabel}>{permission}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
            </ScrollView>

            <View style={styles.buttonArea}>
                <Pressable style={styles.rejectButton} onPress={rejectCompanion}>
                    <Text style={styles.rejectButtonText}>거절하기</Text>
                </Pressable>
                <PrimaryButton
                    label={isSubmitting ? '처리 중' : '승인하기'}
                    width="100%"
                    onPress={approveCompanion}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.pageBg,
        paddingTop: 10,
        paddingHorizontal: 32,
        paddingBottom: 54,
    },

    scrollView: {
        flex: 1,
    },

    inner: {
        flexGrow: 1,
        paddingBottom: 24,
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
        marginBottom: 20,
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 23,
        color: Colors.textShadow,
        marginBottom: 0,
    },

    profileCard: {
        width: '100%',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 30,
        marginBottom: 24,
    },

    profileImage: {
        width: 82,
        height: 82,
        marginBottom: 14,
    },

    profileImageFilled: {
        width: 82,
        height: 82,
        borderRadius: 41,
        marginBottom: 14,
    },

    name: {
        fontFamily: Fonts.bodyBold,
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 6,
    },

    section: {
        width: '100%',
        marginBottom: 24,
    },

    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 17,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 12,
    },

    optionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    relationChip: {
        minHeight: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
    },

    relationChipSelected: {
        backgroundColor: Colors.highlight1,
        borderColor: Colors.highlight1,
    },

    relationChipText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },

    relationChipTextSelected: {
        color: Colors.text,
    },

    info: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textShadow,
        marginBottom: 10,
    },

    intro: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 18,
    },

    permissionText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.text,
        textAlign: 'center',
    },

    permissionCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 14,
        gap: 12,
    },

    permissionRow: {
        minHeight: 32,
        flexDirection: 'row',
        alignItems: 'center',
    },

    permissionCheck: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: Colors.pageBg3,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    permissionCheckSelected: {
        backgroundColor: Colors.highlight1,
    },

    permissionLabel: {
        flex: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    errorText: {
        marginTop: -8,
        marginBottom: 14,
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.highlight3,
        textAlign: 'center',
    },

    buttonArea: {
        width: '100%',
        gap: 10,
    },

    rejectButton: {
        width: '100%',
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    rejectButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.textShadow,
    },
});
