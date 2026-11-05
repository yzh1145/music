package com.zcy.music.common;

/**
 * 当前登录用户上下文（ThreadLocal）。
 * 由 {@link AuthInterceptor} 在请求进入时写入、请求结束时清理；
 * 需要登录的写操作调用 {@link #requireUserId()}，后台接口调用 {@link #requireAdmin()}。
 */
public final class UserContext {

    private static final ThreadLocal<CurrentUser> HOLDER = new ThreadLocal<>();

    private UserContext() {
    }

    public static void set(Long userId, String username, Integer role) {
        HOLDER.set(new CurrentUser(userId, username, role == null ? 0 : role));
    }

    public static void clear() {
        HOLDER.remove();
    }

    /** 当前用户 ID，未登录返回 null */
    public static Long getUserId() {
        CurrentUser user = HOLDER.get();
        return user == null ? null : user.id;
    }

    public static String getUsername() {
        CurrentUser user = HOLDER.get();
        return user == null ? null : user.username;
    }

    public static Integer getRole() {
        CurrentUser user = HOLDER.get();
        return user == null ? 0 : user.role;
    }

    /** 当前用户 ID，未登录抛出 401 */
    public static Long requireUserId() {
        Long id = getUserId();
        if (id == null) {
            throw BusinessException.unauthorized();
        }
        return id;
    }

    public static boolean isAdmin() {
        return Integer.valueOf(1).equals(getRole());
    }

    /** 校验管理员权限，非管理员抛出 403 */
    public static void requireAdmin() {
        requireUserId();
        if (!isAdmin()) {
            throw BusinessException.forbidden("仅管理员可执行该操作");
        }
    }

    /** 判断当前用户是否已登录（用于返回 liked/collected 等状态） */
    public static boolean isLogin() {
        return getUserId() != null;
    }

    private static class CurrentUser {
        private final Long id;
        private final String username;
        private final Integer role;

        CurrentUser(Long id, String username, Integer role) {
            this.id = id;
            this.username = username;
            this.role = role;
        }
    }
}
