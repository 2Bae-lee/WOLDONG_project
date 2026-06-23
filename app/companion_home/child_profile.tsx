import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

const profileSections = [
    {
        title: '설명 방식',
        items: ['짧고 쉬운 문장', '그림/사진 활용', '선택지 질문'],
    },
    {
        title: '의사소통 방식',
        items: ['단어로 대답', '네/아니오로 대답'],
    },
    {
        title: '외출 중 주의 상황',
        items: ['차도/차량 위험 인지 어려움', '갑자기 뛰어갈 수 있음'],
    },
    {
        title: '동행인이 해야 할 행동',
        items: ['손을 꼭 잡고 이동', '이름을 부르고 천천히 멈추기'],
    },
    {
        title: '힘들어하는 환경',
        items: ['큰 소리', '사람 많은 곳', '대기'],
    },
    {
        title: '미리 알림 시간',
        items: ['10분 전', '30분 전'],
    },
];

export default function CompanionChildProfile() {
    const params = useLocalSearchParams<{ childName?: string }>();
    const childName = params.childName || '아이';

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
                        source={require('../../assets/images/canola_flower_small.png')}
                        style={styles.logoFlower}
                        resizeMode="contain"
                    />
                </View>
            </View>

            <View style={styles.headerArea}>
                <Text style={styles.title}>{childName}의 프로필입니다.</Text>
                <Text style={styles.description}>보호자가 공유한 아이 특성이에요.</Text>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatarFrame}>
                    <Image
                        source={require('../../assets/images/icon_child.png')}
                        style={styles.defaultProfileImage}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.childName}>{childName}</Text>

                <View style={styles.summaryArea}>
                    {profileSections.map((section) => (
                        <View key={section.title} style={styles.summarySection}>
                            <View style={styles.sectionTitleRow}>
                                <Text style={styles.summaryTitle}>{section.title}</Text>
                                <Ionicons name="checkmark" size={17} color={Colors.highlight1} />
                            </View>
                            <View style={styles.itemList}>
                                {section.items.map((item) => (
                                    <Text key={item} style={styles.summaryItem}>- {item}</Text>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
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
        overflow: 'hidden',
        marginBottom: 12,
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

    sectionTitleRow: {
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
});
