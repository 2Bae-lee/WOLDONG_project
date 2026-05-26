import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

export default function SignupRole() {
  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <View style={styles.logoRow}>
            <Text style={styles.title}>월동</Text>
            <Image
                source={require('../../assets/images/canola_flower_small.png')}
                style={styles.logoFlower}
                resizeMode="contain"
            />
        </View>
    </View>

      <View style={styles.content}>
        <Text style={styles.question}>어떤 역할로 시작하시나요?</Text>

        <Pressable
          style={[styles.roleCard, styles.guardianCard]}
          onPress={() => router.push('/signup/parent/email')}
        >
          <View style={styles.iconCircle}>
            <Image
          source={require('../../assets/images/icon_family.png')}
          style={styles.roleIcon}
          resizeMode="contain"
        />
          </View>

          <View>
            <Text style={styles.roleTitle}>보호자</Text>
            <Text style={styles.roleDescription}>
              아이의 일정을 관리하고 {'\n'}
              준비를 도와주세요
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.roleCard, styles.companionCard]}
          onPress={() => router.push('/signup/companion/email')}
        >
          <View style={styles.iconCircle}>
          <Image
          source={require('../../assets/images/icon_companion.png')}
          style={styles.roleIcon}
          resizeMode="contain"
        />
          </View>
        
          <View>
            <Text style={styles.roleTitle}>동행인</Text>
            <Text style={styles.roleDescription}>
              아이와 함께 외출하고{'\n'}
              지원을 도와주세요.
            </Text>
          </View>
        </Pressable>
      </View>

      <Pressable onPress={() => router.push('/login')}>
        <Text style={styles.loginText}>로그인</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 70,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 30,
  },
  
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  title: {
    fontFamily: Fonts.title,
    fontSize: 60,
    color: Colors.text,
    marginBottom: -10,
  },
  
  logoFlower: {
    width: 60,
    height: 60,
    marginLeft: -20,
    marginTop: -50,
    transform: [{ rotate: '-18deg' }],
  },

  content: {
    width: '100%',
    alignItems: 'center',
  },
  question: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 17,
    color: Colors.text,
    marginBottom: 22,
  },
  roleCard: {
    width: 340,
    height: 100,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 30,
  },
  guardianCard: {
    backgroundColor: Colors.pageBg2,
  },
  companionCard: {
    backgroundColor: Colors.pageBg4,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 23,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20, 
    marginRight: 40,
  },
  iconText: {
    fontSize: 22,
  },
  roleTitle: {
    fontFamily: Fonts.bodyBold,
    fontWeight: '900',
    fontSize: 17,
    color: Colors.text,
    marginBottom: 10,
  },
  roleDescription: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 17,
    color: Colors.textShadow,
  },
  loginText: {
    marginTop: 'auto',
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textShadow,
    textDecorationLine: 'underline',
  },

  roleIcon: {
    width: 70,
    height: 70,
  },
});