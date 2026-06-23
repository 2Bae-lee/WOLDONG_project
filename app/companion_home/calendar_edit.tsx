import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
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
import { deleteSchedule, updateSchedule } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

type EditTodo = {
    id: number;
    text: string;
    done: boolean;
};

const parseTodos = (value?: string): EditTodo[] => {
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter((item) => (
                typeof item?.id === 'number' &&
                typeof item?.text === 'string' &&
                typeof item?.done === 'boolean'
            ))
            .map((item) => ({
                id: item.id,
                text: item.text,
                done: item.done,
            }));
    } catch {
        return [];
    }
};

export default function CompanionCalendarEdit() {
    const params = useLocalSearchParams<{
        eventId?: string;
        scheduleId?: string;
        year?: string;
        month?: string;
        day?: string;
        childName?: string;
        guardian?: string;
        title?: string;
        todos?: string;
    }>();
    const eventId = Number(params.eventId);
    const scheduleId = params.scheduleId || '';
    const year = params.year || '';
    const month = params.month || '';
    const day = params.day || '';
    const childName = params.childName || '김월동';
    const guardian = params.guardian || '김보호자';
    const [title, setTitle] = useState(params.title || '');
    const [todos, setTodos] = useState<EditTodo[]>(() => parseTodos(params.todos));
    const [todoText, setTodoText] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const goBackToCalendar = (extraParams: Record<string, string>) => {
        router.replace({
            pathname: '/companion_home',
            params: {
                tab: 'calendar',
                ...extraParams,
            },
        } as any);
    };

    const toggleTodo = (id: number) => {
        setTodos((current) => current.map((todo) => (
            todo.id === id ? { ...todo, done: !todo.done } : todo
        )));
    };

    const deleteTodo = (id: number) => {
        setTodos((current) => current.filter((todo) => todo.id !== id));
    };

    const addTodo = () => {
        const trimmedText = todoText.trim();
        if (!trimmedText) return;

        setTodos((current) => [
            ...current,
            { id: Date.now(), text: trimmedText, done: false },
        ]);
        setTodoText('');
    };

    const saveEdit = async () => {
        if (saving || deleting) return;

        const trimmedTitle = title.trim();

        if (!trimmedTitle || Number.isNaN(eventId)) {
            setError('일정 이름을 입력해주세요.');
            return;
        }

        Keyboard.dismiss();
        setSaving(true);
        setError('');

        try {
            if (scheduleId) {
                await updateSchedule(scheduleId, {
                    title: trimmedTitle,
                    checklist: todos.map((todo) => todo.text),
                });
            }

            goBackToCalendar({
                updatedEventId: String(eventId),
                updatedEventTitle: trimmedTitle,
                updatedEventTodos: JSON.stringify(todos),
            });
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : '일정을 수정하지 못했어요.');
        } finally {
            setSaving(false);
        }
    };

    const deleteEvent = async () => {
        if (saving || deleting || Number.isNaN(eventId)) return;

        Keyboard.dismiss();
        setDeleting(true);
        setError('');

        try {
            if (scheduleId) {
                await deleteSchedule(scheduleId);
            }

            goBackToCalendar({
                deletedEventId: String(eventId),
            });
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : '일정을 삭제하지 못했어요.');
        } finally {
            setDeleting(false);
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
                    <Text style={styles.title}>일정 수정하기</Text>
                    <Text style={styles.description}>
                        {month}월 {day}일 공유 일정과 세부 Todo를 수정해요.
                    </Text>
                </View>

                <View style={styles.childCard}>
                    <View style={styles.childIcon}>
                        <Image
                            source={require('../../assets/images/icon_child.png')}
                            style={styles.childImage}
                            resizeMode="contain"
                        />
                    </View>
                    <View style={styles.childTextArea}>
                        <Text style={styles.childName}>{childName}</Text>
                        <Text style={styles.childMeta}>
                            {guardian} 보호자와 공유 중 · {year}년 {month}월 {day}일
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>일정 이름</Text>
                    <TextInput
                        style={[styles.input, error ? styles.inputError : null]}
                        value={title}
                        onChangeText={(text) => {
                            setTitle(text);
                            if (error) setError('');
                        }}
                        placeholder="ex) 병원 진료"
                        placeholderTextColor={Colors.textShadow}
                        returnKeyType="done"
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>세부 Todo</Text>
                    <View style={styles.todoCard}>
                        {todos.map((todo) => (
                            <View key={todo.id} style={styles.todoRow}>
                                <Pressable
                                    style={[
                                        styles.todoCheck,
                                        todo.done && styles.todoCheckDone,
                                    ]}
                                    onPress={() => toggleTodo(todo.id)}
                                >
                                    {todo.done ? (
                                        <Ionicons name="checkmark" size={14} color={Colors.realwhite} />
                                    ) : null}
                                </Pressable>
                                <Text style={[styles.todoText, todo.done && styles.todoTextDone]}>
                                    {todo.text}
                                </Text>
                                <Pressable
                                    style={styles.todoDeleteButton}
                                    onPress={() => deleteTodo(todo.id)}
                                >
                                    <Ionicons name="close" size={18} color={Colors.textShadow} />
                                </Pressable>
                            </View>
                        ))}

                        <View style={styles.todoAddRow}>
                            <TextInput
                                style={styles.todoAddInput}
                                placeholder="세부 할 일을 입력해주세요"
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

                <View style={styles.buttonRow}>
                    <Pressable style={styles.deleteButton} onPress={deleteEvent}>
                        <Text style={styles.deleteButtonText}>{deleting ? '삭제 중...' : '삭제'}</Text>
                    </Pressable>
                    <View style={styles.saveButtonArea}>
                        <PrimaryButton label={saving ? '저장 중...' : '저장'} width="100%" onPress={saveEdit} />
                    </View>
                </View>
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
        paddingBottom: 64,
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
        marginBottom: 20,
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

    childCard: {
        minHeight: 72,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 22,
    },

    childIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FFF8DF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    childImage: {
        width: 30,
        height: 30,
    },

    childTextArea: {
        flex: 1,
    },

    childName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
    },

    childMeta: {
        fontFamily: Fonts.body,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textShadow,
    },

    section: {
        width: '100%',
        marginBottom: 22,
    },

    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },

    input: {
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
    },

    inputError: {
        borderColor: Colors.highlight3,
    },

    errorText: {
        marginTop: 8,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.highlight3,
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
    },

    todoCheck: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: Colors.pageBg3,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    todoCheckDone: {
        backgroundColor: Colors.highlight1,
    },

    todoText: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.text,
    },

    todoTextDone: {
        color: '#A9A196',
    },

    todoDeleteButton: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
    },

    todoAddRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E8DDC8',
        paddingTop: 10,
        marginTop: 2,
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

    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },

    deleteButton: {
        width: 84,
        height: 52,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    deleteButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.highlight3,
    },

    saveButtonArea: {
        flex: 1,
    },
});
