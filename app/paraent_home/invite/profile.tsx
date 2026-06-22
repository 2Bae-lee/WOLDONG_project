import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../../components/BackButton';
import PrimaryButton from '../../../components/PrimaryButton';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

export default function CompanionProfile() {
    return (
        <View style={styles.container}>
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

            <View style={styles.content}>
                <Text style={styles.title}>동행인 프로필</Text>

                <View style={styles.profileCard}>
                    <Image
                        source={require('../../../assets/images/icon_companion.png')}
                        style={styles.profileImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.name}>박민지</Text>
                    <Text style={styles.relation}>담임 선생님</Text>
                    <Text style={styles.info}>010-1234-5678</Text>
                    <Text style={styles.info}>아이 프로필, 오늘 일정, 인수인계 자료 접근 가능</Text>
                </View>

                <Text style={styles.taskText}>일정 정리하기</Text>
            </View>

            <View style={styles.buttonArea}>
                <PrimaryButton
                    label="홈 화면으로 이동"
                    width="100%"
                    onPress={() => router.push('/paraent_home' as any)}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.pageBg,
        paddingTop: 10,
        paddingHorizontal: 32,
        paddingBottom: 54,
    },

    logoArea: {
        alignItems: 'flex-start',
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

    content: {
        flex: 1,
        justifyContent: 'center',
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 42,
    },

    profileCard: {
        width: '100%',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 28,
        marginBottom: 58,
    },

    profileImage: {
        width: 78,
        height: 78,
        marginBottom: 14,
    },

    name: {
        fontFamily: Fonts.bodyBold,
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 6,
    },

    relation: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },

    info: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textShadow,
        textAlign: 'center',
    },

    taskText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginLeft: 22,
    },

    buttonArea: {
        width: '100%',
    },
});
