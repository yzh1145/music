package com.zcy.music.common;

/**
 * 业务异常：message 会直接返回给前端，code 使用 {@link Result} 中的错误码。
 */
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(String message) {
        this(Result.CODE_BAD_REQUEST, message);
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }

    /** 未登录 */
    public static BusinessException unauthorized() {
        return new BusinessException(Result.CODE_UNAUTHORIZED, "请先登录");
    }

    /** 无权限 */
    public static BusinessException forbidden(String message) {
        return new BusinessException(Result.CODE_FORBIDDEN, message);
    }

    /** 资源不存在 */
    public static BusinessException notFound(String message) {
        return new BusinessException(Result.CODE_NOT_FOUND, message);
    }
}
