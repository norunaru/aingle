import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import timerIcon from '../../assets/icons/ic_time.png';
import startIcon from '../../assets/icons/ic_start.png';
import stopIcon from '../../assets/icons/ic_stop.png';
import pauseIcon from '../../assets/icons/ic_pause.png';
import calorieIcon from '../../assets/icons/ic_calorie.png';
import distIcon from '../../assets/icons/distance.png';
import Modal from '../components/Modal';
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
} from 'react-native-responsive-dimensions';

const PloggingScreen = ({navigation}) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (secs) => {
    const time = parseInt(secs / 60) + ':' + parseInt(secs % 60)

    return time.replace(/\b(\d)\b/g, '0$1');
  };

  const onCountdownFinish = () => {
    setIsCountdownComplete(true);
    setIsRunning(true);
  };

  return (
    <View style={styles.wrap}>
      {isModalOpen ? (
        <Modal
          onClose={() => setIsModalOpen(false)}
          boldText={'플로깅을 끝내시겠어요?'}
          subText={
            '현재 진행한 코스까지만 기록돼요'
          }
          whiteBtnFn={() => setIsModalOpen(false)}
          greenBtnFn={() => navigation.navigate('Writing')}
          greenBtnText={'끝내기'}
          whiteBtnText={'계속하기'}
        />
      ) : null}

      <Text style={styles.topText}>A코스에서 플로깅 하고있어요</Text>
      <View style={styles.timerContainer}>
        <Image source={timerIcon} style={{width:27, height:27}}/>
        <Text style={styles.timerText}>{formatTime(seconds)}</Text>
      </View>
      <View style={styles.mapContainer}>
        <Image 
          source={require('../../assets/images/mapmap.png')}
          style={styles.mapImage}
        />
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.textCont}>
          <Image source={distIcon} style={{width:27, height:27, marginTop: 4}}/>
          <Text style={styles.infoText}>현재 이동 거리</Text>
          <Text style={styles.numText}>3km</Text>
        </View>
        <View style={styles.textCont}>
          <Image source={calorieIcon} style={{width:27, height:27, marginTop: 4}}/>
          <Text style={styles.infoText}>소모 칼로리</Text>
          <Text style={styles.numText}>150kcal</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.endButton}
          onPress={() => setIsModalOpen(true)}
        >
          <Image source={stopIcon} style={{width:21, height:21, marginTop: 3.5}}/>        
          <Text style={styles.endButtonText}>끝내기</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isRunning ? '#E7F7EF' : '#1ECD90', borderWidth: isRunning ? 2 : 0 }]} 
          onPress={() => setIsRunning(!isRunning)}
        >
          <Image source={isRunning ? pauseIcon : startIcon} style={{ width: 21, height: 21, marginTop: 4 }} />
          <Text style={[styles.actionButtonText, { color: isRunning ? '#00A68A' :  '#FFFFFF'}]}>
            {isRunning ? '잠시 멈추기' : '이어하기'}
          </Text>
        </TouchableOpacity>
      </View>
      {!isCountdownComplete && (
        <View style={styles.overlay}>
          <LottieView
            source={require('../../assets/animation/countdown.json')}
            autoPlay
            loop={false}
            onAnimationFinish={onCountdownFinish} // 애니메이션이 끝나면 타이머 시작
            style={styles.lottie}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#DFE4E7',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 200,
    height: 200,
  },
  topText: {
    color: 'black',
    fontSize: responsiveFontSize(2.2),
    fontWeight: 'bold',
    marginTop: 40,
    textAlign: 'center',
  },
  timerContainer: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    width: 217,
    height: 89,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  timerText: {
    fontSize: responsiveFontSize(3.2),
    fontWeight: 'bold',
    color: '#017978',
  },
  mapContainer: {
    marginTop: 20,
    width: '90%',
    height: 300,
    backgroundColor: '#DFE4E7',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapImage: {
    width: '110%',
    height: '90%',
  },
  infoContainer: {
    width: '90%',
    height: 100,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  textCont: {
    flexDirection: 'row',
    marginVertical: 1.4,
  },
  infoText: {
    fontSize: responsiveFontSize(1.8),
    color: 'black',
    fontWeight: '500',
    paddingVertical: 7,
    marginLeft: 10,
  },
  numText: {
    fontSize: responsiveFontSize(1.7),
    color: '#3F3F47',
    paddingVertical: 7,
    marginLeft: 6,
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  endButton: {
    backgroundColor: '#FFFFFF',
    width: 127,
    height: 70,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  endButtonText: {
    fontSize: responsiveFontSize(1.8),
    fontWeight: 'bold',
    color: '#9B9BA3',
    marginLeft: 7,
  },
  actionButton: {
    width: 226,
    height: 70,    
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    borderColor: '#1ECD90',
  },
  actionButtonText: {
    fontSize: responsiveFontSize(1.8),
    fontWeight: 'bold',
    marginLeft: 7,
  },
});

export default PloggingScreen;
