package com.zcy.music.service.impl;

import com.zcy.music.common.BusinessException;
import com.zcy.music.common.PageResult;
import com.zcy.music.common.UserContext;
import com.zcy.music.mapper.AlbumMapper;
import com.zcy.music.mapper.SongMapper;
import com.zcy.music.service.AlbumService;
import com.zcy.music.vo.AlbumDetailVO;
import com.zcy.music.vo.AlbumVO;
import com.zcy.music.vo.SongVO;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 专辑服务实现。
 */
@Service
public class AlbumServiceImpl implements AlbumService {

    private final AlbumMapper albumMapper;
    private final SongMapper songMapper;

    public AlbumServiceImpl(AlbumMapper albumMapper, SongMapper songMapper) {
        this.albumMapper = albumMapper;
        this.songMapper = songMapper;
    }

    @Override
    public PageResult<AlbumVO> page(String keyword, Long singerId, int page, int size) {
        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 1), 100);
        long total = albumMapper.countPage(keyword, singerId);
        List<AlbumVO> list = albumMapper.selectPage(keyword, singerId, (page - 1L) * size, size);
        return PageResult.of(total, list);
    }

    @Override
    public AlbumDetailVO detail(Long id) {
        AlbumVO album = albumMapper.findVOById(id);
        if (album == null) {
            throw BusinessException.notFound("专辑不存在");
        }
        List<SongVO> songs = songMapper.selectByAlbum(id, UserContext.getUserId());
        return new AlbumDetailVO(album, songs);
    }
}
