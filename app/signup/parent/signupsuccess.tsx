import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../../components/PrimaryButton';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

export default function OnboardingOne() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../../assets/images/canola_sprig_vertical.png')}
          style={styles.flower}
        />
        <Text style={styles.title}>월동</Text>
        <Text style={styles.description}>
        <Text style={styles.boldText}>회원가입이 완료되었습니다.</Text>{'\n'}
          로그인 화면으로 이동합니다. {'\n'}
        </Text>
      </View>

      <PrimaryButton
        label="이동"
        onPress={() => router.push('/login')}
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