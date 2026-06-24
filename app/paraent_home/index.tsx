import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import {
    TodayScheduleSummary,
    deleteSchedule,
    getInviteRequests,
    getNotifications,
    getParentHome,
    getSchedule,
    getSchedules,
    getTodaySchedules,
    updateSchedule,
} from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { hasUnreadParentNotifications } from '../../constants/NotificationState';
import { RepeatDate, parseRepeatDates } from '../../constants/Recurrence';

type ScheduleItem = {
    id: number;
    scheduleId?: string;
    text: string;
    done: boolean;
    companion: string;
    todos: ScheduleTodo[];
};

type ScheduleTodo = {
    id: number;
    text: string;
    done: boolean;
};

type HandoffItem = {
    id: number;
    text: string;
};

type ActiveTab = 'today' | 'calendar';

type CalendarEvent = {
    id: number;
    scheduleId?: string;
    year: number;
    month: number;
    day: number;
    title: string;
    companion: string;
    todos: ScheduleTodo[];
};

type CalendarDay = {
    year: number;
    month: number;
    day: number;
    monthOffset: -1 | 0 | 1;
};

type EditTarget =
    | { type: 'schedule'; item: ScheduleItem }
    | { type: 'handoff'; item: HandoffItem }
    | { type: 'calendar'; item: CalendarEvent }
    | null;

const initialSchedules: ScheduleItem[] = [
    {
        id: 1,
        text: '병원 진료',
        done: false,
        companion: '박민지',
        todos: [
            { id: 11, text: '병원 갈 준비', done: false },
            { id: 12, text: '병원으로 이동', done: true },
            { id: 13, text: '진료 보기', done: true },
        ],
    },
    {
        id: 2,
        text: '치료실 방문',
        done: true,
        companion: '최서윤',
        todos: [
            { id: 21, text: '치료 도구 챙기기', done: true },
            { id: 22, text: '치료 후 쉬는 시간 갖기', done: true },
        ],
    },
];

const initialHandoffs: HandoffItem[] = [
    { id: 1, text: '병원에 가기 전 아이가 긴장할 수 있어요.' },
    { id: 2, text: '진료실에 들어가기 전 짧게 예고해주세요.' },
    { id: 3, text: '대기 시간이 길면 조용한 곳에서 쉬면 좋아요.' },
];

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
const companionOptions = ['박민지', '이하늘', '최서윤'];

function getTodayTitle() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();

    return `${month}월 ${date}일 오늘의 일정`;
}

const toNumericId = (id: string) => (
    id.split('').reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0)
);

const mapScheduleTodos = (schedule: TodayScheduleSummary, baseId: number): ScheduleTodo[] => {
    const details = [
        schedule.start_time ? `${schedule.start_time} 시작` : '',
        schedule.destination || schedule.place_type || '',
        schedule.transport_type ? `${schedule.transport_type} 이동` : '',
    ].filter(Boolean);

    return details.map((text, index) => ({
        id: baseId + index + 1,
        text,
        done: schedule.status === 'done',
    }));
};

const mapTodaySchedule = (schedule: TodayScheduleSummary): ScheduleItem => {
    const id = toNumericId(schedule.schedule_id);

    return {
        id,
        scheduleId: schedule.schedule_id,
        text: schedule.title,
        done: schedule.status === 'done',
        companion: '동행인 미정',
        todos: mapScheduleTodos(schedule, id),
    };
};

const mapCalendarEvent = (schedule: TodayScheduleSummary): CalendarEvent | null => {
    const [year, month, day] = schedule.date.split('-').map(Number);
    const id = toNumericId(schedule.schedule_id);

    if ([year, month, day].some(Number.isNaN)) return null;

    return {
        id,
        scheduleId: schedule.schedule_id,
        year,
        month,
        day,
        title: schedule.title,
        companion: '동행인 미정',
        todos: mapScheduleTodos(schedule, id),
    };
};

export default function ParentHome() {
    const params = useLocalSearchParams<{
        tab?: string;
        addedEventId?: string;
        addedEventYear?: string;
        addedEventMonth?: string;
        addedEventDay?: string;
        addedEventTitle?: string;
        addedEventCompanion?: string;
        addedEventTodos?: string;
        addedEventDates?: string;
        addedScheduleId?: string;
        addedScheduleTitle?: string;
        addedScheduleCompanion?: string;
        addedScheduleTodos?: string;
        updatedChildId?: string;
        updatedChildName?: string;
        updatedProfileImage?: string;
        updatedProfileSections?: string;
    }>();
    const todayTitle = useMemo(() => getTodayTitle(), []);
    const today = useMemo(() => new Date(), []);
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const todayDay = today.getDate();
    const [calendarYear, setCalendarYear] = useState(currentYear);
    const [calendarMonth, setCalendarMonth] = useState(currentMonth);
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
    const scrollViewRef = useRef<ScrollView>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('today');
    const [childId, setChildId] = useState('');
    const [childName, setChildName] = useState('김월동');
    const [childProfileImage, setChildProfileImage] = useState('');
    const [childProfileSections, setChildProfileSections] = useState('');
    const [selectedCalendarDay, setSelectedCalendarDay] = useState(todayDay);
    const [schedules, setSchedules] = useState(initialSchedules);
    const [handoffs, setHandoffs] = useState(initialHandoffs);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
        {
            id: 1,
            year: currentYear,
            month: currentMonth,
            day: todayDay,
            title: '병원 진료',
            companion: '박민지',
            todos: [
                { id: 101, text: '진료 접수하기', done: false },
                { id: 102, text: '진료 후 쉬는 시간 갖기', done: false },
            ],
        },
        {
            id: 2,
            year: currentYear,
            month: currentMonth,
            day: todayDay,
            title: '진료 후 쉬는 시간',
            companion: '이하늘',
            todos: [
                { id: 201, text: '조용한 장소 찾기', done: true },
            ],
        },
        {
            id: 3,
            year: currentYear,
            month: currentMonth,
            day: Math.min(todayDay + 3, new Date(currentYear, currentMonth, 0).getDate()),
            title: '언어 치료',
            companion: '최서윤',
            todos: [
                { id: 301, text: '치료 카드 챙기기', done: false },
            ],
        },
    ]);
    const [isScheduleInputOpen, setIsScheduleInputOpen] = useState(false);
    const [isHandoffInputOpen, setIsHandoffInputOpen] = useState(false);
    const [scheduleText, setScheduleText] = useState('');
    const [handoffText, setHandoffText] = useState('');
    const [editTarget, setEditTarget] = useState<EditTarget>(null);
    const [editText, setEditText] = useState('');
    const [editCompanion, setEditCompanion] = useState(companionOptions[0]);
    const [editTodos, setEditTodos] = useState<ScheduleTodo[]>([]);
    const [editTodoText, setEditTodoText] = useState('');
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(() => (
        hasUnreadParentNotifications()
    ));
    const selectedCalendarEvents = calendarEvents.filter((event) => (
        event.year === calendarYear &&
        event.month === calendarMonth &&
        event.day === selectedCalendarDay
    ));
    const selectedStoryEvent = selectedCalendarEvents[0];

    useFocusEffect(
        useCallback(() => {
            setHasUnreadNotifications(hasUnreadParentNotifications());

            let active = true;

            const loadUnreadNotifications = async () => {
                try {
                    const [notificationsResponse, requestsResponse] = await Promise.all([
                        getNotifications(),
                        getInviteRequests(),
                    ]);

                    if (!active) return;

                    const hasUnreadApiNotifications = notificationsResponse.data?.some((notification) => (
                        !notification.is_read
                    )) ?? false;
                    const hasPendingRequests = (requestsResponse.data?.length ?? 0) > 0;

                    setHasUnreadNotifications(hasUnreadApiNotifications || hasPendingRequests);
                } catch {
                    if (active) {
                        setHasUnreadNotifications(hasUnreadParentNotifications());
                    }
                }
            };

            loadUnreadNotifications();

            return () => {
                active = false;
            };
        }, [])
    );

    useEffect(() => {
        let cancelled = false;

        const loadParentHome = async () => {
            try {
                const [homeResponse, todaySchedulesResponse, schedulesResponse] = await Promise.all([
                    getParentHome(),
                    getTodaySchedules(),
                    getSchedules(),
                ]);

                if (cancelled) return;

                const firstChild = homeResponse.data?.children?.[0];
                if (firstChild?.child_id) {
                    setChildId(firstChild.child_id);
                }
                if (firstChild?.name) {
                    setChildName(firstChild.name);
                }
                if (firstChild?.profile_image_url) {
                    setChildProfileImage(firstChild.profile_image_url);
                }

                const apiSchedules = todaySchedulesResponse.data?.length
                    ? todaySchedulesResponse.data
                    : homeResponse.data?.today_schedules ?? [];

                setSchedules(apiSchedules.map(mapTodaySchedule));
                const allSchedules = schedulesResponse.data ?? apiSchedules;
                setCalendarEvents(allSchedules.map(mapCalendarEvent).filter((event): event is CalendarEvent => (
                    event !== null
                )));
            } catch {
                // 목 로그인이나 로컬 서버 미실행 상태에서는 기존 목데이터 홈을 유지합니다.
            }
        };

        loadParentHome();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (params.tab === 'calendar') {
            setActiveTab('calendar');
        }

        if (params.updatedChildName) {
            setChildName(params.updatedChildName);
        }

        if (params.updatedChildId) {
            setChildId(params.updatedChildId);
        }

        if (typeof params.updatedProfileImage === 'string') {
            setChildProfileImage(params.updatedProfileImage);
        }

        if (typeof params.updatedProfileSections === 'string') {
            setChildProfileSections(params.updatedProfileSections);
        }

        const addedScheduleId = params.addedScheduleId;
        const addedScheduleTitle = params.addedScheduleTitle;
        const addedScheduleCompanion = params.addedScheduleCompanion;

        if (addedScheduleId && addedScheduleTitle && addedScheduleCompanion) {
            const scheduleId = Number(addedScheduleId);
            let parsedTodos: ScheduleTodo[] = [];

            try {
                const parsed = params.addedScheduleTodos ? JSON.parse(params.addedScheduleTodos) : [];
                parsedTodos = Array.isArray(parsed)
                    ? parsed
                        .filter((item) => typeof item === 'string' && item.trim())
                        .map((item, index) => ({
                            id: scheduleId + index + 1,
                            text: item.trim(),
                            done: false,
                        }))
                    : [];
            } catch {
                parsedTodos = [];
            }

            if (!Number.isNaN(scheduleId)) {
                setActiveTab('today');
                setSchedules((current) => (
                    current.some((schedule) => schedule.id === scheduleId)
                        ? current
                        : [
                            ...current,
                            {
                                id: scheduleId,
                                text: addedScheduleTitle,
                                done: false,
                                companion: addedScheduleCompanion,
                                todos: parsedTodos,
                            },
                        ]
                ));
            }
        }

        if (
            !params.addedEventId ||
            !params.addedEventTitle ||
            !params.addedEventCompanion ||
            !params.addedEventYear ||
            !params.addedEventMonth ||
            !params.addedEventDay
        ) {
            return;
        }

        const eventTitle = params.addedEventTitle;
        const eventCompanion = params.addedEventCompanion;
        const eventId = Number(params.addedEventId);
        const fallbackEventId = params.addedEventId ? toNumericId(params.addedEventId) : Date.now();
        const numericEventId = Number.isNaN(eventId) ? fallbackEventId : eventId;
        let parsedTodos: ScheduleTodo[] = [];

        try {
            const parsed = params.addedEventTodos ? JSON.parse(params.addedEventTodos) : [];
            parsedTodos = Array.isArray(parsed)
                ? parsed
                    .filter((item) => typeof item === 'string' && item.trim())
                    .map((item, index) => ({
                        id: numericEventId + index + 1,
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
        const nextEvents = (eventDates.length > 0 ? eventDates : [fallbackDate]).map((date, index) => ({
            id: numericEventId + index,
            scheduleId: params.addedEventId,
            year: date.year,
            month: date.month,
            day: date.day,
            title: eventTitle,
            companion: eventCompanion,
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
        setSelectedCalendarDay(firstEvent.day);
        setCalendarEvents((current) => (
            current.some((event) => event.id === firstEvent.id)
                ? current
                : [...current, ...nextEvents]
        ));
    }, [
        params.addedEventCompanion,
        params.addedEventDates,
        params.addedEventDay,
        params.addedEventId,
        params.addedEventMonth,
        params.addedEventTitle,
        params.addedEventTodos,
        params.addedEventYear,
        params.addedScheduleCompanion,
        params.addedScheduleId,
        params.addedScheduleTitle,
        params.addedScheduleTodos,
        params.tab,
        params.updatedChildId,
        params.updatedChildName,
        params.updatedProfileImage,
        params.updatedProfileSections,
    ]);

    const cancelAddInputs = () => {
        if (!isScheduleInputOpen && !isHandoffInputOpen) return;

        setIsScheduleInputOpen(false);
        setIsHandoffInputOpen(false);
        setScheduleText('');
        setHandoffText('');
        Keyboard.dismiss();
    };

    const switchTab = (nextTab: ActiveTab) => {
        cancelAddInputs();
        setActiveTab(nextTab);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    const selectCalendarDay = (calendarDay: CalendarDay) => {
        cancelAddInputs();
        if (calendarDay.monthOffset !== 0) {
            setCalendarYear(calendarDay.year);
            setCalendarMonth(calendarDay.month);
        }
        setSelectedCalendarDay(calendarDay.day);
    };

    const toggleSchedule = (id: number) => {
        const target = schedules.find((item) => item.id === id);
        if (target?.scheduleId) {
            void updateSchedule(target.scheduleId, {
                status: target.done ? 'upcoming' : 'done',
            }).catch(() => {
                // 로컬 목데이터 일정은 기존 화면 상태만 갱신합니다.
            });
        }

        setSchedules((current) => current.map((item) => (
            item.id === id ? { ...item, done: !item.done } : item
        )));
    };

    const addSchedule = () => {
        const trimmedText = scheduleText.trim();
        if (!trimmedText) return;

        setSchedules((current) => [
            ...current,
            {
                id: Date.now(),
                text: trimmedText,
                done: false,
                companion: companionOptions[0],
                todos: [],
            },
        ]);
        setScheduleText('');
        setIsScheduleInputOpen(false);
        Keyboard.dismiss();
    };

    const loadScheduleChecklist = async (scheduleId: string, baseId: number) => {
        try {
            const response = await getSchedule(scheduleId);
            const checklist = response.data?.checklist ?? [];
            if (checklist.length === 0) return;

            setEditTodos(checklist.map((todo, index) => ({
                id: toNumericId(todo.item_id || `${scheduleId}-${index}`) || baseId + index + 1,
                text: todo.content,
                done: todo.is_checked,
            })));
        } catch {
            // 상세 조회가 실패해도 요약 화면에서 만든 Todo는 그대로 보여줍니다.
        }
    };

    const openScheduleEditor = (item: ScheduleItem) => {
        cancelAddInputs();
        setEditTarget({ type: 'schedule', item });
        setEditText(item.text);
        setEditCompanion(item.companion);
        setEditTodos(item.todos);
        setEditTodoText('');
        if (item.scheduleId) {
            void loadScheduleChecklist(item.scheduleId, item.id);
        }
    };

    const addHandoff = () => {
        const trimmedText = handoffText.trim();
        if (!trimmedText) return;

        setHandoffs((current) => [
            ...current,
            { id: Date.now(), text: trimmedText },
        ]);
        setHandoffText('');
        setIsHandoffInputOpen(false);
        Keyboard.dismiss();
    };

    const openHandoffEditor = (item: HandoffItem) => {
        cancelAddInputs();
        setEditTarget({ type: 'handoff', item });
        setEditText(item.text);
    };

    const openCalendarEditor = (item: CalendarEvent) => {
        cancelAddInputs();
        setEditTarget({ type: 'calendar', item });
        setEditText(item.title);
        setEditCompanion(item.companion);
        setEditTodos(item.todos);
        setEditTodoText('');
        if (item.scheduleId) {
            void loadScheduleChecklist(item.scheduleId, item.id);
        }
    };

    const closeEditor = () => {
        setEditTarget(null);
        setEditText('');
        setEditCompanion(companionOptions[0]);
        setEditTodos([]);
        setEditTodoText('');
        Keyboard.dismiss();
    };

    const toggleEditTodo = (id: number) => {
        setEditTodos((current) => current.map((todo) => (
            todo.id === id ? { ...todo, done: !todo.done } : todo
        )));
    };

    const deleteEditTodo = (id: number) => {
        setEditTodos((current) => current.filter((todo) => todo.id !== id));
    };

    const addEditTodo = () => {
        const trimmedText = editTodoText.trim();
        if (!trimmedText) return;

        setEditTodos((current) => [
            ...current,
            { id: Date.now(), text: trimmedText, done: false },
        ]);
        setEditTodoText('');
    };

    const saveEdit = async () => {
        const trimmedText = editText.trim();
        if (!trimmedText || !editTarget) return;

        if (
            (editTarget.type === 'schedule' || editTarget.type === 'calendar') &&
            editTarget.item.scheduleId
        ) {
            try {
                await updateSchedule(editTarget.item.scheduleId, {
                    title: trimmedText,
                    checklist: editTodos.map((todo) => todo.text),
                });
            } catch {
                // 로컬 목데이터 일정은 기존 화면 상태만 갱신합니다.
            }
        }

        if (editTarget.type === 'schedule') {
            setSchedules((current) => current.map((item) => (
                item.id === editTarget.item.id
                    ? {
                        ...item,
                        text: trimmedText,
                        companion: editCompanion,
                        todos: editTodos,
                    }
                    : item
            )));
        } else if (editTarget.type === 'calendar') {
            setCalendarEvents((current) => current.map((item) => (
                item.id === editTarget.item.id
                    ? {
                        ...item,
                        title: trimmedText,
                        companion: editCompanion,
                        todos: editTodos,
                    }
                    : item
            )));
        } else {
            setHandoffs((current) => current.map((item) => (
                item.id === editTarget.item.id ? { ...item, text: trimmedText } : item
            )));
        }

        closeEditor();
    };

    const deleteEdit = async () => {
        if (!editTarget) return;

        if (
            (editTarget.type === 'schedule' || editTarget.type === 'calendar') &&
            editTarget.item.scheduleId
        ) {
            try {
                await deleteSchedule(editTarget.item.scheduleId);
            } catch {
                // 로컬 목데이터 일정은 기존 화면 상태만 갱신합니다.
            }
        }

        if (editTarget.type === 'schedule') {
            setSchedules((current) => current.filter((item) => item.id !== editTarget.item.id));
        } else if (editTarget.type === 'calendar') {
            setCalendarEvents((current) => current.filter((item) => item.id !== editTarget.item.id));
        } else {
            setHandoffs((current) => current.filter((item) => item.id !== editTarget.item.id));
        }

        closeEditor();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={cancelAddInputs}
            >
                {(isScheduleInputOpen || isHandoffInputOpen) ? (
                    <Pressable style={styles.cancelAddArea} onPress={cancelAddInputs} />
                ) : null}

                <Pressable style={styles.header} onPress={cancelAddInputs}>
                    <View style={styles.logoRow}>
                        <Text style={styles.logoTitle}>월동</Text>
                        <Image
                            source={require('../../assets/images/canola_flower_small.png')}
                            style={styles.logoFlower}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.headerActions}>
                        <Pressable
                            style={styles.iconButton}
                            onPress={() => router.push('/paraent_home/notifications' as any)}
                        >
                            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
                            {hasUnreadNotifications ? <View style={styles.notificationDot} /> : null}
                        </Pressable>
                        <Pressable
                            style={styles.iconButton}
                            onPress={() =>
                                router.push({
                                    pathname: '/paraent_home/companions',
                                    params: {
                                        childId,
                                        childName,
                                    },
                                } as any)
                            }
                        >
                            <Ionicons name="person-add-outline" size={23} color={Colors.text} />
                        </Pressable>
                        <Pressable
                            style={styles.profileButton}
                            onPress={() =>
                                router.push({
                                    pathname: '/paraent_home/child_profile',
                                    params: {
                                        childId,
                                        childName,
                                        profileImage: childProfileImage,
                                        sections: childProfileSections,
                                    },
                                } as any)
                            }
                        >
                            <Image
                                source={
                                    childProfileImage
                                        ? { uri: childProfileImage }
                                        : require('../../assets/images/icon_child.png')
                                }
                                style={childProfileImage ? styles.profileImageFilled : styles.profileImage}
                                resizeMode={childProfileImage ? 'cover' : 'contain'}
                            />
                        </Pressable>
                    </View>
                </Pressable>

                {activeTab === 'today' ? (
                    <>
                        <View style={styles.section}>
                            <Pressable onPress={cancelAddInputs}>
                                <Text style={styles.sectionTitle}>{todayTitle}</Text>
                            </Pressable>

                            <View style={styles.scheduleCard}>
                                {schedules.length > 0 ? schedules.map((item) => (
                                    <View key={item.id} style={styles.scheduleRow}>
                                        <Pressable
                                            style={[styles.checkBox, item.done && styles.checkBoxDone]}
                                            onPress={() => {
                                                cancelAddInputs();
                                                toggleSchedule(item.id);
                                            }}
                                            hitSlop={10}
                                        >
                                            {item.done ? (
                                                <Ionicons name="checkmark" size={15} color={Colors.realwhite} />
                                            ) : null}
                                        </Pressable>
                                        <Pressable
                                            style={styles.scheduleTextButton}
                                            onPress={() => openScheduleEditor(item)}
                                        >
                                            <View style={styles.scheduleTitleRow}>
                                                <Text style={[
                                                    styles.scheduleText,
                                                    item.done && styles.scheduleTextDone,
                                                ]} numberOfLines={1}>
                                                    {item.text}
                                                </Text>
                                                <View style={styles.scheduleMetaPill}>
                                                    <Ionicons name="person-outline" size={13} color={Colors.textShadow} />
                                                    <Text style={styles.scheduleMetaText} numberOfLines={1}>
                                                        {item.companion}와 함께
                                                    </Text>
                                                </View>
                                            </View>
                                            {item.todos.length > 0 ? (
                                                <View style={styles.scheduleTodoPreview}>
                                                    {item.todos.slice(0, 2).map((todo) => (
                                                        <View key={todo.id} style={styles.scheduleTodoPreviewRow}>
                                                            <Ionicons
                                                                name={todo.done ? 'checkmark-circle' : 'ellipse-outline'}
                                                                size={13}
                                                                color={todo.done ? Colors.highlight1 : Colors.textShadow}
                                                            />
                                                            <Text style={[
                                                                styles.scheduleTodoPreviewText,
                                                                todo.done && styles.scheduleTodoPreviewTextDone,
                                                            ]}>
                                                                {todo.text}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                    {item.todos.length > 2 ? (
                                                        <Text style={styles.scheduleMoreText}>+ {item.todos.length - 2}개 더</Text>
                                                    ) : null}
                                                </View>
                                            ) : null}
                                        </Pressable>
                                    </View>
                                )) : (
                                    <Text style={styles.emptyScheduleText}>오늘 예정된 일정이 없어요.</Text>
                                )}
                            </View>

                            <Pressable
                                style={styles.addButton}
                                onPress={() => {
                                    cancelAddInputs();
                                    router.push({
                                        pathname: '/paraent_home/calendar_add',
                                        params: {
                                            childId,
                                            year: String(currentYear),
                                            month: String(currentMonth),
                                            day: String(todayDay),
                                        },
                                    } as any);
                                }}
                            >
                                <View style={styles.addIconCircle}>
                                    <Ionicons name="add" size={18} color={Colors.realwhite} />
                                </View>
                                <Text style={styles.addButtonText}>일정 추가하기</Text>
                            </Pressable>
                        </View>

                        <View style={styles.sectionDivider} />

                        <View style={styles.section}>
                            <Pressable onPress={cancelAddInputs}>
                                <Text style={styles.sectionTitle}>아이 주의사항</Text>
                            </Pressable>

                            <View style={styles.handoffCard}>
                                {handoffs.map((item) => (
                                    <Pressable
                                        key={item.id}
                                        style={styles.handoffRow}
                                        onPress={() => openHandoffEditor(item)}
                                    >
                                        <View style={styles.staticCheckIcon}>
                                            <Ionicons name="checkmark" size={18} color={Colors.highlight1} />
                                        </View>
                                        <Text style={styles.handoffText}>{item.text}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            {isHandoffInputOpen ? (
                                <View style={styles.handoffInputBox}>
                                    <TextInput
                                        style={styles.handoffInput}
                                        placeholder="공유할 내용을 입력해주세요"
                                        placeholderTextColor={Colors.textShadow}
                                        value={handoffText}
                                        onChangeText={setHandoffText}
                                        autoFocus
                                        multiline
                                        textAlignVertical="top"
                                    />
                                    <Pressable style={styles.saveHandoffButton} onPress={addHandoff}>
                                        <Text style={styles.saveHandoffText}>저장</Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <Pressable
                                    style={styles.addButton}
                                    onPress={() => {
                                        setIsScheduleInputOpen(false);
                                        setScheduleText('');
                                        setIsHandoffInputOpen(true);
                                    }}
                                >
                                    <View style={styles.addIconCircle}>
                                        <Ionicons name="add" size={18} color={Colors.realwhite} />
                                    </View>
                                    <Text style={styles.addButtonText}>자료 추가하기</Text>
                                </Pressable>
                            )}
                        </View>
                    </>
                ) : (
                    <View style={styles.section}>
                        <View style={styles.calendarHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>{calendarMonth}월 캘린더</Text>
                                <Text style={styles.calendarSubtitle}>동행인과 함께 보는 공유 일정이에요.</Text>
                            </View>
                            <Text style={styles.calendarYear}>{calendarYear}</Text>
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
                                    const selected = !muted && calendarDay.day === selectedCalendarDay;
                                    const isToday = (
                                        calendarDay.year === currentYear &&
                                        calendarDay.month === currentMonth &&
                                        calendarDay.day === todayDay
                                    );

                                    return (
                                        <Pressable
                                            key={`${calendarDay.year}-${calendarDay.month}-${calendarDay.day}-${index}`}
                                            style={[
                                                styles.dayCell,
                                                selected && styles.dayCellSelected,
                                            ]}
                                            onPress={() => selectCalendarDay(calendarDay)}
                                        >
                                            <Text style={[
                                                styles.dayText,
                                                muted && styles.dayTextMuted,
                                                selected && styles.dayTextSelected,
                                                isToday && !selected && !muted && styles.todayText,
                                            ]}>
                                                {calendarDay.day}
                                            </Text>
                                            <View style={[styles.eventDot, !hasEvent && styles.eventDotHidden]} />
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.calendarEventHeader}>
                            <Text style={styles.calendarEventTitle}>
                                {calendarMonth}월 {selectedCalendarDay}일 일정
                            </Text>
                        </View>

                        <View style={styles.calendarEventList}>
                            {selectedCalendarEvents.length > 0 ? (
                                selectedCalendarEvents.map((event) => (
                                    <Pressable
                                        key={event.id}
                                        style={styles.calendarEventCard}
                                        onPress={() => openCalendarEditor(event)}
                                    >
                                        <View style={styles.calendarEventIcon}>
                                            <Ionicons name="calendar-outline" size={18} color={Colors.text} />
                                        </View>
                                        <View style={styles.calendarEventTextArea}>
                                            <Text style={styles.calendarEventName}>{event.title}</Text>
                                            <Text style={styles.calendarEventCompanion}>{event.companion}와 공유 중</Text>
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
                                                                todo.done && styles.calendarTodoPreviewTextDone,
                                                            ]}>
                                                                {todo.text}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            ) : null}
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={Colors.textShadow} />
                                    </Pressable>
                                ))
                            ) : (
                                <View style={styles.emptyEventCard}>
                                    <Text style={styles.emptyEventText}>등록된 공유 일정이 없어요.</Text>
                                </View>
                            )}
                        </View>

                        {selectedStoryEvent ? (
                            <View style={styles.calendarActionRow}>
                                <Pressable
                                    style={styles.socialStoryButton}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/social_story',
                                            params: {
                                                scheduleId: selectedStoryEvent.scheduleId ?? '',
                                                childName,
                                                title: selectedStoryEvent.title,
                                                script: `오늘은 ${selectedStoryEvent.title} 일정이 있어요.`,
                                                checkedItems: JSON.stringify([
                                                    `일정_${selectedStoryEvent.title}`,
                                                    ...selectedStoryEvent.todos.map((todo) => `체크_${todo.text}`),
                                                ]),
                                            },
                                        } as any)
                                    }
                                >
                                    <Ionicons name="book-outline" size={19} color={Colors.text} />
                                    <Text style={styles.socialStoryButtonText}>소셜 스토리 만들기</Text>
                                </Pressable>

                                {selectedStoryEvent.scheduleId ? (
                                    <Pressable
                                        style={styles.socialStoryButton}
                                        onPress={() =>
                                            router.push({
                                                pathname: '/paraent_home/outing_record',
                                                params: {
                                                    scheduleId: selectedStoryEvent.scheduleId,
                                                    childName,
                                                },
                                            } as any)
                                        }
                                    >
                                        <Ionicons name="document-text-outline" size={19} color={Colors.text} />
                                        <Text style={styles.socialStoryButtonText}>당일 외출 기록 보기</Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        ) : null}

                        <Pressable
                            style={styles.addButton}
                            onPress={() =>
                                router.push({
                                    pathname: '/paraent_home/calendar_add',
                                    params: {
                                        childId,
                                        year: String(calendarYear),
                                        month: String(calendarMonth),
                                        day: String(selectedCalendarDay),
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
                        onPress={() => switchTab('today')}
                    >
                        <Ionicons
                            name="sunny-outline"
                            size={18}
                            color={activeTab === 'today' ? Colors.text : Colors.textShadow}
                        />
                        <Text style={[
                            styles.tabButtonText,
                            activeTab === 'today' && styles.tabButtonTextActive,
                        ]}>
                            오늘
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.tabButton, activeTab === 'calendar' && styles.tabButtonActive]}
                        onPress={() => switchTab('calendar')}
                    >
                        <Ionicons
                            name="calendar-outline"
                            size={18}
                            color={activeTab === 'calendar' ? Colors.text : Colors.textShadow}
                        />
                        <Text style={[
                            styles.tabButtonText,
                            activeTab === 'calendar' && styles.tabButtonTextActive,
                        ]}>
                            캘린더
                        </Text>
                    </Pressable>
                </View>
            </View>

            <Modal
                visible={Boolean(editTarget)}
                transparent
                animationType="fade"
                onRequestClose={closeEditor}
            >
                <Pressable style={styles.modalBackdrop} onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                        style={styles.modalKeyboardArea}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
                    >
                        <Pressable
                            style={[
                                styles.editModal,
                                editTarget?.type === 'schedule' && styles.todayEditModalOffset,
                            ]}
                            onPress={(event) => event.stopPropagation()}
                        >
                            <Text style={styles.modalTitle}>
                                {editTarget?.type === 'handoff' ? '주의사항 수정하기' : '일정 수정하기'}
                            </Text>
                            <TextInput
                                style={[
                                    styles.modalInput,
                                    editTarget?.type !== 'handoff' && styles.modalSingleLineInput,
                                ]}
                                value={editText}
                                onChangeText={setEditText}
                                placeholder="내용을 입력해주세요"
                                placeholderTextColor={Colors.textShadow}
                                multiline={editTarget?.type === 'handoff'}
                                textAlignVertical={editTarget?.type === 'handoff' ? 'top' : 'center'}
                                autoFocus
                            />

                            {editTarget?.type === 'schedule' || editTarget?.type === 'calendar' ? (
                                <>
                                    <Text style={styles.modalSubTitle}>함께 가는 동행인</Text>
                                    <View style={styles.modalChipRow}>
                                        {companionOptions.map((companion) => {
                                            const selected = editCompanion === companion;

                                            return (
                                                <Pressable
                                                    key={companion}
                                                    style={[styles.modalChip, selected && styles.modalChipSelected]}
                                                    onPress={() => setEditCompanion(companion)}
                                                >
                                                    <Text style={[
                                                        styles.modalChipText,
                                                        selected && styles.modalChipTextSelected,
                                                    ]}>
                                                        {companion}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>

                                    <Text style={styles.modalSubTitle}>세부 Todo</Text>
                                    <View style={styles.todoEditorCard}>
                                        {editTodos.map((todo) => (
                                            <View key={todo.id} style={styles.todoEditorRow}>
                                                <Pressable
                                                    style={[
                                                        styles.todoEditorCheck,
                                                        todo.done && styles.todoEditorCheckDone,
                                                    ]}
                                                    onPress={() => toggleEditTodo(todo.id)}
                                                >
                                                    {todo.done ? (
                                                        <Ionicons name="checkmark" size={14} color={Colors.realwhite} />
                                                    ) : null}
                                                </Pressable>
                                                <Text style={[
                                                    styles.todoEditorText,
                                                    todo.done && styles.todoEditorTextDone,
                                                ]}>
                                                    {todo.text}
                                                </Text>
                                                <Pressable onPress={() => deleteEditTodo(todo.id)} hitSlop={8}>
                                                    <Ionicons name="close" size={18} color={Colors.textShadow} />
                                                </Pressable>
                                            </View>
                                        ))}

                                        <View style={styles.todoAddRow}>
                                            <TextInput
                                                style={styles.todoAddInput}
                                                placeholder="세부 할 일을 입력해주세요"
                                                placeholderTextColor={Colors.textShadow}
                                                value={editTodoText}
                                                onChangeText={setEditTodoText}
                                                returnKeyType="done"
                                                onSubmitEditing={addEditTodo}
                                            />
                                            <Pressable style={styles.todoAddButton} onPress={addEditTodo}>
                                                <Ionicons name="add" size={18} color={Colors.text} />
                                            </Pressable>
                                        </View>
                                    </View>
                                </>
                            ) : null}

                            <View style={styles.modalButtonRow}>
                                <Pressable style={styles.deleteButton} onPress={deleteEdit}>
                                    <Text style={styles.deleteButtonText}>삭제</Text>
                                </Pressable>
                                <Pressable style={styles.cancelButton} onPress={closeEditor}>
                                    <Text style={styles.cancelButtonText}>취소</Text>
                                </Pressable>
                                <Pressable style={styles.saveButton} onPress={saveEdit}>
                                    <Text style={styles.saveButtonText}>저장</Text>
                                </Pressable>
                            </View>
                        </Pressable>
                    </KeyboardAvoidingView>
                </Pressable>
            </Modal>
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

    container: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 18,
        paddingBottom: 126,
        position: 'relative',
    },

    cancelAddArea: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 44,
        zIndex: 1,
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

    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    notificationDot: {
        position: 'absolute',
        right: 8,
        bottom: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.highlight3,
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

    profileImageFilled: {
        width: '100%',
        height: '100%',
    },

    section: {
        width: '100%',
        marginBottom: 36,
        zIndex: 1,
    },

    sectionDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#E8DDC8',
        marginTop: -12,
        marginBottom: 28,
        zIndex: 1,
    },

    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 20,
        fontWeight: '900',
        color: Colors.black,
        marginBottom: 16,
    },

    scheduleCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 16,
        paddingVertical: 18,
        marginBottom: 16,
        gap: 18,
    },

    emptyScheduleText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.textShadow,
        textAlign: 'center',
        paddingVertical: 38,
    },

    scheduleRow: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    checkBox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: '#F0EED8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 8,
    },

    checkBoxDone: {
        backgroundColor: Colors.highlight1,
    },

    scheduleText: {
        flex: 1,
        flexShrink: 1,
        fontFamily: Fonts.bodyMedium,
        fontSize: 15,
        color: Colors.text,
        lineHeight: 22,
    },

    scheduleTextDone: {
        color: '#A9A196',
    },

    scheduleTextButton: {
        flex: 1,
        minHeight: 42,
        justifyContent: 'center',
        paddingVertical: 6,
    },

    scheduleTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },

    scheduleMetaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: Colors.pageBg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        maxWidth: 126,
    },

    scheduleMetaText: {
        marginLeft: 5,
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textShadow,
    },

    scheduleTodoPreview: {
        marginTop: 8,
        gap: 4,
    },

    scheduleTodoPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    scheduleTodoPreviewText: {
        flex: 1,
        marginLeft: 5,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.text,
    },

    scheduleTodoPreviewTextDone: {
        color: '#A9A196',
    },

    scheduleMoreText: {
        marginTop: 2,
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textShadow,
    },

    addButton: {
        alignSelf: 'flex-start',
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
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

    socialStoryButton: {
        alignSelf: 'flex-start',
        minHeight: 38,
        borderRadius: 19,
        backgroundColor: Colors.pageBg2,
        borderWidth: 1,
        borderColor: Colors.highlight1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        marginBottom: 14,
        gap: 7,
    },

    socialStoryButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },

    calendarActionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },

    inlineInputRow: {
        width: '100%',
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingLeft: 14,
        paddingRight: 6,
    },

    inlineInput: {
        flex: 1,
        height: 44,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
        paddingVertical: 0,
    },

    inlineAddButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    handoffCard: {
        width: '100%',
        borderRadius: 16,
        backgroundColor: '#F7F4E8',
        borderWidth: 1,
        borderColor: '#E8DDC8',
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
        gap: 4,
    },

    handoffRow: {
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },

    staticCheckIcon: {
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    handoffText: {
        flex: 1,
        fontFamily: Fonts.bodyMedium,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
    },

    handoffInputBox: {
        width: '100%',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 12,
    },

    handoffInput: {
        minHeight: 84,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.text,
        padding: 0,
        marginBottom: 12,
    },

    saveHandoffButton: {
        alignSelf: 'flex-end',
        minWidth: 64,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    saveHandoffText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },

    calendarHeader: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    calendarSubtitle: {
        marginTop: -8,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textShadow,
    },

    calendarYear: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.textShadow,
        paddingTop: 4,
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

    todayText: {
        color: Colors.highlight3,
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

    calendarEventHeader: {
        marginBottom: 12,
    },

    calendarEventTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 17,
        fontWeight: '900',
        color: Colors.text,
    },

    calendarEventList: {
        width: '100%',
        gap: 10,
        marginBottom: 16,
    },

    calendarEventCard: {
        width: '100%',
        minHeight: 62,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },

    calendarEventIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.pageBg2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    calendarEventTextArea: {
        flex: 1,
    },

    calendarEventName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 3,
    },

    calendarEventCompanion: {
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
        marginLeft: 5,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.text,
    },

    calendarTodoPreviewTextDone: {
        color: '#A9A196',
    },

    emptyEventCard: {
        width: '100%',
        minHeight: 58,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
    },

    emptyEventText: {
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

    tabButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.textShadow,
    },

    tabButtonTextActive: {
        color: Colors.text,
    },

    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(17, 17, 17, 0.28)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },

    modalKeyboardArea: {
        width: '100%',
        alignItems: 'center',
    },

    editModal: {
        width: '100%',
        borderRadius: 18,
        backgroundColor: Colors.pageBg,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        padding: 20,
    },

    todayEditModalOffset: {
        transform: [{ translateY: 28 }],
    },

    modalTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 14,
    },

    modalInput: {
        width: '100%',
        minHeight: 94,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
        marginBottom: 16,
    },

    modalSingleLineInput: {
        minHeight: 46,
        paddingVertical: 10,
        textAlignVertical: 'center',
    },

    modalSubTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },

    modalChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },

    modalChip: {
        minHeight: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },

    modalChipSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: Colors.highlight1,
    },

    modalChipText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.text,
    },

    modalChipTextSelected: {
        color: Colors.text,
    },

    todoEditorCard: {
        width: '100%',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 12,
        marginBottom: 16,
        gap: 10,
    },

    todoEditorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 28,
    },

    todoEditorCheck: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: Colors.pageBg3,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    todoEditorCheckDone: {
        backgroundColor: Colors.highlight1,
    },

    todoEditorText: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
    },

    todoEditorTextDone: {
        color: '#A9A196',
    },

    todoAddRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E8DDC8',
        paddingTop: 10,
    },

    todoAddInput: {
        flex: 1,
        height: 36,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
        paddingVertical: 0,
    },

    todoAddButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },

    deleteButton: {
        height: 38,
        borderRadius: 19,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FBE7E3',
    },

    deleteButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.highlight3,
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
