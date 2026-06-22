import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { Colors } from '../../constants/Colors';
import {
    CompanionTodaySchedule,
    getCompanionTodaySchedulesForChild,
    subscribeCompanionTodaySchedules,
    toggleCompanionTodaySchedule,
    toggleCompanionTodayTodo,
} from '../../constants/CompanionTodayState';
import { Fonts } from '../../constants/Fonts';

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

export default function CompanionChildHome() {
    const params = useLocalSearchParams<{
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
    }>();
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
    const calendarDays = useMemo(() => {
        const firstDay = new Date(calendarYear, calendarMonth - 1, 1).getDay();
        const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();

        return [
            ...Array.from({ length: firstDay }, () => null),
            ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
        ];
    }, [calendarMonth, calendarYear]);

    const selectedEvents = calendarEvents.filter((event) => (
        event.year === calendarYear &&
        event.month === calendarMonth &&
        event.day === selectedDay
    ));

    useFocusEffect(
        useCallback(() => {
            setTodayEvents(getCompanionTodaySchedulesForChild(childName));
            const unsubscribe = subscribeCompanionTodaySchedules(() => {
                setTodayEvents(getCompanionTodaySchedulesForChild(childName));
            });

            return unsubscribe;
        }, [childName])
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

        const nextEvent: CalendarEvent = {
            id: eventId,
            year: Number(params.addedEventYear),
            month: Number(params.addedEventMonth),
            day: Number(params.addedEventDay),
            title: params.addedEventTitle,
            guardian: params.addedEventGuardian,
            todos: parsedTodos,
        };

        if (
            Number.isNaN(nextEvent.id) ||
            Number.isNaN(nextEvent.year) ||
            Number.isNaN(nextEvent.month) ||
            Number.isNaN(nextEvent.day)
        ) {
            return;
        }

        setCalendarYear(nextEvent.year);
        setCalendarMonth(nextEvent.month);
        setSelectedDay(nextEvent.day);
        setCalendarEvents((current) => (
            current.some((event) => event.id === nextEvent.id)
                ? current
                : [...current, nextEvent]
        ));
    }, [
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

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>아이 인수인계 자료</Text>
                            <View style={styles.handoffCard}>
                                {handoffs.map((handoff) => (
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
                                {calendarDays.map((day, index) => {
                                    const hasEvent = day !== null && calendarEvents.some((event) => (
                                        event.year === calendarYear &&
                                        event.month === calendarMonth &&
                                        event.day === day
                                    ));
                                    const selected = day === selectedDay;

                                    return (
                                        <Pressable
                                            key={`${day ?? 'blank'}-${index}`}
                                            style={[styles.dayCell, selected && styles.dayCellSelected]}
                                            disabled={day === null}
                                            onPress={() => day !== null && setSelectedDay(day)}
                                        >
                                            {day !== null ? (
                                                <>
                                                    <Text style={[
                                                        styles.dayText,
                                                        selected && styles.dayTextSelected,
                                                    ]}>
                                                        {day}
                                                    </Text>
                                                    <View style={[styles.eventDot, !hasEvent && styles.eventDotHidden]} />
                                                </>
                                            ) : null}
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

    section: {
        marginBottom: 34,
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
