import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../../components/BackButton';
import PrimaryButton from '../../../components/PrimaryButton';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

export default function MakeCharacterComplete() {
    const params = useLocalSearchParams<{
        name?: string;
        profileImage?: string;
        profileSections?: string;
        childId?: string;
        characterName?: string;
    }>();

    const childName = params.name || '아이';
    const characterName = params.characterName || '캐릭터';

    const handleVoicePreview = () => {
        // TODO: 생성된 음성 파일이 연결되면 이곳에서 재생합니다.
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

            <View style={styles.progressArea}>
                <Text style={styles.progressText}>3/3</Text>
                <View style={styles.progressTrack}>
                    <View style={styles.progressFill} />
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>
                    우리 아이에게 이야기를{'\n'}전달할 캐릭터가 만들어졌어요!
                </Text>

                <Image
                    source={require('../../../assets/images/mock_character.png')}
                    style={styles.characterImage}
                    resizeMode="contain"
                />

                <Text style={styles.characterName}>{characterName}</Text>
                <Text style={styles.description}>{childName}에게 들려줄 목소리를 준비했어요.</Text>

                <Pressable style={styles.voiceButton} onPress={handleVoicePreview}>
                    <Text style={styles.voiceIcon}>▶</Text>
                    <Text style={styles.voiceText}>음성 듣기</Text>
                </Pressable>
            </View>

            <View style={styles.buttonArea}>
                <PrimaryButton
                    label="홈"
                    width="100%"
                    onPress={() =>
                        router.replace({
                            pathname: '/paraent_home',
                            params: {
                                updatedChildName: childName,
                                updatedProfileImage: params.profileImage ?? '',
                                updatedProfileSections: params.profileSections ?? '',
                            },
                        } as any)
                    }
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

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 22,
        fontWeight: '900',
        lineHeight: 32,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 34,
    },

    characterImage: {
        width: 210,
        height: 250,
        marginBottom: 8,
    },

    characterName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textShadow,
        marginBottom: 18,
    },

    voiceButton: {
        minWidth: 142,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F7F4E8',
        borderWidth: 1,
        borderColor: '#E8DDC8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
    },

    voiceIcon: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        color: Colors.text,
        marginRight: 8,
    },

    voiceText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },

    buttonArea: {
        width: '100%',
    },
});
