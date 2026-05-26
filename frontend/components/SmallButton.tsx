import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/Colors';

type Props = {
  label: string;
  onPress: () => void;
};

export default function SmallButton({ label, onPress }: Props) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '82%',
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.pageBg4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Sumana_700Bold',
    fontSize: 17,
    color: Colors.text,
  },
});