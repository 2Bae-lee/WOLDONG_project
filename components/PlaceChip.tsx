import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

type PlaceChipProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
    };

export default function PlaceChip({
    label,
    selected,
    onPress,
    }: PlaceChipProps) {
    return (
        <Pressable
        style={[
            styles.chip,
            selected && styles.selectedChip,
        ]}
        onPress={onPress}
        >
        <Text
            style={[
            styles.text,
            selected && styles.selectedText,
            ]}
        >
            {label}
        </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: 18,
        paddingVertical: 10,

        borderRadius: 999,

        backgroundColor: Colors.pageBg3,
    },

    selectedChip: {
        backgroundColor: '#5F6F16',
    },

    text: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.text,
    },

    selectedText: {
        fontFamily: Fonts.bodyBold,
        color: Colors.realwhite,
    },
});
