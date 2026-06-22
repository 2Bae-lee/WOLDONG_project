import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { approveCompanionRequestNotification } from '../../constants/NotificationState';

const relationOptions = ['담임 선생님', '활동지원사', '치료사', '가족'];
const permissionOptions = [
    '아이 프로필',
    '오늘 일정',
    '공유 캘린더',
    '인수인계 자료',
];

export default function NotificationRequest() {
    const [selectedRelation, setSelectedRelation] = useState('담임 선생님');
    const [selectedPermissions, setSelectedPermissions] = useState([
        '아이 프로필',
        '오늘 일정',
        '인수인계 자료',
    ]);

    const togglePermission = (permission: string) => {
        setSelectedPermissions((current) => (
            current.includes(permission)
                ? current.filter((item) => item !== permission)
                : [...current, permission]
        ));
    };

    const approveCompanion = () => {
        approveCompanionRequestNotification('박민지');

        router.replace({
            pathname: '/paraent_home/companions',
            params: {
                acceptedName: '박민지',
                acceptedRelation: selectedRelation,
                acceptedPhone: '010-1234-5678',
                acceptedPermissions: selectedPermissions.join(','),
            },
        } as any);
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
                    <Text style={styles.description}>
                        박민지님이 김월동 어린이의 동행인 권한을 요청했어요.
                    </Text>
                </View>

                <View style={styles.profileCard}>
                    <Image
                        source={require('../../assets/images/icon_companion.png')}
                        style={styles.profileImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.name}>박민지</Text>
                    <Text style={styles.info}>010-1234-5678</Text>
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
            </ScrollView>

            <View style={styles.buttonArea}>
                <PrimaryButton
                    label="승인하기"
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

    buttonArea: {
        width: '100%',
    },
});
