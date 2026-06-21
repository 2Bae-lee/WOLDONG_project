import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../../components/PrimaryButton';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

export default function ChildProfileComplete() {
    const params = useLocalSearchParams<{
        name?: string;
    }>();

    const childName = params.name || '아이';

    return (
        <View style={styles.container}>
            <View style={styles.logoArea}>
                <View style={styles.logoRow}>
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

            <View style={styles.content}>
                <Image
                    source={require('../../../assets/images/canola_sprig_vertical.png')}
                    style={styles.flower}
                    resizeMode="contain"
                />

                <Text style={styles.title}>{childName}의 특성을{'\n'}모두 입력했어요</Text>
                <Text style={styles.description}>
                    입력한 정보는 외출 전 안내와{'\n'}주의사항 추천에 활용됩니다.
                </Text>
            </View>

            <View style={styles.buttonArea}>
                <PrimaryButton
                    label="완료"
                    width="100%"
                    onPress={() => router.push('/login' as any)}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.pageBg,
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

    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    flower: {
        width: 180,
        height: 220,
        marginBottom: -18,
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 24,
        fontWeight: '900',
        lineHeight: 34,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 16,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 24,
        color: Colors.textShadow,
        textAlign: 'center',
    },

    buttonArea: {
        width: '100%',
    },
});
