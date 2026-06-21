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

const scheduleChangeOptions: Option[] = [
    {
        icon: '🚌',
        label: '이동 수단 타기를 어려워해요',
        value: 'take_transport',
    },
    {
        icon: '⏲️',
        label: '기다리는 시간을 어려워해요',
        value: 'waiting',
    },
    {
        icon: '✋',
        label: '하던 활동을 멈추기 어려워해요',
        value: 'stop_activity',
    },
    {
        icon: '➡️',
        label: '장소를 이동할 때 어려워해요',
        value: 'move_place',
    },
    {
        icon: '🏠',
        label: '집에 돌아가는 전환을 어려워해요',
        value: 'go_home',
    },
    {
        icon: '🚻',
        label: '화장실 가는 상황을 어려워해요',
        value: 'go_toilet',
    },
    {
        icon: '🔄',
        label: '예정과 다른 일이 생기면 어려워해요',
        value: 'unexpected_change',
    },
];

export default function ScheduleChangeProfile() {
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
    }>();

    const [selectedScheduleChanges, setSelectedScheduleChanges] = useState<string[]>([]);
    const [optionError, setOptionError] = useState('');

    const toggleItem = (value: string) => {
        if (selectedScheduleChanges.includes(value)) {
            setSelectedScheduleChanges(
                selectedScheduleChanges.filter((item) => item !== value)
            );
        } else {
            setSelectedScheduleChanges([...selectedScheduleChanges, value]);
        }

        if (optionError) {
            setOptionError('');
        }
    };

    const handleNext = () => {
        if (selectedScheduleChanges.length === 0) {
            setOptionError('아이에게 어려운 일정 변화 상황을 선택해주세요.');
            return;
        }

        router.push({
            pathname: '/childprofile/intellectual/advancenotice',
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
                scheduleChangeOptions: JSON.stringify(selectedScheduleChanges),
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
                    <Text style={styles.progressText}>4/6</Text>

                    <View style={styles.progressTrack}>
                        <View style={styles.progressFill} />
                    </View>
                </View>

                <View style={styles.titleArea}>
                    <Text style={styles.title}>
                        아이가 어려워하는{'\n'}일정 변화가 있나요?
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>어려워하는 상황을 선택해주세요.</Text>

                    <View style={styles.optionGrid}>
                        {scheduleChangeOptions.map((option) => {
                            const selected = selectedScheduleChanges.includes(option.value);

                            return (
                                <DangerOptionCard
                                    key={option.value}
                                    icon={option.icon}
                                    label={option.label}
                                    selected={selected}
                                    onPress={() => toggleItem(option.value)}
                                />
                            );
                        })}
                    </View>
                </View>

                {optionError ? <Text style={styles.errorText}>{optionError}</Text> : null}

                <View style={styles.buttonArea}>
                    <PrimaryButton label="다음" width="100%" onPress={handleNext} />
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
        width: '66.7%',
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
