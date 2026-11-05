package com.zcy.music.service;

import com.zcy.music.dto.PasswordDTO;
import com.zcy.music.dto.UserUpdateDTO;
import com.zcy.music.vo.PlaylistVO;
import com.zcy.music.vo.SingerVO;
import com.zcy.music.vo.SongVO;
import com.zcy.music.vo.UserVO;

import java.util.List;

/**
 * 用户服务：资料、密码、喜欢 / 收藏 / 关注。
 */
public interface UserService {

    UserVO profile();

    void updateProfile(UserUpdateDTO dto);

    void changePassword(PasswordDTO dto);

    /** 切换喜欢状态，返回切换后的状态：true 已喜欢 */
    boolean toggleLike(Long songId);

    /** 切换歌单收藏状态 */
    boolean toggleCollect(Long playlistId);

    /** 切换歌手关注状态 */
    boolean toggleFollow(Long singerId);

    List<SongVO> likeSongs();

    List<PlaylistVO> collectPlaylists();

    List<SingerVO> followSingers();
}
