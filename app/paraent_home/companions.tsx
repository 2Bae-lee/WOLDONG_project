import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

type Companion = {
    id: number;
    name: string;
    relation: string;
    phone: string;
    status: string;
};

const companions: Companion[] = [
    {
        id: 1,
        name: '박민지',
        relation: '담임 선생님',
        phone: '010-1234-5678',
        status: '아이 프로필 공유 완료',
    },
    {
        id: 2,
        name: '이하늘',
        relation: '활동지원사',
        phone: '010-2345-6789',
        status: '오늘 일정 확인 가능',
    },
    {
        id: 3,
        name: '최서윤',
        relation: '치료사',
        phone: '010-3456-7890',
        status: '인수인계 자료 공유 완료',
    },
];

export default function Companions() {
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
                <Text style={styles.title}>추가된 동행인</Text>
                <Text style={styles.description}>현재 아이 정보를 함께 볼 수 있는 동행인이에요.</Text>
            </View>

            <View style={styles.listArea}>
                {companions.map((companion) => (
                    <View key={companion.id} style={styles.companionCard}>
                        <View style={styles.avatarCircle}>
                            <Image
                                source={require('../../assets/images/icon_companion.png')}
                                style={styles.avatarImage}
                                resizeMode="contain"
                            />
                        </View>

                        <View style={styles.companionInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.companionName}>{companion.name}</Text>
                                <Text style={styles.relationBadge}>{companion.relation}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Ionicons name="call-outline" size={15} color={Colors.textShadow} />
                                <Text style={styles.infoText}>{companion.phone}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Ionicons name="checkmark-circle" size={15} color={Colors.highlight1} />
                                <Text style={styles.infoText}>{companion.status}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>

            <Pressable
                style={styles.addCompanionButton}
                onPress={() => router.push('/paraent_home/invite/make_code' as any)}
            >
                <Ionicons name="add" size={20} color={Colors.text} />
                <Text style={styles.addCompanionText}>동행인 추가하기</Text>
            </Pressable>
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
        marginBottom: 28,
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
        marginBottom: 22,
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

    listArea: {
        width: '100%',
        gap: 12,
        marginBottom: 22,
    },

    companionCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        padding: 14,
    },

    avatarCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#FFF8DF',
        borderWidth: 1,
        borderColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },

    avatarImage: {
        width: 40,
        height: 40,
    },

    companionInfo: {
        flex: 1,
        justifyContent: 'center',
    },

    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },

    companionName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
    },

    relationBadge: {
        borderRadius: 12,
        backgroundColor: Colors.highlight1,
        paddingHorizontal: 9,
        paddingVertical: 4,
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
        overflow: 'hidden',
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },

    infoText: {
        flex: 1,
        marginLeft: 6,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.textShadow,
    },

    addCompanionButton: {
        width: '100%',
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.highlight1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    addCompanionText: {
        marginLeft: 6,
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },
});
