import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import {
    LinkedCompanion,
    getLinkedCompanions,
    getParentHome,
} from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

type Companion = {
    id: string;
    companionId: string;
    childId: string;
    name: string;
    relation: string;
    status: string;
    permissions: string[];
};

export default function Companions() {
    const params = useLocalSearchParams<{
        childId?: string;
        childName?: string;
        acceptedRelation?: string;
        acceptedPermissions?: string;
        removedCompanionId?: string;
        refreshAt?: string;
    }>();
    const [childId, setChildId] = useState(params.childId ?? '');
    const [visibleCompanions, setVisibleCompanions] = useState<Companion[]>([]);
    const [statusText, setStatusText] = useState('');

    useFocusEffect(useCallback(() => {
        let active = true;

        const mapLinkedCompanion = (companion: LinkedCompanion, targetChildId: string): Companion => ({
            id: companion.request_id,
            companionId: companion.companion_id,
            childId: targetChildId,
            name: companion.companion_name,
            relation: companion.relation || '동행인',
            permissions: companion.permissions?.length
                ? companion.permissions
                : [],
            status: '아이 정보를 함께 확인할 수 있어요.',
        });

        const applyLocalParams = (items: Companion[]) => {
            let nextItems = items;

            if (params.removedCompanionId) {
                nextItems = nextItems.filter((companion) => companion.companionId !== params.removedCompanionId);
            }

            return nextItems;
        };

        const loadCompanions = async () => {
            setStatusText('');
            try {
                let nextChildId = childId;

                if (!nextChildId) {
                    const homeResponse = await getParentHome();
                    nextChildId = homeResponse.data?.children?.[0]?.child_id ?? '';
                    if (active) setChildId(nextChildId);
                }

                if (!nextChildId) {
                    setVisibleCompanions([]);
                    return;
                }

                const response = await getLinkedCompanions(nextChildId);
                if (!active) return;

                setVisibleCompanions(applyLocalParams((response.data ?? []).map((companion) => (
                    mapLinkedCompanion(companion, nextChildId)
                ))));
            } catch {
                if (!active) return;
                setStatusText('동행인 목록을 불러오지 못했어요.');
                setVisibleCompanions([]);
            }
        };

        loadCompanions();

        return () => {
            active = false;
        };
    }, [
        childId,
        params.acceptedPermissions,
        params.acceptedRelation,
        params.removedCompanionId,
        params.refreshAt,
    ]));

    const openCompanionProfile = (companion: Companion) => {
        router.push({
            pathname: '/paraent_home/companion_profile',
            params: {
                childId: companion.childId || childId,
                companionId: companion.companionId,
                name: companion.name,
                relation: companion.relation,
                status: companion.status,
                permissions: companion.permissions.join(','),
            },
        } as any);
    };

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
                {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}
            </View>

            <View style={styles.listArea}>
                {visibleCompanions.map((companion) => (
                    <Pressable
                        key={`${companion.id}-${companion.name}`}
                        style={styles.companionCard}
                        onPress={() => openCompanionProfile(companion)}
                    >
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
                                <Ionicons name="checkmark-circle" size={15} color={Colors.highlight1} />
                                <Text style={styles.infoText}>{companion.status}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textShadow} />
                    </Pressable>
                ))}
            </View>

            <Pressable
                style={styles.addCompanionButton}
                onPress={() =>
                    router.push({
                        pathname: '/paraent_home/invite/make_code',
                        params: {
                            childId,
                            childName: params.childName ?? '아이',
                        },
                    } as any)
                }
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

    statusText: {
        marginTop: 8,
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
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
