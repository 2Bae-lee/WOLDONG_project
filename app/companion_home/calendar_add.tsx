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
import RepeatSelector from '../../components/RepeatSelector';
import { createSchedule } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import {
    RepeatDate,
    RepeatOption,
    getDateKey,
    getRepeatDates,
    toggleRepeatDate,
} from '../../constants/Recurrence';
import {
    SCHEDULE_FEATURE_CROWD,
    SCHEDULE_FEATURE_WAIT,
    getScheduleFeatureLabels,
    getUniqueScheduleFeatures,
    scheduleFeatureGroups,
    scheduleFeatureLabelMap,
    scheduleFeatureTemplates,
    scheduleTypeFeatureMap,
    transportFeatureMap,
} from '../../constants/ScheduleFeatures';
import { formatScheduleTimeInput, normalizeScheduleTimeInput } from '../../constants/ScheduleTimeInput';

const scheduleTypes = [
    { label: '병원', description: '진료, 검사, 예방접종 일정' },
    { label: '치료', description: '언어/놀이/감각 치료 일정' },
    { label: '학교', description: '등하원, 상담, 학교 행사' },
    { label: '외출', description: '마트, 공연장, 새로운 장소 방문' },
    { label: '기타', description: '직접 정리해야 하는 일정' },
];

const transportTypes = ['버스', '지하철', '택시', '도보', '자가용'];
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

type CalendarDay = {
    day: number;
    monthOffset: -1 | 0 | 1;
};

export default function CompanionCalendarAdd() {
    const params = useLocalSearchParams<{
        childId?: string;
        childName?: string;
        guardian?: string;
        year?: string;
        month?: string;
        day?: string;
    }>();
    const today = useMemo(() => new Date(), []);
    const childId = params.childId || '';
    const childName = params.childName || '김월동';
    const guardian = params.guardian || '김보호자';
    const initialYear = Number(params.year) || today.getFullYear();
    const initialMonth = Number(params.month) || today.getMonth() + 1;
    const initialDay = Number(params.day) || today.getDate();
    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [selectedMonth, setSelectedMonth] = useState(initialMonth);
    const [selectedDay, setSelectedDay] = useState(initialDay);
    const [selectedType, setSelectedType] = useState('');
    const [selectedTransport, setSelectedTransport] = useState('');
    const [startTime, setStartTime] = useState('00:00');
    const [scheduleTitle, setScheduleTitle] = useState('');
    const [memo, setMemo] = useState('');
    const [todos, setTodos] = useState<string[]>([]);
    const [todoText, setTodoText] = useState('');
    const [preparations, setPreparations] = useState<string[]>([]);
    const [preparationText, setPreparationText] = useState('');
    const [selectedFeatureValues, setSelectedFeatureValues] = useState<string[]>([]);
    const [excludedFeatureValues, setExcludedFeatureValues] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isTypeSheetOpen, setIsTypeSheetOpen] = useState(false);
    const [repeatOption, setRepeatOption] = useState<RepeatOption>('none');
    const [customRepeatDates, setCustomRepeatDates] = useState<RepeatDate[]>([]);
    const selectedDate = { year: selectedYear, month: selectedMonth, day: selectedDay };
    const repeatDates = getRepeatDates(repeatOption, selectedDate, customRepeatDates);
    const repeatDateKeys = new Set(repeatDates.map(getDateKey));
    const baseScheduleFeatureValues = useMemo(() => getUniqueScheduleFeatures(
        scheduleTypeFeatureMap[selectedType] ?? [],
        transportFeatureMap[selectedTransport] ?? [],
    ), [selectedTransport, selectedType]);
    const selectedScheduleFeatureValues = useMemo(() => getUniqueScheduleFeatures(
        baseScheduleFeatureValues.filter((value) => !excludedFeatureValues.includes(value)),
        selectedFeatureValues,
    ), [baseScheduleFeatureValues, excludedFeatureValues, selectedFeatureValues]);
    const selectedScheduleFeatureLabels = getScheduleFeatureLabels(selectedScheduleFeatureValues);
    const waitPossible = selectedScheduleFeatureValues.includes(SCHEDULE_FEATURE_WAIT);
    const crowdPossible = selectedScheduleFeatureValues.includes(SCHEDULE_FEATURE_CROWD);
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

    const addPreparation = () => {
        const trimmedText = preparationText.trim();
        if (!trimmedText) return;

        setPreparations((current) => [...current, trimmedText]);
        setPreparationText('');
    };

    const deletePreparation = (index: number) => {
        setPreparations((current) => current.filter((_, itemIndex) => itemIndex !== index));
    };

    const toggleScheduleFeature = (featureValue: string) => {
        if (baseScheduleFeatureValues.includes(featureValue)) {
            setSelectedFeatureValues((current) => current.filter((value) => value !== featureValue));
            setExcludedFeatureValues((current) => (
                current.includes(featureValue)
                    ? current.filter((value) => value !== featureValue)
                    : [...current, featureValue]
            ));
            return;
        }

        setSelectedFeatureValues((current) => (
            current.includes(featureValue)
                ? current.filter((value) => value !== featureValue)
                : [...current, featureValue]
        ));
    };

    const toggleFeatureTemplate = (featureValues: string[]) => {
        setSelectedFeatureValues((current) => {
            const templateValueSet = new Set(featureValues);
            const allSelected = featureValues.every((value) => selectedScheduleFeatureValues.includes(value));

            if (allSelected) {
                setExcludedFeatureValues((excluded) => getUniqueScheduleFeatures(
                    excluded,
                    featureValues.filter((value) => baseScheduleFeatureValues.includes(value)),
                ));
                return current.filter((value) => !templateValueSet.has(value));
            }

            setExcludedFeatureValues((excluded) => (
                excluded.filter((value) => !templateValueSet.has(value))
            ));
            return getUniqueScheduleFeatures(current, featureValues);
        });
    };

    const formatDate = (date: RepeatDate) => (
        `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
    );

    const handleSave = async () => {
        if (isSaving) return;

        const title = scheduleTitle.trim();

        if (!childId) {
            setError('담당 어린이 정보를 불러오지 못했어요.');
            return;
        }

        if (!selectedType || !selectedTransport || !title) {
            setError('날짜, 일정 종류, 이동수단, 일정 이름을 입력해주세요.');
            return;
        }

        const normalizedStartTime = normalizeScheduleTimeInput(startTime);

        if (!/^\d{2}:\d{2}$/.test(normalizedStartTime)) {
            setError('출발 시간은 00:00처럼 HH:MM 형식으로 입력해주세요.');
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
                child_id: childId,
                title,
                date: formatDate(date),
                start_time: normalizedStartTime,
                place_type: selectedType,
                transport_type: selectedTransport,
                activities: getUniqueScheduleFeatures(
                    [selectedType],
                    selectedScheduleFeatureValues
                        .filter((value) => value.startsWith('일정_활동_'))
                        .map((value) => scheduleFeatureLabelMap[value] ?? value),
                ),
                wait_possible: waitPossible,
                crowd_possible: crowdPossible,
                schedule_features: selectedScheduleFeatureValues,
                preparations,
                checklist: todos,
            })));
            const firstResponse = responses[0];

            if (!firstResponse?.data?.schedule_id) {
                setError('일정 저장 결과를 확인하지 못했어요.');
                return;
            }

            const firstDate = repeatDates[0] ?? selectedDate;

            router.replace({
                pathname: '/companion_home/child_home',
                params: {
                    childId,
                    childName,
                    guardian,
                    scheduleId: firstResponse.data.schedule_id,
                    tab: 'calendar',
                    addedEventId: String(Date.now()),
                    addedEventYear: String(firstDate.year),
                    addedEventMonth: String(firstDate.month),
                    addedEventDay: String(firstDate.day),
                    addedEventTitle: title,
                    addedEventGuardian: guardian,
                    addedEventTodos: JSON.stringify(todos),
                    addedEventDates: JSON.stringify(repeatDates),
                    addedEventFeatures: JSON.stringify(selectedScheduleFeatureValues),
                },
            } as any);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : '일정을 저장하지 못했어요.');
        } finally {
            setIsSaving(false);
        }
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
                    <Text style={styles.title}>공유 일정을 추가해요</Text>
                    <Text style={styles.description}>{childName} 어린이의 일정과 세부 Todo를 보호자와 함께 확인해요.</Text>
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
                                const muted = calendarDay.monthOffset !== 0;
                                const repeated = calendarDay.monthOffset === 0 && repeatDateKeys.has(getDateKey({
                                    year: selectedYear,
                                    month: selectedMonth,
                                    day: calendarDay.day,
                                }));
                                const selected = calendarDay.monthOffset === 0 && (
                                    repeatOption === 'custom'
                                        ? repeated
                                        : calendarDay.day === selectedDay
                                );
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
                    <Pressable style={styles.selectField} onPress={() => setIsTypeSheetOpen(true)}>
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
                    <Text style={styles.sectionTitle}>공유 대상</Text>
                    <View style={styles.guardianCard}>
                        <View style={styles.guardianIcon}>
                            <Ionicons name="people-outline" size={19} color={Colors.text} />
                        </View>
                        <View style={styles.guardianTextArea}>
                            <Text style={styles.guardianName}>{guardian} 보호자</Text>
                            <Text style={styles.guardianDescription}>저장하면 보호자 홈 캘린더에도 함께 공유돼요.</Text>
                        </View>
                    </View>
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
                        returnKeyType="done"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>출발 시간</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="00:00"
                        placeholderTextColor={Colors.textShadow}
                        value={startTime}
                        onChangeText={(text) => {
                            setStartTime(formatScheduleTimeInput(text));
                            clearError();
                        }}
                        onBlur={() => setStartTime(normalizeScheduleTimeInput(startTime))}
                        keyboardType="number-pad"
                        maxLength={5}
                        selectTextOnFocus
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>이동수단</Text>
                    <View style={styles.optionGrid}>
                        {transportTypes.map((transport) => {
                            const selected = selectedTransport === transport;

                            return (
                                <Pressable
                                    key={transport}
                                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                                    onPress={() => {
                                        setSelectedTransport(transport);
                                        clearError();
                                    }}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        selected && styles.optionTextSelected,
                                    ]}>
                                        {transport}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
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
                    <Text style={styles.sectionTitle}>일정 특성</Text>
                    <View style={styles.templateGrid}>
                        {scheduleFeatureTemplates.map((template) => {
                            const selected = template.values.every((value) => (
                                selectedScheduleFeatureValues.includes(value)
                            ));

                            return (
                                <Pressable
                                    key={template.title}
                                    style={[styles.templateButton, selected && styles.templateButtonSelected]}
                                    onPress={() => toggleFeatureTemplate(template.values)}
                                >
                                    <View style={styles.templateTitleRow}>
                                        <Ionicons
                                            name={selected ? 'checkmark-circle' : 'albums-outline'}
                                            size={18}
                                            color={selected ? Colors.highlight1 : Colors.textShadow}
                                        />
                                        <Text style={styles.templateTitle}>{template.title}</Text>
                                    </View>
                                    <Text style={styles.templateDescription}>{template.description}</Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.featurePanel}>
                        {scheduleFeatureGroups.map((group) => (
                            <View key={group.title} style={styles.featureGroup}>
                                <Text style={styles.featureGroupTitle}>{group.title}</Text>
                                <View style={styles.featureChipRow}>
                                    {group.items.map((feature) => {
                                        const selected = selectedScheduleFeatureValues.includes(feature.value);

                                        return (
                                            <Pressable
                                                key={feature.value}
                                                style={[
                                                    styles.featureChip,
                                                    selected && styles.featureChipSelected,
                                                ]}
                                                onPress={() => toggleScheduleFeature(feature.value)}
                                            >
                                                <Ionicons
                                                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                                                    size={15}
                                                    color={selected ? Colors.highlight1 : Colors.textShadow}
                                                />
                                                <Text style={styles.featureChipText}>{feature.label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </View>

                    {selectedScheduleFeatureLabels.length ? (
                        <View style={styles.selectedFeatureBox}>
                            {selectedScheduleFeatureLabels.slice(0, 8).map((label) => (
                                <Text key={label} style={styles.selectedFeatureText}>{label}</Text>
                            ))}
                            {selectedScheduleFeatureLabels.length > 8 ? (
                                <Text style={styles.selectedFeatureText}>
                                    + {selectedScheduleFeatureLabels.length - 8}개
                                </Text>
                            ) : null}
                        </View>
                    ) : null}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>외출 환경</Text>
                    <View style={styles.toggleRow}>
                        <Pressable
                            style={[styles.toggleButton, waitPossible && styles.toggleButtonSelected]}
                            onPress={() => toggleScheduleFeature(SCHEDULE_FEATURE_WAIT)}
                        >
                            <Ionicons
                                name={waitPossible ? 'checkmark-circle' : 'ellipse-outline'}
                                size={18}
                                color={waitPossible ? Colors.highlight1 : Colors.textShadow}
                            />
                            <Text style={styles.toggleText}>대기 가능성</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.toggleButton, crowdPossible && styles.toggleButtonSelected]}
                            onPress={() => toggleScheduleFeature(SCHEDULE_FEATURE_CROWD)}
                        >
                            <Ionicons
                                name={crowdPossible ? 'checkmark-circle' : 'ellipse-outline'}
                                size={18}
                                color={crowdPossible ? Colors.highlight1 : Colors.textShadow}
                            />
                            <Text style={styles.toggleText}>혼잡 가능성</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>필수 준비물</Text>
                    <View style={styles.todoCard}>
                        {preparations.map((item, index) => (
                            <View key={`${item}-${index}`} style={styles.todoRow}>
                                <Ionicons name="checkmark-circle" size={16} color={Colors.highlight1} />
                                <Text style={styles.todoText}>{item}</Text>
                                <Pressable onPress={() => deletePreparation(index)} hitSlop={8}>
                                    <Ionicons name="close" size={18} color={Colors.textShadow} />
                                </Pressable>
                            </View>
                        ))}

                        <View style={[
                            styles.todoInputRow,
                            preparations.length > 0 && styles.todoInputRowDivider,
                        ]}>
                            <TextInput
                                style={styles.todoInput}
                                placeholder="ex) 이어폰, 선글라스"
                                placeholderTextColor={Colors.textShadow}
                                value={preparationText}
                                onChangeText={setPreparationText}
                                returnKeyType="done"
                                onSubmitEditing={addPreparation}
                            />
                            <Pressable style={styles.todoAddButton} onPress={addPreparation}>
                                <Ionicons name="add" size={18} color={Colors.text} />
                            </Pressable>
                        </View>
                    </View>
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
                visible={isTypeSheetOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsTypeSheetOpen(false)}
            >
                <Pressable style={styles.sheetBackdrop} onPress={() => setIsTypeSheetOpen(false)}>
                    <Pressable style={styles.sheet} onPress={() => undefined}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>일정 종류 선택</Text>
                        <Text style={styles.sheetDescription}>보호자와 공유할 일정의 종류를 골라주세요.</Text>
                        {scheduleTypes.map((option) => {
                            const selected = selectedType === option.label;

                            return (
                                <Pressable
                                    key={option.label}
                                    style={[
                                        styles.sheetOption,
                                        selected && styles.sheetOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedType(option.label);
                                        clearError();
                                        setIsTypeSheetOpen(false);
                                    }}
                                >
                                    <View style={styles.sheetTypeIcon}>
                                        <Ionicons name="calendar-outline" size={18} color={Colors.text} />
                                    </View>
                                    <View style={styles.sheetOptionTextArea}>
                                        <Text style={styles.sheetOptionText}>{option.label}</Text>
                                        <Text style={styles.sheetOptionDescription}>{option.description}</Text>
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

    templateGrid: {
        gap: 10,
        marginBottom: 12,
    },

    templateButton: {
        width: '100%',
        minHeight: 70,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },

    templateButtonSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF4CF',
    },

    templateTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 5,
    },

    templateTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    templateDescription: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 18,
        color: Colors.textShadow,
    },

    featurePanel: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 12,
        gap: 13,
    },

    featureGroup: {
        gap: 8,
    },

    featureGroupTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.textShadow,
    },

    featureChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    featureChip: {
        minHeight: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: Colors.pageBg,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 11,
        gap: 5,
    },

    featureChipSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF8DF',
    },

    featureChipText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.text,
    },

    selectedFeatureBox: {
        marginTop: 10,
        borderRadius: 14,
        backgroundColor: '#FFF8DF',
        padding: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },

    selectedFeatureText: {
        borderRadius: 12,
        backgroundColor: Colors.pageBg,
        paddingHorizontal: 9,
        paddingVertical: 5,
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.text,
        overflow: 'hidden',
    },

    toggleRow: {
        flexDirection: 'row',
        gap: 10,
    },

    toggleButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        gap: 6,
    },

    toggleButtonSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF4CF',
    },

    toggleText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },

    guardianCard: {
        minHeight: 76,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },

    guardianIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    guardianTextArea: {
        flex: 1,
    },

    guardianName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
    },

    guardianDescription: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 18,
        color: Colors.textShadow,
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
        minHeight: 118,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
    },

    todoCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 12,
        gap: 10,
    },

    todoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 30,
    },

    todoText: {
        flex: 1,
        marginLeft: 8,
        marginRight: 8,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
    },

    todoInputRow: {
        minHeight: 42,
        borderRadius: 12,
        backgroundColor: Colors.pageBg,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 6,
    },

    todoInputRowDivider: {
        borderTopWidth: 1,
        borderTopColor: '#E8DDC8',
        paddingTop: 10,
    },

    todoInput: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
        paddingVertical: 8,
    },

    todoAddButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    errorText: {
        marginTop: -6,
        marginBottom: 14,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: '#D85C46',
    },

    buttonArea: {
        width: '100%',
        marginTop: 2,
    },

    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.18)',
        justifyContent: 'flex-end',
    },

    sheet: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: Colors.pageBg,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 34,
    },

    sheetHandle: {
        alignSelf: 'center',
        width: 44,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D8CFBE',
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
        minHeight: 72,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 10,
    },

    sheetOptionSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF4CF',
    },

    sheetTypeIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    sheetOptionTextArea: {
        flex: 1,
    },

    sheetOptionText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
    },

    sheetOptionDescription: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 18,
        color: Colors.textShadow,
    },
});
