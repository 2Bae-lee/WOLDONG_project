import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../../components/BackButton';
import PrimaryButton from '../../../components/PrimaryButton';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

const mockInviteCode = ['R', 'O', 'W', '8'];

export default function MakeInviteCode() {
    const goNext = () => {
        router.push('/paraent_home/invite/accept' as any);
    };

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

                <Text style={styles.description}>
                    동행인을 추가할 수 있는{'\n'}초대 코드입니다.
                </Text>

                <View style={styles.codeRow}>
                    {mockInviteCode.map((letter, index) => (
                        <View key={`${letter}-${index}`} style={styles.codeBox}>
                            <Text style={styles.codeText}>{letter}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.notice}>
                    동행인이 월동에 초대 코드를 입력하면{'\n'}권한 승인 요청 알림을 통해 알려드립니다!
                </Text>
            </View>

            <Pressable style={styles.skipButton} onPress={goNext}>
                <Text style={styles.skipText}>넘어가기</Text>
            </Pressable>

            <View style={styles.buttonArea}>
                <PrimaryButton label="공유하기" width="100%" onPress={goNext} />
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
        paddingBottom: 48,
    },

    centerLogoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
    },

    centerLogo: {
        fontFamily: Fonts.title,
        fontSize: 64,
        color: Colors.black,
    },

    centerFlower: {
        width: 32,
        height: 32,
        marginLeft: -8,
        marginTop: -38,
        transform: [{ rotate: '-18deg' }],
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        color: Colors.text,
        marginBottom: 34,
    },

    codeRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 46,
    },

    codeBox: {
        width: 48,
        height: 52,
        borderRadius: 8,
        backgroundColor: Colors.realwhite,
        alignItems: 'center',
        justifyContent: 'center',
    },

    codeText: {
        fontFamily: Fonts.bodyBlack,
        fontSize: 28,
        fontWeight: '900',
        color: Colors.black,
        transform: [{ rotate: '-8deg' }],
    },

    notice: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        color: Colors.text,
    },

    skipButton: {
        alignSelf: 'center',
        marginBottom: 16,
    },

    skipText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textShadow,
    },

    buttonArea: {
        width: '100%',
    },
});
