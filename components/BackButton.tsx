import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

type BackButtonProps = {
    onPress?: () => void;
};

export default function BackButton({ onPress }: BackButtonProps) {
    return (
        <Pressable
            style={styles.button}
            onPress={onPress ?? (() => router.back())}
            hitSlop={10}
        >
            <Text style={styles.icon}>‹</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.pageBg2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    icon: {
        fontFamily: Fonts.bodyBold,
        fontSize: 28,
        lineHeight: 30,
        color: Colors.text,
        marginTop: -2,
    },
});
