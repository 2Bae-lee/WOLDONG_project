import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

const dangerSituationOptions: Option[] = [
    {
        icon: '🚌',
        label: '차도/차량 위험 인지를 어려워해요',
        value: 'car_danger',
    },
    {
        icon: '🚦',
        label: '신호등/횡단보도 규칙을 어려워해요',
        value: 'crosswalk_danger',
    },
    {
        icon: '🙌',
        label: '낯선 사람을 쉽게 따라갈 수 있어요',
        value: 'stranger_danger',
    },
    {   
        icon: '😕',
        label: '동행인과 떨어지면 위험을 잘 인지하지 못해요',
        value: 'apartfromcompanion_danger',
    },
    {
        icon: '🏃',
        label: '갑자기 뛰어갈 수 있어요',
        value: 'suddenrun_danger',
    },
    {
        icon: '💣',
        label: '위험한 물건을 만질 수 있어요',
        value: 'touch_danger',
    },
];


export default function DangerProfile() {
    const params = useLocalSearchParams<{
        name?: string;
        profileImage?: string;
        gender?: string;
        birth?: string;
        relationship?: string;
        typeofdisability?: string;
        guidanceOptions?: string;
        communicationOptions?: string;
    }>();

    const [selectedDangerSituations, setSelectedDangerSituations]= useState<string[]>([]);
    const [companionAction, setCompanionAction]= useState('');
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
        if (selectedDangerSituations.length === 0 && companionAction.length === 0) {
        setOptionError('주의가 필요한 상황 또는 동행인이 반드시 해야할 행동을 작성해주세요.');
        return;
    }

    router.push({
        pathname: '/childprofile/intellectual/environment',
        params: {
            name: params.name ?? '',
            profileImage: params.profileImage ?? '',
            gender: params.gender ?? '',
            birth: params.birth ?? '',
            relationship: params.relationship ?? '',
            typeofdisability: params.typeofdisability ?? '',
            guidanceOptions: params.guidanceOptions ?? '',
            communicationOptions: params.communicationOptions ?? '',
            dangerSituations: JSON.stringify(selectedDangerSituations),
            companionAction: companionAction,
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
            <Text style={styles.progressText}>2/6</Text>

            <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
            </View>
            </View>

            <View style={styles.titleArea}>
            <Text style={styles.title}>
                외출 중 특히 조심해야할{'\n'}상황이 있나요?
            </Text>
            </View>

            <View style={styles.section}>
            <Text style={styles.sectionTitle}>주의가 필요한 상황을 선택해주세요.</Text>

            <View style={styles.optionGrid}>
                {
                dangerSituationOptions.map((option) => {
                        const selected =
                        selectedDangerSituations.includes(option.value);

                        return (
                        <DangerOptionCard
                            key={option.value}
                            icon={option.icon}
                            label={option.label}
                            selected={selected}
                            onPress={() =>
                            toggleItem(
                                option.value,
                                selectedDangerSituations,
                                setSelectedDangerSituations
                            )
                            }
                        />
                        );
})
}
            </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    동행인이 반드시 해야 할 행동이 있나요? 
                </Text>
                <TextInput
                    style={styles.textArea}
                    multiline
                    placeholder={
                        '예) 손을 꼭 잡고 이동해주세요\n횡단보도 전 반드시 멈춰 설명해주세요'
                    }
                    value={companionAction}
                    onChangeText={setCompanionAction}

                    />
            
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
        width: '33.3%',
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

    description: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
        textAlign: 'center',
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

    optionCard: {
        width: '48%',
        minHeight: 62,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.pageBg3,
        backgroundColor: Colors.pageBg,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },

    optionCardSelected: {
        borderColor: Colors.highlight1,
    },

    checkBox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.pageBg3,
        backgroundColor: Colors.pageBg2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },

    checkBoxSelected: {
        backgroundColor: Colors.highlight1,
        borderColor: Colors.highlight1,
    },

    checkText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.white ?? '#FFFFFF',
        lineHeight: 18,
    },

    optionText: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.text,
        textAlign: 'center',
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
    
    textArea: {
        minHeight: 140,
        borderWidth: 1,
        borderColor: Colors.pageBg3,
        borderRadius: 16,
        backgroundColor: Colors.pageBg,
        padding: 16,
        textAlignVertical: 'top',

        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.text,
},
});