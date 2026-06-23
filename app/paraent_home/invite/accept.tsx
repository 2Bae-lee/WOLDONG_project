import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../../components/BackButton';
import PrimaryButton from '../../../components/PrimaryButton';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

export default function AcceptInvite() {
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
                <View style={styles.centerLogoRow}>
                    <Text style={styles.centerLogo}>월동</Text>
                    <Image
                        source={require('../../../assets/images/canola_flower_small.png')}
                        style={styles.centerFlower}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.description}>동행인의 권한 승인 요청이 왔습니다.</Text>

                <View style={styles.profileCard}>
                    <Image
                        source={require('../../../assets/images/icon_companion.png')}
                        style={styles.profileImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.profileName}>동행인</Text>
                    <Text style={styles.profileMeta}>프로필 정보를 불러오는 중이에요.</Text>
                </View>
            </View>

            <View style={styles.buttonArea}>
                <PrimaryButton
                    label="수락하기"
                    width="100%"
                    onPress={() => router.push('/paraent_home/invite/accepted' as any)}
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
        paddingBottom: 30,
    },

    centerLogoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },

    centerLogo: {
        fontFamily: Fonts.title,
        fontSize: 58,
        color: Colors.black,
    },

    centerFlower: {
        width: 30,
        height: 30,
        marginLeft: -8,
        marginTop: -34,
        transform: [{ rotate: '-18deg' }],
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 22,
    },

    profileCard: {
        width: '100%',
        minHeight: 250,
        borderRadius: 14,
        backgroundColor: Colors.realwhite,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },

    profileImage: {
        width: 72,
        height: 72,
        marginBottom: 12,
    },

    profileName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
    },

    profileMeta: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 6,
    },

    profileInfo: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textShadow,
    },

    buttonArea: {
        width: '100%',
    },
});
