import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { ParentNotification, getNotifications, markNotificationRead } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { markCompanionNotificationsRead } from '../../constants/NotificationState';
import { formatRelativeTime } from '../../constants/Time';

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'request_approved' | 'request_rejected' | 'emergency' | 'schedule' | string;
    unread: boolean;
    notificationId?: string;
};

const getNotificationTitle = (type: string) => {
    if (type === 'request_approved') return '승인 완료';
    if (type === 'request_rejected') return '승인 거절';
    if (type === 'emergency') return '돌발상황 알림';
    if (type === 'schedule') return '공유 일정';

    return '알림';
};

const mapNotification = (notification: ParentNotification): NotificationItem => ({
    id: notification.notification_id,
    notificationId: notification.notification_id,
    title: getNotificationTitle(notification.type),
    message: notification.message,
    time: formatRelativeTime(notification.created_at),
    type: notification.type,
    unread: !notification.is_read,
});

const getIconName = (type: NotificationItem['type']) => {
    if (type === 'request_approved') return 'checkmark-circle-outline';
    if (type === 'request_rejected') return 'close-circle-outline';
    if (type === 'emergency') return 'alert-circle-outline';
    if (type === 'schedule') return 'calendar-outline';
    return 'notifications-outline';
};

export default function CompanionNotifications() {
    const [visibleNotifications, setVisibleNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useFocusEffect(
        useCallback(() => {
            markCompanionNotificationsRead();

            let active = true;

            const loadNotifications = async () => {
                setIsLoading(true);
                setLoadError('');

                try {
                    const response = await getNotifications();
                    if (!active) return;

                    const apiNotifications = response.data ?? [];
                    setVisibleNotifications(apiNotifications.map(mapNotification));

                    const unreadIds = apiNotifications
                        .filter((notification) => !notification.is_read)
                        .map((notification) => notification.notification_id);

                    await Promise.allSettled(unreadIds.map(markNotificationRead));
                } catch (error) {
                    if (!active) return;
                    setVisibleNotifications([]);
                    setLoadError(error instanceof Error ? error.message : '알림을 불러오지 못했어요.');
                } finally {
                    if (active) setIsLoading(false);
                }
            };

            loadNotifications();

            return () => {
                active = false;
            };
        }, [])
    );

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
                <Text style={styles.description}>담당 어린이와 공유 일정 소식을 모아봤어요.</Text>
            </View>

            <View style={styles.listArea}>
                {isLoading ? (
                    <Text style={styles.statusText}>알림을 불러오는 중이에요.</Text>
                ) : null}
                {loadError ? (
                    <Text style={styles.statusText}>{loadError}</Text>
                ) : null}
                {visibleNotifications.map((notification) => (
                    <Pressable key={notification.id} style={styles.notificationCard}>
                        <View style={[
                            styles.iconCircle,
                            notification.unread && styles.iconCircleUnread,
                        ]}>
                            <Ionicons
                                name={getIconName(notification.type)}
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
                    </Pressable>
                ))}

                {!isLoading && visibleNotifications.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="checkmark-circle" size={34} color={Colors.highlight1} />
                        <Text style={styles.emptyTitle}>확인할 알림이 없어요.</Text>
                        <Text style={styles.emptyDescription}>새로운 소식이 생기면 여기에서 알려드릴게요.</Text>
                    </View>
                ) : null}
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
        gap: 10,
    },

    notificationTitle: {
        flex: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    notificationTime: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textShadow,
    },

    notificationMessage: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.text,
    },

    statusText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
    },

    emptyCard: {
        minHeight: 160,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },

    emptyTitle: {
        marginTop: 10,
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },

    emptyDescription: {
        marginTop: 5,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
        textAlign: 'center',
    },
});
