package com.zcy.music.common;

import com.zcy.music.entity.User;
import com.zcy.music.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 登录拦截器：解析请求头 Authorization: Bearer &lt;token&gt;，
 * 成功则写入 {@link UserContext}。是否强制登录由各业务方法自行判断，
 * 这样游客也能访问首页、歌单、搜索等只读接口。
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;

    public AuthInterceptor(JwtUtil jwtUtil, UserMapper userMapper) {
        this.jwtUtil = jwtUtil;
        this.userMapper = userMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String header = request.getHeader(HEADER);
        if (header != null && header.startsWith(PREFIX)) {
            JwtUtil.TokenPayload payload = jwtUtil.parse(header.substring(PREFIX.length()).trim());
            User user = userMapper.findAuthById(payload.getUserId());
            if (user == null || Integer.valueOf(0).equals(user.getStatus())) {
                throw BusinessException.unauthorized();
            }
            UserContext.set(user.getId(), user.getUsername(), user.getRole());
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
