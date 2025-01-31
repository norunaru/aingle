package com.aintopia.aingle.character.service;

import com.aintopia.aingle.character.domain.Character;
import com.aintopia.aingle.character.domain.CharacterImage;
import com.aintopia.aingle.character.dto.AllCharacterDto;
import com.aintopia.aingle.character.dto.CharacterImageDto;
import com.aintopia.aingle.character.dto.CharacterInfo;
import com.aintopia.aingle.character.dto.request.CharacterCreateRequest;
import com.aintopia.aingle.character.dto.request.CharacterSurveyRequestDto;
import com.aintopia.aingle.character.dto.response.*;
import com.aintopia.aingle.character.exception.CharacterCreateLimitException;
import com.aintopia.aingle.character.exception.CharacterForbiddenException;
import com.aintopia.aingle.character.exception.NotFoundCharacterException;
import com.aintopia.aingle.character.repository.CharacterImageRepository;
import com.aintopia.aingle.character.repository.CharacterRepository;
import com.aintopia.aingle.chat.domain.ChatRoom;
import com.aintopia.aingle.chat.repository.ChatRoomRepository;
import com.aintopia.aingle.comment.domain.Comment;
import com.aintopia.aingle.comment.repository.CommentRepository;
import com.aintopia.aingle.common.openai.OpenAIClient;
import com.aintopia.aingle.common.service.S3Service;
import com.aintopia.aingle.follow.domain.Follow;
import com.aintopia.aingle.follow.exception.FollowDuplicateException;
import com.aintopia.aingle.follow.repository.FollowRepository;
import com.aintopia.aingle.member.domain.Member;
import com.aintopia.aingle.member.exception.NotFoundMemberException;
import com.aintopia.aingle.member.repository.MemberRepository;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

import com.aintopia.aingle.post.domain.Post;
import com.aintopia.aingle.post.dto.MyPagePostDto;
import com.aintopia.aingle.post.repository.PostRepository;
import com.aintopia.aingle.reply.domain.Reply;
import com.aintopia.aingle.reply.repository.ReplyRepository;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CharacterService {

    private final CharacterRepository characterRepository;
    private final CharacterImageRepository characterImageRepository;
    private final ModelMapper mapper;
    private final MemberRepository memberRepository;
    private final FollowRepository followRepository;
    private final S3Service s3Service;
    private final PostRepository postRepository;
    private final OpenAIClient openAIClient;
    private final CommentRepository commentRepository;
    private final ReplyRepository replyRepository;
    private final ChatRoomRepository chatRoomRepository;
    private static final int MAX_RETRIES = 1;

    public CharacterSurveyResponseDto getCharacterSurvey(CharacterSurveyRequestDto requestDto) {
        int ei = requestDto.getEi(); // E: 0, I: 1
        int sn = requestDto.getSn(); // S: 0, N: 1
        int tf = requestDto.getTf(); // T: 0, F: 1
        int jp = requestDto.getJp(); // J: 0, P: 1

        int combination = (ei << 3) | (sn << 2) | (tf << 1) | jp;

        Long characterId = getCharacterIdByCombination(combination);
        CharacterSurveyResponseDto characterSurveyResponseDto = mapper.map(
            characterRepository.findById(characterId)
                .orElseThrow(() -> new NoSuchElementException(
                    "Character not found with id: " + characterId)),
            CharacterSurveyResponseDto.class
        );

        // CharacterImage에서 imageUrl 설정
        CharacterImage characterImage = characterImageRepository.findById(characterId)
            .orElseThrow(() -> new NoSuchElementException(
                "Image not found for character with id: " + characterId));

        characterSurveyResponseDto.setImageUrl(characterImage.getImageUrl());

        return characterSurveyResponseDto;

    }

    private Long getCharacterIdByCombination(int combination) {
        switch (combination) {
            case 0b0000: // 0
                return 2L; // ESTJ
            case 0b0001: // 1
                return 4L; // ESTP
            case 0b0010: // 2
                return 4L; // ESFJ
            case 0b0011: // 3
                return 1L; // ESFP
            case 0b0100: // 4
                return 2L; // ENTJ
            case 0b0101: // 5
                return 3L; // ENTP
            case 0b0110: // 6
                return 3L; // ENFJ
            case 0b0111: // 7
                return 1L; // ENFP
            case 0b1000: // 8
                return 2L; // ISTJ
            case 0b1001: // 9
                return 6L; // ISTP
            case 0b1010: // 10
                return 4L; // ISFJ
            case 0b1011: // 11
                return 1L; // ISFP
            case 0b1100: // 12
                return 6L; // INTJ
            case 0b1101: // 13
                return 3L; // INTP
            case 0b1110: // 14
                return 5L; // INFJ
            case 0b1111: // 15
                return 5L; // INFP
            default:
                throw new IllegalArgumentException("Invalid MBTI combination");
        }
    }

    @Transactional(readOnly = true)
    public AllCharacterResponse getAllCharacter(Long memberId) {
        Member member = memberRepository.findById(memberId)
            .orElseThrow(NotFoundMemberException::new);
        List<AllCharacterDto> allCharacterDtos = new ArrayList<>();
        //공개된 캐릭터와 삭제되지 않은 캐릭터만 조회
        List<Character> publicCharacters = characterRepository.findByIsPublicTrueAndIsDeletedFalse();

        for (Character character : publicCharacters) {
            CharacterImage characterImage = characterImageRepository.findById(
                character.getCharacterId()).orElseThrow(NotFoundCharacterException::new);
            // 팔로우 여부
            boolean isFollow = followRepository.findByMemberAndCharacter(member, character)
                .isPresent();
            AllCharacterDto allCharacterDto = AllCharacterDto.builder()
                .character(character)
                .imageUrl(characterImage.getImageUrl())
                .isFollow(isFollow)
                .build();
            allCharacterDtos.add(allCharacterDto);
        }

        return new AllCharacterResponse(allCharacterDtos);

    }

    @Transactional(readOnly = true)
    public CharacterDetailResponse getCharacterDetailById(Long characterId) {
        Character character = characterRepository.findById(characterId)
            .orElseThrow(NotFoundCharacterException::new);
        //삭제된 캐릭터 예외처리
        if (character.getIsDeleted()) {
            throw new NotFoundCharacterException();
        }

        CharacterImage characterImage = characterImageRepository.findById(characterId)
            .orElseThrow(NotFoundCharacterException::new);
        return CharacterDetailResponse.builder()
            .character(character)
            .imageUrl(characterImage.getImageUrl())
            .build();
    }

    @Transactional
    public CharacterCreateResponseDto createCharacter(Long memberId,
        CharacterCreateRequest characterCreateRequest, MultipartFile file) throws IOException {
        Member member = memberRepository.findById(memberId)
            .orElseThrow(NotFoundMemberException::new);

        // 한 사람 당 3개만 생성 가능 (삭제된 캐릭터 제외)
        int characterCnt = characterRepository.countByMemberAndIsDeletedFalse(member);
        if (characterCnt == 3) {
            throw new CharacterCreateLimitException();
        }

        // 이미지가 있는 경우 S3에 업로드 후 URL 저장
        String imageUrl = null;
        if (file != null && !file.isEmpty()) {
            imageUrl = s3Service.uploadFile(file);
        }

        //캐릭터 저장
        Character saveCharacter = characterRepository.save(Character.builder()
            .characterCreateRequest(characterCreateRequest)
            .member(member)
            .build());
        //AI 캐릭터 한 줄 요약 생성
        generateSummary(saveCharacter);
        // 비동기로 AI 게시글 생성
        openAIClient.generatePost(saveCharacter);

        log.info("캐릭터 저장 : " + saveCharacter.getCharacterId());
        //캐릭터 이미지 저장
        characterImageRepository.save(CharacterImage.builder()
            .character(saveCharacter)
            .url(imageUrl)
            .build());

        //이미 팔로우한 캐릭터인 경우
        if (followRepository.findByMemberAndCharacter(member, saveCharacter).isPresent()) {
            throw new FollowDuplicateException();
        }

        Follow savedFollow = followRepository.save(Follow.builder()
            .member(member)
            .character(saveCharacter)
            .build());

        // 팔로우하는 캐릭터와 채팅방 생성
        log.info("생성한 캐릭터 채팅방 생성 캐릭터 id :  " + saveCharacter.getCharacterId());
        chatRoomRepository.save(ChatRoom.builder()
            .member(member)
            .character(savedFollow.getCharacter())
            .build());

        return CharacterCreateResponseDto.builder().characterId(saveCharacter.getCharacterId())
            .build();
    }

    public void generateSummary(Character saveCharacter) {
        for (int i = 0; i < MAX_RETRIES; i++) {
            try {
                String summary = openAIClient.createSummary(
                    CharacterInfo.builder().character(saveCharacter).build()
                );
                saveCharacter.updateSummary(summary);

                return; // 성공 시 메서드 종료
            } catch (Exception e) {
                log.error("Summary 생성 실패 - 시도 횟수: {}", i + 1, e);
            }
        }
        throw new RuntimeException("Summary 생성 실패");
    }


    // 공용 캐릭터, 커스텀 캐릭터 게시글 매일 밤 12시마다 생성
    @Scheduled(cron = "0 0 15 * * *", zone = "Asia/Seoul")
    @Transactional
    public void scheduleCharacterPostCreation() {
        // 한 캐릭만 게시글 테스트
//        Optional<Character> oneCharacter = characterRepository.findById(1L);

        // 실 사용 코드 주석 해제 후 사용
        List<Character> publicCharacters = characterRepository.findByIsPublicTrueAndIsDeletedFalse();

        // 아래 두 줄 코드가 테스트용 코드
//        List<Character> publicCharacters = new ArrayList<>();
//        oneCharacter.ifPresent(publicCharacters::add);

        int totalCharacters = publicCharacters.size();
        int batchSize = 3;

        // 스케줄러를 배치 반복문 외부에서 한 번만 생성
        ScheduledExecutorService executorService = Executors.newScheduledThreadPool(1);

        for (int i = 0; i < totalCharacters; i += batchSize) {
            List<Character> batch = publicCharacters.subList(i,
                Math.min(i + batchSize, totalCharacters));

            for (int j = 0; j < batch.size(); j++) {
                Character character = batch.get(j);

                // 20초 간격으로 요청 실행
                executorService.schedule(() -> {
                    openAIClient.generatePost(character);
                }, j * 20L, TimeUnit.SECONDS);
            }

            // 배치 간 대기 시간 추가 (1분)
            try {
                Thread.sleep(60 * 1000); // 1분 대기
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

        // 모든 작업이 끝난 후 스케줄러 종료
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(1, TimeUnit.MINUTES)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            e.printStackTrace();
        }
    }


    @Transactional
    public void deleteCharacter(Long memberId, Long characterId) {
        Member member = memberRepository.findById(memberId)
            .orElseThrow(NotFoundMemberException::new);
        Character character = characterRepository.findById(characterId)
            .orElseThrow(NotFoundCharacterException::new);

        // 캐릭터 만든 사람이 내가 아니면 삭제 불가
        if (!character.getMember().equals(member)) {
            throw new CharacterForbiddenException();
        }

        character.deleteSoftly(character);

        List<Post> pList = postRepository.findByCharacter(character);
        for (Post p : pList) {
            p.delete();
        }

        List<Comment> cList = commentRepository.findByCharacter(character);
        for (Comment c : cList) {
            c.delete();
            c.getPost().decreaseComment();
        }

        List<Reply> rList = replyRepository.findByCharacter(character);
        for (Reply r : rList) {
            r.delete();
        }

        postRepository.saveAll(pList);
        commentRepository.saveAll(cList);
        replyRepository.saveAll(rList);
    }

    @Transactional(readOnly = true)
    public AllCharacterResponse getAllMyCharacter(Long memberId) {
        Member member = memberRepository.findById(memberId)
            .orElseThrow(NotFoundMemberException::new);
        List<CharacterImageDto> characterImageDtos = new ArrayList<>();
        //내가 만든 캐릭터와 삭제되지 않은 캐릭터만 조회
        List<Character> myCharacters = characterRepository.findByMemberAndIsDeletedFalse(member);

        for (Character character : myCharacters) {
            CharacterImage characterImage = characterImageRepository.findById(
                character.getCharacterId()).orElseThrow(NotFoundCharacterException::new);
            CharacterImageDto characterImageDto = mapper.map(characterImage,
                CharacterImageDto.class);
            characterImageDtos.add(characterImageDto);
        }

        return new AllCharacterResponse(characterImageDtos);
    }

    @Transactional(readOnly = true)
    public CharacterPostResponse getCharacterPostInfo(Long characterId, Long memberId) {
        Character character = characterRepository.findById(characterId)
            .orElseThrow(NotFoundCharacterException::new);
        List<Post> characterPosts = postRepository.findByCharacterAndIsDeletedFalse(character);
        List<MyPagePostDto> postImageUrls = new ArrayList<>();
        for (Post post : characterPosts) {
            postImageUrls.add(post.changeToMyPagePostDto());
        }
        Collections.reverse(postImageUrls);
        // 팔로우 여부
        Member member = memberRepository.findById(memberId)
            .orElseThrow(NotFoundMemberException::new);
        boolean isFollow = followRepository.findByMemberAndCharacter(member, character)
            .isPresent();
        int followerCount = followRepository.countByCharacterId(characterId);

        return CharacterPostResponse.builder()
            .postImageUrls(postImageUrls)
            .character(character)
            .isFollow(isFollow)
            .followerCount(followerCount)
            .build();
    }
}
