import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../../components/BackButton';
import { generateInviteCode, getParentHome } from '../../../constants/Api';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

export default function MakeInviteCode() {
    const params = useLocalSearchParams<{
        childId?: string;
        childName?: string;
    }>();
    const [inviteCode, setInviteCode] = useState('');
    const [childName, setChildName] = useState(params.childName || '');
    const [expiresAt, setExpiresAt] = useState('');
    const [statusText, setStatusText] = useState('');
    const codeLetters = useMemo(() => inviteCode.split(''), [inviteCode]);
    const inviteUrl = `https://woldong.app/invite/${inviteCode}`;

    useEffect(() => {
        let active = true;

        const loadInviteCode = async () => {
            setStatusText('');
            try {
                let nextChildId = params.childId ?? '';
                let nextChildName = params.childName ?? '';

                if (!nextChildId) {
                    const homeResponse = await getParentHome();
                    const firstChild = homeResponse.data?.children?.[0];
                    nextChildId = firstChild?.child_id ?? '';
                    nextChildName = nextChildName || firstChild?.name || '';
                }

                if (!nextChildId) {
                    setStatusText('아동 프로필을 먼저 등록하면 초대 코드를 만들 수 있어요.');
                    return;
                }

                const response = await generateInviteCode(nextChildId);
                if (!active) return;

                setInviteCode(response.data?.code ?? '');
                setExpiresAt(response.data?.expires_at ?? '');
                if (nextChildName) setChildName(nextChildName);
            } catch (error) {
                if (active) {
                    setInviteCode('');
                    setStatusText(error instanceof Error ? error.message : '초대 코드를 만들지 못했어요.');
                }
            }
        };

        loadInviteCode();

        return () => {
            active = false;
        };
    }, [params.childId, params.childName]);

    const shareInviteCode = async () => {
        await Share.share({
            message: `${childName} 어린이 월동 동행인 초대 코드 : ${inviteCode}\n${inviteUrl}`,
            url: inviteUrl,
        });
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
                    {codeLetters.map((letter, index) => (
                        <View key={`${letter}-${index}`} style={styles.codeBox}>
                            <Text style={styles.codeText}>{letter}</Text>
                        </View>
                    ))}
                </View>

                {expiresAt ? (
                    <Text style={styles.expireText}>만료 시간 {new Date(expiresAt).toLocaleString()}</Text>
                ) : null}
                {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}

                <Text style={styles.notice}>
                    동행인이 월동에 초대 코드를 입력하면{'\n'}권한 승인 요청 알림을 통해 알려드립니다!
                </Text>
            </View>

            <View style={styles.buttonArea}>
                <Pressable style={styles.shareButton} onPress={shareInviteCode}>
                    <Text style={styles.shareButtonText}>공유하기</Text>
                </Pressable>
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
        gap: 8,
        marginBottom: 18,
    },

    codeBox: {
        width: 66,
        height: 76,
        borderRadius: 10,
        backgroundColor: Colors.realwhite,
        alignItems: 'center',
        justifyContent: 'center',
    },

    codeText: {
        fontFamily: Fonts.title,
        fontSize: 80,
        color: Colors.black,
        transform: [{ rotate: '-8deg' }],
    },

    expireText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
        color: Colors.textShadow,
        marginBottom: 8,
    },

    statusText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
        color: Colors.textShadow,
        marginBottom: 14,
    },

    notice: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        color: Colors.text,
    },

    buttonArea: {
        width: '100%',
    },

    shareButton: {
        width: '100%',
        height: 58,
        borderRadius: 29,
        backgroundColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    shareButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'center',
        includeFontPadding: false,
    },
});
