import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

const children = [
    {
        id: 1,
        name: '김월동',
        guardian: '김보호자',
        schedules: 3,
        permissions: ['오늘 일정', '공유 캘린더', '인수인계 자료'],
    },
    {
        id: 2,
        name: '이하준',
        guardian: '이보호자',
        schedules: 1,
        permissions: ['오늘 일정', '아이 프로필'],
    },
];

export default function CompanionChildren() {
    const params = useLocalSearchParams<{
        companionName?: string;
        companionRelation?: string;
        companionPhone?: string;
        companionProfileImage?: string;
    }>();
    const companionName = params.companionName || '박민지';
    const companionRelation = params.companionRelation || '담임 선생님';
    const companionPhone = params.companionPhone || '010-1234-5678';
    const companionProfileImage = params.companionProfileImage || '';

    const openProfileSetup = () => {
        router.push({
            pathname: '/companion_home/profile_setup',
            params: {
                companionName,
                companionRelation,
                companionPhone,
                companionProfileImage,
            },
        } as any);
    };

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.inner}
            showsVerticalScrollIndicator={false}
        >
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

            <Pressable style={styles.profileCard} onPress={openProfileSetup}>
                <View style={styles.profileAvatar}>
                    <Image
                        source={
                            companionProfileImage
                                ? { uri: companionProfileImage }
                                : require('../../assets/images/icon_companion.png')
                        }
                        style={companionProfileImage ? styles.profileImageFilled : styles.profileImage}
                        resizeMode={companionProfileImage ? 'cover' : 'contain'}
                    />
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileLabel}>동행인 프로필</Text>
                    <Text style={styles.profileName}>{companionName}</Text>
                    <Text style={styles.profileMeta}>{companionRelation} · {companionPhone}</Text>
                </View>
                <View style={styles.profileEditButton}>
                    <Ionicons name="pencil" size={16} color={Colors.text} />
                </View>
            </Pressable>

            <View style={styles.headerArea}>
                <Text style={styles.title}>담당 어린이</Text>
                <Text style={styles.description}>오늘 함께 확인할 어린이를 선택해주세요.</Text>
            </View>

            <View style={styles.listArea}>
                {children.map((child) => (
                    <Pressable
                        key={child.id}
                        style={styles.childCard}
                        onPress={() =>
                            router.push({
                                pathname: '/companion_home/child_home',
                                params: {
                                    childName: child.name,
                                    guardian: child.guardian,
                                },
                            } as any)
                        }
                    >
                        <View style={styles.avatarCircle}>
                            <Image
                                source={require('../../assets/images/icon_child.png')}
                                style={styles.avatarImage}
                                resizeMode="contain"
                            />
                        </View>

                        <View style={styles.childInfo}>
                            <Text style={styles.childName}>{child.name}</Text>
                            <Text style={styles.guardianText}>{child.guardian} 보호자와 연결됨</Text>
                            <View style={styles.metaRow}>
                                <View style={styles.metaPill}>
                                    <Ionicons name="calendar-outline" size={14} color={Colors.text} />
                                    <Text style={styles.metaText}>오늘 일정 {child.schedules}개</Text>
                                </View>
                            </View>
                            <View style={styles.permissionRow}>
                                {child.permissions.slice(0, 2).map((permission) => (
                                    <Text key={permission} style={styles.permissionChip}>{permission}</Text>
                                ))}
                            </View>
                        </View>

                        <Ionicons name="chevron-forward" size={21} color={Colors.textShadow} />
                    </Pressable>
                ))}
            </View>
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
        paddingTop: 28,
        paddingHorizontal: 30,
        paddingBottom: 54,
    },

    logoArea: {
        alignItems: 'flex-start',
        marginBottom: 38,
    },

    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    logoTitle: {
        fontFamily: Fonts.title,
        fontSize: 42,
        color: Colors.black,
    },

    logoFlower: {
        width: 24,
        height: 24,
        marginLeft: -5,
        marginTop: -28,
        transform: [{ rotate: '-18deg' }],
    },

    headerArea: {
        marginBottom: 22,
    },

    profileCard: {
        width: '100%',
        minHeight: 92,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginBottom: 28,
    },

    profileAvatar: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 1,
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginRight: 13,
    },

    profileImage: {
        width: 40,
        height: 40,
    },

    profileImageFilled: {
        width: '100%',
        height: '100%',
    },

    profileInfo: {
        flex: 1,
    },

    profileLabel: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textShadow,
        marginBottom: 3,
    },

    profileName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 3,
    },

    profileMeta: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
    },

    profileEditButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.pageBg2,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 25,
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

    listArea: {
        gap: 14,
    },

    childCard: {
        width: '100%',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },

    avatarCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        borderWidth: 1,
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },

    avatarImage: {
        width: 44,
        height: 44,
    },

    childInfo: {
        flex: 1,
    },

    childName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 19,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
    },

    guardianText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
        marginBottom: 9,
    },

    metaRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },

    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 13,
        backgroundColor: Colors.pageBg2,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },

    metaText: {
        marginLeft: 5,
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
    },

    permissionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },

    permissionChip: {
        borderRadius: 11,
        backgroundColor: Colors.pageBg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontFamily: Fonts.body,
        fontSize: 11,
        color: Colors.textShadow,
        overflow: 'hidden',
    },
});
