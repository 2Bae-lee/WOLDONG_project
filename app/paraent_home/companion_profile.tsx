import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { deleteLinkedCompanion } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

const parsePermissions = (value?: string) => (
    value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []
);

const permissionOptions = [
    '아이 프로필',
    '오늘 일정',
    '공유 캘린더',
    '주의사항',
];

export default function CompanionProfile() {
    const params = useLocalSearchParams<{
        childId?: string;
        companionId?: string;
        name?: string;
        relation?: string;
        status?: string;
        permissions?: string;
    }>();

    const name = params.name || '동행인';
    const relation = params.relation || '동행인';
    const status = params.status || '아이 정보를 함께 확인할 수 있어요.';
    const [permissions, setPermissions] = useState(() => parsePermissions(params.permissions));
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [draftPermissions, setDraftPermissions] = useState<string[]>(permissions);
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorText, setErrorText] = useState('');

    const openPermissionModal = () => {
        setDraftPermissions(permissions);
        setIsPermissionModalOpen(true);
    };

    const toggleDraftPermission = (permission: string) => {
        setDraftPermissions((current) => (
            current.includes(permission)
                ? current.filter((item) => item !== permission)
                : [...current, permission]
        ));
    };

    const savePermissions = () => {
        setPermissions(draftPermissions);
        setIsPermissionModalOpen(false);
    };

    const deleteCompanion = async () => {
        if (isDeleting) return;

        setIsDeleting(true);
        setErrorText('');

        try {
            if (!params.childId || !params.companionId) {
                throw new Error('철회할 동행인 정보를 확인할 수 없어요.');
            }

            await deleteLinkedCompanion(params.childId, params.companionId);

            router.replace({
                pathname: '/paraent_home/companions',
                params: {
                    childId: params.childId ?? '',
                    removedCompanionId: params.companionId ?? '',
                    refreshAt: String(Date.now()),
                },
            } as any);
        } catch (error) {
            setErrorText(error instanceof Error ? error.message : '동행인 권한 철회에 실패했어요.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
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
                <Text style={styles.title}>동행인 프로필</Text>
                <Text style={styles.description}>부모님이 정리한 동행인 정보예요.</Text>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatarCircle}>
                    <Image
                        source={require('../../assets/images/icon_companion.png')}
                        style={styles.avatarImage}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.name}>{name}</Text>
                <Text style={styles.relationBadge}>{relation}</Text>

                <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                        <Ionicons name="checkmark-circle" size={17} color={Colors.highlight1} />
                        <Text style={styles.infoText}>{status}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>허용된 권한</Text>
                    <Pressable style={styles.editPermissionButton} onPress={openPermissionModal}>
                        <Ionicons name="pencil" size={15} color={Colors.textShadow} />
                        <Text style={styles.editPermissionText}>수정</Text>
                    </Pressable>
                </View>
                <View style={styles.permissionCard}>
                    {permissions.length > 0 ? (
                        permissions.map((permission) => (
                            <View key={permission} style={styles.permissionRow}>
                                <Ionicons name="checkmark" size={18} color={Colors.highlight1} />
                                <Text style={styles.permissionText}>{permission}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>아직 설정된 권한이 없어요.</Text>
                    )}
                </View>
            </View>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <Pressable style={styles.deleteButton} onPress={deleteCompanion}>
                <Ionicons name="trash-outline" size={17} color={Colors.highlight3} />
                <Text style={styles.deleteButtonText}>
                    {isDeleting ? '철회 중' : '권한 철회하기'}
                </Text>
            </Pressable>

            <Modal
                visible={isPermissionModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsPermissionModalOpen(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setIsPermissionModalOpen(false)}>
                    <Pressable style={styles.permissionModal} onPress={() => undefined}>
                        <Text style={styles.modalTitle}>권한 수정하기</Text>
                        <Text style={styles.modalDescription}>
                            이 동행인이 확인할 수 있는 정보를 선택해주세요.
                        </Text>

                        <View style={styles.modalPermissionCard}>
                            {permissionOptions.map((permission) => {
                                const selected = draftPermissions.includes(permission);

                                return (
                                    <Pressable
                                        key={permission}
                                        style={styles.modalPermissionRow}
                                        onPress={() => toggleDraftPermission(permission)}
                                    >
                                        <View style={[
                                            styles.modalPermissionCheck,
                                            selected && styles.modalPermissionCheckSelected,
                                        ]}>
                                            {selected ? (
                                                <Ionicons name="checkmark" size={15} color={Colors.realwhite} />
                                            ) : null}
                                        </View>
                                        <Text style={styles.modalPermissionText}>{permission}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <View style={styles.modalButtonRow}>
                            <Pressable
                                style={styles.cancelButton}
                                onPress={() => setIsPermissionModalOpen(false)}
                            >
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </Pressable>
                            <Pressable style={styles.saveButton} onPress={savePermissions}>
                                <Text style={styles.saveButtonText}>저장</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
        marginBottom: 28,
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

    profileCard: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 30,
        marginBottom: 28,
    },

    avatarCircle: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: '#FFF8DF',
        borderWidth: 1,
        borderColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },

    avatarImage: {
        width: 58,
        height: 58,
    },

    name: {
        fontFamily: Fonts.bodyBold,
        fontSize: 22,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },

    relationBadge: {
        borderRadius: 14,
        backgroundColor: Colors.highlight1,
        paddingHorizontal: 12,
        paddingVertical: 5,
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.text,
        overflow: 'hidden',
        marginBottom: 20,
    },

    infoBox: {
        width: '100%',
        borderRadius: 14,
        backgroundColor: Colors.pageBg,
        padding: 14,
        gap: 10,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    infoText: {
        flex: 1,
        marginLeft: 8,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.text,
    },

    section: {
        width: '100%',
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 17,
        fontWeight: '900',
        color: Colors.text,
    },

    editPermissionButton: {
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F7F4E8',
        borderWidth: 1,
        borderColor: '#E8DDC8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },

    editPermissionText: {
        marginLeft: 4,
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.textShadow,
    },

    permissionCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 14,
        gap: 10,
    },

    permissionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    permissionText: {
        flex: 1,
        marginLeft: 8,
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    emptyText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textShadow,
    },

    errorText: {
        marginTop: 14,
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.highlight3,
        textAlign: 'center',
    },

    deleteButton: {
        width: '100%',
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 22,
    },

    deleteButtonText: {
        marginLeft: 6,
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.highlight3,
    },

    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(17, 17, 17, 0.28)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },

    permissionModal: {
        width: '100%',
        borderRadius: 18,
        backgroundColor: Colors.pageBg,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        padding: 20,
    },

    modalTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },

    modalDescription: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textShadow,
        marginBottom: 16,
    },

    modalPermissionCard: {
        width: '100%',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 12,
        gap: 12,
        marginBottom: 16,
    },

    modalPermissionRow: {
        minHeight: 32,
        flexDirection: 'row',
        alignItems: 'center',
    },

    modalPermissionCheck: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: Colors.pageBg3,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    modalPermissionCheckSelected: {
        backgroundColor: Colors.highlight1,
    },

    modalPermissionText: {
        flex: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    modalButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },

    cancelButton: {
        height: 38,
        borderRadius: 19,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F4E8',
    },

    cancelButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.textShadow,
    },

    saveButton: {
        height: 38,
        borderRadius: 19,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.highlight1,
    },

    saveButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },
});
