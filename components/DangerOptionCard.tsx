import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

type DangerOptionCardProps = {
    icon: string;
    label: string;
    selected: boolean;
    onPress: () => void;
};

export default function DangerOptionCard({
    icon,
    label,
    selected,
    onPress,
}: DangerOptionCardProps) {
    return (
        <Pressable
        style={[
            styles.container,
            selected && styles.containerSelected,
        ]}
        onPress={onPress}
        >
        <View style={styles.leftArea}>
            <Text style={styles.icon}>{icon}</Text>

            <Text style={styles.label}>
            {label}
            </Text>
        </View>

        <View
            style={[
            styles.checkBox,
            selected && styles.checkBoxSelected,
            ]}
        >
            {selected && (
            <Text style={styles.checkText}>✓</Text>
            )}
        </View>
        </Pressable>
    );
    }

const styles = StyleSheet.create({
    container: {
        width: '100%',
        minHeight: 64,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        paddingVertical: 14,
        paddingHorizontal: 12,

        borderBottomWidth: 1,
        borderBottomColor: Colors.pageBg3,
    },

    containerSelected: {},

    leftArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
    },

    icon: {
        fontSize: 26,
        marginRight: 14,
    },

    label: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 16,
        lineHeight: 24,
        color: Colors.text,
    },

    checkBox: {
        width: 36,
        height: 36,

        borderRadius: 10,

        borderWidth: 1,
        borderColor: Colors.pageBg3,

        backgroundColor: Colors.pageBg2,

        alignItems: 'center',
        justifyContent: 'center',
    },

    checkBoxSelected: {
        backgroundColor: Colors.highlight1,
        borderColor: Colors.highlight1,
    },

    checkText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 18,
        color: '#FFFFFF',
    },
});