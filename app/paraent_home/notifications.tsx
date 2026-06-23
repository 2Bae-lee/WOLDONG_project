import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import {
    InviteRequest,
    ParentNotification,
    getInviteRequests,
    getNotifications,
    markNotificationRead,
} from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { formatRelativeTime } from '../../constants/DateTime';
import { Fonts } from '../../constants/Fonts';

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'companion_request' | 'schedule' | 'handoff' | 'emergency' | string;
    unread: boolean;
    companionName?: string;
    childId?: string;
    notificationId?: string;
    requestId?: string;
};

const getNotificationTitle = (type: string) => {
    if (type === 'companion_request') return '동행인 승인 요청';
    if (type === 'emergency') return '돌발상황 알림';
    if (type === 'request_approved') return '승인 완료';
    if (type === 'request_rejected') return '승인 거절';

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
    companionName: notification.sender_name,
    childId: notification.child_id,
});

const mapInviteRequest = (request: InviteRequest): NotificationItem => ({
    id: `request-${request.request_id}`,
    requestId: request.request_id,
    title: '동행인 승인 요청',
    message: `${request.companion_name}님이 아동 연결을 요청했어요.`,
    time: formatRelativeTime(request.created_at),
    type: 'companion_request',
    unread: true,
    companionName: request.companion_name,
    childId: request.child_id,
});

export default function Notifications() {
    const [visibleNotifications, setVisibleNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useFocusEffect(
        useCallback(() => {
            let active = true;

            const loadNotifications = async () => {
                setIsLoading(true);
                setLoadError('');

                try {
                    const [notificationResponse, requestResponse] = await Promise.all([
                        getNotifications(),
                        getInviteRequests(),
                    ]);

                    if (!active) return;

                    const apiNotifications = notificationResponse.data ?? [];
                    const apiRequests = requestResponse.data ?? [];
                    const requestMap = new Map(apiRequests.map((request) => [
                        `${request.companion_name}-${request.child_id}`,
                        request,
                    ]));
                    const requestKeys = new Set(apiNotifications.map((notification) => (
                        `${notification.sender_name}-${notification.child_id}`
                    )));
                    const requestNotifications = apiRequests
                        .filter((request) => !requestKeys.has(`${request.companion_name}-${request.child_id}`))
                        .map(mapInviteRequest);
                    const nextNotifications = [
                        ...requestNotifications,
                        ...apiNotifications.map((notification) => {
                            const item = mapNotification(notification);
                            const matchedRequest = requestMap.get(`${notification.sender_name}-${notification.child_id}`);

                            return matchedRequest && notification.type === 'companion_request'
                                ? { ...item, requestId: matchedRequest.request_id }
                                : item;
                        }),
                    ];

                    setVisibleNotifications(nextNotifications);

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

    const openNotification = async (notification: NotificationItem) => {
        if (notification.notificationId) {
            try {
                await markNotificationRead(notification.notificationId);
            } catch {
                // 이미 읽음 처리되었거나 목 서버 상태여도 화면 이동은 유지합니다.
            }
        }

        if (notification.type === 'companion_request') {
            router.push({
                pathname: '/paraent_home/notification_request',
                params: {
                    requestId: notification.requestId ?? '',
                    notificationId: notification.notificationId ?? '',
                    companionName: notification.companionName ?? '',
                    childId: notification.childId ?? '',
                },
            } as any);
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
                {isLoading ? (
                    <Text style={styles.statusText}>알림을 불러오는 중이에요.</Text>
                ) : null}
                {loadError ? (
                    <Text style={styles.statusText}>{loadError}</Text>
                ) : null}
                {visibleNotifications.map((notification) => (
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

                {visibleNotifications.length === 0 ? (
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

    statusText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.textShadow,
        marginBottom: 2,
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

    emptyCard: {
        width: '100%',
        minHeight: 180,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 28,
    },

    emptyTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 17,
        fontWeight: '900',
        color: Colors.text,
        marginTop: 12,
        marginBottom: 8,
    },

    emptyDescription: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textShadow,
        textAlign: 'center',
    },
});
