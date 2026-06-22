import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
    Image,
    Keyboard,
    Modal,
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

type ScheduleItem = {
    id: number;
    text: string;
    done: boolean;
};

type HandoffItem = {
    id: number;
    text: string;
};

type EditTarget =
    | { type: 'schedule'; item: ScheduleItem }
    | { type: 'handoff'; item: HandoffItem }
    | null;

const initialSchedules: ScheduleItem[] = [
    { id: 1, text: '병원 갈 준비', done: false },
    { id: 2, text: '병원으로 이동', done: true },
    { id: 3, text: '진료 보기', done: true },
    { id: 4, text: '주사 맞기', done: true },
];

const initialHandoffs: HandoffItem[] = [
    { id: 1, text: '병원에 가기 전 아이가 긴장할 수 있어요.' },
    { id: 2, text: '진료실에 들어가기 전 짧게 예고해주세요.' },
    { id: 3, text: '대기 시간이 길면 조용한 곳에서 쉬면 좋아요.' },
];

function getTodayTitle() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();

    return `${month}월 ${date}일 오늘의 일정`;
}

export default function ParentHome() {
    const todayTitle = useMemo(() => getTodayTitle(), []);
    const scrollViewRef = useRef<ScrollView>(null);
    const [schedules, setSchedules] = useState(initialSchedules);
    const [handoffs, setHandoffs] = useState(initialHandoffs);
    const [isScheduleInputOpen, setIsScheduleInputOpen] = useState(false);
    const [isHandoffInputOpen, setIsHandoffInputOpen] = useState(false);
    const [scheduleText, setScheduleText] = useState('');
    const [handoffText, setHandoffText] = useState('');
    const [editTarget, setEditTarget] = useState<EditTarget>(null);
    const [editText, setEditText] = useState('');

    const cancelAddInputs = () => {
        if (!isScheduleInputOpen && !isHandoffInputOpen) return;

        setIsScheduleInputOpen(false);
        setIsHandoffInputOpen(false);
        setScheduleText('');
        setHandoffText('');
        Keyboard.dismiss();
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 80);
    };

    const toggleSchedule = (id: number) => {
        setSchedules((current) => current.map((item) => (
            item.id === id ? { ...item, done: !item.done } : item
        )));
    };

    const addSchedule = () => {
        const trimmedText = scheduleText.trim();
        if (!trimmedText) return;

        setSchedules((current) => [
            ...current,
            { id: Date.now(), text: trimmedText, done: false },
        ]);
        setScheduleText('');
        setIsScheduleInputOpen(false);
        Keyboard.dismiss();
    };

    const openScheduleEditor = (item: ScheduleItem) => {
        cancelAddInputs();
        setEditTarget({ type: 'schedule', item });
        setEditText(item.text);
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

    const closeEditor = () => {
        setEditTarget(null);
        setEditText('');
        Keyboard.dismiss();
    };

    const saveEdit = () => {
        const trimmedText = editText.trim();
        if (!trimmedText || !editTarget) return;

        if (editTarget.type === 'schedule') {
            setSchedules((current) => current.map((item) => (
                item.id === editTarget.item.id ? { ...item, text: trimmedText } : item
            )));
        } else {
            setHandoffs((current) => current.map((item) => (
                item.id === editTarget.item.id ? { ...item, text: trimmedText } : item
            )));
        }

        closeEditor();
    };

    const deleteEdit = () => {
        if (!editTarget) return;

        if (editTarget.type === 'schedule') {
            setSchedules((current) => current.filter((item) => item.id !== editTarget.item.id));
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
                        <Pressable style={styles.iconButton}>
                            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
                            <View style={styles.notificationDot} />
                        </Pressable>
                        <Pressable
                            style={styles.iconButton}
                            onPress={() => router.push('/paraent_home/companions' as any)}
                        >
                            <Ionicons name="add" size={25} color={Colors.text} />
                        </Pressable>
                        <Pressable style={styles.profileButton} onPress={() => router.push('/paraent_home/child_profile' as any)}>
                            <Image
                                source={require('../../assets/images/icon_child.png')}
                                style={styles.profileImage}
                                resizeMode="contain"
                            />
                        </Pressable>
                    </View>
                </Pressable>

                <View style={styles.section}>
                    <Pressable onPress={cancelAddInputs}>
                        <Text style={styles.sectionTitle}>{todayTitle}</Text>
                    </Pressable>

                    <View style={styles.scheduleCard}>
                        {schedules.map((item) => (
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
                                    <Text style={[
                                        styles.scheduleText,
                                        item.done && styles.scheduleTextDone,
                                    ]}>
                                        {item.text}
                                    </Text>
                                </Pressable>
                            </View>
                        ))}
                    </View>

                    {isScheduleInputOpen ? (
                        <View style={styles.inlineInputRow}>
                            <TextInput
                                style={styles.inlineInput}
                                placeholder="추가할 일정을 입력해주세요"
                                placeholderTextColor={Colors.textShadow}
                                value={scheduleText}
                                onChangeText={setScheduleText}
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={addSchedule}
                            />
                            <Pressable style={styles.inlineAddButton} onPress={addSchedule}>
                                <Ionicons name="checkmark" size={18} color={Colors.text} />
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable
                            style={styles.addButton}
                            onPress={() => {
                                setIsHandoffInputOpen(false);
                                setHandoffText('');
                                setIsScheduleInputOpen(true);
                                scrollToBottom();
                            }}
                        >
                            <View style={styles.addIconCircle}>
                                <Ionicons name="add" size={18} color={Colors.realwhite} />
                            </View>
                            <Text style={styles.addButtonText}>일정 추가하기</Text>
                        </Pressable>
                    )}
                </View>

                <View style={styles.section}>
                    <Pressable onPress={cancelAddInputs}>
                        <Text style={styles.sectionTitle}>아이 인수인계 자료</Text>
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
                                onFocus={scrollToBottom}
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
                                scrollToBottom();
                            }}
                        >
                            <View style={styles.addIconCircle}>
                                <Ionicons name="add" size={18} color={Colors.realwhite} />
                            </View>
                            <Text style={styles.addButtonText}>자료 추가하기</Text>
                        </Pressable>
                    )}
                </View>
            </ScrollView>

            <Modal
                visible={Boolean(editTarget)}
                transparent
                animationType="fade"
                onRequestClose={closeEditor}
            >
                <Pressable style={styles.modalBackdrop} onPress={closeEditor}>
                    <Pressable style={styles.editModal} onPress={() => undefined}>
                        <Text style={styles.modalTitle}>
                            {editTarget?.type === 'schedule' ? '일정 수정하기' : '인수인계 자료 수정하기'}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editText}
                            onChangeText={setEditText}
                            placeholder="내용을 입력해주세요"
                            placeholderTextColor={Colors.textShadow}
                            multiline={editTarget?.type === 'handoff'}
                            textAlignVertical="top"
                            autoFocus
                        />

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
        paddingBottom: 46,
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

    section: {
        width: '100%',
        marginBottom: 36,
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

    scheduleRow: {
        minHeight: 28,
        flexDirection: 'row',
        alignItems: 'center',
    },

    checkBox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: '#F0EED8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    checkBoxDone: {
        backgroundColor: Colors.highlight1,
    },

    scheduleText: {
        flex: 1,
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
        minHeight: 28,
        justifyContent: 'center',
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

    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(17, 17, 17, 0.28)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },

    editModal: {
        width: '100%',
        borderRadius: 18,
        backgroundColor: Colors.pageBg,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        padding: 20,
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
