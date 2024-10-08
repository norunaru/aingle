import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import calendar from '../../assets/icons/ic_calendar.png';
import location from '../../assets/icons/location.png';
import photoAdd from '../../assets/icons/photoAdd.png';
import distanceImg from '../../assets/icons/distance.png';
import timeImg from '../../assets/icons/ic_time.png';
import calorieImg from '../../assets/icons/ic_calorie.png';
import Modal from '../components/Modal';
import {launchImageLibrary} from 'react-native-image-picker'; // 이미지 선택을 위한 패키지 추가
import greenStar from '../../assets/images/greenStar.png';
import grayStar from '../../assets/images/grayStar.png';

const WritingScreen = ({ navigation, route }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0); // 별점 상태
  const [memo, setMemo] = useState(''); // 메모 상태
  const [selectedImages, setSelectedImages] = useState([]); // 선택된 이미지 상태

  // 전달된 데이터를 가져옵니다.
  const {
    totalDistance = 0,
    caloriesBurned = 0,
    seconds = 0,
    pathCoordinates = [],
    courseName = '',
    endDate = new Date().toISOString(),
  } = route.params || {};

  // endDate를 Date 객체로 변환
  const endDateObj = new Date(endDate);

  // 날짜 형식 변환
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 월은 0부터 시작하므로 1을 더합니다.
    const day = date.getDate();
    return `${year}.${month}.${day}`;
  };

  // 시간을 시:분 형식으로 변환
  const formatTime = (secs) => {
    const hours = parseInt(secs / 3600, 10);
    const minutes = parseInt((secs % 3600) / 60, 10);
    return `${hours}시간 ${minutes}분`;
  };

  // 상태 설정
  const [date, setDate] = useState(formatDate(endDateObj));
  const [locationName, setLocationName] = useState(courseName);
  const [distance, setDistance] = useState((totalDistance / 1000).toFixed(2)); // km 단위
  const [calories, setCalories] = useState(caloriesBurned.toFixed(0)); // kcal
  const [time, setTime] = useState(formatTime(seconds));
  const [path, setPath] = useState(pathCoordinates);

  // 별 클릭 시 호출되는 함수
  const handleStarPress = index => {
    setRating(index); // 클릭한 별의 인덱스(1~5)를 상태에 저장
  };

  // 이미지 선택 핸들러
  const handleSelectImages = () => {
    launchImageLibrary(
      {
        mediaType: 'photo', // 사진만 선택 가능
        selectionLimit: 3, // 최대 3개 선택 가능
      },
      response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.log('ImagePicker Error: ', response.errorMessage);
        } else {
          // 선택된 이미지를 상태에 저장
          const selectedUris = response.assets.map(asset => asset.uri);
          setSelectedImages(selectedUris);
        }
      },
    );
  };

  return (
    <ScrollView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}>
      {/* 모달 */}
      {isModalOpen ? (
        <Modal
          onClose={() => setIsModalOpen(false)}
          boldText={'작성을 중단하시겠어요?'}
          subText={
            '지금 나가면 내용이 저장되지 않으며 추후 마이페이지에서 작성이 가능해요'
          }
          whiteBtnFn={() => setIsModalOpen(false)}
          greenBtnFn={() => navigation.navigate('Tabs')}
          greenBtnText={'끝내기'}
          whiteBtnText={'계속하기'}
        />
      ) : null}

      <SafeAreaView
        style={{padding: 20, backgroundColor: 'white', height: '100%'}}
      >
        <TextInput
          style={styles.textInput}
          placeholder="제목을 입력해 주세요"
          placeholderTextColor="#D9D9D9"
          multiline={true}
          maxLength={120}
          textAlignVertical="top"
        />
        <View style={{flexDirection: 'row', marginVertical: 16}}>
          <View style={{flexDirection: 'row', marginRight: 12}}>
            <Image style={styles.miniIcon} source={calendar} />
            <Text>{date}</Text>
          </View>
          <View style={{flexDirection: 'row'}}>
            <Image style={styles.miniIcon} source={location} />
            <Text>{locationName}</Text>
          </View>
        </View>
        {/* 지도, 정보 박스 */}
        <View>
          <Image
            source={require('../../assets/images/mapmap.png')}
            style={styles.map}
          />
          <View style={styles.detail}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image source={distanceImg} style={styles.icon} />
              <Text style={styles.detailBold}>총 거리</Text>
              <Text style={styles.detailThin}>{distance} km</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image source={timeImg} style={styles.icon} />
              <Text style={styles.detailBold}>총 시간</Text>
              <Text style={styles.detailThin}>{time}</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image source={calorieImg} style={styles.icon} />
              <Text style={styles.detailBold}>소모 칼로리</Text>
              <Text style={styles.detailThin}>{calories} kcal</Text>
            </View>
          </View>
        </View>

        <View style={{marginTop: 20, marginLeft: 8}}>
          <Text style={styles.boldText}>이 코스 어땠나요?</Text>
          {/* starWrap */}
          <View style={styles.starWrap}>
            <View style={styles.starRow}>
              {Array.from({length: 5}, (_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleStarPress(index + 1)}>
                  <Image
                    source={index < rating ? greenStar : grayStar}
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.scoreText}>{rating}점</Text>
          </View>
        </View>

        {/* 메모 */}
        <KeyboardAvoidingView style={styles.memoContainer}>
          <TextInput
            placeholder="메모를 작성하세요"
            style={styles.memo}
            multiline={true}
            scrollEnabled={true} // 내부 스크롤 가능하게 설정
            maxLength={255} // 최대 글자 수 제한
            onChangeText={text => setMemo(text)}
            value={memo}
            textAlignVertical="top"
          />
          {/* 글자수 카운터 표시 */}
          <Text style={styles.charCounter}>
            {memo.length}/255
          </Text>
        </KeyboardAvoidingView>

        <View style={{flexDirection: 'row', marginBottom: 24}}>
          {/* 선택한 이미지들을 표시 */}
          {selectedImages.map((imageUri, index) => (
            <Image key={index} source={{uri: imageUri}} style={styles.photo} />
          ))}
        </View>

        {/* 사진 선택 버튼 */}
        <Pressable onPress={handleSelectImages}>
          <Image source={photoAdd} style={styles.icon} />
        </Pressable>

        <View style={styles.btnWrap}>
          <TouchableOpacity onPress={() => setIsModalOpen(true)}>
            <View style={styles.whiteBtn}>
              <Text style={styles.btnText}>다음에 작성</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Tabs')}>
            <View style={styles.greenBtn}>
              <Text style={styles.btnText}>저장하기</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default WritingScreen;

const styles = StyleSheet.create({
  textInput: {
    borderBottomColor: '#D9D9D9',
    borderBottomWidth: 1,
    padding: 8,
    fontSize: 18,
  },
  miniIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  icon: {
    width: 26,
    height: 26,
    marginRight: 8,
  },
  map: {
    backgroundColor: '#DFE4E7',
    width: '100%',
    height: 265,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
  },
  detail: {
    height: 142,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    padding: 20,
    justifyContent: 'space-between',
  },
  detailBold: {
    fontSize: 15,
    marginRight: 8,
    color: 'black',
  },
  detailThin: {
    fontSize: 13,
  },
  memoContainer: {
    position: 'relative',
    paddingBottom: 15,
  },
  memo: {
    borderBottomColor: '#D9D9D9', 
    borderBottomWidth: 1,
    height: 80,
    maxHeight: 265,
    padding: 8,
    fontSize: 15,
    marginVertical: 14,
  },
  charCounter: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    fontSize: 12,
    color: '#8A8A8A',
  },
  whiteBtn: {
    width: 122,
    height: 52,
    borderColor: '#1ECD90',
    borderWidth: 1,
    marginRight: 8,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: 600,
  },
  greenBtn: {
    width: 205,
    height: 52,
    backgroundColor: '#1ECD90',
    marginRight: 8,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  boldText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: 'black',
  },
  starWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: 28,
    height: 28,
    marginRight: 4,
  },
  scoreText: {
    marginLeft: 4,
    fontSize: 15,
    color: '#202025',
  },
  btnWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 29,
  },
  photo: {
    backgroundColor: 'gray',
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 8,
  },
});
