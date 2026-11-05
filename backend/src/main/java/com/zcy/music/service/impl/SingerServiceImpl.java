package com.zcy.music.service.impl;

import com.zcy.music.common.BusinessException;
import com.zcy.music.common.PageResult;
import com.zcy.music.common.UserContext;
import com.zcy.music.mapper.AlbumMapper;
import com.zcy.music.mapper.SingerMapper;
import com.zcy.music.mapper.SongMapper;
import com.zcy.music.service.SingerService;
import com.zcy.music.service.UserService;
import com.zcy.music.vo.AlbumVO;
import com.zcy.music.vo.SingerDetailVO;
import com.zcy.music.vo.SingerVO;
import com.zcy.music.vo.SongVO;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 歌手服务实现。
 */
@Service
public class SingerServiceImpl implements SingerService {

    private final SingerMapper singerMapper;
    private final SongMapper songMapper;
    private final AlbumMapper albumMapper;
    private final UserService userService;

    public SingerServiceImpl(SingerMapper singerMapper, SongMapper songMapper,
                             AlbumMapper albumMapper, UserService userService) {
        this.singerMapper = singerMapper;
        this.songMapper = songMapper;
        this.albumMapper = albumMapper;
        this.userService = userService;
    }

    @Override
    public PageResult<SingerVO> page(String keyword, String region, int page, int size) {
        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 1), 100);
        long total = singerMapper.countPage(keyword, region);
        List<SingerVO> list = singerMapper.selectPage(keyword, region, UserContext.getUserId(),
                (page - 1L) * size, size);
        return PageResult.of(total, list);
    }

    @Override
    public SingerDetailVO detail(Long id) {
        Long userId = UserContext.getUserId();
        SingerVO singer = singerMapper.findVOById(id, userId);
        if (singer == null) {
            throw BusinessException.notFound("歌手不存在");
        }
        List<SongVO> songs = songMapper.selectBySinger(id, userId, 50);
        List<AlbumVO> albums = albumMapper.selectBySinger(id);
        return new SingerDetailVO(singer, songs, albums);
    }

    @Override
    public boolean toggleFollow(Long id) {
        return userService.toggleFollow(id);
    }
}
