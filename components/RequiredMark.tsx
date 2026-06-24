import { StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/Colors';

export default function RequiredMark() {
    return <Text style={styles.mark}> *</Text>;
}

const styles = StyleSheet.create({
    mark: {
        color: Colors.highlight3,
    },
});
