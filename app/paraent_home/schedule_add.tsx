import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
        description: '외출 일정과 주의사항을 함께 확인해요.',
    },
    {
        name: '최서윤',
        relation: '치료사',
        description: '치료 일정과 아이 반응 메모를 함께 확인해요.',
    },
];

type SheetTarget = 'type' | 'companion' | null;

export default function ScheduleAdd() {
    const today = useMemo(() => new Date(), []);
    const todayText = `${today.getMonth() + 1}월 ${today.getDate()}일`;
    const [selectedType, setSelectedType] = useState('');
    const [selectedCompanion, setSelectedCompanion] = useState('');
    const [scheduleTitle, setScheduleTitle] = useState('');
    const [memo, setMemo] = useState('');
    const [todos, setTodos] = useState<string[]>([]);
    const [todoText, setTodoText] = useState('');
    const [error, setError] = useState('');
    const [sheetTarget, setSheetTarget] = useState<SheetTarget>(null);

    const clearError = () => {
        if (error) setError('');
    };

    const selectOption = (target: Exclude<SheetTarget, null>, option: string) => {
        if (target === 'type') {
            setSelectedType(option);
        } else {
            setSelectedCompanion(option);
        }
        clearError();
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

    const addTodo = () => {
        const trimmedText = todoText.trim();
        if (!trimmedText) return;

        setTodos((current) => [...current, trimmedText]);
        setTodoText('');
    };

    const deleteTodo = (index: number) => {
        setTodos((current) => current.filter((_, itemIndex) => itemIndex !== index));
    };

    const handleSave = () => {
        const title = scheduleTitle.trim();

        if (!selectedType || !selectedCompanion || !title) {
            setError('일정 종류, 동행인, 일정 이름을 모두 입력해주세요.');
            return;
        }

        Keyboard.dismiss();
        router.replace({
            pathname: '/paraent_home',
            params: {
                tab: 'today',
                addedScheduleId: String(Date.now()),
                addedScheduleTitle: title,
                addedScheduleCompanion: selectedCompanion,
                addedScheduleTodos: JSON.stringify(todos),
            },
        } as any);
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
                    <Text style={styles.title}>오늘 일정을 추가해요</Text>
                    <Text style={styles.description}>오늘 함께 확인할 일정과 세부 Todo를 정리해주세요.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>날짜</Text>
                    <View style={styles.todayCard}>
                        <View style={styles.todayIcon}>
                            <Ionicons name="sunny-outline" size={20} color={Colors.text} />
                        </View>
                        <View>
                            <Text style={styles.todayTitle}>{todayText}</Text>
                            <Text style={styles.todayDescription}>오늘의 일정에 추가돼요.</Text>
                        </View>
                    </View>
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
                    <Text style={styles.sectionTitle}>동행인 선택</Text>
                    <Pressable style={styles.selectField} onPress={() => setSheetTarget('companion')}>
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
                        returnKeyType="done"
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
                            {sheetTarget === 'type' ? '일정 종류 선택' : '동행인 선택'}
                        </Text>
                        <Text style={styles.sheetDescription}>
                            {sheetTarget === 'type'
                                ? '오늘 일정의 종류를 골라주세요.'
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

    todayCard: {
        minHeight: 70,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
    },

    todayIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    todayTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 3,
    },

    todayDescription: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
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

    sheetCompanionAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    sheetCompanionImage: {
        width: 27,
        height: 27,
    },

    sheetOptionTextArea: {
        flex: 1,
    },

    sheetOptionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },

    sheetOptionText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },

    sheetOptionBadge: {
        marginLeft: 8,
        borderRadius: 10,
        backgroundColor: Colors.pageBg,
        paddingHorizontal: 7,
        paddingVertical: 2,
        fontFamily: Fonts.body,
        fontSize: 11,
        color: Colors.textShadow,
        overflow: 'hidden',
    },

    sheetOptionDescription: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 18,
        color: Colors.textShadow,
    },
});
