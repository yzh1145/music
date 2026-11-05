package com.zcy.music.service.impl;

import com.zcy.music.common.UserContext;
import com.zcy.music.mapper.BannerMapper;
import com.zcy.music.mapper.PlaylistMapper;
import com.zcy.music.mapper.SingerMapper;
import com.zcy.music.mapper.SongMapper;
import com.zcy.music.service.HomeService;
import com.zcy.music.vo.HomeVO;
import org.springframework.stereotype.Service;

/**
 * 首页服务实现。
 */
@Service
public class HomeServiceImpl implements HomeService {

    private final BannerMapper bannerMapper;
    private final PlaylistMapper playlistMapper;
    private final SongMapper songMapper;
    private final SingerMapper singerMapper;

    public HomeServiceImpl(BannerMapper bannerMapper, PlaylistMapper playlistMapper,
                           SongMapper songMapper, SingerMapper singerMapper) {
        this.bannerMapper = bannerMapper;
        this.playlistMapper = playlistMapper;
        this.songMapper = songMapper;
        this.singerMapper = singerMapper;
    }

    @Override
    public HomeVO home() {
        Long userId = UserContext.getUserId();
        return new HomeVO(
                bannerMapper.selectEnabled(),
                playlistMapper.selectRecommend(8, userId),
                songMapper.selectNew(12, userId),
                singerMapper.selectHot(8, userId),
                songMapper.selectRecommend(6, userId));
    }
}
