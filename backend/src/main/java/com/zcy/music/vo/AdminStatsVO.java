package com.zcy.music.vo;

/**
 * 后台看板统计。
 */
public record AdminStatsVO(
        long userCount,
        long songCount,
        long singerCount,
        long albumCount,
        long playlistCount,
        long commentCount,
        long playCount,
        long todayUserCount) {
}
