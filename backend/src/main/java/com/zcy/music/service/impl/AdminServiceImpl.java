package com.zcy.music.service.impl;

import com.zcy.music.common.BusinessException;
import com.zcy.music.common.PageResult;
import com.zcy.music.common.UserContext;
import com.zcy.music.entity.Album;
import com.zcy.music.entity.Banner;
import com.zcy.music.entity.Playlist;
import com.zcy.music.entity.Singer;
import com.zcy.music.entity.Song;
import com.zcy.music.mapper.AlbumMapper;
import com.zcy.music.mapper.BannerMapper;
import com.zcy.music.mapper.CommentMapper;
import com.zcy.music.mapper.PlaylistMapper;
import com.zcy.music.mapper.PlaylistSongMapper;
import com.zcy.music.mapper.SingerMapper;
import com.zcy.music.mapper.SongMapper;
import com.zcy.music.mapper.UserMapper;
import com.zcy.music.mapper.UserSongMapper;
import com.zcy.music.service.AdminService;
import com.zcy.music.service.SongService;
import com.zcy.music.vo.AdminStatsVO;
import com.zcy.music.vo.PlaylistVO;
import com.zcy.music.vo.SongVO;
import com.zcy.music.vo.UserVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 后台管理服务实现。删除资源前先做引用校验，避免产生孤儿数据。
 */
@Service
public class AdminServiceImpl implements AdminService {

    private final SongMapper songMapper;
    private final SingerMapper singerMapper;
    private final AlbumMapper albumMapper;
    private final PlaylistMapper playlistMapper;
    private final PlaylistSongMapper playlistSongMapper;
    private final BannerMapper bannerMapper;
    private final UserMapper userMapper;
    private final UserSongMapper userSongMapper;
    private final CommentMapper commentMapper;
    private final SongService songService;

    public AdminServiceImpl(SongMapper songMapper, SingerMapper singerMapper, AlbumMapper albumMapper,
                            PlaylistMapper playlistMapper, PlaylistSongMapper playlistSongMapper,
                            BannerMapper bannerMapper, UserMapper userMapper, UserSongMapper userSongMapper,
                            CommentMapper commentMapper, SongService songService) {
        this.songMapper = songMapper;
        this.singerMapper = singerMapper;
        this.albumMapper = albumMapper;
        this.playlistMapper = playlistMapper;
        this.playlistSongMapper = playlistSongMapper;
        this.bannerMapper = bannerMapper;
        this.userMapper = userMapper;
        this.userSongMapper = userSongMapper;
        this.commentMapper = commentMapper;
        this.songService = songService;
    }

    @Override
    public AdminStatsVO stats() {
        return new AdminStatsVO(
                userMapper.countAll(),
                songMapper.countAll(),
                singerMapper.countAll(),
                albumMapper.countAll(),
                playlistMapper.countAll(),
                commentMapper.countAll(),
                songMapper.sumPlayCount(),
                userMapper.countToday());
    }

    @Override
    public PageResult<SongVO> songs(String keyword, Integer status, int page, int size) {
        // 后台默认查看全部状态：status = -1
        return songService.page(keyword, null, null, null, null,
                status == null ? -1 : status, "new", page, size);
    }

    @Override
    public void saveSong(Song song) {
        if (song.getName() == null || song.getName().isBlank()) {
            throw new BusinessException("歌曲名不能为空");
        }
        if (song.getSingerId() == null) {
            throw new BusinessException("请选择歌手");
        }
        if (singerMapper.findById(song.getSingerId()) == null) {
            throw BusinessException.notFound("歌手不存在");
        }
        if (song.getAlbumId() != null && albumMapper.findById(song.getAlbumId()) == null) {
            throw BusinessException.notFound("专辑不存在");
        }
        song.setStatus(song.getStatus() == null ? 1 : song.getStatus());
        song.setIsRecommend(song.getIsRecommend() == null ? 0 : song.getIsRecommend());
        song.setDuration(song.getDuration() == null ? 0 : song.getDuration());
        if (song.getId() == null) {
            song.setCover(song.getCover() == null || song.getCover().isBlank()
                    ? "/images/album/a1.png" : song.getCover());
            songMapper.insert(song);
        } else {
            if (songMapper.findById(song.getId()) == null) {
                throw BusinessException.notFound("歌曲不存在");
            }
            songMapper.update(song);
        }
    }

    @Override
    @Transactional
    public void deleteSong(Long id) {
        if (songMapper.findById(id) == null) {
            throw BusinessException.notFound("歌曲不存在");
        }
        playlistSongMapper.deleteBySong(id);
        userSongMapper.deleteBySong(id);
        songMapper.delete(id);
    }

    @Override
    public void saveSinger(Singer singer) {
        if (singer.getName() == null || singer.getName().isBlank()) {
            throw new BusinessException("歌手名不能为空");
        }
        if (singer.getId() == null) {
            singer.setFollowCount(0);
            singerMapper.insert(singer);
        } else {
            if (singerMapper.findById(singer.getId()) == null) {
                throw BusinessException.notFound("歌手不存在");
            }
            singerMapper.update(singer);
        }
    }

    @Override
    public void deleteSinger(Long id) {
        if (singerMapper.findById(id) == null) {
            throw BusinessException.notFound("歌手不存在");
        }
        if (songMapper.countBySinger(id) > 0) {
            throw new BusinessException("该歌手名下还有歌曲，请先删除或转移歌曲");
        }
        if (albumMapper.countPage(null, id) > 0) {
            throw new BusinessException("该歌手名下还有专辑，请先删除专辑");
        }
        singerMapper.delete(id);
    }

    @Override
    public void saveAlbum(Album album) {
        if (album.getName() == null || album.getName().isBlank()) {
            throw new BusinessException("专辑名不能为空");
        }
        if (album.getSingerId() == null || singerMapper.findById(album.getSingerId()) == null) {
            throw new BusinessException("请选择有效的歌手");
        }
        if (album.getId() == null) {
            album.setCover(album.getCover() == null || album.getCover().isBlank()
                    ? "/images/album/a1.png" : album.getCover());
            albumMapper.insert(album);
        } else {
            if (albumMapper.findById(album.getId()) == null) {
                throw BusinessException.notFound("专辑不存在");
            }
            albumMapper.update(album);
        }
    }

    @Override
    public void deleteAlbum(Long id) {
        if (albumMapper.findById(id) == null) {
            throw BusinessException.notFound("专辑不存在");
        }
        if (songMapper.countByAlbum(id) > 0) {
            throw new BusinessException("该专辑下还有歌曲，请先删除歌曲");
        }
        albumMapper.delete(id);
    }

    @Override
    public PageResult<PlaylistVO> playlists(String keyword, int page, int size) {
        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 1), 100);
        long total = playlistMapper.countPage(keyword, null, null, null);
        List<PlaylistVO> list = playlistMapper.selectPage(keyword, null, null, null,
                UserContext.getUserId(), (page - 1L) * size, size);
        return PageResult.of(total, list);
    }

    @Override
    public void savePlaylist(Playlist playlist) {
        if (playlist.getName() == null || playlist.getName().isBlank()) {
            throw new BusinessException("歌单名称不能为空");
        }
        if (playlist.getId() == null) {
            playlist.setUserId(playlist.getUserId() == null ? UserContext.requireUserId() : playlist.getUserId());
            playlist.setCover(playlist.getCover() == null || playlist.getCover().isBlank()
                    ? "/images/playlist/p6.png" : playlist.getCover());
            playlist.setCategory(playlist.getCategory() == null || playlist.getCategory().isBlank()
                    ? "流行" : playlist.getCategory());
            playlist.setIsRecommend(playlist.getIsRecommend() == null ? 0 : playlist.getIsRecommend());
            playlist.setStatus(1);
            playlistMapper.insert(playlist);
        } else {
            Playlist exist = playlistMapper.findById(playlist.getId());
            if (exist == null) {
                throw BusinessException.notFound("歌单不存在");
            }
            exist.setName(playlist.getName());
            exist.setCover(playlist.getCover() == null ? exist.getCover() : playlist.getCover());
            exist.setIntro(playlist.getIntro());
            exist.setCategory(playlist.getCategory() == null ? exist.getCategory() : playlist.getCategory());
            exist.setIsRecommend(playlist.getIsRecommend() == null ? exist.getIsRecommend() : playlist.getIsRecommend());
            playlistMapper.update(exist);
        }
    }

    @Override
    @Transactional
    public void deletePlaylist(Long id) {
        if (playlistMapper.findById(id) == null) {
            throw BusinessException.notFound("歌单不存在");
        }
        playlistSongMapper.deleteByPlaylist(id);
        playlistMapper.delete(id);
    }

    @Override
    public List<Banner> banners() {
        return bannerMapper.selectAll();
    }

    @Override
    public void saveBanner(Banner banner) {
        if (banner.getImageUrl() == null || banner.getImageUrl().isBlank()) {
            throw new BusinessException("轮播图片地址不能为空");
        }
        banner.setTitle(banner.getTitle() == null ? "" : banner.getTitle());
        banner.setLinkType(banner.getLinkType() == null ? 1 : banner.getLinkType());
        banner.setSort(banner.getSort() == null ? 0 : banner.getSort());
        banner.setStatus(banner.getStatus() == null ? 1 : banner.getStatus());
        if (banner.getId() == null) {
            bannerMapper.insert(banner);
        } else {
            if (bannerMapper.findById(banner.getId()) == null) {
                throw BusinessException.notFound("轮播图不存在");
            }
            bannerMapper.update(banner);
        }
    }

    @Override
    public void deleteBanner(Long id) {
        if (bannerMapper.findById(id) == null) {
            throw BusinessException.notFound("轮播图不存在");
        }
        bannerMapper.delete(id);
    }

    @Override
    public PageResult<UserVO> users(String keyword, int page, int size) {
        page = Math.max(page, 1);
        size = Math.min(Math.max(size, 1), 100);
        long total = userMapper.countPage(keyword);
        List<UserVO> list = userMapper.selectPage(keyword, (page - 1L) * size, size);
        return PageResult.of(total, list);
    }

    @Override
    public void updateUser(Long id, Integer role, Integer status) {
        if (role == null || (role != 0 && role != 1)) {
            throw new BusinessException("角色只能是 0（普通用户）或 1（管理员）");
        }
        if (status == null || (status != 0 && status != 1)) {
            throw new BusinessException("状态只能是 0（禁用）或 1（正常）");
        }
        if (id.equals(UserContext.requireUserId()) && (role != 1 || status != 1)) {
            throw new BusinessException("不能修改自己的角色或禁用自己");
        }
        if (userMapper.findById(id) == null) {
            throw BusinessException.notFound("用户不存在");
        }
        userMapper.updateRoleStatus(id, role, status);
    }
}
