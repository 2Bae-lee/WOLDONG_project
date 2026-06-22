import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { markCompanionNotificationsRead } from '../../constants/NotificationState';

type NotificationItem = {
    id: number;
    title: string;
    message: string;
    time: string;
    type: 'approval' | 'schedule' | 'todo';
    unread: boolean;
};

const notifications: NotificationItem[] = [
    {
        id: 1,
        title: '승인 요청 전송',
        message: '김월동 어린이 보호자에게 동행인 승인 요청을 보냈어요.',
        time: '방금 전',
        type: 'approval',
        unread: true,
    },
    {
        id: 2,
        title: '오늘 할 일',
        message: '병원 진료 일정의 세부 Todo를 확인해주세요.',
        time: '20분 전',
        type: 'todo',
        unread: false,
    },
    {
        id: 3,
        title: '공유 일정',
        message: '김월동 어린이의 언어 치료 일정이 캘린더에 있어요.',
        time: '1시간 전',
        type: 'schedule',
        unread: false,
    },
];

const getIconName = (type: NotificationItem['type']) => {
    if (type === 'approval') return 'person-add-outline';
    if (type === 'schedule') return 'calendar-outline';
    return 'checkmark-circle-outline';
};

export default function CompanionNotifications() {
    useFocusEffect(
        useCallback(() => {
            markCompanionNotificationsRead();
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
                {notifications.map((notification) => (
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
});
