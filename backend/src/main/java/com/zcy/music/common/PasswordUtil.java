package com.zcy.music.common;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * 密码工具：PBKDF2-HMAC-SHA256，存储格式为 "迭代次数$盐(hex)$哈希(hex)"。
 * 与 tools/gen_password.py、sql/music.sql 中的演示账号保持一致。
 */
public final class PasswordUtil {

    private static final int ITERATIONS = 10000;
    private static final int KEY_LENGTH = 256;
    private static final int SALT_BYTES = 8;

    private PasswordUtil() {
    }

    /** 生成可入库的密码串 */
    public static String encode(String rawPassword) {
        byte[] salt = new byte[SALT_BYTES];
        new SecureRandom().nextBytes(salt);
        String hash = hash(rawPassword, salt, ITERATIONS);
        return ITERATIONS + "$" + HexFormat.of().formatHex(salt) + "$" + hash;
    }

    /** 校验明文密码与入库密码串是否匹配 */
    public static boolean matches(String rawPassword, String encoded) {
        if (rawPassword == null || encoded == null) {
            return false;
        }
        String[] parts = encoded.split("\\$");
        if (parts.length != 3) {
            return false;
        }
        try {
            int iterations = Integer.parseInt(parts[0]);
            byte[] salt = HexFormat.of().parseHex(parts[1]);
            String expected = parts[2];
            String actual = hash(rawPassword, salt, iterations);
            // 定长比较，避免时序攻击
            return MessageDigest.isEqual(expected.getBytes(), actual.getBytes());
        } catch (Exception e) {
            return false;
        }
    }

    private static String hash(String rawPassword, byte[] salt, int iterations) {
        try {
            PBEKeySpec spec = new PBEKeySpec(rawPassword.toCharArray(), salt, iterations, KEY_LENGTH);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] bytes = factory.generateSecret(spec).getEncoded();
            return HexFormat.of().formatHex(bytes);
        } catch (Exception e) {
            throw new IllegalStateException("密码加密失败", e);
        }
    }
}
