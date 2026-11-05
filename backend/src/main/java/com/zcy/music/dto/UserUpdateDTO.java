package com.zcy.music.dto;

import java.time.LocalDate;

/**
 * 个人信息修改请求：只允许修改昵称、头像、性别、生日、签名与联系方式。
 */
public record UserUpdateDTO(
        String nickname,
        String avatar,
        Integer gender,
        LocalDate birthday,
        String signature,
        String phone,
        String email) {
}
