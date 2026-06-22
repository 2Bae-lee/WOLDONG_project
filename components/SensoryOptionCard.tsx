import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

type SensoryOptionCardProps = {
    icon: string;
    label: string;
    selected: boolean;
    onPress: () => void;
};

export default function SensoryOptionCard({
    icon,
    label,
    selected,
    onPress,
    }: SensoryOptionCardProps) {
    return (
        <Pressable
        style={[
            styles.container,
            selected && styles.selectedContainer,
        ]}
        onPress={onPress}
        >
        <View style={styles.content}>
            <Text style={styles.icon}>
                {icon}
            </Text>

            <Text style={styles.label}>
                {label}
            </Text>
        </View>

        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '48%',
        minHeight: 104,
        borderWidth: 1,
        borderColor: Colors.pageBg3,
        borderRadius: 12,
        backgroundColor: Colors.pageBg,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },

    selectedContainer: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF8E3',
    },

    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    icon: {
        fontSize: 28,
        marginBottom: 8,
    },

    label: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.text,
        textAlign: 'center',
        lineHeight: 18,
    },

});
