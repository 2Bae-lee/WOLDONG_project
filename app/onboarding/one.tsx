import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

export default function OnboardingOne() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/canola_flower_main.png')}
          style={styles.flower}
        />
        <Text style={styles.title}>월동</Text>
        <Text style={styles.description}>
          외출 전 안내부터{'\n'}
          동행인 인수인계와 기록까지{'\n'}
          월동이 함께 도와드려요.
        </Text>
      </View>

      <PrimaryButton
        label="시작하기"
        onPress={() => router.push('/onboarding/two')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 180,
    paddingBottom: 54,
  },
  content: {
    alignItems: 'center',
  },
  flower: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 60,
    color: Colors.text,
    marginBottom: 40,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 17,
    lineHeight: 30,
    color: Colors.textShadow,
    textAlign: 'center',
  
  }
});