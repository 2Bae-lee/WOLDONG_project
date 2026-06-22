import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { checkStoredSession } from '../constants/Api';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

export default function SplashScreen() {
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const user = await checkStoredSession();
      if (!mounted) return;

      if (user?.role === 'parent') {
        router.replace('/paraent_home' as any);
        return;
      }

      if (user?.role === 'companion') {
        router.replace('/companion_home' as any);
        return;
      }

      router.replace('/onboarding/one' as any);
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/canola_flower_main.png')}
        style={styles.flower}
      />
      <Text style={styles.title}>월동</Text>
      <Text style={styles.description}>로그인 정보를 확인하고 있어요</Text>
    </View>
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
