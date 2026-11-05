package com.zcy.music.dto;

/**
 * 修改密码请求。
 */
public record PasswordDTO(String oldPassword, String newPassword) {
}
