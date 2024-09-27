import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  Button,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import TopBar from '../components/TopBar';
import Weather from '../components/Weather';
import locationCourse from '../../assets/icons/locationCourse.png';
import music from '../../assets/icons/ic_music.png';
import LoginScreen from './LoginScreen';
import running from '../../assets/images/img_home_running.png';
import FriendCard from '../components/cards/FriendCard';

export default function MyPageScreen() {
  return (
    <SafeAreaView style={{flex: 1, paddingTop: 60}}>
      <TopBar />
      <ScrollView>
        <View style={styles.whiteWrap}>
          <View style={styles.greenCard}>
            <Image source={running} style={styles.runImg} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 28,
              }}>
              <Text style={{fontSize: 22, fontWeight: 'bold', color: 'black'}}>
                최승빈님
              </Text>
              <View style={styles.levelBadge}>
                <Text style={{fontSize: 11, color: 'white'}}>4레벨 플로거</Text>
              </View>
            </View>
            <Text style={{fontSize: 15, color: 'black'}}>
              지금까지 {'\n'}??번의 플로깅을 완료했어요
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text style={{fontSize: 16, fontWeight: 'bold', color: 'black'}}>
              플로거 친구들
            </Text>
            <Pressable>
              <Text style={{color: '#4879FF', fontSize: 11}}>친구관리</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.friendsWrap}>
              <FriendCard level={6} name={'재준소'} profile={'jaejun'} />
              <FriendCard level={4} name={'용훈'} profile={'yonghoon'} />
              <FriendCard level={999} name={'가원선장'} profile={'gawon'} />
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  whiteWrap: {
    backgroundColor: 'white',
    padding: 20,
    borderTopColor: '#D9D9D9',
    borderTopWidth: 1,
  },
  greenCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#E7F7EF',
    borderColor: '#7BE6B4',
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    marginBottom: 20,
  },
  levelBadge: {
    backgroundColor: '#1ECD90',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    justifyContent: 'center',
    alignContent: 'center',
    marginLeft: 8,
    marginTop: 12,
  },
  runImg: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  friendsWrap: {
    flex: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    marginTop: 8,
  },
});
