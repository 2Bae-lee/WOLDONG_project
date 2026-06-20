import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

type SelectOptionCardProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
    width?: string;
};

export default function SelectOptionCard({
    label,
    selected,
    onPress,
}: SelectOptionCardProps) {
    return (
        <Pressable
        style={[styles.optionCard, selected && styles.optionCardSelected]}
        onPress={onPress}
        >
        <View style={[styles.checkBox, selected && styles.checkBoxSelected]}>
            {selected ? <Text style={styles.checkText}>✓</Text> : null}
        </View>

        <Text style={styles.optionText}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
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
        color: '#FFFFFF',
    },

    optionText: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.text,
        textAlign: 'center',
    },
});