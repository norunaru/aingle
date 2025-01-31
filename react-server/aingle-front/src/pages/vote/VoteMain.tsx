import { useNavigate } from "react-router-dom";
import Trophy_voteMian from "../../assets/icons/Trophy_voteMian.png";
import {
  CharacterGetPublicResponseDto,
  VoteCharacterDetail,
} from "../../model/vote";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "../../styles/CustomSwiper.css";
import { useState, useEffect } from "react";
import {
  doVote,
  getExpireTime,
  getVoteCharacter,
  getVoteCharacterDetail,
} from "../../api/voteAPI";

const VoteMain = () => {
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [expireTime, setExpireTime] = useState<string>(""); // 종료 시간
  const [timeLeft, setTimeLeft] = useState<string>(""); // 남은 시간 표시
  const [isDisable, setIsDisable] = useState(false);
  const [CharacterInfo, setCharacterInfo] =
    useState<VoteCharacterDetail | null>(null);
  const [characters, setCharacters] =
    useState<CharacterGetPublicResponseDto | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState(3);
  const [opacity, setOpacity] = useState(0);

  // 종료 시간 가져오기
  useEffect(() => {
    const fetchTime = async () => {
      const response = await getExpireTime();
      setExpireTime(response);
    };
    fetchTime();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDisable(false);
    }, 1600); // 1.6초 뒤 실행
    return () => clearTimeout(timer);
  }, [isDisable]);

  // 남은 시간 계산
  useEffect(() => {
    if (!expireTime) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const endTime = new Date(expireTime);
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("투표가 종료되었습니다.");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${days > 0 ? `${days}일 ` : ""}${hours
          .toString()
          .padStart(2, "0")}시간 ${minutes
          .toString()
          .padStart(2, "0")}분 ${seconds.toString().padStart(2, "0")}초`
      );
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer); // 컴포넌트 언마운트 시 타이머 해제
  }, [expireTime]);

  const handleClick = () => {
    setIsVisible(true);
    setPosition(16);
    setOpacity(1);
  };

  const handleBackClick = () => {
    navigate("/vote");
  };

  const handleSelect = (id: number) => {
    setSelectedId(id);
  };

  const vote = async (id: number) => {
    setIsDisable(true);
    if (id === -1) {
      return;
    }
    try {
      const data = await doVote(id);
      setVoteCount(data.totalVoteCount);
    } catch (error: any) {
      if (error.status === 409) {
        console.error("중복 투표 오류: ", error);
        handleClick();
      } else {
        console.error("투표 실패: ", error);
      }
    }
  };

  const getsetCharacterInfo = async (id: number) => {
    try {
      const data = await getVoteCharacterDetail(id);
      setCharacterInfo(data);
      setVoteCount(data.voteCount);
    } catch (error) {
      console.error("투표 선택된 캐릭터 상세 조회 실패: ", error);
    }
  };

  const fetchCharacter = async () => {
    try {
      const data = await getVoteCharacter();
      setCharacters(data);
    } catch (error) {
      console.error("투표 캐릭터 리스트 조회 실패: ", error);
    }
  };

  useEffect(() => {
    if (selectedId != null) {
      getsetCharacterInfo(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchCharacter();
  }, []);

  useEffect(() => {
    if (isVisible) {
      const timeoutId = setTimeout(() => {
        setOpacity(0);
        setPosition(3);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isVisible]);

  return (
    <div className="bg-[#ffe8f1] min-h-screen w-full flex flex-col">
      <div className="bg-[#ffe8f1]  w-full px-[16px] pb-[15px] flex flex-col items-center relative">
        <div className="w-full flex justify-between items-center mt-[30px] mb-[30px]">
          <button className="text-[#fb599a] text-lg" onClick={handleBackClick}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
        <div>
          {/* 남은 시간 */}
          <h2 className="text-main-color text-lg font-semibold">
            남은 시간: {timeLeft}
          </h2>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-white h-[90px] flex flex-col justify-center items-center rounded-2xl">
          <div className="flex flex-row justify-center items-center">
            <div>
              <h1 className="text-main-color font-bold text-[20px]">
                이번 달 앵표
              </h1>
            </div>
            <div className="ml-1 mt-1">
              <img src={Trophy_voteMian} alt="" className="w-[40px]" />
            </div>
          </div>
          <div className="flex justify-center items-center mt-1 text-[#bdbdbd] text-[14px] font-semibold">
            <h1>가장 사용해 보고 싶은 캐릭터를 골라주세앵</h1>
          </div>
        </div>
      </div>

      <div className="w-full h-[150px] max-w-3xl pt-8 pb-2 px-4 flex flex-col items-center">
        {characters != null && characters.allCharacterDtos.length === 0 ? (
          <p className="text-gray-500 text-lg">투표항목이 없어요</p>
        ) : (
          <Swiper
            slidesPerView={4}
            spaceBetween={8}
            pagination={{ clickable: true }}
            modules={[Pagination]}
            className="w-full h-full "
          >
            {characters != null &&
              characters.allCharacterDtos.map((character, index) => (
                <SwiperSlide key={character.characterId}>
                  <div
                    onClick={() => handleSelect(character.characterId)}
                    className={`relative w-[65px] p-1 bg-white rounded-xl flex items-center justify-center shadow-md cursor-pointer ${
                      selectedId === character.characterId
                        ? "border-2 border-red-500"
                        : index === 0
                        ? "border-2 border-purple-950"
                        : ""
                    }`}
                  >
                    {index === 0 && (
                      <span className="absolute bottom-[-25px] font-bold text-[12px] text-transparent bg-gradient-to-r from-[#5de7d3] to-[#f3b15e] bg-clip-text px-1 py-0.5 rounded-md">
                        현재 1위
                      </span>
                    )}
                    <img
                      src={character.imageUrl}
                      alt={`Character ${character.characterId}`}
                      className="w-[60px] h-[60px] rounded-xl object-cover"
                    />
                  </div>
                </SwiperSlide>
              ))}
          </Swiper>
        )}
      </div>
      <div className="w-full px-4 flex flex-col justify-center items-center gap-4 relative">
        {selectedId == null ? (
          <div className="bg-white w-full h-[175px] flex rounded-2xl px-4 justify-center items-center">
            <h1 className="font-hakgyo text-main-color text-[18px]">
              캐릭터를 선택해 확인해보세요!
            </h1>
          </div>
        ) : (
          <div className="bg-white w-full h-[275px] flex rounded-2xl px-4">
            <div className="absolute top-4 right-10 flex items-center space-x-1 text-gray-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-[18px] w-[18px] text-main-color"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>

              <span className="text-sm font-medium font-hakgyo">
                {voteCount} 득표
              </span>
            </div>
            <div className="w-1/4 flex justify-center pt-[45px]">
              <div className="border-[1.5px] bg-white border-main-color rounded-full w-[60px] h-[60px] overflow-hidden">
                <img
                  src={CharacterInfo?.imageUrl}
                  alt="이미지 설명"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="w-3/4">
              <div className="h-1/4 text-[18px] pl-3 font-extrabold flex pt-10">
                {CharacterInfo?.name}
              </div>
              <div className="font-bold text-main-color text-[14px] flex pt-[5px] pb-[5px] pl-3 flex-wrap">
                <div className="mr-2">#{CharacterInfo?.age}세</div>
                <div className="mr-2">#{CharacterInfo?.job}</div>
                <div className="mr-2">#{CharacterInfo?.personality}</div>
                <div className="mr-2">#{CharacterInfo?.talkType}</div>
              </div>
              <div className="pl-3 h-[60px] font-semibold text-[20px] flex justify-start items-center">
                <h1>{CharacterInfo?.summary}</h1>
              </div>
              <div className="flex justify-end items-end pt-5">
                <h1 className="text-[12px] text-slate-400">
                  제작자: {CharacterInfo?.memberName}
                </h1>
              </div>
            </div>
          </div>
        )}
        <button
          className="bg-main-color font-semibold text-white rounded-2xl w-full h-[50px]"
          onClick={() => vote(selectedId != null ? selectedId : -1)}
          disabled={isDisable}
        >
          투표하기
        </button>
        {isVisible && (
          <div
            className="absolute transition-all duration-500 ease-out"
            style={{ bottom: `${position}px`, opacity }}
            onTransitionEnd={() => {
              if (opacity === 0) setIsVisible(false);
            }}
          >
            <h1 className="bg-[#f7b9e8] font-hakgyo text-center text-main-color px-4 py-2 rounded-md w-[250px] h-[40px]">
              투표는 하루에 한 번 가능합니다!
            </h1>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteMain;
