package com.plog.backend.domain.activity.service;

import com.plog.backend.domain.activity.dto.ActivityDto;
import com.plog.backend.domain.activity.dto.ActivityImageDto;
import com.plog.backend.domain.activity.dto.request.ActivityUpdateRequestDto;
import com.plog.backend.domain.activity.dto.response.ActivityFindByIdResponseDto;
import com.plog.backend.domain.activity.dto.response.ActivityFindByMemberIdResponseDto;
import com.plog.backend.domain.activity.dto.request.ActivitySaveRequestDto;
import com.plog.backend.domain.activity.entity.Activity;
import com.plog.backend.domain.activity.entity.ActivityImage;
import com.plog.backend.domain.activity.repository.ActivityImageRepository;
import com.plog.backend.domain.activity.repository.ActivityRepository;
import com.plog.backend.domain.member.entity.Member;
import com.plog.backend.domain.member.entity.MemberScore;
import com.plog.backend.domain.member.repository.MemberRepository;
import com.plog.backend.domain.member.repository.MemberScoreRepository;
import com.plog.backend.domain.trail.entity.Trail;
import com.plog.backend.domain.trail.repository.TrailRepository;
import com.plog.backend.global.s3.service.S3Service;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Transactional
@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityServiceImpl implements ActivityService {

    private final ActivityRepository activityRepository;
    private final ActivityImageRepository activityImageRepository;
    private final MemberScoreRepository memberScoreRepository;
    private final MemberRepository memberRepository;
    private final ModelMapper mapper;
    private final S3Service s3Service;

    @Override
    public void save(ActivitySaveRequestDto activity, Long memberId) throws IOException {

        // S3에 이미지 업로드
        List<MultipartFile> images = activity.getImages();
        List<String> imageUrls = new ArrayList<>();

        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                // 각 파일을 S3에 업로드하고, URL을 리스트에 추가
                String imageUrl = s3Service.uploadFile(image);
                imageUrls.add(imageUrl);
            }
        }

        // 1. memberId로 Member 조회
        Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> new IllegalArgumentException("Invalid member ID: " + memberId));

        // 2. 클러스터링을 위한 유저 점수 추가
        // 2.1. trailId로 Trail 조회
        long trailId = activity.getTrailId();
        // 2.2. trailId
        MemberScore memberScore = memberScoreRepository.findByMemberId(memberId);
        memberScore.getScore()[(int)trailId] = activity.getScore();
        memberScoreRepository.save(memberScore);

        // 3. Activity 엔티티를 생성하여 저장
        Activity newActivity = Activity.builder()
            .member(member)
            .title(activity.getTitle())
            .lat(activity.getLat())
            .lon(activity.getLon())
            .totalDistance(activity.getDistance())
            .totalKcal(activity.getTotalKcal())
            .totalTime(activity.getTime())
            .creationDate(activity.getCreationDate())
            .locationName(activity.getLocationName())
            .review(activity.getReview())
            .score(activity.getScore())
            .build();

        // 3. ActivityImage 엔티티 생성 및 Activity와의 연관관계 설정
        List<ActivityImage> activityImages = new ArrayList<>();
        for (String url : imageUrls) {
            ActivityImage activityImage = ActivityImage.builder()
                .savedUrl(url)
                .activity(newActivity)  // 연관된 Activity 설정
                .build();
            activityImages.add(activityImage);
        }

        // Activity 객체에 ActivityImage 설정
        newActivity.setActivityImages(activityImages);

        // 4. Activity와 ActivityImage 둘 다 저장 (Cascade 설정을 통해 자동으로 ActivityImage도 저장)
        activityRepository.save(newActivity);
    }


    @Override
    public List<ActivityFindByMemberIdResponseDto> findActivityByMemberId(Long id) {
        List<Activity> activities = activityRepository.findAllByMemberId(id);

        return activities.stream().map(
            activity -> ActivityFindByMemberIdResponseDto.builder().id(activity.getId())
                .title(activity.getTitle()).locationName(activity.getLocationName())
                .creationDate(activity.getCreationDate()).build()).collect(Collectors.toList());
    }

    @Override
    public ActivityFindByIdResponseDto findActivityById(Long id) {
        // 예외처리 시간 남으면 만들면 좋음
        Activity activity = activityRepository.findById(id).orElseThrow();
        return mapper.map(activity, ActivityFindByIdResponseDto.class);
    }

    @Override
    public void updateActivity(ActivityUpdateRequestDto activityDto, Long memberId)
        throws IOException {

        // S3에 이미지 업로드
        List<MultipartFile> images = activityDto.getImages();
        List<String> imageUrls = new ArrayList<>();

        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                // 각 파일을 S3에 업로드하고, URL을 리스트에 추가
                String imageUrl = s3Service.uploadFile(image);
                imageUrls.add(imageUrl);
            }
        }

        // 2. 기존 Activity 조회
        Activity existingActivity = activityRepository.findById(activityDto.getId()).orElseThrow(
            () -> new IllegalArgumentException("Invalid activity ID: " + activityDto.getId()));

        // 3. Activity 엔티티 업데이트
        existingActivity.update(activityDto, imageUrls);

        // 3. 클러스터링을 위한 유저 점수 추가
        // 3.1. trailId로 Trail 조회
        long trailId = existingActivity.getTrail().getId();
        // 3.2. trailId
        MemberScore memberScore = memberScoreRepository.findByMemberId(memberId);
        memberScore.getScore()[(int)trailId] = existingActivity.getScore();
        memberScoreRepository.save(memberScore);

        // 4. Activity 저장
        activityRepository.save(existingActivity);
    }
}
