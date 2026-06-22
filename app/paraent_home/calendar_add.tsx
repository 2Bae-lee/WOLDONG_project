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
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

const scheduleTypes = [
    { label: '병원', description: '진료, 검사, 예방접종 일정' },
    { label: '치료', description: '언어/놀이/감각 치료 일정' },
    { label: '학교', description: '등하원, 상담, 학교 행사' },
    { label: '외출', description: '마트, 공연장, 새로운 장소 방문' },
    { label: '기타', description: '직접 정리해야 하는 일정' },
];

const companions = [
    {
        name: '박민지',
        relation: '담임 선생님',
        description: '아이 프로필과 학교 관련 일정을 함께 확인해요.',
    },
    {
        name: '이하늘',
        relation: '활동지원사',
        description: '외출 일정과 인수인계 자료를 함께 확인해요.',
    },
    {
        name: '최서윤',
        relation: '치료사',
        description: '치료 일정과 아이 반응 메모를 함께 확인해요.',
    },
];
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

type CalendarDay = {
    day: number;
    monthOffset: -1 | 0 | 1;
};

type SheetTarget = 'type' | 'companion' | null;

export default function CalendarAdd() {
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
    const [selectedCompanion, setSelectedCompanion] = useState('');
    const [scheduleTitle, setScheduleTitle] = useState('');
    const [memo, setMemo] = useState('');
    const [todos, setTodos] = useState<string[]>([]);
    const [todoText, setTodoText] = useState('');
    const [error, setError] = useState('');
    const [sheetTarget, setSheetTarget] = useState<SheetTarget>(null);
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

    const moveMonth = (monthOffset: number, nextDay?: number) => {
        const nextDate = new Date(selectedYear, selectedMonth - 1 + monthOffset, 1);
        const nextYear = nextDate.getFullYear();
        const nextMonth = nextDate.getMonth() + 1;
        const nextMonthDays = new Date(nextYear, nextMonth, 0).getDate();

        setSelectedYear(nextYear);
        setSelectedMonth(nextMonth);
        setSelectedDay(Math.min(nextDay ?? selectedDay, nextMonthDays));
        clearError();
    };

    const selectCalendarDay = (calendarDay: CalendarDay) => {
        if (calendarDay.monthOffset !== 0) {
            moveMonth(calendarDay.monthOffset, calendarDay.day);
            return;
        }

        setSelectedDay(calendarDay.day);
        clearError();
    };

    const selectOption = (target: Exclude<SheetTarget, null>, option: string) => {
        if (target === 'type') {
            setSelectedType(option);
        } else {
            setSelectedCompanion(option);
        }
        clearError();
    };

    const openOptionSheet = (target: Exclude<SheetTarget, null>) => {
        setSheetTarget(target);
    };

    const sheetOptions = sheetTarget === 'type'
        ? scheduleTypes.map((option) => ({
            value: option.label,
            description: option.description,
            badge: '',
        }))
        : companions.map((option) => ({
            value: option.name,
            description: option.description,
            badge: option.relation,
        }));

    const handleSave = () => {
        if (!selectedType || !selectedCompanion || !scheduleTitle.trim()) {
            setError('날짜, 일정 종류, 동행인, 일정 이름을 모두 입력해주세요.');
            return;
        }

        Keyboard.dismiss();
        router.replace({
            pathname: '/paraent_home',
            params: {
                tab: 'calendar',
                addedEventId: String(Date.now()),
                addedEventYear: String(selectedYear),
                addedEventMonth: String(selectedMonth),
                addedEventDay: String(selectedDay),
                addedEventTitle: scheduleTitle.trim(),
                addedEventCompanion: selectedCompanion,
                addedEventTodos: JSON.stringify(todos),
            },
        } as any);
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
                <Text style={styles.description}>동행인과 함께 확인할 일정을 정리해주세요.</Text>
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

                            return (
                                <Pressable
                                    key={`${calendarDay.monthOffset}-${calendarDay.day}-${index}`}
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
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>일정 종류</Text>
                <Pressable style={styles.selectField} onPress={() => openOptionSheet('type')}>
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
                <Text style={styles.sectionTitle}>동행인 선택</Text>
                <Pressable style={styles.selectField} onPress={() => openOptionSheet('companion')}>
                    <View style={styles.selectFieldLeft}>
                        {selectedCompanion ? (
                            <View style={styles.companionAvatarSmall}>
                                <Image
                                    source={require('../../assets/images/icon_companion.png')}
                                    style={styles.companionImageSmall}
                                    resizeMode="contain"
                                />
                            </View>
                        ) : null}
                        <Text style={[
                            styles.selectFieldText,
                            !selectedCompanion && styles.selectFieldPlaceholder,
                        ]}>
                            {selectedCompanion || '동행인을 선택해주세요'}
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
                    placeholder="동행인이 참고할 내용을 적어주세요"
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

                    <View style={styles.todoInputRow}>
                        <TextInput
                            style={styles.todoInput}
                            placeholder="ex) 병원 접수하기"
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
                <PrimaryButton label="일정 저장하기" width="100%" onPress={handleSave} />
            </View>

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
                            {sheetTarget === 'type' ? '일정 종류 선택' : '동행인 선택'}
                        </Text>
                        <Text style={styles.sheetDescription}>
                            {sheetTarget === 'type'
                                ? '동행인과 공유할 일정의 종류를 골라주세요.'
                                : '이 일정을 함께 확인할 동행인을 골라주세요.'}
                        </Text>
                        {sheetOptions.map((option) => {
                            const selected = (sheetTarget === 'type' && selectedType === option.value) ||
                                (sheetTarget === 'companion' && selectedCompanion === option.value);

                            return (
                                <Pressable
                                    key={option.value}
                                    style={[
                                        styles.sheetOption,
                                        selected && styles.sheetOptionSelected,
                                    ]}
                                    onPress={() => {
                                        if (sheetTarget) {
                                            selectOption(sheetTarget, option.value);
                                        }
                                        setSheetTarget(null);
                                    }}
                                >
                                    <View style={styles.sheetOptionLeft}>
                                        {sheetTarget === 'companion' ? (
                                            <View style={styles.sheetCompanionAvatar}>
                                                <Image
                                                    source={require('../../assets/images/icon_companion.png')}
                                                    style={styles.sheetCompanionImage}
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
        </ScrollView>
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

    companionAvatarSmall: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    companionImageSmall: {
        width: 21,
        height: 21,
    },

    optionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    optionButton: {
        minWidth: 84,
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },

    optionButtonSelected: {
        backgroundColor: Colors.highlight1,
        borderColor: Colors.highlight1,
    },

    optionText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },

    optionTextSelected: {
        color: Colors.text,
    },

    companionList: {
        gap: 10,
    },

    companionButton: {
        width: '100%',
        minHeight: 58,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },

    companionButtonSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF4CF',
    },

    companionAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    companionImage: {
        width: 27,
        height: 27,
    },

    companionName: {
        flex: 1,
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
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
        fontSize: 14,
        color: Colors.text,
    },

    memoInput: {
        width: '100%',
        minHeight: 104,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 14,
        fontFamily: Fonts.body,
        fontSize: 14,
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
        gap: 10,
    },

    todoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 28,
    },

    todoText: {
        flex: 1,
        marginLeft: 8,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
    },

    todoInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E8DDC8',
        paddingTop: 10,
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
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.highlight3,
        marginBottom: 14,
    },

    buttonArea: {
        width: '100%',
        marginTop: 'auto',
    },

    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(17, 17, 17, 0.28)',
        justifyContent: 'flex-end',
    },

    sheet: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: Colors.pageBg,
        paddingHorizontal: 26,
        paddingTop: 14,
        paddingBottom: 38,
        minHeight: 380,
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
        textAlign: 'center',
        marginBottom: 8,
    },

    sheetDescription: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textShadow,
        textAlign: 'center',
        marginBottom: 20,
    },

    sheetOption: {
        width: '100%',
        minHeight: 62,
        borderRadius: 16,
        backgroundColor: '#F7F4E8',
        borderWidth: 1,
        borderColor: '#E8DDC8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        marginBottom: 10,
    },

    sheetOptionSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF4CF',
    },

    sheetOptionLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },

    sheetTypeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.pageBg2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    sheetCompanionAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    sheetCompanionImage: {
        width: 25,
        height: 25,
    },

    sheetOptionText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },

    sheetOptionTextArea: {
        flex: 1,
    },

    sheetOptionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },

    sheetOptionBadge: {
        borderRadius: 11,
        backgroundColor: Colors.pageBg2,
        paddingHorizontal: 8,
        paddingVertical: 3,
        fontFamily: Fonts.bodyBold,
        fontSize: 11,
        fontWeight: '900',
        color: Colors.text,
        overflow: 'hidden',
    },

    sheetOptionDescription: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.textShadow,
    },
});
