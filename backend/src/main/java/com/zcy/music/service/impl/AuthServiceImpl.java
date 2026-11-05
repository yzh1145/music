package com.zcy.music.service.impl;

import com.zcy.music.common.BusinessException;
import com.zcy.music.common.JwtUtil;
import com.zcy.music.common.PasswordUtil;
import com.zcy.music.dto.LoginDTO;
import com.zcy.music.dto.RegisterDTO;
import com.zcy.music.entity.User;
import com.zcy.music.mapper.UserMapper;
import com.zcy.music.service.AuthService;
import com.zcy.music.vo.LoginVO;
import com.zcy.music.vo.UserVO;
import org.springframework.stereotype.Service;

/**
 * 认证服务实现。
 */
@Service
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserMapper userMapper, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public LoginVO login(LoginDTO dto) {
        String username = dto.username();
        String password = dto.password();
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new BusinessException("请输入账号和密码");
        }
        User user = userMapper.findByUsername(username);
        if (user == null || !PasswordUtil.matches(password, user.getPassword())) {
            throw new BusinessException("账号或密码错误");
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException("该账号已被禁用，请联系管理员");
        }
        return buildLogin(user);
    }

    @Override
    public LoginVO register(RegisterDTO dto) {
        String username = dto.username();
        String password = dto.password();
        String nickname = dto.nickname();
        if (username == null || !username.matches("[A-Za-z0-9_]{3,20}")) {
            throw new BusinessException("账号需为 3-20 位字母、数字或下划线");
        }
        if (password == null || password.length() < 6 || password.length() > 20) {
            throw new BusinessException("密码长度需为 6-20 位");
        }
        if (userMapper.findByUsername(username) != null) {
            throw new BusinessException("该账号已被注册");
        }
        if (nickname == null || nickname.isBlank()) {
            nickname = username;
        }
        if (nickname.length() > 20) {
            throw new BusinessException("昵称最长 20 个字符");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(PasswordUtil.encode(password));
        user.setNickname(nickname);
        user.setAvatar("/images/avatar/u3.png");
        user.setGender(0);
        user.setSignature("这个人很懒，什么都没有留下。");
        user.setRole(0);
        user.setStatus(1);
        userMapper.insert(user);
        return buildLogin(user);
    }

    private LoginVO buildLogin(User user) {
        String token = jwtUtil.generate(user.getId(), user.getUsername(), user.getRole());
        UserVO vo = userMapper.findVOById(user.getId());
        return new LoginVO(token, vo);
    }
}
