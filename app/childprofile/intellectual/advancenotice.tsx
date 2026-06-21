import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import DangerOptionCard from '../../../components/DangerOptionCard';
import PrimaryButton from '../../../components/PrimaryButton';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

type Option = {
    icon: string;
    label: string;
    value: string;
};

const noticeOptions: Option[] = [
    {
        icon: '⏱️',
        label: '바로 직전에 알려주면 좋아요',
        value: 'right_before',
    },
    {
        icon: '5',
        label: '5분 전에 알려주면 좋아요',
        value: 'five_minutes',
    },
    {
        icon: '10',
        label: '10분 전에 알려주면 좋아요',
        value: 'ten_minutes',
    },
    {
        icon: '30',
        label: '30분 전에 알려주면 좋아요',
        value: 'thirty_minutes',
    },
    {
        icon: '1h',
        label: '1시간 전에 알려주면 좋아요',
        value: 'one_hour',
    },
    {
        icon: '3h',
        label: '3시간 전에 알려주면 좋아요',
        value: 'three_hours',
    },
    {
        icon: '🌙',
        label: '전 날 미리 알려주면 좋아요',
        value: 'day_before',
    },
];

export default function AdvanceNoticeProfile() {
    const params = useLocalSearchParams<{
        name?: string;
        profileImage?: string;
        gender?: string;
        birth?: string;
        relationship?: string;
        typeofdisability?: string;
        guidanceOptions?: string;
        communicationOptions?: string;
        dangerSituations?: string;
        companionAction?: string;
        sensoryOptions?: string;
        placeOptions?: string;
        scheduleChangeOptions?: string;
    }>();

    const [selectedNotice, setSelectedNotice] = useState('');
    const [optionError, setOptionError] = useState('');

    const handleSelect = (value: string) => {
        setSelectedNotice(value);

        if (optionError) {
            setOptionError('');
        }
    };

    const handleNext = () => {
        if (!selectedNotice) {
            setOptionError('아이에게 맞는 미리 알림 시간을 선택해주세요.');
            return;
        }

        router.push({
            pathname: '/childprofile/intellectual/profilecomplete',
            params: {
                name: params.name ?? '',
                profileImage: params.profileImage ?? '',
                gender: params.gender ?? '',
                birth: params.birth ?? '',
                relationship: params.relationship ?? '',
                typeofdisability: params.typeofdisability ?? '',
                guidanceOptions: params.guidanceOptions ?? '',
                communicationOptions: params.communicationOptions ?? '',
                dangerSituations: params.dangerSituations ?? '',
                companionAction: params.companionAction ?? '',
                sensoryOptions: params.sensoryOptions ?? '',
                placeOptions: params.placeOptions ?? '',
                scheduleChangeOptions: params.scheduleChangeOptions ?? '',
                advanceNoticeOptions: JSON.stringify([selectedNotice]),
            },
        } as any);
    };

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.inner}
            showsVerticalScrollIndicator={false}
        >
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
                    <Text style={styles.progressText}>5/6</Text>

                    <View style={styles.progressTrack}>
                        <View style={styles.progressFill} />
                    </View>
                </View>

                <View style={styles.titleArea}>
                    <Text style={styles.title}>
                        아이에게 언제 미리 알려주면{'\n'}가장 안정적인가요?
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>선호하는 미리 알림 시간을 선택해주세요.</Text>

                    <View style={styles.optionGrid}>
                        {noticeOptions.map((option) => {
                            const selected = selectedNotice === option.value;

                            return (
                                <DangerOptionCard
                                    key={option.value}
                                    icon={option.icon}
                                    label={option.label}
                                    selected={selected}
                                    onPress={() => handleSelect(option.value)}
                                />
                            );
                        })}
                    </View>
                </View>

                {optionError ? <Text style={styles.errorText}>{optionError}</Text> : null}

                <View style={styles.buttonArea}>
                    <PrimaryButton label="완료" width="100%" onPress={handleNext} />
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
        paddingBottom: 54,
    },

    container: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.pageBg,
        paddingTop: 10,
        paddingHorizontal: 32,
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
        width: '83.3%',
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.highlight1,
    },

    titleArea: {
        alignItems: 'center',
        marginBottom: 28,
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 23,
        fontWeight: '900',
        lineHeight: 34,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 14,
    },

    section: {
        marginBottom: 34,
    },

    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 12,
    },

    optionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 14,
    },

    errorText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.highlight3,
        marginTop: -10,
        marginBottom: 16,
    },

    buttonArea: {
        marginTop: 'auto',
        marginBottom: 44,
    },
});
