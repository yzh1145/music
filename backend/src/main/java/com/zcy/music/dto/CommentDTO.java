package com.zcy.music.dto;

/**
 * 发表评论 / 回复评论请求：parentId 为 0 表示一级评论。
 */
public record CommentDTO(Long songId, String content, Long parentId) {

    public CommentDTO {
        content = content == null ? null : content.trim();
        if (parentId == null) {
            parentId = 0L;
        }
    }
}
