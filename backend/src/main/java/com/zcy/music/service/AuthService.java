package com.zcy.music.service;

import com.zcy.music.dto.LoginDTO;
import com.zcy.music.dto.RegisterDTO;
import com.zcy.music.vo.LoginVO;

/**
 * 认证服务：注册、登录。
 */
public interface AuthService {

    LoginVO login(LoginDTO dto);

    LoginVO register(RegisterDTO dto);
}
