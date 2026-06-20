import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/Colors';

type Props = {
  label: string;
  onPress: () => void;
  width?: number | `${number}%`;
};

export default function PrimaryButton({
  label,
  onPress,
  width = '82%',
}: Props) {
  return (
    <Pressable style={[styles.button, { width }]} onPress={onPress}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 30,
    backgroundColor: Colors.highlight1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Sumana_700Bold',
    fontSize: 20,
    color: Colors.text,
  },
});