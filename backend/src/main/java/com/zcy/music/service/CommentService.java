package com.zcy.music.service;

import com.zcy.music.common.PageResult;
import com.zcy.music.dto.CommentDTO;
import com.zcy.music.vo.CommentVO;

/**
 * 评论服务：一级评论分页 + 二级回复 + 点赞 + 删除。
 */
public interface CommentService {

    PageResult<CommentVO> page(Long songId, int page, int size);

    void add(CommentDTO dto);

    boolean toggleLike(Long commentId);

    void delete(Long commentId);
}
