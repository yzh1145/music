package com.zcy.music.service.impl;

import com.zcy.music.common.UserContext;
import com.zcy.music.mapper.AlbumMapper;
import com.zcy.music.mapper.PlaylistMapper;
import com.zcy.music.mapper.SingerMapper;
import com.zcy.music.mapper.SongMapper;
import com.zcy.music.service.SearchService;
import com.zcy.music.vo.AlbumVO;
import com.zcy.music.vo.PlaylistVO;
import com.zcy.music.vo.SearchVO;
import com.zcy.music.vo.SingerVO;
import com.zcy.music.vo.SongVO;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * 搜索服务实现：关键词为空时返回空结果，避免全表扫描。
 */
@Service
public class SearchServiceImpl implements SearchService {

    private final SongMapper songMapper;
    private final PlaylistMapper playlistMapper;
    private final SingerMapper singerMapper;
    private final AlbumMapper albumMapper;

    public SearchServiceImpl(SongMapper songMapper, PlaylistMapper playlistMapper,
                             SingerMapper singerMapper, AlbumMapper albumMapper) {
        this.songMapper = songMapper;
        this.playlistMapper = playlistMapper;
        this.singerMapper = singerMapper;
        this.albumMapper = albumMapper;
    }

    @Override
    public SearchVO search(String keyword, int limit) {
        if (keyword == null || keyword.isBlank()) {
            return new SearchVO(Collections.emptyList(), Collections.emptyList(), Collections.emptyList(),
                    Collections.emptyList(), 0, 0, 0, 0);
        }
        String kw = keyword.trim();
        limit = Math.min(Math.max(limit, 1), 50);
        Long userId = UserContext.getUserId();
        List<SongVO> songs = songMapper.search(kw, userId, limit);
        List<PlaylistVO> playlists = playlistMapper.search(kw, userId, limit);
        List<SingerVO> singers = singerMapper.search(kw, userId, limit);
        List<AlbumVO> albums = albumMapper.search(kw, limit);
        return new SearchVO(songs, playlists, singers, albums,
                songMapper.countSearch(kw), playlistMapper.countSearch(kw),
                singerMapper.countSearch(kw), albumMapper.countSearch(kw));
    }
}
