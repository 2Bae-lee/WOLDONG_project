import { router, useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../../components/BackButton';
import PrimaryButton from '../../../components/PrimaryButton';
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
        guidanceOptions?: string;
        communicationOptions?: string;
        dangerSituations?: string;
        companionAction?: string;
        sensoryOptions?: string;
        placeOptions?: string;
        scheduleChangeOptions?: string;
        advanceNoticeOptions?: string;
    }>();

    const childName = params.name || '아이';
    const profileImage = params.profileImage ?? '';
    const guidanceItems = toLabels(parseList(params.guidanceOptions));
    const communicationItems = toLabels(parseList(params.communicationOptions));
    const dangerItems = toLabels(parseList(params.dangerSituations));
    const companionItems = toLabels(parseList(params.companionAction));
    const sensoryItems = toLabels(parseList(params.sensoryOptions));
    const placeItems = parseList(params.placeOptions);
    const scheduleChangeItems = toLabels(parseList(params.scheduleChangeOptions));
    const advanceNoticeItems = toLabels(parseList(params.advanceNoticeOptions));

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
                    label="캐릭터 만들기"
                    width="100%"
                    onPress={() =>
                        router.push({
                            pathname: '/childprofile/makecharacter',
                            params: {
                                name: childName,
                                profileImage,
                            },
                        } as any)
                    }
                />
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
});
