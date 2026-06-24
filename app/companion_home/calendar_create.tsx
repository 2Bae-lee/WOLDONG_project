import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import RepeatSelector from '../../components/RepeatSelector';
import { CompanionChild, createSchedule, getCompanionChildren } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import {
    RepeatDate,
    RepeatOption,
    getDateKey,
    getRepeatDates,
    toggleRepeatDate,
} from '../../constants/Recurrence';

const scheduleTypes = [
    { label: '병원', description: '진료, 검사, 예방접종 일정' },
    { label: '치료', description: '언어/놀이/감각 치료 일정' },
    { label: '학교', description: '등하원, 상담, 학교 행사' },
    { label: '외출', description: '마트, 공연장, 새로운 장소 방문' },
    { label: '기타', description: '직접 정리해야 하는 일정' },
];

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

type CalendarDay = {
    day: number;
    monthOffset: -1 | 0 | 1;
};

type SheetTarget = 'type' | 'child' | null;

export default function CompanionHomeCalendarCreate() {
    const params = useLocalSearchParams<{
        year?: string;
        month?: string;
        day?: string;
    }>();
    const today = useMemo(() => new Date(), []);
    const initialYear = Number(params.year) || today.getFullYear();
    const initialMonth = Number(params.month) || today.getMonth() + 1;
    const initialDay = Number(params.day) || today.getDate();
    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [selectedMonth, setSelectedMonth] = useState(initialMonth);
    const [selectedDay, setSelectedDay] = useState(initialDay);
    const [selectedType, setSelectedType] = useState('');
    const [selectedChildName, setSelectedChildName] = useState('');
    const [scheduleTitle, setScheduleTitle] = useState('');
    const [memo, setMemo] = useState('');
    const [todos, setTodos] = useState<string[]>([]);
    const [todoText, setTodoText] = useState('');
    const [error, setError] = useState('');
    const [children, setChildren] = useState<CompanionChild[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [sheetTarget, setSheetTarget] = useState<SheetTarget>(null);
    const selectedChild = children.find((child) => child.name === selectedChildName);
    const [repeatOption, setRepeatOption] = useState<RepeatOption>('none');
    const [customRepeatDates, setCustomRepeatDates] = useState<RepeatDate[]>([]);
    const selectedDate = { year: selectedYear, month: selectedMonth, day: selectedDay };
    const repeatDates = getRepeatDates(repeatOption, selectedDate, customRepeatDates);
    const repeatDateKeys = new Set(repeatDates.map(getDateKey));
    const calendarDays = useMemo(() => {
        const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const previousMonthDays = new Date(selectedYear, selectedMonth - 1, 0).getDate();
        const previousDays: CalendarDay[] = Array.from({ length: firstDay }, (_, index) => ({
            day: previousMonthDays - firstDay + index + 1,
            monthOffset: -1,
        }));
        const currentDays: CalendarDay[] = Array.from({ length: daysInMonth }, (_, index) => ({
            day: index + 1,
            monthOffset: 0,
        }));
        const trailingCount = Math.ceil((previousDays.length + currentDays.length) / 7) * 7
            - previousDays.length
            - currentDays.length;
        const nextDays: CalendarDay[] = Array.from({ length: trailingCount }, (_, index) => ({
            day: index + 1,
            monthOffset: 1,
        }));

        return [...previousDays, ...currentDays, ...nextDays];
    }, [selectedMonth, selectedYear]);

    const clearError = () => {
        if (error) setError('');
    };

    useEffect(() => {
        let active = true;

        const loadChildren = async () => {
            try {
                const response = await getCompanionChildren();
                if (!active) return;

                setChildren(response.data ?? []);
            } catch (loadError) {
                if (!active) return;

                setChildren([]);
                setError(loadError instanceof Error ? loadError.message : '담당 어린이를 불러오지 못했어요.');
            }
        };

        loadChildren();

        return () => {
            active = false;
        };
    }, []);

    const moveMonth = (monthOffset: number, nextDay?: number) => {
        const nextDate = new Date(selectedYear, selectedMonth - 1 + monthOffset, 1);
        const nextYear = nextDate.getFullYear();
        const nextMonth = nextDate.getMonth() + 1;
        const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();

        setSelectedYear(nextYear);
        setSelectedMonth(nextMonth);
        setSelectedDay(Math.min(nextDay ?? selectedDay, daysInNextMonth));
        clearError();
    };

    const selectCalendarDay = (calendarDay: CalendarDay) => {
        if (calendarDay.monthOffset !== 0) {
            moveMonth(calendarDay.monthOffset, calendarDay.day);
            return;
        }

        const nextDate = {
            year: selectedYear,
            month: selectedMonth,
            day: calendarDay.day,
        };

        setSelectedDay(calendarDay.day);
        if (repeatOption === 'custom') {
            setCustomRepeatDates((current) => toggleRepeatDate(current, nextDate));
        }
        clearError();
    };

    const handleRepeatChange = (option: RepeatOption) => {
        setRepeatOption(option);
        if (option === 'custom' && customRepeatDates.length === 0) {
            setCustomRepeatDates([selectedDate]);
        }
    };

    const addTodo = () => {
        const trimmedText = todoText.trim();
        if (!trimmedText) return;

        setTodos((current) => [...current, trimmedText]);
        setTodoText('');
    };

    const deleteTodo = (index: number) => {
        setTodos((current) => current.filter((_, itemIndex) => itemIndex !== index));
    };

    const formatDate = (date: RepeatDate) => (
        `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
    );

    const handleSave = async () => {
        if (isSaving) return;

        const title = scheduleTitle.trim();

        if (!selectedType || !selectedChild || !title) {
            setError('날짜, 일정 종류, 어린이, 일정 이름을 모두 입력해주세요.');
            return;
        }

        if (repeatOption === 'custom' && repeatDates.length === 0) {
            setError('기타 반복에서는 캘린더에서 날짜를 하나 이상 선택해주세요.');
            return;
        }

        Keyboard.dismiss();
        setIsSaving(true);
        setError('');

        try {
            const responses = await Promise.all(repeatDates.map((date) => createSchedule({
                child_id: selectedChild.child_id,
                title,
                date: formatDate(date),
                start_time: '09:00',
                place_type: selectedType,
                transport_type: '기타',
                activities: memo.trim() ? [memo.trim()] : [],
                wait_possible: false,
                crowd_possible: false,
                preparations: [],
                checklist: todos,
            })));
            const firstResponse = responses[0];

            if (!firstResponse?.data?.schedule_id) {
                setError('일정 저장 결과를 확인하지 못했어요.');
                return;
            }

            const firstDate = repeatDates[0] ?? selectedDate;

            router.replace({
                pathname: '/companion_home',
                params: {
                    tab: 'calendar',
                    addedEventId: String(Date.now()),
                    addedEventYear: String(firstDate.year),
                    addedEventMonth: String(firstDate.month),
                    addedEventDay: String(firstDate.day),
                    addedEventTitle: title,
                    addedEventChildName: selectedChild.name,
                    addedEventGuardian: '연결된 보호자',
                    addedEventTodos: JSON.stringify(todos),
                    addedEventDates: JSON.stringify(repeatDates),
                },
            } as any);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : '일정을 저장하지 못했어요.');
        } finally {
            setIsSaving(false);
        }
    };

    const sheetOptions = sheetTarget === 'type'
        ? scheduleTypes.map((option) => ({
            value: option.label,
            description: option.description,
            badge: '',
        }))
        : children.map((option) => ({
            value: option.name,
            description: option.disability_type || '담당 어린이',
            badge: '연결됨',
        }));

    return (
        <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.inner}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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
                    <Text style={styles.title}>공유 일정을 만들어요</Text>
                    <Text style={styles.description}>담당 어린이와 보호자가 함께 확인할 일정을 정리해주세요.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>날짜</Text>
                    <View style={styles.dateHeader}>
                        <Pressable style={styles.monthMoveButton} onPress={() => moveMonth(-1)}>
                            <Ionicons name="chevron-back" size={20} color={Colors.text} />
                        </Pressable>
                        <View style={styles.dateHeaderTextArea}>
                            <Text style={styles.dateTitle}>{selectedYear}년 {selectedMonth}월</Text>
                            <Text style={styles.selectedDate}>{selectedMonth}월 {selectedDay}일</Text>
                        </View>
                        <Pressable style={styles.monthMoveButton} onPress={() => moveMonth(1)}>
                            <Ionicons name="chevron-forward" size={20} color={Colors.text} />
                        </Pressable>
                    </View>

                    <View style={styles.calendarCard}>
                        <View style={styles.weekRow}>
                            {weekDays.map((day) => (
                                <Text key={day} style={styles.weekDay}>{day}</Text>
                            ))}
                        </View>

                        <View style={styles.calendarGrid}>
                            {calendarDays.map((calendarDay, index) => {
                                const selected = calendarDay.monthOffset === 0 && calendarDay.day === selectedDay;
                                const muted = calendarDay.monthOffset !== 0;
                                const repeated = calendarDay.monthOffset === 0 && repeatDateKeys.has(getDateKey({
                                    year: selectedYear,
                                    month: selectedMonth,
                                    day: calendarDay.day,
                                }));
                                const highlighted = repeatOption !== 'custom' && selected;

                                return (
                                    <Pressable
                                        key={`${calendarDay.monthOffset}-${calendarDay.day}-${index}`}
                                        style={[
                                            styles.dayCell,
                                            repeated && styles.dayCellRepeated,
                                            highlighted && styles.dayCellSelected,
                                        ]}
                                        onPress={() => selectCalendarDay(calendarDay)}
                                    >
                                        <Text style={[
                                            styles.dayText,
                                            muted && styles.dayTextMuted,
                                            highlighted && styles.dayTextSelected,
                                        ]}>
                                            {calendarDay.day}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>반복</Text>
                    <RepeatSelector
                        value={repeatOption}
                        repeatDates={repeatDates}
                        onChange={handleRepeatChange}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>일정 종류</Text>
                    <Pressable style={styles.selectField} onPress={() => setSheetTarget('type')}>
                        <Text style={[
                            styles.selectFieldText,
                            !selectedType && styles.selectFieldPlaceholder,
                        ]}>
                            {selectedType || '일정 종류를 선택해주세요'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={Colors.textShadow} />
                    </Pressable>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>어린이 선택</Text>
                    <Pressable style={styles.selectField} onPress={() => setSheetTarget('child')}>
                        <View style={styles.selectFieldLeft}>
                            {selectedChild ? (
                                <View style={styles.childAvatarSmall}>
                                    <Image
                                        source={require('../../assets/images/icon_child.png')}
                                        style={styles.childImageSmall}
                                        resizeMode="contain"
                                    />
                                </View>
                            ) : null}
                            <Text style={[
                                styles.selectFieldText,
                                !selectedChild && styles.selectFieldPlaceholder,
                            ]}>
                                {selectedChild?.name || '어린이를 선택해주세요'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color={Colors.textShadow} />
                    </Pressable>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>일정 이름</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ex) 병원 진료"
                        placeholderTextColor={Colors.textShadow}
                        value={scheduleTitle}
                        onChangeText={(text) => {
                            setScheduleTitle(text);
                            clearError();
                        }}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>메모</Text>
                    <TextInput
                        style={styles.memoInput}
                        placeholder="보호자가 참고할 내용을 적어주세요"
                        placeholderTextColor={Colors.textShadow}
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>세부 Todo</Text>
                    <View style={styles.todoCard}>
                        {todos.map((todo, index) => (
                            <View key={`${todo}-${index}`} style={styles.todoRow}>
                                <Ionicons name="ellipse-outline" size={16} color={Colors.textShadow} />
                                <Text style={styles.todoText}>{todo}</Text>
                                <Pressable onPress={() => deleteTodo(index)} hitSlop={8}>
                                    <Ionicons name="close" size={18} color={Colors.textShadow} />
                                </Pressable>
                            </View>
                        ))}

                        <View style={[
                            styles.todoInputRow,
                            todos.length > 0 && styles.todoInputRowDivider,
                        ]}>
                            <TextInput
                                style={styles.todoInput}
                                placeholder="ex) 진료 카드 챙기기"
                                placeholderTextColor={Colors.textShadow}
                                value={todoText}
                                onChangeText={setTodoText}
                                returnKeyType="done"
                                onSubmitEditing={addTodo}
                            />
                            <Pressable style={styles.todoAddButton} onPress={addTodo}>
                                <Ionicons name="add" size={18} color={Colors.text} />
                            </Pressable>
                        </View>
                    </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.buttonArea}>
                    <PrimaryButton label={isSaving ? '저장 중...' : '일정 저장하기'} width="100%" onPress={handleSave} />
                </View>
            </ScrollView>

            <Modal
                visible={sheetTarget !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSheetTarget(null)}
            >
                <Pressable style={styles.sheetBackdrop} onPress={() => setSheetTarget(null)}>
                    <Pressable style={styles.sheet} onPress={() => undefined}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>
                            {sheetTarget === 'type' ? '일정 종류 선택' : '어린이 선택'}
                        </Text>
                        <Text style={styles.sheetDescription}>
                            {sheetTarget === 'type'
                                ? '보호자와 공유할 일정의 종류를 골라주세요.'
                                : '이 일정을 함께 확인할 어린이를 골라주세요.'}
                        </Text>
                        {sheetOptions.map((option) => {
                            const selected = (sheetTarget === 'type' && selectedType === option.value) ||
                                (sheetTarget === 'child' && selectedChildName === option.value);

                            return (
                                <Pressable
                                    key={option.value}
                                    style={[
                                        styles.sheetOption,
                                        selected && styles.sheetOptionSelected,
                                    ]}
                                    onPress={() => {
                                        if (sheetTarget === 'type') {
                                            setSelectedType(option.value);
                                        } else {
                                            setSelectedChildName(option.value);
                                        }
                                        clearError();
                                        setSheetTarget(null);
                                    }}
                                >
                                    <View style={styles.sheetOptionLeft}>
                                        {sheetTarget === 'child' ? (
                                            <View style={styles.sheetChildAvatar}>
                                                <Image
                                                    source={require('../../assets/images/icon_child.png')}
                                                    style={styles.sheetChildImage}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                        ) : (
                                            <View style={styles.sheetTypeIcon}>
                                                <Ionicons name="calendar-outline" size={18} color={Colors.text} />
                                            </View>
                                        )}

                                        <View style={styles.sheetOptionTextArea}>
                                            <View style={styles.sheetOptionTitleRow}>
                                                <Text style={styles.sheetOptionText}>{option.value}</Text>
                                                {option.badge ? (
                                                    <Text style={styles.sheetOptionBadge}>{option.badge}</Text>
                                                ) : null}
                                            </View>
                                            <Text style={styles.sheetOptionDescription}>{option.description}</Text>
                                        </View>
                                    </View>

                                    {selected ? (
                                        <Ionicons name="checkmark-circle" size={22} color={Colors.highlight1} />
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
        backgroundColor: Colors.pageBg,
    },

    scrollView: {
        flex: 1,
        backgroundColor: Colors.pageBg,
    },

    inner: {
        flexGrow: 1,
        width: '100%',
        paddingTop: 10,
        paddingHorizontal: 32,
        paddingBottom: 120,
    },

    logoArea: {
        alignItems: 'flex-start',
        marginBottom: 24,
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
        marginBottom: 28,
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

    section: {
        width: '100%',
        marginBottom: 24,
    },

    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 12,
    },

    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        borderRadius: 16,
        backgroundColor: '#F7F4E8',
        borderWidth: 1,
        borderColor: '#E8DDC8',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },

    dateHeaderTextArea: {
        alignItems: 'center',
    },

    monthMoveButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.pageBg,
    },

    dateTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 17,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 2,
    },

    selectedDate: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textShadow,
    },

    calendarCard: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 18,
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
    },

    dayCellSelected: {
        backgroundColor: Colors.highlight1,
        borderRadius: 12,
    },

    dayCellRepeated: {
        backgroundColor: '#FFF4CF',
        borderRadius: 12,
    },

    dayText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    dayTextMuted: {
        color: '#B7AFA3',
    },

    dayTextSelected: {
        color: Colors.text,
    },

    selectField: {
        width: '100%',
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
    },

    selectFieldLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },

    selectFieldText: {
        flex: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    selectFieldPlaceholder: {
        fontFamily: Fonts.body,
        fontWeight: '400',
        color: Colors.textShadow,
    },

    childAvatarSmall: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    childImageSmall: {
        width: 22,
        height: 22,
    },

    input: {
        width: '100%',
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.text,
    },

    memoInput: {
        width: '100%',
        minHeight: 86,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 21,
        color: Colors.text,
    },

    todoCard: {
        width: '100%',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 12,
        gap: 8,
    },

    todoRow: {
        minHeight: 34,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    todoText: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.text,
    },

    todoInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    todoInputRowDivider: {
        borderTopWidth: 1,
        borderTopColor: '#E8DDC8',
        paddingTop: 10,
        marginTop: 2,
    },

    todoInput: {
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

    errorText: {
        marginTop: -8,
        marginBottom: 14,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.highlight3,
    },

    buttonArea: {
        marginTop: 4,
    },

    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(17, 17, 17, 0.25)',
        justifyContent: 'flex-end',
    },

    sheet: {
        width: '100%',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        backgroundColor: Colors.pageBg,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: 34,
    },

    sheetHandle: {
        width: 42,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#E8DDC8',
        alignSelf: 'center',
        marginBottom: 18,
    },

    sheetTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },

    sheetDescription: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.textShadow,
        marginBottom: 16,
    },

    sheetOption: {
        minHeight: 70,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 10,
    },

    sheetOptionSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF8DF',
    },

    sheetOptionLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },

    sheetTypeIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.pageBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    sheetChildAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    sheetChildImage: {
        width: 28,
        height: 28,
    },

    sheetOptionTextArea: {
        flex: 1,
    },

    sheetOptionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 4,
    },

    sheetOptionText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    sheetOptionBadge: {
        borderRadius: 999,
        backgroundColor: '#E8DDC8',
        paddingHorizontal: 8,
        paddingVertical: 2,
        fontFamily: Fonts.bodyBold,
        fontSize: 11,
        fontWeight: '900',
        color: Colors.text,
    },

    sheetOptionDescription: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 18,
        color: Colors.textShadow,
    },
});
