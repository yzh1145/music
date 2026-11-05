package com.zcy.music.dto;

/**
 * 登录请求。
 */
public record LoginDTO(String username, String password) {

    public LoginDTO {
        username = username == null ? null : username.trim();
    }
}
