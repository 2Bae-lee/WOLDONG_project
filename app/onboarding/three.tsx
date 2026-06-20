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
        <Text style={styles.boldText}>월동</Text>은 그 작은 용기처럼, {'\n'}
          아이의 외출길에 {'\n'}
          <Text style={styles.boldText}>따뜻한 동행</Text>이 되고자 합니다.{'\n'}
        </Text>
      </View>

      <PrimaryButton
        label="회원가입"
        onPress={() => router.push('/signup/signuprole')}
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