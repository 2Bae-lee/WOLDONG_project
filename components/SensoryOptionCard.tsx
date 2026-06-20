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
        <Text style={styles.icon}>
            {icon}
        </Text>

        <Text style={styles.label}>
            {label}
        </Text>

        <View style={styles.checkArea}>
            {selected ? (
            <Text style={styles.checkText}>✓</Text>
            ) : null}
        </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '23%',
        aspectRatio: 1,

        borderWidth: 1,
        borderColor: Colors.pageBg3,
        borderRadius: 18,

        backgroundColor: Colors.pageBg,

        alignItems: 'center',
        justifyContent: 'center',

        padding: 10,
    },

    selectedContainer: {
        borderColor: Colors.highlight1,
        backgroundColor: '#FFF8E3',
    },

    icon: {
        fontSize: 32,
        marginBottom: 16,
    },

    label: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.text,
        textAlign: 'center',
        lineHeight: 20,
    },

    checkArea: {
        height: 20,
        marginTop: 10,
    },

    checkText: {
        color: Colors.highlight1,
        fontSize: 18,
        fontWeight: 'bold',
    },
});