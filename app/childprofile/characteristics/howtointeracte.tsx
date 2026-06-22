import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import BackButton from '../../../components/BackButton';
import OptionCard from '../../../components/OptionCard';
import PrimaryButton from '../../../components/PrimaryButton';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

type Option = {
  label: string;
  value: string;
};

const guidanceOptions: Option[] = [
  {
    label: '한번에 하나씩\n말해주세요',
    value: 'one_by_one',
  },
  {
    label: '그림이나 사진이 있으면 좋아요',
    value: 'visual_support',
  },
  {
    label: '짧고 쉬운 문장으로\n말해주세요',
    value: 'short_sentence',
  },
  {
    label: '반복 설명이 필요해요',
    value: 'need_repetition',
  },
  {
    label: '선택지로 물어보면\n잘 대답해요',
    value: 'choice_question',
  },
  {
    label: '먼저 보여주고 설명하면\n잘 이해해요',
    value: 'show_first',
  },
];

const communicationOptions: Option[] = [
  {
    label: '문장으로 대답해요',
    value: 'sentence_answer',
  },
  {
    label: '단어로 대답해요',
    value: 'word_answer',
  },
  {
    label: '고개 끄덕임이나\n손짓으로 대답해요',
    value: 'gesture_answer',
  },
  {
    label: '그림/사진 카드가\n필요해요',
    value: 'picture_card',
  },
  {
    label: '네/아니오로\n대답해요',
    value: 'yes_no_answer',
  },
  {
    label: '불편함을 말로\n표현하기 어려워요',
    value: 'hard_to_express',
  },
];

export default function CommunicationProfile() {
  const params = useLocalSearchParams<{
    name?: string;
    profileImage?: string;
    gender?: string;
    birth?: string;
    relationship?: string;
    typeofdisability?: string;
  }>();

  const [selectedGuidance, setSelectedGuidance] = useState<string[]>([]);
  const [selectedCommunication, setSelectedCommunication] = useState<string[]>([]);
  const [optionError, setOptionError] = useState('');

  const toggleItem = (
    value: string,
    selectedList: string[],
    setSelectedList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selectedList.includes(value)) {
      setSelectedList(selectedList.filter((item) => item !== value));
    } else {
      setSelectedList([...selectedList, value]);
    }

    if (optionError) {
      setOptionError('');
    }
  };

  const handleNext = () => {
    if (selectedGuidance.length === 0 && selectedCommunication.length === 0) {
      setOptionError('아이에게 맞는 설명방식 또는 의사소통 방식을 선택해주세요.');
      return;
    }

    router.push({
      pathname: '/childprofile/characteristics/dangerduringoutdoor',
      params: {
        name: params.name ?? '',
        profileImage: params.profileImage ?? '',
        gender: params.gender ?? '',
        birth: params.birth ?? '',
        relationship: params.relationship ?? '',
        typeofdisability: params.typeofdisability ?? '',
        guidanceOptions: JSON.stringify(selectedGuidance),
        communicationOptions: JSON.stringify(selectedCommunication),
      },
    } as any);
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.inner}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.logoArea}>
          <View style={styles.logoRow}>
            <BackButton />
            <Text style={styles.logoTitle}>월동</Text>
            <Image
              source={require('../../../assets/images/canola_flower_small.png')}
              style={styles.logoFlower}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.progressArea}>
          <Text style={styles.progressText}>1/6</Text>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.title}>
            아이에게 어떻게 설명하면{'\n'}잘 이해하나요?
          </Text>

          <Text style={styles.description}>
            설명 방식과 의사소통 방식을 선택해주세요
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>설명방식</Text>

          <View style={styles.optionGrid}>
            {guidanceOptions.map((option) => {
              const selected = selectedGuidance.includes(option.value);

              return (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  selected={selected}
                  onPress={() =>
                    toggleItem(
                      option.value,
                      selectedGuidance,
                      setSelectedGuidance
                    )
                  }
                />
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>의사소통 방식</Text>

          <View style={styles.optionGrid}>
            {communicationOptions.map((option) => {
              const selected = selectedCommunication.includes(option.value);

              return (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  selected={selected}
                  onPress={() =>
                    toggleItem(
                      option.value,
                      selectedCommunication,
                      setSelectedCommunication
                    )
                  }
                />
              );
            })}
          </View>
        </View>

        {optionError ? <Text style={styles.errorText}>{optionError}</Text> : null}

        <View style={styles.buttonArea}>
          <PrimaryButton label="다음" width="100%" onPress={handleNext} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },

  inner: {
    flexGrow: 1,
    paddingBottom: 54,
  },

  container: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.pageBg,
    paddingTop: 10,
    paddingHorizontal: 32,
  },

  logoArea: {
    alignItems: 'flex-start',
    marginBottom: 18,
    marginLeft: -20,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoTitle: {
    fontFamily: Fonts.title,
    fontSize: 32,
    color: Colors.text,
  },

  logoFlower: {
    width: 24,
    height: 24,
    marginLeft: -4,
    marginTop: -20,
    transform: [{ rotate: '-18deg' }],
  },

  progressArea: {
    width: '100%',
    marginBottom: 20,
  },

  progressText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 8,
  },

  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.pageBg2,
  },

  progressFill: {
    width: '16.6%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.highlight1,
  },

  titleArea: {
    alignItems: 'center',
    marginBottom: 28,
  },

  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 34,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 14,
  },

  description: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },

  section: {
    marginBottom: 34,
  },

  sectionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 12,
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },

  optionCard: {
    width: '48%',
    minHeight: 62,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.pageBg3,
    backgroundColor: Colors.pageBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  optionCardSelected: {
    borderColor: Colors.highlight1,
  },

  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.pageBg3,
    backgroundColor: Colors.pageBg2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  checkBoxSelected: {
    backgroundColor: Colors.highlight1,
    borderColor: Colors.highlight1,
  },

  checkText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    fontWeight: '900',
    color: Colors.white ?? '#FFFFFF',
    lineHeight: 18,
  },

  optionText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
    textAlign: 'center',
  },

  errorText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.highlight3,
    marginTop: -10,
    marginBottom: 16,
  },

  buttonArea: {
    marginTop: 'auto',
    marginBottom: 44,
  },
});
