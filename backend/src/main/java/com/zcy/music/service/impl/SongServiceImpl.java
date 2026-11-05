package com.zcy.music.service.impl;

import com.zcy.music.common.BusinessException;
import com.zcy.music.common.PageResult;
import com.zcy.music.common.UserContext;
import com.zcy.music.mapper.SongMapper;
import com.zcy.music.service.SongService;
import com.zcy.music.vo.SongVO;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 歌曲服务实现。
 */
@Service
public class SongServiceImpl implements SongService {

    private final SongMapper songMapper;

    public SongServiceImpl(SongMapper songMapper) {
        this.songMapper = songMapper;
    }

    @Override
    public PageResult<SongVO> page(String keyword, Long singerId, Long albumId, Integer categoryId,
                                   Integer recommend, Integer status, String sort, int page, int size) {
        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 1), 100);
        Long userId = UserContext.getUserId();
        long total = songMapper.countPage(keyword, singerId, albumId, categoryId, recommend, status);
        List<SongVO> list = songMapper.selectPage(keyword, singerId, albumId, categoryId, recommend,
                status, sort, userId, (page - 1L) * size, size);
        return PageResult.of(total, list);
    }

    @Override
    public SongVO detail(Long id) {
        SongVO vo = songMapper.findVOById(id, UserContext.getUserId());
        if (vo == null) {
            throw BusinessException.notFound("歌曲不存在");
        }
        return vo;
    }

    @Override
    public void addPlayCount(Long id) {
        songMapper.incrementPlayCount(id);
    }
}
