import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

export default function SplashScreen() {
  const handlePress = () => {
    router.push('/onboarding/one' as any );
  }

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Image
        source={require('../assets/images/canola_flower_main.png')}
        style={styles.flower}
      />
      <Text style={styles.title}>월동</Text>
      <Text style={styles.description}>화면을 눌러 시작하기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  flower: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 80,
    color: Colors.text,
  },
  description:{
    fontFamily: Fonts.body,
    fontSize: 15, 
    color: Colors.textShadow,
    marginTop: 40,
  }
});