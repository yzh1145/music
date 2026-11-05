package com.zcy.music.vo;

/**
 * 登录结果：token 供前端保存到 localStorage，user 用于展示当前用户信息。
 */
public record LoginVO(String token, UserVO user) {
}
