import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { registerCompanionRequestNotification } from '../../constants/NotificationState';

type ActiveTab = 'today' | 'calendar';

type ChildItem = {
    id: number;
    name: string;
    guardian: string;
    schedules: number;
    permissions: string[];
    status: 'connected' | 'pending';
    inviteCode?: string;
};

type HomeTodo = {
    id: number;
    childName: string;
    title: string;
    guardian: string;
    todos: { id: number; text: string; done: boolean }[];
};

type CalendarTodo = {
    id: number;
    text: string;
    done: boolean;
};

type CalendarEvent = {
    id: number;
    year: number;
    month: number;
    day: number;
    childName: string;
    title: string;
    guardian: string;
    todos: CalendarTodo[];
};

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const initialChildren: ChildItem[] = [
    {
        id: 1,
        name: '김월동',
        guardian: '김보호자',
        schedules: 3,
        permissions: ['오늘 일정', '공유 캘린더', '인수인계 자료'],
        status: 'connected',
    },
    {
        id: 2,
        name: '이하준',
        guardian: '이보호자',
        schedules: 1,
        permissions: ['오늘 일정', '아이 프로필'],
        status: 'connected',
    },
];

export default function CompanionChildren() {
    const params = useLocalSearchParams<{
        companionName?: string;
        companionRelation?: string;
        companionJob?: string;
        companionIntro?: string;
        companionProfileImage?: string;
    }>();
    const companionName = params.companionName || '박민지';
    const companionJob = params.companionJob || params.companionRelation || '담임 선생님';
    const companionIntro = params.companionIntro || '아이에게 필요한 일정을 차분하게 함께 확인해요.';
    const companionProfileImage = params.companionProfileImage || '';
    const today = useMemo(() => new Date(), []);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const [activeTab, setActiveTab] = useState<ActiveTab>('today');
    const [children, setChildren] = useState(initialChildren);
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [codeError, setCodeError] = useState('');
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
    const todayTodos: HomeTodo[] = [
        {
            id: 1,
            childName: '김월동',
            title: '병원 진료',
            guardian: '김보호자',
            todos: [
                { id: 11, text: '병원 접수하기', done: false },
                { id: 12, text: '진료 전 짧게 설명하기', done: true },
            ],
        },
        {
            id: 2,
            childName: '이하준',
            title: '귀가 준비',
            guardian: '이보호자',
            todos: [
                { id: 21, text: '가방 챙기기', done: false },
            ],
        },
    ];
    const connectedChildren = children.filter((child) => child.status === 'connected');
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
                childName: child.name,
                guardian: child.guardian,
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

    const closeCodeModal = () => {
        setIsCodeModalOpen(false);
        setInviteCode('');
        setCodeError('');
        Keyboard.dismiss();
    };

    const submitInviteCode = () => {
        const normalizedCode = inviteCode.trim().replace(/\s/g, '').toUpperCase();

        if (normalizedCode.length < 4) {
            setCodeError('초대 코드를 4자리 이상 입력해주세요.');
            return;
        }

        const pendingName = normalizedCode === 'ROW8' ? '김월동' : `초대 코드 ${normalizedCode}`;
        const alreadyRequested = children.some((child) => child.inviteCode === normalizedCode);

        if (!alreadyRequested) {
            setChildren((current) => [
                ...current,
                {
                    id: Date.now(),
                    name: pendingName,
                    guardian: '보호자 승인 대기',
                    schedules: 0,
                    permissions: ['승인 요청 중'],
                    status: 'pending',
                    inviteCode: normalizedCode,
                },
            ]);
        }

        registerCompanionRequestNotification(companionName, pendingName);
        setRequestMessage(`${pendingName} 보호자에게 승인 요청을 보냈어요.`);
        closeCodeModal();
    };

    const openNewCalendarEvent = () => {
        const defaultChild = connectedChildren[0];

        setEditingEvent(null);
        setEditTitle('');
        setEditChildName(defaultChild?.name ?? '');
        setEditTodos([]);
        setEditTodoText('');
        setEditError('');
        setIsCalendarEditorOpen(true);
    };

    const openCalendarEventEditor = (event: CalendarEvent) => {
        setEditingEvent(event);
        setEditTitle(event.title);
        setEditChildName(event.childName);
        setEditTodos(event.todos);
        setEditTodoText('');
        setEditError('');
        setIsCalendarEditorOpen(true);
    };

    const closeCalendarEditor = () => {
        setIsCalendarEditorOpen(false);
        setEditingEvent(null);
        setEditTitle('');
        setEditChildName('');
        setEditTodos([]);
        setEditTodoText('');
        setEditError('');
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

                {activeTab === 'today' ? (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.title}>{currentMonth}월 {todayDay}일 오늘 할 일</Text>
                            <Text style={styles.description}>담당 어린이들의 오늘 일정을 모아봤어요.</Text>

                            <View style={styles.todoCard}>
                                {todayTodos.map((schedule) => (
                                    <View key={schedule.id} style={styles.todoBlock}>
                                        <View style={styles.todoTitleRow}>
                                            <Text style={styles.todoTitle}>{schedule.title}</Text>
                                            <Text style={styles.childPill}>{schedule.childName}</Text>
                                        </View>
                                        <Text style={styles.todoMeta}>{schedule.guardian} 보호자와 공유 중</Text>
                                        <View style={styles.todoList}>
                                            {schedule.todos.map((todo) => (
                                                <View key={todo.id} style={styles.todoRow}>
                                                    <Ionicons
                                                        name={todo.done ? 'checkmark-circle' : 'ellipse-outline'}
                                                        size={16}
                                                        color={todo.done ? Colors.highlight1 : Colors.textShadow}
                                                    />
                                                    <Text style={[styles.todoText, todo.done && styles.todoDoneText]}>
                                                        {todo.text}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ))}
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
                                    onPress={() => setIsCodeModalOpen(true)}
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
                                {children.map((child) => (
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
                                                source={require('../../assets/images/icon_child.png')}
                                                style={styles.avatarImage}
                                                resizeMode="contain"
                                            />
                                        </View>

                                        <View style={styles.childInfo}>
                                            <Text style={styles.childName}>{child.name}</Text>
                                            <Text style={styles.guardianText}>
                                                {child.status === 'pending'
                                                    ? '보호자 승인 요청을 기다리고 있어요'
                                                    : `${child.guardian} 보호자와 연결됨`}
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
                                ))}
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.section}>
                        <View style={styles.calendarHeader}>
                            <View>
                                <Text style={styles.title}>{calendarMonth}월 캘린더</Text>
                                <Text style={styles.description}>담당 어린이들의 공유 일정이에요.</Text>
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
                                    const selected = day === selectedDay;
                                    const hasEvent = day !== null && calendarEvents.some((event) => (
                                        event.year === calendarYear &&
                                        event.month === calendarMonth &&
                                        event.day === day
                                    ));

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
                                                    {hasEvent ? <View style={styles.eventDot} /> : null}
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
                                                {event.childName} · {event.guardian} 보호자와 공유 중
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
                visible={isCodeModalOpen}
                transparent
                animationType="fade"
                onRequestClose={closeCodeModal}
            >
                <Pressable style={styles.modalBackdrop} onPress={closeCodeModal}>
                    <KeyboardAvoidingView
                        style={styles.modalKeyboardArea}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
                    >
                        <Pressable style={styles.codeModal} onPress={(event) => event.stopPropagation()}>
                            <Text style={styles.modalTitle}>담당 어린이 추가</Text>
                            <Text style={styles.modalDescription}>
                                보호자에게 받은 초대 코드를 입력하면 승인 요청이 전송돼요.
                            </Text>

                            <TextInput
                                style={[styles.codeInput, codeError && styles.inputError]}
                                placeholder="초대 코드 입력"
                                placeholderTextColor={Colors.textShadow}
                                value={inviteCode}
                                onChangeText={(text) => {
                                    setInviteCode(text.toUpperCase());
                                    if (codeError) setCodeError('');
                                }}
                                autoCapitalize="characters"
                                returnKeyType="done"
                                onSubmitEditing={submitInviteCode}
                                autoFocus
                            />
                            {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}

                            <View style={styles.modalButtonRow}>
                                <Pressable style={styles.cancelButton} onPress={closeCodeModal}>
                                    <Text style={styles.cancelButtonText}>취소</Text>
                                </Pressable>
                                <Pressable style={styles.submitButton} onPress={submitInviteCode}>
                                    <Text style={styles.submitButtonText}>요청 보내기</Text>
                                </Pressable>
                            </View>
                        </Pressable>
                    </KeyboardAvoidingView>
                </Pressable>
            </Modal>

            <Modal
                visible={isCalendarEditorOpen}
                transparent
                animationType="fade"
                onRequestClose={closeCalendarEditor}
            >
                <Pressable style={styles.modalBackdrop} onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                        style={styles.modalKeyboardArea}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
                    >
                        <Pressable style={styles.calendarEditModal} onPress={(event) => event.stopPropagation()}>
                            <ScrollView
                                style={styles.calendarEditScroll}
                                contentContainerStyle={styles.calendarEditInner}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={styles.modalTitle}>
                                    {editingEvent ? '일정 수정하기' : '일정 추가하기'}
                                </Text>
                                <Text style={styles.modalDescription}>
                                    {calendarMonth}월 {selectedDay}일에 공유할 일정과 세부 Todo를 정리해주세요.
                                </Text>

                                <Text style={styles.modalSubTitle}>어린이 선택</Text>
                                <View style={styles.modalChipRow}>
                                    {connectedChildren.map((child) => {
                                        const selected = editChildName === child.name;

                                        return (
                                            <Pressable
                                                key={child.id}
                                                style={[styles.modalChip, selected && styles.modalChipSelected]}
                                                onPress={() => {
                                                    setEditChildName(child.name);
                                                    if (editError) setEditError('');
                                                }}
                                            >
                                                <Text style={[
                                                    styles.modalChipText,
                                                    selected && styles.modalChipTextSelected,
                                                ]}>
                                                    {child.name}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                <Text style={styles.modalSubTitle}>일정 이름</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editTitle}
                                    onChangeText={(text) => {
                                        setEditTitle(text);
                                        if (editError) setEditError('');
                                    }}
                                    placeholder="ex) 병원 진료"
                                    placeholderTextColor={Colors.textShadow}
                                    returnKeyType="done"
                                />

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

                                {editError ? <Text style={styles.errorText}>{editError}</Text> : null}

                                <View style={styles.modalButtonRow}>
                                    {editingEvent ? (
                                        <Pressable style={styles.deleteButton} onPress={deleteCalendarEvent}>
                                            <Text style={styles.deleteButtonText}>삭제</Text>
                                        </Pressable>
                                    ) : null}
                                    <Pressable style={styles.cancelButton} onPress={closeCalendarEditor}>
                                        <Text style={styles.cancelButtonText}>취소</Text>
                                    </Pressable>
                                    <Pressable style={styles.submitButton} onPress={saveCalendarEvent}>
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

    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.textShadow,
        marginBottom: 16,
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
        padding: 16,
        gap: 18,
    },

    todoBlock: {
        gap: 8,
    },

    todoTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },

    todoTitle: {
        flex: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
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
    },

    todoMeta: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
    },

    todoList: {
        gap: 6,
    },

    todoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    todoText: {
        flex: 1,
        marginLeft: 7,
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
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
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
    },

    calendarCard: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 14,
        marginBottom: 18,
    },

    weekRow: {
        flexDirection: 'row',
        marginBottom: 10,
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
        maxHeight: '84%',
        borderRadius: 18,
        backgroundColor: Colors.pageBg,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        overflow: 'hidden',
    },

    calendarEditScroll: {
        width: '100%',
    },

    calendarEditInner: {
        padding: 20,
    },

    modalTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 19,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
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
