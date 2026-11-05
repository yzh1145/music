package com.zcy.music.service.impl;

import com.zcy.music.common.BusinessException;
import com.zcy.music.common.PageResult;
import com.zcy.music.common.UserContext;
import com.zcy.music.dto.CommentDTO;
import com.zcy.music.entity.Comment;
import com.zcy.music.entity.Song;
import com.zcy.music.mapper.CommentLikeMapper;
import com.zcy.music.mapper.CommentMapper;
import com.zcy.music.mapper.SongMapper;
import com.zcy.music.service.CommentService;
import com.zcy.music.vo.CommentVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 评论服务实现：一级评论按点赞数排序，二级回复按时间正序挂在父评论下。
 */
@Service
public class CommentServiceImpl implements CommentService {

    private final CommentMapper commentMapper;
    private final CommentLikeMapper commentLikeMapper;
    private final SongMapper songMapper;

    public CommentServiceImpl(CommentMapper commentMapper, CommentLikeMapper commentLikeMapper, SongMapper songMapper) {
        this.commentMapper = commentMapper;
        this.commentLikeMapper = commentLikeMapper;
        this.songMapper = songMapper;
    }

    @Override
    public PageResult<CommentVO> page(Long songId, int page, int size) {
        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 1), 100);
        long total = commentMapper.countRoot(songId);
        if (total == 0) {
            return PageResult.empty();
        }
        Long userId = UserContext.getUserId();
        List<CommentVO> roots = commentMapper.selectRoot(songId, userId, (page - 1L) * size, size);
        if (!roots.isEmpty()) {
            List<Long> ids = new ArrayList<>();
            for (CommentVO root : roots) {
                ids.add(root.getId());
            }
            List<CommentVO> replies = commentMapper.selectReplies(ids, userId);
            Map<Long, List<CommentVO>> grouped = new LinkedHashMap<>();
            for (CommentVO reply : replies) {
                grouped.computeIfAbsent(reply.getParentId(), k -> new ArrayList<>()).add(reply);
            }
            for (CommentVO root : roots) {
                root.setReplies(grouped.getOrDefault(root.getId(), new ArrayList<>()));
            }
        }
        return PageResult.of(total, roots);
    }

    @Override
    @Transactional
    public void add(CommentDTO dto) {
        Long userId = UserContext.requireUserId();
        if (dto.songId() == null) {
            throw new BusinessException("缺少歌曲 ID");
        }
        if (dto.content() == null || dto.content().isBlank()) {
            throw new BusinessException("评论内容不能为空");
        }
        if (dto.content().length() > 500) {
            throw new BusinessException("评论最长 500 个字符");
        }
        Song song = songMapper.findById(dto.songId());
        if (song == null || song.getStatus() == null || song.getStatus() == 0) {
            throw BusinessException.notFound("歌曲不存在或已下架");
        }
        long parentId = dto.parentId() == null ? 0 : dto.parentId();
        if (parentId > 0) {
            Comment parent = commentMapper.findById(parentId);
            if (parent == null || parent.getStatus() == 0) {
                throw BusinessException.notFound("回复的评论不存在");
            }
            if (!parent.getSongId().equals(dto.songId())) {
                throw new BusinessException("评论与歌曲不匹配");
            }
            // 只支持二级评论：若回复的是回复，则挂到其父评论下
            if (parent.getParentId() != null && parent.getParentId() > 0) {
                parentId = parent.getParentId();
            }
        }
        Comment comment = new Comment();
        comment.setSongId(dto.songId());
        comment.setUserId(userId);
        comment.setContent(dto.content());
        comment.setParentId(parentId);
        commentMapper.insert(comment);
        songMapper.updateCommentCount(dto.songId(), 1);
    }

    @Override
    @Transactional
    public boolean toggleLike(Long commentId) {
        Long userId = UserContext.requireUserId();
        Comment comment = commentMapper.findByIdForUpdate(commentId);
        if (comment == null || comment.getStatus() == null || comment.getStatus() == 0) {
            throw BusinessException.notFound("评论不存在");
        }
        if (commentLikeMapper.exists(commentId, userId) > 0) {
            commentLikeMapper.delete(commentId, userId);
            commentMapper.updateLikeCount(commentId, -1);
            return false;
        }
        commentLikeMapper.insert(commentId, userId);
        commentMapper.updateLikeCount(commentId, 1);
        return true;
    }

    @Override
    @Transactional
    public void delete(Long commentId) {
        Long userId = UserContext.requireUserId();
        Comment comment = commentMapper.findById(commentId);
        if (comment == null || comment.getStatus() == null || comment.getStatus() == 0) {
            throw BusinessException.notFound("评论不存在");
        }
        if (!userId.equals(comment.getUserId()) && !UserContext.isAdmin()) {
            throw BusinessException.forbidden("只能删除自己发表的评论");
        }
        commentMapper.softDelete(commentId);
        songMapper.updateCommentCount(comment.getSongId(), -1);
    }
}
