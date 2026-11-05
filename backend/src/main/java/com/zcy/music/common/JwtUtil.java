package com.zcy.music.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 轻量 JWT 工具（HS256 自实现，不依赖第三方库）。
 * <p>payload 中携带 userId、username、role 与过期时间 exp，有效期默认 7 天。</p>
 */
@Component
public class JwtUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String HEADER = base64Url("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    @Value("${music.jwt.secret}")
    private String secret;

    @Value("${music.jwt.expire-days:7}")
    private int expireDays;

    /** 生成 token */
    public String generate(Long userId, String username, Integer role) {
        long exp = Instant.now().plus(expireDays, ChronoUnit.DAYS).getEpochSecond();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("uid", userId);
        payload.put("username", username);
        payload.put("role", role == null ? 0 : role);
        payload.put("exp", exp);
        try {
            String body = base64Url(MAPPER.writeValueAsBytes(payload));
            String content = HEADER + "." + body;
            return content + "." + sign(content);
        } catch (Exception e) {
            throw new IllegalStateException("token 生成失败", e);
        }
    }

    /**
     * 解析并校验 token。
     *
     * @throws BusinessException token 非法或已过期（401）
     */
    public TokenPayload parse(String token) {
        if (token == null || token.isBlank()) {
            throw BusinessException.unauthorized();
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new BusinessException(Result.CODE_UNAUTHORIZED, "登录状态已失效，请重新登录");
        }
        String content = parts[0] + "." + parts[1];
        if (!constantTimeEquals(sign(content), parts[2])) {
            throw new BusinessException(Result.CODE_UNAUTHORIZED, "登录状态已失效，请重新登录");
        }
        try {
            byte[] json = Base64.getUrlDecoder().decode(parts[1]);
            @SuppressWarnings("unchecked")
            Map<String, Object> map = MAPPER.readValue(json, Map.class);
            long exp = ((Number) map.get("exp")).longValue();
            if (Instant.now().getEpochSecond() > exp) {
                throw new BusinessException(Result.CODE_UNAUTHORIZED, "登录已过期，请重新登录");
            }
            TokenPayload payload = new TokenPayload();
            payload.userId = ((Number) map.get("uid")).longValue();
            payload.username = String.valueOf(map.get("username"));
            payload.role = ((Number) map.get("role")).intValue();
            return payload;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(Result.CODE_UNAUTHORIZED, "登录状态已失效，请重新登录");
        }
    }

    private String sign(String content) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return base64Url(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("token 签名失败", e);
        }
    }

    private static String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return java.security.MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    /** token 中的用户信息 */
    public static class TokenPayload {
        private Long userId;
        private String username;
        private Integer role;

        public Long getUserId() {
            return userId;
        }

        public String getUsername() {
            return username;
        }

        public Integer getRole() {
            return role;
        }
    }
}
