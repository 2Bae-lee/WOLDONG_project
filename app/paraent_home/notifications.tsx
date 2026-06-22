import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

type NotificationItem = {
    id: number;
    title: string;
    message: string;
    time: string;
    type: 'companion_request' | 'schedule' | 'handoff';
    unread: boolean;
};

const notifications: NotificationItem[] = [
    {
        id: 1,
        title: '동행인 승인 요청',
        message: '박민지님이 김월동 어린이의 동행인 권한을 요청했어요.',
        time: '방금 전',
        type: 'companion_request',
        unread: true,
    },
    {
        id: 2,
        title: '오늘 일정 확인',
        message: '병원 일정이 아직 남아 있어요.',
        time: '20분 전',
        type: 'schedule',
        unread: false,
    },
    {
        id: 3,
        title: '인수인계 자료',
        message: '아이에게 전달할 자료를 다시 확인해주세요.',
        time: '1시간 전',
        type: 'handoff',
        unread: false,
    },
];

export default function Notifications() {
    const openNotification = (notification: NotificationItem) => {
        if (notification.type === 'companion_request') {
            router.push('/paraent_home/notification_request' as any);
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
                <Text style={styles.title}>알림</Text>
                <Text style={styles.description}>확인이 필요한 소식을 모아봤어요.</Text>
            </View>

            <View style={styles.listArea}>
                {notifications.map((notification) => (
                    <Pressable
                        key={notification.id}
                        style={styles.notificationCard}
                        onPress={() => openNotification(notification)}
                    >
                        <View style={[
                            styles.iconCircle,
                            notification.unread && styles.iconCircleUnread,
                        ]}>
                            <Ionicons
                                name={notification.type === 'companion_request' ? 'person-add-outline' : 'notifications-outline'}
                                size={22}
                                color={Colors.text}
                            />
                        </View>

                        <View style={styles.notificationContent}>
                            <View style={styles.notificationHeader}>
                                <Text style={styles.notificationTitle}>{notification.title}</Text>
                                <Text style={styles.notificationTime}>{notification.time}</Text>
                            </View>
                            <Text style={styles.notificationMessage}>{notification.message}</Text>
                        </View>

                        {notification.type === 'companion_request' ? (
                            <Ionicons name="chevron-forward" size={20} color={Colors.textShadow} />
                        ) : null}
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
        marginBottom: 22,
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

    listArea: {
        width: '100%',
        gap: 12,
    },

    notificationCard: {
        width: '100%',
        minHeight: 92,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },

    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF8DF',
        borderWidth: 1,
        borderColor: '#E8DDC8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    iconCircleUnread: {
        borderColor: Colors.highlight1,
        backgroundColor: Colors.pageBg2,
    },

    notificationContent: {
        flex: 1,
    },

    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },

    notificationTitle: {
        flex: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginRight: 8,
    },

    notificationTime: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textShadow,
    },

    notificationMessage: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textShadow,
    },
});
