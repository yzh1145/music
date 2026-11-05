package com.zcy.music.service.impl;

import com.zcy.music.common.BusinessException;
import com.zcy.music.common.PasswordUtil;
import com.zcy.music.common.UserContext;
import com.zcy.music.dto.PasswordDTO;
import com.zcy.music.dto.UserUpdateDTO;
import com.zcy.music.entity.Playlist;
import com.zcy.music.entity.Singer;
import com.zcy.music.entity.Song;
import com.zcy.music.entity.User;
import com.zcy.music.mapper.PlaylistMapper;
import com.zcy.music.mapper.SingerMapper;
import com.zcy.music.mapper.SongMapper;
import com.zcy.music.mapper.UserMapper;
import com.zcy.music.mapper.UserPlaylistMapper;
import com.zcy.music.mapper.UserSingerMapper;
import com.zcy.music.mapper.UserSongMapper;
import com.zcy.music.service.UserService;
import com.zcy.music.vo.PlaylistVO;
import com.zcy.music.vo.SingerVO;
import com.zcy.music.vo.SongVO;
import com.zcy.music.vo.UserVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 用户服务实现：涉及计数变化的操作都放在事务中，保证数据一致。
 */
@Service
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final SongMapper songMapper;
    private final PlaylistMapper playlistMapper;
    private final SingerMapper singerMapper;
    private final UserSongMapper userSongMapper;
    private final UserPlaylistMapper userPlaylistMapper;
    private final UserSingerMapper userSingerMapper;

    public UserServiceImpl(UserMapper userMapper, SongMapper songMapper, PlaylistMapper playlistMapper,
                           SingerMapper singerMapper, UserSongMapper userSongMapper,
                           UserPlaylistMapper userPlaylistMapper, UserSingerMapper userSingerMapper) {
        this.userMapper = userMapper;
        this.songMapper = songMapper;
        this.playlistMapper = playlistMapper;
        this.singerMapper = singerMapper;
        this.userSongMapper = userSongMapper;
        this.userPlaylistMapper = userPlaylistMapper;
        this.userSingerMapper = userSingerMapper;
    }

    @Override
    public UserVO profile() {
        Long userId = UserContext.requireUserId();
        UserVO vo = userMapper.findVOById(userId);
        if (vo == null) {
            throw BusinessException.notFound("用户不存在");
        }
        return vo;
    }

    @Override
    public void updateProfile(UserUpdateDTO dto) {
        Long userId = UserContext.requireUserId();
        User user = userMapper.findById(userId);
        if (user == null) {
            throw BusinessException.notFound("用户不存在");
        }
        if (dto.nickname() == null || dto.nickname().isBlank()) {
            throw new BusinessException("昵称不能为空");
        }
        if (dto.nickname().length() > 20) {
            throw new BusinessException("昵称最长 20 个字符");
        }
        if (dto.signature() != null && dto.signature().length() > 255) {
            throw new BusinessException("个性签名最长 255 个字符");
        }
        user.setNickname(dto.nickname().trim());
        user.setAvatar(dto.avatar());
        user.setGender(dto.gender() == null ? 0 : dto.gender());
        user.setBirthday(dto.birthday());
        user.setSignature(dto.signature());
        user.setPhone(dto.phone());
        user.setEmail(dto.email());
        userMapper.updateProfile(user);
    }

    @Override
    public void changePassword(PasswordDTO dto) {
        Long userId = UserContext.requireUserId();
        User user = userMapper.findById(userId);
        if (user == null) {
            throw BusinessException.notFound("用户不存在");
        }
        if (dto.oldPassword() == null || !PasswordUtil.matches(dto.oldPassword(), user.getPassword())) {
            throw new BusinessException("原密码不正确");
        }
        if (dto.newPassword() == null || dto.newPassword().length() < 6 || dto.newPassword().length() > 20) {
            throw new BusinessException("新密码长度需为 6-20 位");
        }
        if (dto.newPassword().equals(dto.oldPassword())) {
            throw new BusinessException("新密码不能与原密码相同");
        }
        userMapper.updatePassword(userId, PasswordUtil.encode(dto.newPassword()));
    }

    @Override
    @Transactional
    public boolean toggleLike(Long songId) {
        Long userId = UserContext.requireUserId();
        Song song = songMapper.findByIdForUpdate(songId);
        if (song == null || song.getStatus() == null || song.getStatus() == 0) {
            throw BusinessException.notFound("歌曲不存在或已下架");
        }
        if (userSongMapper.exists(userId, songId) > 0) {
            userSongMapper.delete(userId, songId);
            songMapper.updateLikeCount(songId, -1);
            return false;
        }
        userSongMapper.insert(userId, songId);
        songMapper.updateLikeCount(songId, 1);
        return true;
    }

    @Override
    @Transactional
    public boolean toggleCollect(Long playlistId) {
        Long userId = UserContext.requireUserId();
        Playlist playlist = playlistMapper.findByIdForUpdate(playlistId);
        if (playlist == null || playlist.getStatus() == null || playlist.getStatus() == 0) {
            throw BusinessException.notFound("歌单不存在或已删除");
        }
        if (userPlaylistMapper.exists(userId, playlistId) > 0) {
            userPlaylistMapper.delete(userId, playlistId);
            playlistMapper.updateCollectCount(playlistId, -1);
            return false;
        }
        userPlaylistMapper.insert(userId, playlistId);
        playlistMapper.updateCollectCount(playlistId, 1);
        return true;
    }

    @Override
    @Transactional
    public boolean toggleFollow(Long singerId) {
        Long userId = UserContext.requireUserId();
        Singer singer = singerMapper.findByIdForUpdate(singerId);
        if (singer == null) {
            throw BusinessException.notFound("歌手不存在");
        }
        if (userSingerMapper.exists(userId, singerId) > 0) {
            userSingerMapper.delete(userId, singerId);
            singerMapper.updateFollowCount(singerId, -1);
            return false;
        }
        userSingerMapper.insert(userId, singerId);
        singerMapper.updateFollowCount(singerId, 1);
        return true;
    }

    @Override
    public List<SongVO> likeSongs() {
        return userSongMapper.selectByUser(UserContext.requireUserId());
    }

    @Override
    public List<PlaylistVO> collectPlaylists() {
        return userPlaylistMapper.selectByUser(UserContext.requireUserId());
    }

    @Override
    public List<SingerVO> followSingers() {
        return userSingerMapper.selectByUser(UserContext.requireUserId());
    }
}
