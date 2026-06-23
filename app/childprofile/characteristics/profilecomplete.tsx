import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../../components/BackButton';
import PrimaryButton from '../../../components/PrimaryButton';
import { createChildProfile } from '../../../constants/Api';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

const labelMap: Record<string, string> = {
    one_by_one: '한 번에 하나씩 설명',
    visual_support: '그림/사진 활용',
    short_sentence: '짧고 쉬운 문장',
    need_repetition: '반복 설명',
    choice_question: '선택지 질문',
    show_first: '먼저 보여주고 설명',

    sentence_answer: '문장으로 대답',
    word_answer: '단어로 대답',
    gesture_answer: '고개/손짓으로 대답',
    picture_card: '그림/사진 카드 필요',
    yes_no_answer: '네/아니오로 대답',
    hard_to_express: '불편함 표현 어려움',

    car_danger: '차도/차량 위험 인지 어려움',
    crosswalk_danger: '신호등/횡단보도 어려움',
    stranger_danger: '낯선 사람을 따라갈 수 있음',
    apartfromcompanion_danger: '동행인과 떨어지면 위험',
    suddenrun_danger: '갑자기 뛰어갈 수 있음',
    touch_danger: '위험한 물건을 만질 수 있음',

    hold_hands: '손을 꼭 잡고 이동',
    explain_before_crossing: '횡단보도 앞에서 설명',
    stay_close: '사람 많은 곳에서 가까이 있기',
    call_name_and_stop: '이름을 부르고 천천히 멈추기',
    quiet_break: '조용한 곳에서 쉬기',
    remove_dangerous_items: '위험한 물건 먼저 치우기',

    loud_noise: '큰 소리',
    crowded_place: '사람 많은 곳',
    light: '밝은 빛',
    bad_smell: '악취',
    body_contact: '신체 접촉',
    movement: '갑작스러운 움직임',
    wait: '대기',

    take_transport: '이동 수단 타기',
    waiting: '기다리기',
    stop_activity: '하던 활동 멈추기',
    move_place: '장소 이동하기',
    go_home: '집에 돌아가기',
    go_toilet: '화장실 가기',
    unexpected_change: '예정과 다른 일',

    right_before: '바로 직전',
    five_minutes: '5분 전',
    ten_minutes: '10분 전',
    thirty_minutes: '30분 전',
    one_hour: '1시간 전',
    three_hours: '3시간 전',
    day_before: '전 날',

    intellectual: '지적장애',
    autism: '자폐스펙트럼',
};

const apiLabelMap: Record<string, string> = {
    one_by_one: '한번에 하나씩 말해줘야해요',
    visual_support: '그림이나 사진이 있으면 좋아요',
    short_sentence: '짧고 쉬운 문장으로 말해줘야해요',
    need_repetition: '반복 설명이 필요해요',
    choice_question: '선택지로 물어보면 잘 대답해요',
    show_first: '먼저 보여주고 설명하면 잘 이해해요',

    sentence_answer: '문장으로 대답해요',
    word_answer: '단어로 대답해요',
    gesture_answer: '고개 끄덕이나 손짓으로 대답해요',
    picture_card: '그림/사진 카드가 필요해요',
    yes_no_answer: '네/아니오로 대답해요',
    hard_to_express: '불편함을 말로 표현하기 어려워요',

    car_danger: '차도/차량 위험 인지를 어려워해요',
    crosswalk_danger: '신호등/횡단보도 규칙을 어려워해요',
    stranger_danger: '낯선 사람을 쉽게 따라갈 수 있어요',
    apartfromcompanion_danger: '동행인과 떨어지면 위험을 잘 인지하지 못해요',
    suddenrun_danger: '갑자기 뛰어갈 수 있어요',
    touch_danger: '위험한 물건을 만질 수 있어요',

    loud_noise: '큰 소리',
    crowded_place: '사람 많은 곳',
    light: '밝은 빛',
    bad_smell: '냄새',
    body_contact: '신체 접촉',
    movement: '갑작스러운 움직임',
    wait: '대기',

    take_transport: '이동 수단 타기',
    waiting: '기다리기',
    stop_activity: '하던 활동 멈추기',
    move_place: '장소 이동하기',
    go_home: '집에 돌아가기',
    go_toilet: '화장실 가기',
    unexpected_change: '예정과 다른 일이 생기기',

    right_before: '바로 직전',
    five_minutes: '5분 전',
    ten_minutes: '10분 전',
    thirty_minutes: '30분 전',
    one_hour: '1시간 전',
    three_hours: '3시간 전',
    day_before: '전 날',
};

const genderMap: Record<string, '남자아이' | '여자아이'> = {
    male: '남자아이',
    female: '여자아이',
};

const relationMap: Record<string, '주양육자' | '부모' | '조부모'> = {
    primarycaregiver: '주양육자',
    parent: '부모',
    grandparent: '조부모',
};

const disabilityMap: Record<string, '지적장애' | '자폐스펙트럼장애'> = {
    intellectual: '지적장애',
    autism: '자폐스펙트럼장애',
};

const parseList = (value?: string) => {
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch {
        return [];
    }
};

const toLabels = (values: string[]) => values.map((value) => labelMap[value] ?? value);

const toApiLabels = (values: string[]) => values.map((value) => apiLabelMap[value] ?? value);

type SummarySectionProps = {
    title: string;
    items: string[];
};

function SummarySection({ title, items }: SummarySectionProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>{title}</Text>
            <View style={styles.itemList}>
                {items.map((item) => (
                    <Text key={item} style={styles.summaryItem}>- {item}</Text>
                ))}
            </View>
        </View>
    );
}

export default function ChildProfileComplete() {
    const params = useLocalSearchParams<{
        name?: string;
        profileImage?: string;
        gender?: string;
        birth?: string;
        relationship?: string;
        typeofdisability?: string;
        guidanceOptions?: string;
        communicationOptions?: string;
        dangerSituations?: string;
        companionAction?: string;
        sensoryOptions?: string;
        placeOptions?: string;
        scheduleChangeOptions?: string;
        advanceNoticeOptions?: string;
    }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const childName = params.name || '아이';
    const profileImage = params.profileImage ?? '';
    const guidanceValues = parseList(params.guidanceOptions);
    const communicationValues = parseList(params.communicationOptions);
    const dangerValues = parseList(params.dangerSituations);
    const companionValues = parseList(params.companionAction);
    const sensoryValues = parseList(params.sensoryOptions);
    const placeValues = parseList(params.placeOptions);
    const scheduleChangeValues = parseList(params.scheduleChangeOptions);
    const advanceNoticeValues = parseList(params.advanceNoticeOptions);
    const disabilityItems = params.typeofdisability
        ? [labelMap[params.typeofdisability] ?? params.typeofdisability]
        : [];
    const guidanceItems = toLabels(guidanceValues);
    const communicationItems = toLabels(communicationValues);
    const dangerItems = toLabels(dangerValues);
    const companionItems = toLabels(companionValues);
    const sensoryItems = toLabels(sensoryValues);
    const placeItems = placeValues;
    const scheduleChangeItems = toLabels(scheduleChangeValues);
    const advanceNoticeItems = toLabels(advanceNoticeValues);
    const profileSections = [
        { id: 'info', items: disabilityItems },
        { id: 'guidance', items: guidanceItems },
        { id: 'communication', items: communicationItems },
        { id: 'danger', items: dangerItems },
        { id: 'companion', items: companionItems },
        { id: 'sensory', items: sensoryItems },
        { id: 'place', items: placeItems },
        { id: 'schedule', items: scheduleChangeItems },
        { id: 'notice', items: advanceNoticeItems },
    ];

    const openMakeCharacter = (childId?: string) => {
        router.push({
            pathname: '/childprofile/makecharacter',
            params: {
                name: childName,
                profileImage,
                profileSections: JSON.stringify(profileSections),
                childId: childId ?? '',
            },
        } as any);
    };

    const handleCreateProfile = async () => {
        if (isSubmitting) return;

        const gender = genderMap[params.gender ?? ''];
        const disabilityType = disabilityMap[params.typeofdisability ?? ''];

        if (!gender || !disabilityType || !params.birth) {
            setSubmitError('아동 기본 정보가 부족해요. 이전 화면을 다시 확인해주세요.');
            return;
        }

        setSubmitError('');
        setIsSubmitting(true);

        try {
            const response = await createChildProfile({
                name: childName,
                gender,
                birth_date: params.birth.replace(/\./g, '-'),
                guardian_relation: relationMap[params.relationship ?? ''] ?? '주양육자',
                disability_type: disabilityType,
                explanation_styles: toApiLabels(guidanceValues),
                communication_styles: toApiLabels(communicationValues),
                caution_situations: toApiLabels(dangerValues),
                required_actions: toApiLabels(companionValues).join(', '),
                difficult_environments: toApiLabels(sensoryValues),
                difficult_places: placeValues,
                transition_difficulties: toApiLabels(scheduleChangeValues),
                notice_time: toApiLabels(advanceNoticeValues)[0] ?? '',
                calming_methods: [],
                avoid_behaviors: '',
            });

            openMakeCharacter(response.data?.child_id);
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : '아동 프로필 등록에 실패했어요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.inner}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.logoArea}>
                <View style={styles.logoRow}>
                    <BackButton />
                    <Text style={styles.logoTitle}>월동</Text>
                    <Image
                        source={require('../../../assets/images/canola_flower_small.png')}
                        style={styles.logoFlower}
                        resizeMode="contain"
                    />
                </View>
            </View>

            <View style={styles.progressArea}>
                <Text style={styles.progressText}>6/6</Text>

                <View style={styles.progressTrack}>
                    <View style={styles.progressFill} />
                </View>
            </View>

            <View style={styles.headerArea}>
                <Text style={styles.title}>{childName}의 특성을{'\n'}모두 입력했어요</Text>
                <Text style={styles.description}>
                    입력한 내용을 확인해주세요.
                </Text>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatarFrame}>
                    <Image
                        source={
                            profileImage
                                ? { uri: profileImage }
                                : require('../../../assets/images/icon_child.png')
                        }
                        style={profileImage ? styles.profileImage : styles.defaultProfileImage}
                        resizeMode={profileImage ? 'cover' : 'contain'}
                    />
                </View>

                <Text style={styles.childName}>{childName}</Text>

                <View style={styles.summaryArea}>
                    <SummarySection title="공유 정보" items={disabilityItems} />
                    <SummarySection title="설명 방식" items={guidanceItems} />
                    <SummarySection title="의사소통 방식" items={communicationItems} />
                    <SummarySection title="외출 중 주의 상황" items={dangerItems} />
                    <SummarySection title="동행인이 해야 할 행동" items={companionItems} />
                    <SummarySection title="힘들어하는 환경" items={sensoryItems} />
                    <SummarySection title="힘들어하는 장소" items={placeItems} />
                    <SummarySection title="어려운 일정 변화" items={scheduleChangeItems} />
                    <SummarySection title="미리 알림 시간" items={advanceNoticeItems} />
                </View>
            </View>

            <View style={styles.buttonArea}>
                <PrimaryButton
                    label={isSubmitting ? '등록 중' : '캐릭터 만들기'}
                    width="100%"
                    onPress={handleCreateProfile}
                />
                {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
            </View>
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

    progressArea: {
        width: '100%',
        marginBottom: 20,
    },

    progressText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'right',
        marginBottom: 8,
    },

    progressTrack: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.pageBg2,
    },

    progressFill: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.highlight1,
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

    avatarFrame: {
        width: 112,
        height: 112,
        borderRadius: 56,
        borderWidth: 2,
        borderColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 12,
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

    childName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 32,
    },

    summaryArea: {
        width: '100%',
        gap: 24,
    },

    summarySection: {
        width: '100%',
    },

    summaryTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 12,
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

    buttonArea: {
        width: '100%',
        marginTop: 34,
    },

    errorText: {
        marginTop: 12,
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.highlight3,
        textAlign: 'center',
    },
});
