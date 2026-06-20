import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import PlaceChip from '../../../components/PlaceChip';
import PrimaryButton from '../../../components/PrimaryButton';
import SensoryOptionCard from '../../../components/SensoryOptionCard';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

type Option = {
    icon: string;
    label: string;
    value: string;
};

const sensoryOptions: Option[] = [
    {
        icon: '🔉',
        label: '큰 소리',
        value: 'loud_noise',
    },
    {
        icon: '👪',
        label: '사람 많은 곳 ',
        value: 'crowded_place',
    },
    {   
        icon: '💡',
        label: '밝은 빛',
        value: 'light',
    },
    {   
        icon: '👃',
        label: '악취',
        value: 'bad_smell',
    },
    {   
        icon: '👐',
        label: '신체 접촉',
        value: 'body_contact',
    },
    {   
        icon: '⚡',
        label: '갑작스러운\n움직임',
        value: 'movement',
    },
    {   
        icon: '⏲️',
        label: '대기 ',
        value: 'wait',
    },
    {   
        icon: '🚌',
        label: '대중교통',
        value: 'transportation',
    },
    ];

const placeOptions = [
    '지하철',
    '차', 
    '새로운 장소',
    '병원',
    '식당',
    '버스',
    '마트',
    '놀이공원',
    '영화관/공연장',
];

export default function EnvironmentProfile() {
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
    }>();

    const [selectedSensory, setSelectedSensory] = useState<string[]>([]);
    const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
    const [optionError, setOptionError] = useState('');

    const toggleItem = (
        value: string,
        selectedList: string[],
        setSelectedList: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        if (selectedList.includes(value)) {
        setSelectedList(selectedList.filter((item) => item !== value));
        } else {
        setSelectedList([...selectedList, value]);
        }

        if (optionError) {
        setOptionError('');
        }
    };

    const handleNext = () => {
        if (
            selectedSensory.length === 0 &&
            selectedPlaces.length === 0
            ) {
            setOptionError(
                '힘들어하는 환경 또는 장소를 선택해주세요.'
            );
            return;
}

        router.push({
        pathname: '/childprofile/intellectual/dangerduringoutdoor',
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
            sensoryOptions: JSON.stringify(selectedSensory),
            placeOptions: JSON.stringify(selectedPlaces),
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
                source={require('../../assets/images/canola_flower_small.png')}
                style={styles.logoFlower}
                resizeMode="contain"
                />
            </View>
            </View>

            <View style={styles.progressArea}>
            <Text style={styles.progressText}>3/6</Text>

            <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
            </View>
            </View>

            <View style={styles.titleArea}>
            <Text style={styles.title}>
                아이가 힘들어하는{'\n'}환경이 있나요?
            </Text>
            </View>

            <View style={styles.section}>
            <Text style={styles.sectionTitle}>힘들어하는 감각 자극</Text>

            <View style={styles.grid}>
                {sensoryOptions.map((option) => {
                    const selected =
                    selectedSensory.includes(option.value);

                    return (
                    <SensoryOptionCard
                        key={option.value}
                        icon={option.icon}
                        label={option.label}
                        selected={selected}
                        onPress={() =>
                        toggleItem(
                            option.value,
                            selectedSensory,
                            setSelectedSensory
                        )
                        }
                    />
                    );
                })}
</View>
            </View>

            <View style={styles.section}>
            <Text style={styles.sectionTitle}>힘들어하는 장소</Text>
            <View style={styles.chipContainer}>
                {placeOptions.map((place) => {
                    const selected =
                    selectedPlaces.includes(place);

                    return (
                    <PlaceChip
                        key={place}
                        label={place}
                        selected={selected}
                        onPress={() =>
                        toggleItem(
                            place,
                            selectedPlaces,
                            setSelectedPlaces
                        )
                        }
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
        width: '50%',
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
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 14,
    },
});