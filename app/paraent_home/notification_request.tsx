import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

export default function NotificationRequest() {
    return (
        <View style={styles.container}>
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

            <View style={styles.content}>
                <Text style={styles.title}>동행인 승인 요청</Text>
                <Text style={styles.description}>
                    박민지님이 김월동 어린이의 동행인 권한을 요청했어요.
                </Text>

                <View style={styles.profileCard}>
                    <Image
                        source={require('../../assets/images/icon_companion.png')}
                        style={styles.profileImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.name}>박민지</Text>
                    <Text style={styles.relation}>담임 선생님</Text>
                    <Text style={styles.info}>010-1234-5678</Text>
                    <Text style={styles.permissionText}>
                        승인하면 아이 프로필, 오늘 일정, 인수인계 자료를 함께 볼 수 있어요.
                    </Text>
                </View>
            </View>

            <View style={styles.buttonArea}>
                <PrimaryButton
                    label="승인하기"
                    width="100%"
                    onPress={() => router.replace('/paraent_home/companions' as any)}
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 18,
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 23,
        color: Colors.textShadow,
        textAlign: 'center',
        marginBottom: 24,
    },

    profileCard: {
        width: '100%',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 30,
    },

    profileImage: {
        width: 82,
        height: 82,
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
        color: Colors.textShadow,
        marginBottom: 18,
    },

    permissionText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.text,
        textAlign: 'center',
    },

    buttonArea: {
        width: '100%',
    },
});
