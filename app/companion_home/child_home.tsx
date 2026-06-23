import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import {
    ChildNotification,
    getChildNotifications,
    getScheduleWarnings,
    markNotificationRead,
} from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import {
    CompanionTodaySchedule,
    getCompanionTodaySchedulesForChild,
    subscribeCompanionTodaySchedules,
    toggleCompanionTodaySchedule,
    toggleCompanionTodayTodo,
} from '../../constants/CompanionTodayState';
import { Fonts } from '../../constants/Fonts';
import { RepeatDate, parseRepeatDates } from '../../constants/Recurrence';

type ActiveTab = 'today' | 'calendar';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

type ScheduleTodo = {
    id: number;
    text: string;
    done: boolean;
};

type CalendarEvent = {
    id: number;
    year: number;
    month: number;
    day: number;
    title: string;
    guardian: string;
    todos: ScheduleTodo[];
};

type CalendarDay = {
    year: number;
    month: number;
    day: number;
    monthOffset: -1 | 0 | 1;
};

const createInitialEvents = (
    currentYear: number,
    currentMonth: number,
    todayDay: number,
    guardian: string
): CalendarEvent[] => [
    {
        id: 1,
        year: currentYear,
        month: currentMonth,
        day: todayDay,
        title: '병원 진료',
        guardian,
        todos: [
            { id: 11, text: '병원 접수하기', done: false },
            { id: 12, text: '진료 전 짧게 설명하기', done: true },
            { id: 13, text: '진료 후 조용한 곳에서 쉬기', done: false },
        ],
    },
    {
        id: 2,
        year: currentYear,
        month: currentMonth,
        day: todayDay,
        title: '귀가 준비',
        guardian,
        todos: [
            { id: 21, text: '가방 챙기기', done: false },
            { id: 22, text: '집에 간다고 미리 알려주기', done: false },
        ],
    },
    {
        id: 3,
        year: currentYear,
        month: currentMonth,
        day: Math.min(todayDay + 3, new Date(currentYear, currentMonth, 0).getDate()),
        title: '언어 치료',
        guardian,
        todos: [
            { id: 31, text: '치료 카드 챙기기', done: false },
        ],
    },
];

const handoffs = [
    '병원 대기 시간이 길면 아이가 힘들어할 수 있어요.',
    '큰 소리가 나는 공간에서는 잠깐 밖에서 쉬면 좋아요.',
    '선택지를 두 개 정도로 짧게 제시해주세요.',
];

const formatTime = (value: string) => {
    const created = new Date(value).getTime();
    if (Number.isNaN(created)) return '방금 전';

    const diffMinutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
};

const getNotificationTitle = (type: string) => {
    if (type === 'request_approved') return '승인 완료';
    if (type === 'request_rejected') return '승인 거절';
    if (type === 'emergency') return '돌발상황 알림';
    if (type === 'schedule') return '공유 일정';

    return '알림';
};

const getNotificationIcon = (type: string) => {
    if (type === 'request_approved') return 'checkmark-circle-outline';
    if (type === 'request_rejected') return 'close-circle-outline';
    if (type === 'emergency') return 'alert-circle-outline';
    if (type === 'schedule') return 'calendar-outline';

    return 'notifications-outline';
};

export default function CompanionChildHome() {
    const params = useLocalSearchParams<{
        childId?: string;
        scheduleId?: string;
        childName?: string;
        guardian?: string;
        tab?: string;
        addedEventId?: string;
        addedEventYear?: string;
        addedEventMonth?: string;
        addedEventDay?: string;
        addedEventTitle?: string;
        addedEventGuardian?: string;
        addedEventTodos?: string;
        addedEventDates?: string;
    }>();
    const childId = params.childId || '';
    const scheduleId = params.scheduleId || '';
    const childName = params.childName || '김월동';
    const guardian = params.guardian || '김보호자';
    const today = useMemo(() => new Date(), []);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const [activeTab, setActiveTab] = useState<ActiveTab>('today');
    const [calendarYear, setCalendarYear] = useState(currentYear);
    const [calendarMonth, setCalendarMonth] = useState(currentMonth);
    const [selectedDay, setSelectedDay] = useState(todayDay);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => (
        createInitialEvents(currentYear, currentMonth, todayDay, guardian)
    ));
    const [todayEvents, setTodayEvents] = useState<CompanionTodaySchedule[]>(() => (
        getCompanionTodaySchedulesForChild(childName)
    ));
    const [childNotifications, setChildNotifications] = useState<ChildNotification[]>([]);
    const [notificationError, setNotificationError] = useState('');
    const [scheduleWarnings, setScheduleWarnings] = useState<string[]>([]);
    const [warningsError, setWarningsError] = useState('');
    const calendarDays = useMemo(() => {
        const firstDay = new Date(calendarYear, calendarMonth - 1, 1).getDay();
        const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
        const previousMonthDays = new Date(calendarYear, calendarMonth - 1, 0).getDate();
        const previousMonthDate = new Date(calendarYear, calendarMonth - 2, 1);
        const nextMonthDate = new Date(calendarYear, calendarMonth, 1);
        const previousDays: CalendarDay[] = Array.from({ length: firstDay }, (_, index) => ({
            year: previousMonthDate.getFullYear(),
            month: previousMonthDate.getMonth() + 1,
            day: previousMonthDays - firstDay + index + 1,
            monthOffset: -1,
        }));
        const currentDays: CalendarDay[] = Array.from({ length: daysInMonth }, (_, index) => ({
            year: calendarYear,
            month: calendarMonth,
            day: index + 1,
            monthOffset: 0,
        }));
        const trailingCount = Math.ceil((previousDays.length + currentDays.length) / 7) * 7
            - previousDays.length
            - currentDays.length;
        const nextDays: CalendarDay[] = Array.from({ length: trailingCount }, (_, index) => ({
            year: nextMonthDate.getFullYear(),
            month: nextMonthDate.getMonth() + 1,
            day: index + 1,
            monthOffset: 1,
        }));

        return [...previousDays, ...currentDays, ...nextDays];
    }, [calendarMonth, calendarYear]);

    const selectedEvents = calendarEvents.filter((event) => (
        event.year === calendarYear &&
        event.month === calendarMonth &&
        event.day === selectedDay
    ));
    const storySource = activeTab === 'calendar' ? selectedEvents[0] : todayEvents[0];
    const storyScript = storySource
        ? `오늘은 ${storySource.title} 일정이 있어요.`
        : `${childName}의 외출 이야기를 준비해요.`;
    const visibleHandoffs = scheduleWarnings.length > 0 ? scheduleWarnings : handoffs;
    const storyCheckedItems = storySource
        ? [
            `일정_${storySource.title}`,
            ...storySource.todos.map((todo) => `체크_${todo.text}`),
            ...visibleHandoffs.map((handoff) => `아동_주의_${handoff}`),
        ]
        : visibleHandoffs.map((handoff) => `아동_주의_${handoff}`);

    useFocusEffect(
        useCallback(() => {
            setTodayEvents(getCompanionTodaySchedulesForChild(childName));
            const unsubscribe = subscribeCompanionTodaySchedules(() => {
                setTodayEvents(getCompanionTodaySchedulesForChild(childName));
            });
            let active = true;

            const loadChildNotifications = async () => {
                if (!childId) {
                    setChildNotifications([]);
                    return;
                }

                setNotificationError('');

                try {
                    const response = await getChildNotifications(childId);
                    if (!active) return;

                    const notifications = response.data ?? [];
                    setChildNotifications(notifications);

                    const unreadIds = notifications
                        .filter((notification) => !notification.is_read)
                        .map((notification) => notification.notification_id);

                    await Promise.allSettled(unreadIds.map(markNotificationRead));
                } catch (error) {
                    if (!active) return;
                    setChildNotifications([]);
                    setNotificationError(error instanceof Error ? error.message : '알림을 불러오지 못했어요.');
                }
            };

            const loadScheduleWarnings = async () => {
                if (!scheduleId) {
                    setScheduleWarnings([]);
                    setWarningsError('');
                    return;
                }

                setWarningsError('');

                try {
                    const response = await getScheduleWarnings(scheduleId);
                    if (!active) return;

                    setScheduleWarnings(response.data?.warnings ?? []);
                } catch (error) {
                    if (!active) return;

                    setScheduleWarnings([]);
                    setWarningsError(error instanceof Error ? error.message : '주의사항을 불러오지 못했어요.');
                }
            };

            loadChildNotifications();
            loadScheduleWarnings();

            return () => {
                active = false;
                unsubscribe();
            };
        }, [childId, childName, scheduleId])
    );

    const toggleTodayTodo = (scheduleId: number, todoId: number) => {
        toggleCompanionTodayTodo(scheduleId, todoId);
    };

    const toggleTodaySchedule = (scheduleId: number) => {
        toggleCompanionTodaySchedule(scheduleId);
    };

    useEffect(() => {
        if (params.tab === 'calendar') {
            setActiveTab('calendar');
        }

        if (
            !params.addedEventId ||
            !params.addedEventTitle ||
            !params.addedEventGuardian ||
            !params.addedEventYear ||
            !params.addedEventMonth ||
            !params.addedEventDay
        ) {
            return;
        }

        const eventTitle = params.addedEventTitle;
        const eventGuardian = params.addedEventGuardian;
        const eventId = Number(params.addedEventId);
        let parsedTodos: ScheduleTodo[] = [];

        try {
            const parsed = params.addedEventTodos ? JSON.parse(params.addedEventTodos) : [];
            parsedTodos = Array.isArray(parsed)
                ? parsed
                    .filter((item) => typeof item === 'string' && item.trim())
                    .map((item, index) => ({
                        id: eventId + index + 1,
                        text: item.trim(),
                        done: false,
                    }))
                : [];
        } catch {
            parsedTodos = [];
        }

        const fallbackDate: RepeatDate = {
            year: Number(params.addedEventYear),
            month: Number(params.addedEventMonth),
            day: Number(params.addedEventDay),
        };
        const eventDates = parseRepeatDates(params.addedEventDates);
        const nextEvents: CalendarEvent[] = (eventDates.length > 0 ? eventDates : [fallbackDate]).map((date, index) => ({
            id: eventId + index,
            year: date.year,
            month: date.month,
            day: date.day,
            title: eventTitle,
            guardian: eventGuardian,
            todos: parsedTodos.map((todo) => ({
                ...todo,
                id: todo.id + index * 1000,
            })),
        }));
        const firstEvent = nextEvents[0];

        if (
            !firstEvent ||
            nextEvents.some((event) => (
                Number.isNaN(event.id) ||
                Number.isNaN(event.year) ||
                Number.isNaN(event.month) ||
                Number.isNaN(event.day)
            ))
        ) {
            return;
        }

        setCalendarYear(firstEvent.year);
        setCalendarMonth(firstEvent.month);
        setSelectedDay(firstEvent.day);
        setCalendarEvents((current) => (
            current.some((event) => event.id === firstEvent.id)
                ? current
                : [...current, ...nextEvents]
        ));
    }, [
        params.addedEventDates,
        params.addedEventDay,
        params.addedEventGuardian,
        params.addedEventId,
        params.addedEventMonth,
        params.addedEventTitle,
        params.addedEventTodos,
        params.addedEventYear,
        params.tab,
    ]);

    const moveCalendarMonth = (monthOffset: number) => {
        const nextDate = new Date(calendarYear, calendarMonth - 1 + monthOffset, 1);
        const nextYear = nextDate.getFullYear();
        const nextMonth = nextDate.getMonth() + 1;
        const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();

        setCalendarYear(nextYear);
        setCalendarMonth(nextMonth);
        setSelectedDay(Math.min(selectedDay, daysInNextMonth));
    };

    const selectCalendarDay = (calendarDay: CalendarDay) => {
        if (calendarDay.monthOffset !== 0) {
            setCalendarYear(calendarDay.year);
            setCalendarMonth(calendarDay.month);
        }
        setSelectedDay(calendarDay.day);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.inner}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.logoRow}>
                        <BackButton />
                        <Text style={styles.logoTitle}>월동</Text>
                        <Image
                            source={require('../../assets/images/canola_flower_small.png')}
                            style={styles.logoFlower}
                            resizeMode="contain"
                        />
                    </View>

                    <Pressable
                        style={styles.profileButton}
                        onPress={() =>
                            router.push({
                                pathname: '/companion_home/child_profile',
                                params: { childName },
                            } as any)
                        }
                    >
                        <Image
                            source={require('../../assets/images/icon_child.png')}
                            style={styles.profileImage}
                            resizeMode="contain"
                        />
                    </Pressable>
                </View>

                <View style={styles.childSummary}>
                    <Text style={styles.childName}>{childName}</Text>
                    <Text style={styles.summaryText}>{guardian} 보호자가 공유한 일정이에요.</Text>
                </View>

                <View style={styles.notificationSection}>
                    <View style={styles.notificationSectionHeader}>
                        <Text style={styles.notificationSectionTitle}>푸시알림 확인</Text>
                        <Ionicons name="notifications-outline" size={19} color={Colors.textShadow} />
                    </View>
                    {notificationError ? (
                        <Text style={styles.notificationStatusText}>{notificationError}</Text>
                    ) : null}
                    {childNotifications.length > 0 ? (
                        <View style={styles.notificationList}>
                            {childNotifications.slice(0, 3).map((notification) => (
                                <View key={notification.notification_id} style={styles.notificationCard}>
                                    <View style={[
                                        styles.notificationIconCircle,
                                        !notification.is_read && styles.notificationIconCircleUnread,
                                    ]}>
                                        <Ionicons
                                            name={getNotificationIcon(notification.type) as any}
                                            size={18}
                                            color={Colors.text}
                                        />
                                    </View>
                                    <View style={styles.notificationTextArea}>
                                        <View style={styles.notificationTitleRow}>
                                            <Text style={styles.notificationTitle}>
                                                {getNotificationTitle(notification.type)}
                                            </Text>
                                            <Text style={styles.notificationTime}>
                                                {formatTime(notification.created_at)}
                                            </Text>
                                        </View>
                                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.notificationEmptyCard}>
                            <Text style={styles.notificationEmptyText}>확인할 알림이 없어요.</Text>
                        </View>
                    )}
                </View>

                {activeTab === 'today' ? (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{currentMonth}월 {todayDay}일 오늘의 일정</Text>
                            <View style={styles.scheduleCard}>
                                {todayEvents.map((schedule) => (
                                    <View key={schedule.id} style={styles.scheduleBlock}>
                                        <View style={styles.scheduleTitleRow}>
                                            <Pressable
                                                style={[
                                                    styles.scheduleCheckBox,
                                                    schedule.done && styles.scheduleCheckBoxDone,
                                                ]}
                                                onPress={() => toggleTodaySchedule(schedule.id)}
                                                hitSlop={8}
                                            >
                                                {schedule.done ? (
                                                    <Ionicons name="checkmark" size={14} color={Colors.realwhite} />
                                                ) : null}
                                            </Pressable>
                                            <Text
                                                style={[
                                                    styles.scheduleTitle,
                                                    schedule.done && styles.todoDoneText,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {schedule.title}
                                            </Text>
                                            <View style={styles.guardianPill}>
                                                <Text style={styles.guardianPillText}>{schedule.guardian}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.todoList}>
                                            {schedule.todos.map((todo) => (
                                                <Pressable
                                                    key={todo.id}
                                                    style={styles.todoRow}
                                                    onPress={() => toggleTodayTodo(schedule.id, todo.id)}
                                                >
                                                    <View style={styles.todoCheckHitArea}>
                                                        <Ionicons
                                                            name={todo.done ? 'checkmark-circle' : 'ellipse-outline'}
                                                            size={17}
                                                            color={todo.done ? Colors.highlight1 : Colors.textShadow}
                                                        />
                                                    </View>
                                                    <Text style={[
                                                        styles.todoText,
                                                        todo.done && styles.todoDoneText,
                                                    ]}>
                                                        {todo.text}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.sectionDivider} />

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>아이 주의사항</Text>
                            {warningsError ? (
                                <Text style={styles.warningStatusText}>{warningsError}</Text>
                            ) : null}
                            <View style={styles.handoffCard}>
                                {visibleHandoffs.map((handoff) => (
                                    <View key={handoff} style={styles.handoffRow}>
                                        <Ionicons name="checkmark" size={18} color={Colors.highlight1} />
                                        <Text style={styles.handoffText}>{handoff}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.section}>
                        <View style={styles.calendarHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>{calendarMonth}월 캘린더</Text>
                                <Text style={styles.calendarSubtitle}>{childName}의 공유 일정이에요.</Text>
                            </View>
                            <View style={styles.calendarMoveArea}>
                                <Pressable style={styles.calendarMoveButton} onPress={() => moveCalendarMonth(-1)}>
                                    <Ionicons name="chevron-back" size={18} color={Colors.text} />
                                </Pressable>
                                <Text style={styles.calendarYear}>{calendarYear}</Text>
                                <Pressable style={styles.calendarMoveButton} onPress={() => moveCalendarMonth(1)}>
                                    <Ionicons name="chevron-forward" size={18} color={Colors.text} />
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.calendarCard}>
                            <View style={styles.weekRow}>
                                {weekDays.map((day) => (
                                    <Text key={day} style={styles.weekDay}>{day}</Text>
                                ))}
                            </View>

                            <View style={styles.calendarGrid}>
                                {calendarDays.map((calendarDay, index) => {
                                    const muted = calendarDay.monthOffset !== 0;
                                    const hasEvent = calendarEvents.some((event) => (
                                        event.year === calendarDay.year &&
                                        event.month === calendarDay.month &&
                                        event.day === calendarDay.day
                                    ));
                                    const selected = !muted && calendarDay.day === selectedDay;

                                    return (
                                        <Pressable
                                            key={`${calendarDay.year}-${calendarDay.month}-${calendarDay.day}-${index}`}
                                            style={[styles.dayCell, selected && styles.dayCellSelected]}
                                            onPress={() => selectCalendarDay(calendarDay)}
                                        >
                                            <Text style={[
                                                styles.dayText,
                                                muted && styles.dayTextMuted,
                                                selected && styles.dayTextSelected,
                                            ]}>
                                                {calendarDay.day}
                                            </Text>
                                            <View style={[styles.eventDot, !hasEvent && styles.eventDotHidden]} />
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.calendarEventList}>
                            {selectedEvents.length > 0 ? (
                                selectedEvents.map((event) => (
                                    <View key={event.id} style={styles.calendarEventCard}>
                                        <Ionicons name="calendar-outline" size={18} color={Colors.text} />
                                        <View style={styles.calendarEventTextArea}>
                                            <Text style={styles.calendarEventTitle}>{event.title}</Text>
                                            <Text style={styles.calendarEventMeta}>{event.guardian} 보호자와 공유 중</Text>
                                            {event.todos.length > 0 ? (
                                                <View style={styles.calendarTodoPreview}>
                                                    {event.todos.slice(0, 2).map((todo) => (
                                                        <View key={todo.id} style={styles.calendarTodoPreviewRow}>
                                                            <Ionicons
                                                                name={todo.done ? 'checkmark-circle' : 'ellipse-outline'}
                                                                size={13}
                                                                color={todo.done ? Colors.highlight1 : Colors.textShadow}
                                                            />
                                                            <Text style={[
                                                                styles.calendarTodoPreviewText,
                                                                todo.done && styles.todoDoneText,
                                                            ]}>
                                                                {todo.text}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyCard}>
                                    <Text style={styles.emptyText}>공유된 일정이 없어요.</Text>
                                </View>
                            )}
                        </View>

                        <Pressable
                            style={styles.addButton}
                            onPress={() =>
                                router.push({
                                    pathname: '/companion_home/calendar_add',
                                    params: {
                                        childId,
                                        childName,
                                        guardian,
                                        year: String(calendarYear),
                                        month: String(calendarMonth),
                                        day: String(selectedDay),
                                    },
                                } as any)
                            }
                        >
                            <View style={styles.addIconCircle}>
                                <Ionicons name="add" size={18} color={Colors.realwhite} />
                            </View>
                            <Text style={styles.addButtonText}>공유 일정 추가하기</Text>
                        </Pressable>
                    </View>
                )}

                <Pressable
                    style={styles.socialStoryButton}
                    onPress={() =>
                        router.push({
                            pathname: '/social_story',
                            params: {
                                childName,
                                title: storySource?.title ?? '',
                                script: storyScript,
                                scheduleId,
                                checkedItems: JSON.stringify(storyCheckedItems),
                            },
                        } as any)
                    }
                >
                    <Ionicons name="book-outline" size={20} color={Colors.text} />
                    <Text style={styles.socialStoryButtonText}>소셜 스토리 만들기</Text>
                </Pressable>

                {scheduleId ? (
                    <Pressable
                        style={styles.recordButton}
                        onPress={() =>
                            router.push({
                                pathname: '/companion_home/outing_record',
                                params: {
                                    scheduleId,
                                    childName,
                                },
                            } as any)
                        }
                    >
                        <Ionicons name="clipboard-outline" size={20} color={Colors.text} />
                        <Text style={styles.recordButtonText}>외출 후 기록하기</Text>
                    </Pressable>
                ) : null}
            </ScrollView>

            <View style={styles.bottomTabWrap}>
                <View style={styles.bottomTab}>
                    <Pressable
                        style={[styles.tabButton, activeTab === 'today' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('today')}
                    >
                        <Ionicons name="sunny-outline" size={18} color={activeTab === 'today' ? Colors.text : Colors.textShadow} />
                        <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>오늘</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.tabButton, activeTab === 'calendar' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('calendar')}
                    >
                        <Ionicons name="calendar-outline" size={18} color={activeTab === 'calendar' ? Colors.text : Colors.textShadow} />
                        <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>캘린더</Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.pageBg,
    },

    scrollView: {
        flex: 1,
    },

    inner: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 18,
        paddingBottom: 126,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
    },

    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: -20,
    },

    logoTitle: {
        fontFamily: Fonts.title,
        fontSize: 38,
        color: Colors.black,
    },

    logoFlower: {
        width: 22,
        height: 22,
        marginLeft: -5,
        marginTop: -26,
        transform: [{ rotate: '-18deg' }],
    },

    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    profileImage: {
        width: 34,
        height: 34,
    },

    childSummary: {
        marginBottom: 28,
    },

    childName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 6,
    },

    summaryText: {
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.textShadow,
    },

    notificationSection: {
        marginBottom: 28,
    },

    notificationSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    notificationSectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
    },

    notificationStatusText: {
        marginBottom: 10,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.highlight3,
    },

    notificationList: {
        gap: 10,
    },

    notificationCard: {
        minHeight: 76,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },

    notificationIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    notificationIconCircleUnread: {
        borderColor: Colors.highlight1,
        backgroundColor: Colors.pageBg2,
    },

    notificationTextArea: {
        flex: 1,
    },

    notificationTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 5,
    },

    notificationTitle: {
        flex: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },

    notificationTime: {
        fontFamily: Fonts.body,
        fontSize: 11,
        color: Colors.textShadow,
    },

    notificationMessage: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 18,
        color: Colors.text,
    },

    notificationEmptyCard: {
        minHeight: 58,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    notificationEmptyText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
    },

    section: {
        marginBottom: 34,
    },

    sectionDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#E8DDC8',
        marginTop: -10,
        marginBottom: 28,
    },

    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 16,
    },

    scheduleCard: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 16,
        gap: 20,
    },

    scheduleBlock: {
        gap: 10,
    },

    scheduleTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        minHeight: 42,
    },

    scheduleCheckBox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: Colors.pageBg3,
        alignItems: 'center',
        justifyContent: 'center',
    },

    scheduleCheckBoxDone: {
        backgroundColor: Colors.highlight1,
    },

    scheduleTitle: {
        flex: 1,
        flexShrink: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },

    guardianPill: {
        borderRadius: 12,
        backgroundColor: Colors.pageBg,
        paddingHorizontal: 9,
        paddingVertical: 4,
        maxWidth: 116,
    },

    guardianPillText: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textShadow,
    },

    todoList: {
        gap: 6,
    },

    todoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 34,
        paddingVertical: 4,
    },

    todoCheckHitArea: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },

    todoText: {
        flex: 1,
        marginLeft: 3,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
    },

    todoDoneText: {
        color: '#A9A196',
    },

    handoffCard: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 14,
        gap: 12,
    },

    warningStatusText: {
        marginTop: -8,
        marginBottom: 12,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.highlight3,
    },

    handoffRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    handoffText: {
        flex: 1,
        marginLeft: 8,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.text,
    },

    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },

    calendarSubtitle: {
        marginTop: -8,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textShadow,
    },

    calendarYear: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.textShadow,
    },

    calendarMoveArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 2,
    },

    calendarMoveButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F7F4E8',
        borderWidth: 1,
        borderColor: '#E8DDC8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    calendarCard: {
        width: '100%',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 18,
        marginBottom: 22,
    },

    weekRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },

    weekDay: {
        flex: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.textShadow,
        textAlign: 'center',
    },

    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        minHeight: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    dayCellSelected: {
        backgroundColor: Colors.highlight1,
    },

    dayText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    dayTextMuted: {
        color: Colors.textShadow,
        opacity: 0.55,
    },

    dayTextSelected: {
        color: Colors.text,
    },

    eventDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: Colors.highlight2,
        marginTop: 3,
    },

    eventDotHidden: {
        opacity: 0,
    },

    calendarEventList: {
        gap: 10,
    },

    calendarEventCard: {
        minHeight: 62,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },

    calendarEventTextArea: {
        flex: 1,
        marginLeft: 10,
    },

    calendarEventTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 3,
    },

    calendarEventMeta: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
    },

    calendarTodoPreview: {
        marginTop: 8,
        gap: 4,
    },

    calendarTodoPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    calendarTodoPreviewText: {
        flex: 1,
        marginLeft: 6,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.text,
    },

    addButton: {
        alignSelf: 'flex-start',
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingRight: 8,
    },

    addIconCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    addButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    emptyCard: {
        minHeight: 58,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    emptyText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textShadow,
    },

    socialStoryButton: {
        width: '100%',
        minHeight: 52,
        borderRadius: 26,
        backgroundColor: Colors.highlight1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 2,
    },

    socialStoryButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },

    recordButton: {
        width: '100%',
        minHeight: 52,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
    },

    recordButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },

    bottomTabWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 18,
        alignItems: 'center',
        paddingHorizontal: 32,
    },

    bottomTab: {
        width: '100%',
        maxWidth: 330,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#F7F4E8',
        borderWidth: 1,
        borderColor: '#E8DDC8',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
    },

    tabButton: {
        flex: 1,
        height: '100%',
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    tabButtonActive: {
        backgroundColor: Colors.highlight1,
    },

    tabText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.textShadow,
    },

    tabTextActive: {
        color: Colors.text,
    },
});
