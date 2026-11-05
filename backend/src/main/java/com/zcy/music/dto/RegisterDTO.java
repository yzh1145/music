package com.zcy.music.dto;

/**
 * 注册请求。
 */
public record RegisterDTO(String username, String password, String nickname) {

    public RegisterDTO {
        username = username == null ? null : username.trim();
        nickname = nickname == null ? null : nickname.trim();
    }
}
