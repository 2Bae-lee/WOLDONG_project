import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Keyboard,
    Modal,
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

type ProfileSection = {
    id: string;
    title: string;
    items: string[];
    options: string[];
};

type EditTarget =
    | { type: 'name' }
    | { type: 'section'; sectionId: string }
    | null;

const initialSections: ProfileSection[] = [
    {
        id: 'guidance',
        title: '설명 방식',
        items: ['짧고 쉬운 문장', '그림/사진 활용', '선택지 질문'],
        options: ['한 번에 하나씩 설명', '그림/사진 활용', '짧고 쉬운 문장', '반복 설명', '선택지 질문', '먼저 보여주고 설명'],
    },
    {
        id: 'communication',
        title: '의사소통 방식',
        items: ['단어로 대답', '네/아니오로 대답'],
        options: ['문장으로 대답', '단어로 대답', '고개/손짓으로 대답', '그림/사진 카드 필요', '네/아니오로 대답', '불편함 표현 어려움'],
    },
    {
        id: 'danger',
        title: '외출 중 주의 상황',
        items: ['차도/차량 위험 인지 어려움', '갑자기 뛰어갈 수 있음'],
        options: ['차도/차량 위험 인지 어려움', '신호등/횡단보도 어려움', '낯선 사람을 따라갈 수 있음', '동행인과 떨어지면 위험', '갑자기 뛰어갈 수 있음', '위험한 물건을 만질 수 있음'],
    },
    {
        id: 'companion',
        title: '동행인이 해야 할 행동',
        items: ['손을 꼭 잡고 이동', '이름을 부르고 천천히 멈추기'],
        options: ['손을 꼭 잡고 이동', '횡단보도 앞에서 설명', '사람 많은 곳에서 가까이 있기', '이름을 부르고 천천히 멈추기', '조용한 곳에서 쉬기', '위험한 물건 먼저 치우기'],
    },
    {
        id: 'sensory',
        title: '힘들어하는 환경',
        items: ['큰 소리', '사람 많은 곳', '대기'],
        options: ['큰 소리', '사람 많은 곳', '밝은 빛', '악취', '신체 접촉', '갑작스러운 움직임', '대기'],
    },
    {
        id: 'place',
        title: '힘들어하는 장소',
        items: ['병원', '마트'],
        options: ['지하철', '새로운 장소', '병원', '식당', '버스', '마트', '놀이공원', '영화관/공연장'],
    },
    {
        id: 'schedule',
        title: '어려운 일정 변화',
        items: ['장소 이동하기', '예정과 다른 일'],
        options: ['이동 수단 타기', '기다리기', '하던 활동 멈추기', '장소 이동하기', '집에 돌아가기', '화장실 가기', '예정과 다른 일'],
    },
    {
        id: 'notice',
        title: '미리 알림 시간',
        items: ['10분 전', '30분 전'],
        options: ['바로 직전', '5분 전', '10분 전', '30분 전', '1시간 전', '3시간 전', '전 날'],
    },
];

type EditableSectionProps = {
    title: string;
    items: string[];
    onEdit: () => void;
};

function EditableSection({ title, items, onEdit }: EditableSectionProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <View style={styles.summarySection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.summaryTitle}>{title}</Text>
                <Pressable style={styles.editIconButton} onPress={onEdit} hitSlop={8}>
                    <Ionicons name="pencil" size={16} color={Colors.textShadow} />
                </Pressable>
            </View>

            <View style={styles.itemList}>
                {items.map((item) => (
                    <Text key={item} style={styles.summaryItem}>- {item}</Text>
                ))}
            </View>
        </View>
    );
}

const parseSections = (value?: string) => {
    if (!value) return initialSections;

    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return initialSections;

        return initialSections.map((section) => {
            const matched = parsed.find((item) => item?.id === section.id);
            return Array.isArray(matched?.items)
                ? { ...section, items: matched.items.filter((item: unknown) => typeof item === 'string') }
                : section;
        });
    } catch {
        return initialSections;
    }
};

export default function ParentChildProfile() {
    const params = useLocalSearchParams<{
        childName?: string;
        profileImage?: string;
        sections?: string;
    }>();

    const [childName, setChildName] = useState(params.childName || '김월동');
    const [profileImage, setProfileImage] = useState<string | null>(params.profileImage || null);
    const [sections, setSections] = useState(() => parseSections(params.sections));
    const [editTarget, setEditTarget] = useState<EditTarget>(null);
    const [editText, setEditText] = useState('');
    const [editSelectedItems, setEditSelectedItems] = useState<string[]>([]);

    const pickProfileImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
        });

        if (!result.canceled && result.assets[0]?.uri) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const openNameEditor = () => {
        setEditTarget({ type: 'name' });
        setEditText(childName);
        setEditSelectedItems([]);
    };

    const openSectionEditor = (sectionId: string) => {
        const section = sections.find((item) => item.id === sectionId);
        if (!section) return;

        setEditTarget({ type: 'section', sectionId });
        setEditText('');
        setEditSelectedItems(section.items);
    };

    const closeEditor = () => {
        setEditTarget(null);
        setEditText('');
        setEditSelectedItems([]);
        Keyboard.dismiss();
    };

    const toggleEditItem = (item: string) => {
        setEditSelectedItems((current) => (
            current.includes(item)
                ? current.filter((selectedItem) => selectedItem !== item)
                : [...current, item]
        ));
    };

    const saveEdit = () => {
        if (!editTarget) return;

        if (editTarget.type === 'name') {
            const trimmedText = editText.trim();
            if (!trimmedText) return;

            setChildName(trimmedText);
        } else {
            setSections((current) => current.map((section) => (
                section.id === editTarget.sectionId ? { ...section, items: editSelectedItems } : section
            )));
        }

        closeEditor();
    };

    const editingSection = editTarget?.type === 'section'
        ? sections.find((section) => section.id === editTarget.sectionId)
        : null;

    const modalTitle = editTarget?.type === 'name'
        ? '이름 수정하기'
        : `${editingSection?.title ?? '특성'} 수정하기`;

    const handleComplete = () => {
        router.replace({
            pathname: '/paraent_home',
            params: {
                updatedChildName: childName,
                updatedProfileImage: profileImage ?? '',
                updatedProfileSections: JSON.stringify(sections.map((section) => ({
                    id: section.id,
                    items: section.items,
                }))),
            },
        } as any);
    };

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.inner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
                <Text style={styles.title}>{childName}의 프로필입니다.</Text>
                <Text style={styles.description}>현재 저장된 아이 프로필이에요.</Text>
            </View>

            <View style={styles.profileCard}>
                <Pressable style={styles.avatarButton} onPress={pickProfileImage}>
                    <View style={styles.avatarFrame}>
                        <Image
                            source={
                                profileImage
                                    ? { uri: profileImage }
                                    : require('../../assets/images/icon_child.png')
                            }
                            style={profileImage ? styles.profileImage : styles.defaultProfileImage}
                            resizeMode={profileImage ? 'cover' : 'contain'}
                        />
                    </View>
                    <View style={styles.photoEditBadge}>
                        <Ionicons name={profileImage ? 'pencil' : 'add'} size={16} color={Colors.text} />
                    </View>
                </Pressable>

                <View style={styles.nameRow}>
                    <Text style={styles.childName}>{childName}</Text>
                    <Pressable style={styles.nameEditButton} onPress={openNameEditor} hitSlop={8}>
                        <Ionicons name="pencil" size={17} color={Colors.textShadow} />
                    </Pressable>
                </View>

                <View style={styles.summaryArea}>
                    {sections.map((section) => (
                        <EditableSection
                            key={section.id}
                            title={section.title}
                            items={section.items}
                            onEdit={() => openSectionEditor(section.id)}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.buttonArea}>
                <PrimaryButton label="완료" width="100%" onPress={handleComplete} />
            </View>

            <Modal
                visible={Boolean(editTarget)}
                transparent
                animationType="fade"
                onRequestClose={closeEditor}
            >
                <Pressable style={styles.modalBackdrop} onPress={closeEditor}>
                    <Pressable style={styles.editModal} onPress={() => undefined}>
                        <Text style={styles.modalTitle}>{modalTitle}</Text>
                        {editTarget?.type === 'name' ? (
                            <TextInput
                                style={styles.modalInput}
                                value={editText}
                                onChangeText={setEditText}
                                placeholder="내용을 입력해주세요"
                                placeholderTextColor={Colors.textShadow}
                                autoFocus
                            />
                        ) : (
                            <View style={styles.optionButtonGrid}>
                                {editingSection?.options.map((option) => {
                                    const selected = editSelectedItems.includes(option);

                                    return (
                                        <Pressable
                                            key={option}
                                            style={[
                                                styles.optionButton,
                                                selected && styles.optionButtonSelected,
                                            ]}
                                            onPress={() => toggleEditItem(option)}
                                        >
                                            <Text style={[
                                                styles.optionButtonText,
                                                selected && styles.optionButtonTextSelected,
                                            ]}>
                                                {option}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}

                        <View style={styles.modalButtonRow}>
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: Colors.pageBg,
    },

    inner: {
        flexGrow: 1,
        width: '100%',
        paddingTop: 10,
        paddingHorizontal: 32,
        paddingBottom: 54,
    },

    logoArea: {
        alignItems: 'flex-start',
        marginBottom: 18,
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
        alignItems: 'center',
        marginBottom: 28,
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 23,
        fontWeight: '900',
        lineHeight: 33,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 10,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 23,
        color: Colors.textShadow,
        textAlign: 'center',
    },

    profileCard: {
        width: '100%',
        minHeight: 560,
        borderWidth: 1.5,
        borderColor: '#E8DDC8',
        borderRadius: 22,
        paddingHorizontal: 30,
        paddingTop: 40,
        paddingBottom: 34,
        backgroundColor: '#F7F4E8',
    },

    buttonArea: {
        width: '100%',
        marginTop: 24,
    },

    avatarButton: {
        width: 112,
        height: 112,
        alignSelf: 'center',
        marginBottom: 12,
    },

    avatarFrame: {
        width: '100%',
        height: '100%',
        borderRadius: 56,
        borderWidth: 2,
        borderColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    profileImage: {
        width: '100%',
        height: '100%',
    },

    defaultProfileImage: {
        width: 82,
        height: 82,
    },

    photoEditBadge: {
        position: 'absolute',
        right: -2,
        bottom: -2,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.highlight1,
        borderWidth: 2,
        borderColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },

    childName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'center',
    },

    nameEditButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },

    summaryArea: {
        width: '100%',
        gap: 24,
    },

    summarySection: {
        width: '100%',
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    summaryTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },

    editIconButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFBEF',
    },

    itemList: {
        gap: 4,
        paddingLeft: 18,
    },

    summaryItem: {
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 24,
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
        minHeight: 48,
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

    optionButtonGrid: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },

    optionButton: {
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: '100%',
    },

    optionButtonSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: Colors.highlight1,
    },

    optionButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        lineHeight: 20,
        color: Colors.text,
        textAlign: 'center',
    },

    optionButtonTextSelected: {
        color: Colors.text,
    },

    modalButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
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
