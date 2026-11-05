package com.zcy.music.service.impl;

import com.zcy.music.common.BusinessException;
import com.zcy.music.common.PageResult;
import com.zcy.music.common.UserContext;
import com.zcy.music.entity.Playlist;
import com.zcy.music.entity.PlaylistSong;
import com.zcy.music.mapper.PlaylistMapper;
import com.zcy.music.mapper.PlaylistSongMapper;
import com.zcy.music.mapper.SongMapper;
import com.zcy.music.service.PlaylistService;
import com.zcy.music.service.UserService;
import com.zcy.music.vo.PlaylistDetailVO;
import com.zcy.music.vo.PlaylistVO;
import com.zcy.music.vo.SongVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 歌单服务实现。创建者只能维护自己的歌单，管理员可以维护全部歌单。
 */
@Service
public class PlaylistServiceImpl implements PlaylistService {

    private final PlaylistMapper playlistMapper;
    private final PlaylistSongMapper playlistSongMapper;
    private final SongMapper songMapper;
    private final UserService userService;

    public PlaylistServiceImpl(PlaylistMapper playlistMapper, PlaylistSongMapper playlistSongMapper,
                               SongMapper songMapper, UserService userService) {
        this.playlistMapper = playlistMapper;
        this.playlistSongMapper = playlistSongMapper;
        this.songMapper = songMapper;
        this.userService = userService;
    }

    @Override
    public PageResult<PlaylistVO> page(String keyword, String category, Integer recommend, int page, int size) {
        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 1), 100);
        long total = playlistMapper.countPage(keyword, category, recommend, null);
        List<PlaylistVO> list = playlistMapper.selectPage(keyword, category, recommend, null,
                UserContext.getUserId(), (page - 1L) * size, size);
        return PageResult.of(total, list);
    }

    @Override
    public PlaylistDetailVO detail(Long id) {
        Long userId = UserContext.getUserId();
        PlaylistVO playlist = playlistMapper.findVOById(id, userId);
        if (playlist == null || playlist.getStatus() == null || playlist.getStatus() == 0) {
            throw BusinessException.notFound("歌单不存在或已删除");
        }
        List<SongVO> songs = songMapper.selectByPlaylist(id, userId);
        return new PlaylistDetailVO(playlist, songs);
    }

    @Override
    public List<PlaylistVO> created() {
        Long userId = UserContext.requireUserId();
        return playlistMapper.selectCreated(userId, userId);
    }

    @Override
    public List<PlaylistVO> collected() {
        return playlistMapper.selectCollected(UserContext.requireUserId());
    }

    @Override
    public PlaylistVO create(Playlist playlist) {
        Long userId = UserContext.requireUserId();
        if (playlist.getName() == null || playlist.getName().isBlank()) {
            throw new BusinessException("歌单名称不能为空");
        }
        if (playlist.getName().length() > 50) {
            throw new BusinessException("歌单名称最长 50 个字符");
        }
        playlist.setId(null);
        playlist.setUserId(userId);
        playlist.setCover(playlist.getCover() == null || playlist.getCover().isBlank()
                ? "/images/playlist/p6.png" : playlist.getCover());
        playlist.setCategory(playlist.getCategory() == null || playlist.getCategory().isBlank()
                ? "流行" : playlist.getCategory());
        playlist.setIsRecommend(0);
        playlist.setStatus(1);
        playlistMapper.insert(playlist);
        return playlistMapper.findVOById(playlist.getId(), userId);
    }

    @Override
    public void update(Playlist playlist) {
        if (playlist.getId() == null) {
            throw new BusinessException("缺少歌单 ID");
        }
        Playlist exist = requireEditable(playlist.getId());
        if (playlist.getName() == null || playlist.getName().isBlank()) {
            throw new BusinessException("歌单名称不能为空");
        }
        exist.setName(playlist.getName());
        exist.setCover(playlist.getCover());
        exist.setIntro(playlist.getIntro());
        exist.setCategory(playlist.getCategory());
        if (UserContext.isAdmin() && playlist.getIsRecommend() != null) {
            exist.setIsRecommend(playlist.getIsRecommend());
        }
        playlistMapper.update(exist);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        requireEditable(id);
        playlistSongMapper.deleteByPlaylist(id);
        playlistMapper.delete(id);
    }

    @Override
    public void addSong(Long playlistId, Long songId) {
        requireEditable(playlistId);
        if (songMapper.findById(songId) == null) {
            throw BusinessException.notFound("歌曲不存在");
        }
        PlaylistSong ps = new PlaylistSong();
        ps.setPlaylistId(playlistId);
        ps.setSongId(songId);
        ps.setSort(playlistSongMapper.maxSort(playlistId) + 1);
        playlistSongMapper.insert(ps);
    }

    @Override
    public void removeSong(Long playlistId, Long songId) {
        requireEditable(playlistId);
        playlistSongMapper.delete(playlistId, songId);
    }

    @Override
    public void addPlayCount(Long id) {
        playlistMapper.incrementPlayCount(id);
    }

    @Override
    public boolean toggleCollect(Long id) {
        return userService.toggleCollect(id);
    }

    /** 校验歌单是否存在，且当前用户有编辑权限 */
    private Playlist requireEditable(Long id) {
        Playlist playlist = playlistMapper.findById(id);
        if (playlist == null) {
            throw BusinessException.notFound("歌单不存在");
        }
        Long userId = UserContext.requireUserId();
        if (!UserContext.isAdmin() && !userId.equals(playlist.getUserId())) {
            throw BusinessException.forbidden("只能操作自己创建的歌单");
        }
        return playlist;
    }
}
