package com.aintopia.aingle.alarm.service;

import com.aintopia.aingle.alarm.domain.Alarm;
import com.aintopia.aingle.alarm.dto.response.AlarmResponseDto;
import com.aintopia.aingle.alarm.exception.ForbiddenAlarmException;
import com.aintopia.aingle.alarm.exception.NotFoundAlarmException;
import com.aintopia.aingle.alarm.repository.AlarmRepository;
import com.aintopia.aingle.character.domain.Character;
import com.aintopia.aingle.member.domain.Member;
import com.aintopia.aingle.member.exception.NotFoundMemberException;
import com.aintopia.aingle.member.repository.MemberRepository;
import com.aintopia.aingle.post.dto.AlarmPost;
import com.aintopia.aingle.vote.dto.VoteWinnerCharacter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlarmService {
    private final AlarmRepository alarmRepository;
    private final MemberRepository memberRepository;

    public List<AlarmResponseDto> selectAllAlarms(Long memberId, int page, int size) {
        Member member = memberRepository.findById(memberId).orElseThrow(NotFoundMemberException::new);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "alarmId"));

        Page<Alarm> alarms = alarmRepository.findByMember(member, pageable);

        return alarms.stream()
                .map(alarm -> {
                    AlarmPost alarmPostDto = alarm.getPost() != null ? alarm.getPost().changeDto() : null;
                    VoteWinnerCharacter voteWinnerCharacter = alarm.getVote() != null ? new VoteWinnerCharacter(alarm.getVote().getCharacter()) : null;

                    return AlarmResponseDto.builder()
                                    .alarmId(alarm.getAlarmId())
                                    .isRead(alarm.getIsRead())
                                    .post(alarmPostDto)
                                    .voteWinnerCharacter(voteWinnerCharacter)
                                    .createTime(alarm.getCreateTime())
                                    .sender(Optional.ofNullable(alarm.getSender())
                                        .map(Character::changeDto)
                                        .orElse(null))
                                    .build();

                })
                .collect(Collectors.toList());
    }

    public void readAlarm(Long alarmId, Long memberId) {
        Alarm alarm = alarmRepository.findById(alarmId).orElseThrow(NotFoundAlarmException::new);
        Member member = memberRepository.findById(memberId).orElseThrow(NotFoundMemberException::new);

        if(member != alarm.getMember()) throw new ForbiddenAlarmException();

        alarm.isRead();
        alarmRepository.save(alarm);
    }
}
