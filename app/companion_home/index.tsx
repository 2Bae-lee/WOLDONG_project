import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
    CharacterSpeed,
    CharacterTone,
    CharacterVoice,
    CompanionChild,
    TodayScheduleSummary,
    getCompanionChildren,
    getCompanionProfile,
    getSchedules,
    getTodaySchedules,
} from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { CompanionTodaySchedule } from '../../constants/CompanionTodayState';
import { Fonts } from '../../constants/Fonts';
import { hasUnreadCompanionNotifications } from '../../constants/NotificationState';
import { RepeatDate, parseRepeatDates } from '../../constants/Recurrence';

type ActiveTab = 'today' | 'calendar';

type ChildItem = {
    id: string;
    childId?: string;
    primaryScheduleId?: string;
    name: string;
    profileImage?: string;
    profileSections?: string;
    characterImages?: CompanionChild['character_image_url'];
    characterTone?: CharacterTone | null;
    characterSpeed?: CharacterSpeed | null;
    characterVoice?: CharacterVoice | null;
    guardian: string;
    schedules: number;
    permissions: string[];
    status: 'connected' | 'pending';
    inviteCode?: string;
};

type CalendarTodo = {
    id: number;
    text: string;
    done: boolean;
};

type CalendarEvent = {
    id: number;
    scheduleId?: string;
    year: number;
    month: number;
    day: number;
    childName: string;
    title: string;
    guardian: string;
    todos: CalendarTodo[];
};

type CalendarDay = {
    year: number;
    month: number;
    day: number;
    monthOffset: -1 | 0 | 1;
};

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const createNumericId = (value: string) => (
    Number.parseInt(value.slice(-8), 16) ||
    value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
);

const getSchedulePlace = (schedule: TodayScheduleSummary) => (
    schedule.destination || schedule.place_type || '장소 확인'
);

const splitRequiredActions = (value?: string) => (
    value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []
);

const serializeChildProfileSections = (child: CompanionChild) => JSON.stringify([
    { id: 'info', title: '공유 정보', items: [child.disability_type].filter(Boolean) },
    { id: 'guidance', title: '설명 방식', items: child.explanation_styles ?? [] },
    { id: 'communication', title: '의사소통 방식', items: child.communication_styles ?? [] },
    { id: 'danger', title: '외출 중 주의 상황', items: child.caution_situations ?? [] },
    { id: 'companion', title: '동행인이 해야 할 행동', items: splitRequiredActions(child.required_actions) },
    { id: 'sensory', title: '힘들어하는 환경', items: child.difficult_environments ?? [] },
    { id: 'place', title: '힘들어하는 장소', items: child.difficult_places ?? [] },
    { id: 'schedule', title: '어려운 일정 변화', items: child.transition_difficulties ?? [] },
    { id: 'notice', title: '미리 알림 시간', items: child.notice_time ? [child.notice_time] : [] },
    { id: 'calming', title: '도움이 되는 것', items: child.calming_methods ?? [] },
    { id: 'avoid', title: '피해야 할 행동', items: child.avoid_behaviors ? [child.avoid_behaviors] : [] },
]);

const mapTodaySchedules = (
    schedules: TodayScheduleSummary[],
    childById: Map<string, CompanionChild>
): CompanionTodaySchedule[] => (
    schedules.map((schedule) => {
        const child = childById.get(schedule.child_id);
        const scheduleId = createNumericId(schedule.schedule_id);
        const place = getSchedulePlace(schedule);
        const timeText = [schedule.start_time, place].filter(Boolean).join(' · ');

        return {
            id: scheduleId,
            scheduleId: schedule.schedule_id,
            childName: child?.name ?? '담당 어린이',
            title: schedule.title,
            guardian: '연결된 보호자',
            done: schedule.status === 'done',
            todos: timeText
                ? [{ id: scheduleId + 1, text: timeText, done: schedule.status === 'done' }]
                : [],
        };
    })
);

const mapCalendarSchedules = (
    schedules: TodayScheduleSummary[],
    childById: Map<string, CompanionChild>
): CalendarEvent[] => (
    schedules.map((schedule) => {
        const [year, month, day] = schedule.date.split('-').map(Number);

        if (!year || !month || !day) return null;

        const eventId = createNumericId(schedule.schedule_id);
        const child = childById.get(schedule.child_id);
        const place = getSchedulePlace(schedule);
        const todoTexts = [
            schedule.start_time ? `${schedule.start_time} 출발` : '',
            place,
            schedule.transport_type ? `${schedule.transport_type} 이동` : '',
        ].filter(Boolean);

        const event: CalendarEvent = {
            id: eventId,
            scheduleId: schedule.schedule_id,
            year,
            month,
            day,
            childName: child?.name ?? '담당 어린이',
            title: schedule.title,
            guardian: '연결된 보호자',
            todos: todoTexts.map((text, index) => ({
                id: eventId + index + 1,
                text,
                done: schedule.status === 'done',
            })),
        };

        return event;
    }).filter((event): event is CalendarEvent => event !== null)
);

export default function CompanionChildren() {
    const params = useLocalSearchParams<{
        companionName?: string;
        companionRelation?: string;
        companionJob?: string;
        companionIntro?: string;
        companionProfileImage?: string;
        requestSent?: string;
        requestedInviteCode?: string;
        requestedChildName?: string;
        updatedEventId?: string;
        updatedEventTitle?: string;
        updatedEventTodos?: string;
        deletedEventId?: string;
        addedEventId?: string;
        addedEventYear?: string;
        addedEventMonth?: string;
        addedEventDay?: string;
        addedEventTitle?: string;
        addedEventChildName?: string;
        addedEventGuardian?: string;
        addedEventTodos?: string;
        addedEventDates?: string;
        tab?: string;
    }>();
    const [apiCompanionName, setApiCompanionName] = useState('');
    const [apiCompanionJob, setApiCompanionJob] = useState('');
    const [apiCompanionIntro, setApiCompanionIntro] = useState('');
    const [apiCompanionProfileImage, setApiCompanionProfileImage] = useState('');
    const [loadError, setLoadError] = useState('');
    const companionName = params.companionName || apiCompanionName || '동행인';
    const companionJob = params.companionJob || params.companionRelation || apiCompanionJob || '담임 선생님';
    const companionIntro = params.companionIntro || apiCompanionIntro || '아이에게 필요한 일정을 차분하게 함께 확인해요.';
    const companionProfileImage = params.companionProfileImage || apiCompanionProfileImage || '';
    const today = useMemo(() => new Date(), []);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const [activeTab, setActiveTab] = useState<ActiveTab>('today');
    const [children, setChildren] = useState<ChildItem[]>([]);
    const [requestMessage, setRequestMessage] = useState('');
    const [calendarYear, setCalendarYear] = useState(currentYear);
    const [calendarMonth, setCalendarMonth] = useState(currentMonth);
    const [selectedDay, setSelectedDay] = useState(todayDay);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
        {
            id: 1,
            year: currentYear,
            month: currentMonth,
            day: todayDay,
            childName: '김월동',
            title: '병원 진료',
            guardian: '김보호자',
            todos: [
                { id: 101, text: '병원 접수하기', done: false },
                { id: 102, text: '진료 후 조용한 곳에서 쉬기', done: true },
            ],
        },
        {
            id: 2,
            year: currentYear,
            month: currentMonth,
            day: Math.min(todayDay + 3, new Date(currentYear, currentMonth, 0).getDate()),
            childName: '김월동',
            title: '언어 치료',
            guardian: '김보호자',
            todos: [
                { id: 201, text: '치료 카드 챙기기', done: false },
            ],
        },
        {
            id: 3,
            year: currentYear,
            month: currentMonth,
            day: todayDay,
            childName: '이하준',
            title: '하원 동행',
            guardian: '이보호자',
            todos: [
                { id: 301, text: '하원 준비물 확인하기', done: false },
            ],
        },
    ]);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [isCalendarEditorOpen, setIsCalendarEditorOpen] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editChildName, setEditChildName] = useState('');
    const [editTodos, setEditTodos] = useState<CalendarTodo[]>([]);
    const [editTodoText, setEditTodoText] = useState('');
    const [editError, setEditError] = useState('');
    const [isChildPickerOpen, setIsChildPickerOpen] = useState(false);
    const [todayTodos, setTodayTodos] = useState<CompanionTodaySchedule[]>([]);
    const [editingTodayTodo, setEditingTodayTodo] = useState<CompanionTodaySchedule | null>(null);
    const [todayEditTitle, setTodayEditTitle] = useState('');
    const [todayEditTodos, setTodayEditTodos] = useState<CalendarTodo[]>([]);
    const [todayEditTodoText, setTodayEditTodoText] = useState('');
    const [todayEditError, setTodayEditError] = useState('');
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(() => (
        hasUnreadCompanionNotifications()
    ));
    const connectedChildren = children.filter((child) => child.status === 'connected');
    const selectedEditChild = connectedChildren.find((child) => child.name === editChildName);

    const loadCompanionHome = useCallback(async () => {
        try {
            const [profileResponse, childrenResponse, todaySchedulesResponse, allSchedulesResponse] = await Promise.all([
                getCompanionProfile(),
                getCompanionChildren(),
                getTodaySchedules(),
                getSchedules(),
            ]);

            const companionProfile = profileResponse.data;
            const assignedChildren = childrenResponse.data ?? [];
            const todaySchedules = todaySchedulesResponse.data ?? [];
            const allSchedules = allSchedulesResponse.data ?? [];
            const scheduleCountByChildId = new Map<string, number>();
            const primaryScheduleByChildId = new Map<string, string>();

            allSchedules.forEach((schedule) => {
                scheduleCountByChildId.set(
                    schedule.child_id,
                    (scheduleCountByChildId.get(schedule.child_id) ?? 0) + 1
                );
                if (!primaryScheduleByChildId.has(schedule.child_id)) {
                    primaryScheduleByChildId.set(schedule.child_id, schedule.schedule_id);
                }
            });

            const childById = new Map(assignedChildren.map((child) => [child.child_id, child]));
            const nextConnectedChildren: ChildItem[] = assignedChildren.map((child) => ({
                id: child.child_id,
                childId: child.child_id,
                primaryScheduleId: primaryScheduleByChildId.get(child.child_id),
                name: child.name,
                profileImage: child.profile_image_url ?? '',
                profileSections: serializeChildProfileSections(child),
                characterImages: child.character_image_url,
                characterTone: child.character_tone ?? null,
                characterSpeed: child.character_speed ?? null,
                characterVoice: child.character_voice ?? null,
                guardian: '연결된 보호자',
                schedules: scheduleCountByChildId.get(child.child_id) ?? 0,
                permissions: [
                    child.disability_type || '아이 프로필',
                    '오늘 일정',
                    '공유 캘린더',
                ],
                status: 'connected' as const,
            }));

            setApiCompanionName(companionProfile?.name ?? '');
            setApiCompanionJob(companionProfile?.job || companionProfile?.relation || '');
            setApiCompanionIntro(companionProfile?.intro ?? '');
            setApiCompanionProfileImage(companionProfile?.profile_image_url ?? '');
            setTodayTodos(mapTodaySchedules(todaySchedules, childById));
            setCalendarEvents(mapCalendarSchedules(allSchedules, childById));
            setChildren((current) => [
                ...nextConnectedChildren,
                ...current.filter((child) => (
                    child.status === 'pending' &&
                    !nextConnectedChildren.some((connectedChild) => connectedChild.inviteCode === child.inviteCode)
                )),
            ]);
            setLoadError('');
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : '담당 어린이 정보를 불러오지 못했어요.');
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setHasUnreadNotifications(hasUnreadCompanionNotifications());
            loadCompanionHome();
        }, [loadCompanionHome])
    );

    useEffect(() => {
        if (params.requestSent !== 'true' || !params.requestedInviteCode || !params.requestedChildName) {
            return;
        }

        const normalizedCode = params.requestedInviteCode.trim().replace(/\s/g, '').toUpperCase();
        setChildren((current) => {
            const alreadyRequested = current.some((child) => child.inviteCode === normalizedCode);
            if (alreadyRequested) return current;

            return [
                ...current,
                {
                    id: `pending-${normalizedCode}`,
                    name: params.requestedChildName ?? `초대 코드 ${normalizedCode}`,
                    guardian: '보호자 승인 대기',
                    schedules: 0,
                    permissions: ['승인 요청 중'],
                    status: 'pending',
                    inviteCode: normalizedCode,
                },
            ];
        });

        setRequestMessage(`${params.requestedChildName} 보호자에게 승인 요청을 보냈어요.`);
    }, [params.requestSent, params.requestedChildName, params.requestedInviteCode]);

    useEffect(() => {
        if (params.tab === 'calendar') {
            setActiveTab('calendar');
        }
    }, [params.tab]);

    useEffect(() => {
        if (
            !params.addedEventId ||
            !params.addedEventYear ||
            !params.addedEventMonth ||
            !params.addedEventDay ||
            !params.addedEventTitle ||
            !params.addedEventChildName ||
            !params.addedEventGuardian
        ) {
            return;
        }

        const addedEventId = Number(params.addedEventId);
        const addedEventYear = Number(params.addedEventYear);
        const addedEventMonth = Number(params.addedEventMonth);
        const addedEventDay = Number(params.addedEventDay);

        if (
            Number.isNaN(addedEventId) ||
            Number.isNaN(addedEventYear) ||
            Number.isNaN(addedEventMonth) ||
            Number.isNaN(addedEventDay)
        ) {
            return;
        }

        let parsedTodos: CalendarTodo[] = [];

        try {
            const parsed = params.addedEventTodos ? JSON.parse(params.addedEventTodos) : [];
            parsedTodos = Array.isArray(parsed)
                ? parsed
                    .filter((item) => typeof item === 'string' && item.trim())
                    .map((item, index) => ({
                        id: addedEventId + index + 1,
                        text: item.trim(),
                        done: false,
                    }))
                : [];
        } catch {
            parsedTodos = [];
        }

        const fallbackDate: RepeatDate = {
            year: addedEventYear,
            month: addedEventMonth,
            day: addedEventDay,
        };
        const eventDates = parseRepeatDates(params.addedEventDates);
        const nextEvents = (eventDates.length > 0 ? eventDates : [fallbackDate]).map((date, index) => ({
            id: addedEventId + index,
            year: date.year,
            month: date.month,
            day: date.day,
            childName: params.addedEventChildName ?? '김월동',
            guardian: params.addedEventGuardian ?? '김보호자',
            title: params.addedEventTitle ?? '새 일정',
            todos: parsedTodos.map((todo) => ({
                ...todo,
                id: todo.id + index * 1000,
            })),
        }));
        const firstEvent = nextEvents[0];

        if (!firstEvent) return;

        setCalendarEvents((current) => {
            const alreadyLoaded = nextEvents.every((nextEvent) => (
                current.some((event) => (
                    event.id === nextEvent.id ||
                    (
                        event.year === nextEvent.year &&
                        event.month === nextEvent.month &&
                        event.day === nextEvent.day &&
                        event.title === nextEvent.title &&
                        event.childName === nextEvent.childName
                    )
                ))
            ));

            if (alreadyLoaded) return current;

            return [...current, ...nextEvents];
        });
        setCalendarYear(firstEvent.year);
        setCalendarMonth(firstEvent.month);
        setSelectedDay(firstEvent.day);
        setActiveTab('calendar');
    }, [
        params.addedEventChildName,
        params.addedEventDates,
        params.addedEventDay,
        params.addedEventGuardian,
        params.addedEventId,
        params.addedEventMonth,
        params.addedEventTitle,
        params.addedEventTodos,
        params.addedEventYear,
    ]);

    useEffect(() => {
        if (params.deletedEventId) {
            const deletedEventId = Number(params.deletedEventId);

            if (!Number.isNaN(deletedEventId)) {
                setCalendarEvents((current) => current.filter((event) => event.id !== deletedEventId));
                setActiveTab('calendar');
            }

            return;
        }

        if (!params.updatedEventId || !params.updatedEventTitle) {
            return;
        }

        const updatedEventId = Number(params.updatedEventId);
        if (Number.isNaN(updatedEventId)) return;

        let parsedTodos: CalendarTodo[] = [];

        try {
            const parsed = params.updatedEventTodos ? JSON.parse(params.updatedEventTodos) : [];
            parsedTodos = Array.isArray(parsed)
                ? parsed
                    .filter((item) => (
                        typeof item?.id === 'number' &&
                        typeof item?.text === 'string' &&
                        typeof item?.done === 'boolean'
                    ))
                    .map((item) => ({
                        id: item.id,
                        text: item.text,
                        done: item.done,
                    }))
                : [];
        } catch {
            parsedTodos = [];
        }

        setCalendarEvents((current) => current.map((event) => (
            event.id === updatedEventId
                ? {
                    ...event,
                    title: params.updatedEventTitle ?? event.title,
                    todos: parsedTodos,
                }
                : event
        )));
        setActiveTab('calendar');
    }, [
        params.deletedEventId,
        params.updatedEventId,
        params.updatedEventTitle,
        params.updatedEventTodos,
    ]);
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

    const openProfileSetup = () => {
        router.push({
            pathname: '/companion_home/profile_setup',
            params: {
                companionName,
                companionJob,
                companionRelation: companionJob,
                companionIntro,
                companionProfileImage,
            },
        } as any);
    };

    const openChildHome = (child: ChildItem) => {
        if (child.status === 'pending') return;

        router.push({
            pathname: '/companion_home/child_home',
            params: {
                childId: child.childId ?? child.id,
                scheduleId: child.primaryScheduleId ?? '',
                childName: child.name,
                profileImage: child.profileImage ?? '',
                profileSections: child.profileSections ?? '',
                guardian: child.guardian,
                characterImages: child.characterImages ? JSON.stringify(child.characterImages) : '',
                characterTone: child.characterTone ?? '',
                characterSpeed: child.characterSpeed ?? '',
                characterVoice: child.characterVoice ?? '',
            },
        } as any);
    };

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

    const openNewCalendarEvent = () => {
        router.push({
            pathname: '/companion_home/calendar_create',
            params: {
                year: String(calendarYear),
                month: String(calendarMonth),
                day: String(selectedDay),
            },
        } as any);
    };

    const openCalendarEventEditor = (event: CalendarEvent) => {
        router.push({
            pathname: '/companion_home/calendar_edit',
            params: {
                eventId: String(event.id),
                scheduleId: event.scheduleId ?? '',
                year: String(event.year),
                month: String(event.month),
                day: String(event.day),
                childName: event.childName,
                guardian: event.guardian,
                title: event.title,
                todos: JSON.stringify(event.todos),
            },
        } as any);
    };

    const closeCalendarEditor = () => {
        setIsCalendarEditorOpen(false);
        setEditingEvent(null);
        setEditTitle('');
        setEditChildName('');
        setEditTodos([]);
        setEditTodoText('');
        setEditError('');
        setIsChildPickerOpen(false);
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

    const saveCalendarEvent = () => {
        const trimmedTitle = editTitle.trim();
        const selectedChild = connectedChildren.find((child) => child.name === editChildName);

        if (!trimmedTitle || !selectedChild) {
            setEditError('어린이와 일정 이름을 모두 입력해주세요.');
            return;
        }

        if (editingEvent) {
            setCalendarEvents((current) => current.map((event) => (
                event.id === editingEvent.id
                    ? {
                        ...event,
                        title: trimmedTitle,
                        childName: selectedChild.name,
                        guardian: selectedChild.guardian,
                        todos: editTodos,
                    }
                    : event
            )));
        } else {
            setCalendarEvents((current) => [
                ...current,
                {
                    id: Date.now(),
                    year: calendarYear,
                    month: calendarMonth,
                    day: selectedDay,
                    title: trimmedTitle,
                    childName: selectedChild.name,
                    guardian: selectedChild.guardian,
                    todos: editTodos,
                },
            ]);
        }

        closeCalendarEditor();
    };

    const deleteCalendarEvent = () => {
        if (!editingEvent) return;

        setCalendarEvents((current) => current.filter((event) => event.id !== editingEvent.id));
        closeCalendarEditor();
    };

    const toggleTodaySchedule = (id: number) => {
        setTodayTodos((current) => current.map((schedule) => (
            schedule.id === id
                ? {
                    ...schedule,
                    done: !schedule.done,
                    todos: schedule.todos.map((todo) => ({ ...todo, done: !schedule.done })),
                }
                : schedule
        )));
    };

    const toggleTodayTodo = (scheduleId: number, todoId: number) => {
        setTodayTodos((current) => current.map((schedule) => (
            schedule.id === scheduleId
                ? {
                    ...schedule,
                    todos: schedule.todos.map((todo) => (
                        todo.id === todoId ? { ...todo, done: !todo.done } : todo
                    )),
                }
                : schedule
        )));
    };

    const openTodayEditor = (schedule: CompanionTodaySchedule) => {
        setEditingTodayTodo(schedule);
        setTodayEditTitle(schedule.title);
        setTodayEditTodos(schedule.todos);
        setTodayEditTodoText('');
        setTodayEditError('');
    };

    const closeTodayEditor = () => {
        setEditingTodayTodo(null);
        setTodayEditTitle('');
        setTodayEditTodos([]);
        setTodayEditTodoText('');
        setTodayEditError('');
        Keyboard.dismiss();
    };

    const toggleTodayEditTodo = (id: number) => {
        setTodayEditTodos((current) => current.map((todo) => (
            todo.id === id ? { ...todo, done: !todo.done } : todo
        )));
    };

    const deleteTodayEditTodo = (id: number) => {
        setTodayEditTodos((current) => current.filter((todo) => todo.id !== id));
    };

    const addTodayEditTodo = () => {
        const trimmedText = todayEditTodoText.trim();
        if (!trimmedText) return;

        setTodayEditTodos((current) => [
            ...current,
            { id: Date.now(), text: trimmedText, done: false },
        ]);
        setTodayEditTodoText('');
    };

    const saveTodayEdit = () => {
        const trimmedTitle = todayEditTitle.trim();
        if (!editingTodayTodo || !trimmedTitle) {
            setTodayEditError('일정 이름을 입력해주세요.');
            return;
        }

        setTodayTodos((current) => current.map((schedule) => (
            schedule.id === editingTodayTodo.id
                ? {
                    ...schedule,
                    title: trimmedTitle,
                    todos: todayEditTodos.map((todo) => ({ ...todo })),
                }
                : schedule
        )));
        closeTodayEditor();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.inner}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
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
                    <View style={styles.headerActions}>
                        <Pressable
                            style={styles.iconButton}
                            onPress={() => router.push('/companion_home/notifications' as any)}
                        >
                            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
                            {hasUnreadNotifications ? <View style={styles.notificationDot} /> : null}
                        </Pressable>
                        <Pressable style={styles.headerProfileButton} onPress={openProfileSetup}>
                            <Image
                                source={
                                    companionProfileImage
                                        ? { uri: companionProfileImage }
                                        : require('../../assets/images/icon_companion.png')
                                }
                                style={companionProfileImage ? styles.profileImageFilled : styles.profileImage}
                                resizeMode={companionProfileImage ? 'cover' : 'contain'}
                            />
                        </Pressable>
                    </View>
                </View>

                {activeTab === 'today' ? (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.title}>{currentMonth}월 {todayDay}일 오늘 할 일</Text>
                            <Text style={styles.description}>담당 어린이들의 오늘 일정을 모아봤어요.</Text>
                            {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

                            <View style={styles.todoCard}>
                                {todayTodos.length > 0 ? (
                                    todayTodos.map((schedule) => (
                                        <View key={schedule.id} style={styles.todoBlock}>
                                            <View style={styles.todoTitleRow}>
                                                <Pressable
                                                    style={[
                                                        styles.todayScheduleCheck,
                                                        schedule.done && styles.todayScheduleCheckDone,
                                                    ]}
                                                    onPress={() => toggleTodaySchedule(schedule.id)}
                                                    hitSlop={8}
                                                >
                                                    {schedule.done ? (
                                                        <Ionicons name="checkmark" size={14} color={Colors.realwhite} />
                                                    ) : null}
                                                </Pressable>
                                                <Pressable
                                                    style={styles.todayScheduleTextButton}
                                                    onPress={() => openTodayEditor(schedule)}
                                                >
                                                    <Text style={[
                                                        styles.todoTitle,
                                                        schedule.done && styles.todoDoneText,
                                                    ]} numberOfLines={1}>
                                                        {schedule.title}
                                                    </Text>
                                                </Pressable>
                                                <Text style={styles.childPill} numberOfLines={1}>
                                                    {schedule.childName}
                                                </Text>
                                            </View>
                                            <Text style={styles.todoMeta}>{schedule.childName}의 오늘 일정</Text>
                                            <View style={styles.todoList}>
                                                {schedule.todos.map((todo) => (
                                                    <View key={todo.id} style={styles.todoRow}>
                                                        <Pressable
                                                            style={styles.todoCheckButton}
                                                            onPress={() => toggleTodayTodo(schedule.id, todo.id)}
                                                            hitSlop={8}
                                                        >
                                                            <Ionicons
                                                                name={todo.done ? 'checkmark-circle' : 'ellipse-outline'}
                                                                size={16}
                                                                color={todo.done ? Colors.highlight1 : Colors.textShadow}
                                                            />
                                                        </Pressable>
                                                        <Pressable
                                                            style={styles.todoTextButton}
                                                            onPress={() => openTodayEditor(schedule)}
                                                        >
                                                            <Text style={[styles.todoText, todo.done && styles.todoDoneText]}>
                                                                {todo.text}
                                                            </Text>
                                                        </Pressable>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>오늘 수행할 일정이 없어요.</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <View>
                                    <Text style={styles.title}>담당 어린이</Text>
                                    <Text style={styles.description}>연결된 어린이와 승인 요청을 확인해요.</Text>
                                </View>
                                <Pressable
                                    style={styles.smallAddButton}
                                    onPress={() => router.push({
                                        pathname: '/companion_home/invite_code',
                                        params: {
                                            companionName,
                                            companionJob,
                                            companionIntro,
                                            companionProfileImage,
                                        },
                                    } as any)}
                                >
                                    <Ionicons name="add" size={22} color={Colors.text} />
                                </Pressable>
                            </View>

                            {requestMessage ? (
                                <View style={styles.requestMessageCard}>
                                    <Ionicons name="paper-plane-outline" size={18} color={Colors.text} />
                                    <Text style={styles.requestMessageText}>{requestMessage}</Text>
                                </View>
                            ) : null}

                            <View style={styles.listArea}>
                                {children.length > 0 ? (
                                    children.map((child) => (
                                        <Pressable
                                            key={child.id}
                                            style={[
                                                styles.childCard,
                                                child.status === 'pending' && styles.childCardPending,
                                            ]}
                                            onPress={() => openChildHome(child)}
                                        >
                                            <View style={styles.avatarCircle}>
                                                <Image
                                                    source={
                                                        child.profileImage
                                                            ? { uri: child.profileImage }
                                                            : require('../../assets/images/icon_child.png')
                                                    }
                                                    style={child.profileImage ? styles.avatarImageFilled : styles.avatarImage}
                                                    resizeMode={child.profileImage ? 'cover' : 'contain'}
                                                />
                                            </View>

                                            <View style={styles.childInfo}>
                                                <Text style={styles.childName}>{child.name}</Text>
                                                <Text style={styles.guardianText}>
                                                    {child.status === 'pending'
                                                        ? '승인 요청을 기다리고 있어요'
                                                        : '담당 어린이'}
                                                </Text>
                                                <View style={styles.metaRow}>
                                                    <View style={styles.metaPill}>
                                                        <Ionicons
                                                            name={child.status === 'pending' ? 'time-outline' : 'calendar-outline'}
                                                            size={14}
                                                            color={Colors.text}
                                                        />
                                                        <Text style={styles.metaText}>
                                                            {child.status === 'pending'
                                                                ? '승인 대기'
                                                                : `오늘 일정 ${child.schedules}개`}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.permissionRow}>
                                                    {child.permissions.slice(0, 2).map((permission) => (
                                                        <Text key={permission} style={styles.permissionChip}>{permission}</Text>
                                                    ))}
                                                </View>
                                            </View>

                                            {child.status === 'connected' ? (
                                                <Ionicons name="chevron-forward" size={21} color={Colors.textShadow} />
                                            ) : null}
                                        </Pressable>
                                    ))
                                ) : (
                                    <View style={styles.emptyCard}>
                                        <Text style={styles.emptyText}>아직 연결된 담당 어린이가 없어요.</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.section}>
                        <View style={styles.calendarHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>{calendarMonth}월 캘린더</Text>
                                <Text style={styles.calendarSubtitle}>담당 어린이들의 공유 일정이에요.</Text>
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
                                    const selected = !muted && calendarDay.day === selectedDay;
                                    const hasEvent = calendarEvents.some((event) => (
                                        event.year === calendarDay.year &&
                                        event.month === calendarDay.month &&
                                        event.day === calendarDay.day
                                    ));
                                    const isToday = (
                                        calendarDay.year === currentYear &&
                                        calendarDay.month === currentMonth &&
                                        calendarDay.day === todayDay
                                    );

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
                            <Text style={styles.calendarSelectedDateTitle}>
                                {calendarMonth}월 {selectedDay}일 일정
                            </Text>
                        </View>

                        <View style={styles.calendarEventList}>
                            {selectedEvents.length > 0 ? (
                                selectedEvents.map((event) => (
                                    <Pressable
                                        key={event.id}
                                        style={styles.calendarEventCard}
                                        onPress={() => openCalendarEventEditor(event)}
                                    >
                                        <View style={styles.calendarEventIcon}>
                                            <Ionicons name="calendar-outline" size={18} color={Colors.text} />
                                        </View>
                                        <View style={styles.calendarEventTextArea}>
                                            <Text style={styles.calendarEventTitle}>{event.title}</Text>
                                            <Text style={styles.calendarEventMeta}>
                                                {event.childName}의 공유 일정
                                            </Text>
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
                                <View style={styles.emptyCard}>
                                    <Text style={styles.emptyText}>공유된 일정이 없어요.</Text>
                                </View>
                            )}
                        </View>

                        <Pressable style={styles.calendarAddButton} onPress={openNewCalendarEvent}>
                            <View style={styles.calendarAddIcon}>
                                <Ionicons name="add" size={18} color={Colors.realwhite} />
                            </View>
                            <Text style={styles.calendarAddText}>일정 추가하기</Text>
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

            <Modal
                visible={Boolean(editingTodayTodo)}
                transparent
                animationType="fade"
                onRequestClose={closeTodayEditor}
            >
                <Pressable style={styles.modalBackdrop} onPress={closeTodayEditor}>
                    <KeyboardAvoidingView
                        style={styles.modalKeyboardArea}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
                    >
                        <Pressable style={styles.todayEditModal} onPress={(event) => event.stopPropagation()}>
                            <ScrollView
                                style={styles.calendarEditScroll}
                                contentContainerStyle={styles.calendarEditInner}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={styles.modalTitle}>오늘 일정 수정하기</Text>
                                <Text style={styles.modalDescription}>
                                    일정 이름과 세부 Todo를 수정할 수 있어요.
                                </Text>

                                <Text style={styles.modalSubTitle}>일정 이름</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={todayEditTitle}
                                    onChangeText={(text) => {
                                        setTodayEditTitle(text);
                                        if (todayEditError) setTodayEditError('');
                                    }}
                                    placeholder="ex) 병원 진료"
                                    placeholderTextColor={Colors.textShadow}
                                    returnKeyType="done"
                                />

                                <Text style={styles.modalSubTitle}>세부 Todo</Text>
                                <View style={styles.todoEditorCard}>
                                    {todayEditTodos.map((todo) => (
                                        <View key={todo.id} style={styles.todoEditorRow}>
                                            <Pressable
                                                style={[
                                                    styles.todoEditorCheck,
                                                    todo.done && styles.todoEditorCheckDone,
                                                ]}
                                                onPress={() => toggleTodayEditTodo(todo.id)}
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
                                            <Pressable onPress={() => deleteTodayEditTodo(todo.id)} hitSlop={8}>
                                                <Ionicons name="close" size={18} color={Colors.textShadow} />
                                            </Pressable>
                                        </View>
                                    ))}

                                    <View style={styles.todoAddRow}>
                                        <TextInput
                                            style={styles.todoAddInput}
                                            placeholder="세부 할 일을 입력해주세요"
                                            placeholderTextColor={Colors.textShadow}
                                            value={todayEditTodoText}
                                            onChangeText={setTodayEditTodoText}
                                            returnKeyType="done"
                                            onSubmitEditing={addTodayEditTodo}
                                        />
                                        <Pressable style={styles.todoAddButton} onPress={addTodayEditTodo}>
                                            <Ionicons name="add" size={18} color={Colors.text} />
                                        </Pressable>
                                    </View>
                                </View>

                                {todayEditError ? <Text style={styles.errorText}>{todayEditError}</Text> : null}

                                <View style={styles.modalButtonRow}>
                                    <Pressable style={styles.cancelButton} onPress={closeTodayEditor}>
                                        <Text style={styles.cancelButtonText}>취소</Text>
                                    </Pressable>
                                    <Pressable style={styles.submitButton} onPress={saveTodayEdit}>
                                        <Text style={styles.submitButtonText}>저장</Text>
                                    </Pressable>
                                </View>
                            </ScrollView>
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

    inner: {
        flexGrow: 1,
        width: '100%',
        paddingTop: 28,
        paddingHorizontal: 30,
        paddingBottom: 126,
    },

    logoArea: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 34,
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

    headerProfileButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 1,
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    iconButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
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
        marginBottom: 34,
    },

    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 14,
        marginBottom: 14,
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 22,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },

    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 22,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 21,
        color: Colors.textShadow,
        marginBottom: 12,
    },

    smallAddButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },

    todoCard: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        paddingVertical: 14,
        gap: 12,
    },

    todoBlock: {
        gap: 5,
    },

    todoTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        minHeight: 36,
    },

    todoTitle: {
        flex: 1,
        flexShrink: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },

    todayScheduleCheck: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: Colors.pageBg3,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginVertical: 5,
    },

    todayScheduleCheckDone: {
        backgroundColor: Colors.highlight1,
    },

    todayScheduleTextButton: {
        flex: 1,
        minHeight: 36,
        justifyContent: 'center',
        paddingVertical: 4,
    },

    childPill: {
        borderRadius: 12,
        backgroundColor: Colors.pageBg2,
        paddingHorizontal: 9,
        paddingVertical: 4,
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
        overflow: 'hidden',
        maxWidth: 86,
    },

    todoMeta: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
    },

    todoList: {
        gap: 3,
    },

    todoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 28,
        paddingVertical: 1,
    },

    todoCheckButton: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 2,
    },

    todoTextButton: {
        flex: 1,
        minHeight: 28,
        justifyContent: 'center',
    },

    todoText: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
    },

    todoDoneText: {
        color: '#A9A196',
    },

    requestMessageCard: {
        minHeight: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#FFF8DF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginBottom: 12,
    },

    requestMessageText: {
        flex: 1,
        marginLeft: 8,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.text,
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

    childCardPending: {
        backgroundColor: '#FFF8DF',
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

    avatarImageFilled: {
        width: 62,
        height: 62,
        borderRadius: 31,
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

    calendarEventList: {
        width: '100%',
        gap: 10,
        marginBottom: 16,
    },

    calendarEventHeader: {
        marginBottom: 12,
    },

    calendarSelectedDateTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 17,
        fontWeight: '900',
        color: Colors.text,
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
        marginLeft: 5,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.text,
    },

    calendarTodoPreviewTextDone: {
        color: '#A9A196',
    },

    calendarAddButton: {
        alignSelf: 'flex-start',
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingRight: 8,
    },

    calendarAddIcon: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    calendarAddText: {
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

    codeModal: {
        width: '100%',
        borderRadius: 18,
        backgroundColor: Colors.pageBg,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        padding: 20,
    },

    calendarEditModal: {
        width: '100%',
        height: '78%',
        borderRadius: 18,
        backgroundColor: Colors.pageBg,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        overflow: 'hidden',
    },

    todayEditModal: {
        width: '100%',
        height: '78%',
        borderRadius: 18,
        backgroundColor: Colors.pageBg,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        overflow: 'hidden',
        transform: [{ translateY: 28 }],
    },

    calendarEditScroll: {
        width: '100%',
        flex: 1,
    },

    calendarEditInner: {
        padding: 20,
        paddingBottom: 28,
        flexGrow: 1,
    },

    modalTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 14,
    },

    modalDescription: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textShadow,
        marginBottom: 16,
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

    childPickerTrigger: {
        width: '100%',
        minHeight: 64,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
    },

    childPickerTextArea: {
        flex: 1,
    },

    childPickerValue: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 3,
    },

    childPickerPlaceholder: {
        color: Colors.textShadow,
    },

    childPickerMeta: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textShadow,
    },

    childPickerPanel: {
        width: '100%',
        maxHeight: 228,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: Colors.realwhite,
        padding: 8,
        marginTop: -8,
        marginBottom: 16,
    },

    childPickerScroll: {
        maxHeight: 210,
    },

    childSelectRow: {
        minHeight: 64,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
    },

    childSelectRowSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF4CF',
    },

    childSelectAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    childSelectImage: {
        width: 27,
        height: 27,
    },

    childSelectTextArea: {
        flex: 1,
    },

    childSelectName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 3,
    },

    childSelectMeta: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textShadow,
    },

    modalInput: {
        width: '100%',
        minHeight: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.text,
        marginBottom: 16,
    },

    todoEditorCard: {
        width: '100%',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },

    todoEditorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 34,
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
        lineHeight: 22,
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

    codeInput: {
        width: '100%',
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 2,
        marginBottom: 8,
    },

    inputError: {
        borderColor: Colors.highlight3,
    },

    errorText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.highlight3,
        marginBottom: 12,
    },

    modalButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 10,
    },

    cancelButton: {
        height: 40,
        borderRadius: 20,
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

    deleteButton: {
        height: 40,
        borderRadius: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FBE7E3',
        marginRight: 'auto',
    },

    deleteButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.highlight3,
    },

    submitButton: {
        height: 40,
        borderRadius: 20,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.highlight1,
    },

    submitButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },
});
