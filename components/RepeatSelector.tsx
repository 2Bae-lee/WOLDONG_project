import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import {
    RepeatDate,
    RepeatOption,
    formatRepeatSummary,
    repeatOptions,
} from '../constants/Recurrence';

type Props = {
    value: RepeatOption;
    repeatDates: RepeatDate[];
    onChange: (value: RepeatOption) => void;
};

export default function RepeatSelector({ value, repeatDates, onChange }: Props) {
    const selectedOption = repeatOptions.find((option) => option.value === value);

    return (
        <View style={styles.container}>
            <View style={styles.optionGrid}>
                {repeatOptions.map((option) => {
                    const selected = value === option.value;

                    return (
                        <Pressable
                            key={option.value}
                            style={[styles.optionButton, selected && styles.optionButtonSelected]}
                            onPress={() => onChange(option.value)}
                        >
                            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.summaryBox}>
                <Ionicons
                    name={value === 'custom' ? 'calendar-outline' : 'repeat-outline'}
                    size={17}
                    color={Colors.textShadow}
                />
                <View style={styles.summaryTextArea}>
                    <Text style={styles.summaryTitle}>
                        {selectedOption?.description ?? '반복 없이 한 번만 추가돼요.'}
                    </Text>
                    <Text style={styles.summaryDescription}>
                        {formatRepeatSummary(value, repeatDates)}
                    </Text>
                    {value === 'custom' ? (
                        <Text style={styles.customHint}>
                            위 캘린더에서 원하는 날짜를 눌러 선택해주세요.
                        </Text>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },

    optionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    optionButton: {
        minHeight: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
    },

    optionButtonSelected: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF4CF',
    },

    optionText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.text,
    },

    optionTextSelected: {
        color: Colors.text,
    },

    summaryBox: {
        width: '100%',
        minHeight: 64,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        flexDirection: 'row',
        paddingHorizontal: 13,
        paddingVertical: 12,
        marginTop: 10,
    },

    summaryTextArea: {
        flex: 1,
        marginLeft: 9,
    },

    summaryTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
    },

    summaryDescription: {
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 18,
        color: Colors.textShadow,
    },

    customHint: {
        marginTop: 4,
        fontFamily: Fonts.body,
        fontSize: 12,
        lineHeight: 17,
        color: Colors.textShadow,
    },
});
