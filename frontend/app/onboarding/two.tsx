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
          source={require('../../assets/images/canola_sprig_vertical.png')}
          style={styles.flower}
        />
        <Text style={styles.title}>유채꽃</Text>
        <Text style={styles.description}>
        <Text style={styles.boldText}>유채꽃</Text>은 겨울을 견디고 피어나는 꽃입니다.{'\n'}
          차가운 시간을 지나 싹을 틔우고, {'\n'}
          마침내 <Text style={styles.boldText}>'쾌활'</Text>과 <Text style={styles.boldText}>'명량함'</Text>이라는 꽃말처럼 {'\n'}
          환한 노란빛으로 세상을 마주합니다.{'\n'}
        </Text>
      </View>

      <PrimaryButton
        label="시작하기"
        onPress={() => router.push('/onboarding/three')}
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
    height: 250,
    marginBottom: -30,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 60,
    color: Colors.text,
    marginBottom: 20,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 17,
    lineHeight: 30,
    color: Colors.textShadow,
    textAlign: 'center',
  }, 
  boldText: {
    fontFamily: Fonts.bodyBold,
    fontWeight: '900',
    color: Colors.text,
  },
});