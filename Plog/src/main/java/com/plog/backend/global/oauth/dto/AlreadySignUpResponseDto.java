package com.plog.backend.global.oauth.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AlreadySignUpResponseDto {

    private int status;
    private String message;
    private String token;
    private LocalDateTime timestamp;
}
