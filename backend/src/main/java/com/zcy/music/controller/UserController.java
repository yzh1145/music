package com.zcy.music.controller;

import com.zcy.music.common.Result;
import com.zcy.music.dto.PasswordDTO;
import com.zcy.music.dto.UserUpdateDTO;
import com.zcy.music.service.UserService;
import com.zcy.music.vo.PlaylistVO;
import com.zcy.music.vo.SingerVO;
import com.zcy.music.vo.SongVO;
import com.zcy.music.vo.UserVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 用户中心接口：资料、密码、我喜欢、我的收藏、我的关注。
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public Result<UserVO> profile() {
        return Result.ok(userService.profile());
    }

    @PutMapping("/profile")
    public Result<Void> updateProfile(@RequestBody UserUpdateDTO dto) {
        userService.updateProfile(dto);
        return Result.ok();
    }

    @PutMapping("/password")
    public Result<Void> changePassword(@RequestBody PasswordDTO dto) {
        userService.changePassword(dto);
        return Result.ok();
    }

    @GetMapping("/like/song")
    public Result<List<SongVO>> likeSongs() {
        return Result.ok(userService.likeSongs());
    }

    @GetMapping("/collect/playlist")
    public Result<List<PlaylistVO>> collectPlaylists() {
        return Result.ok(userService.collectPlaylists());
    }

    @GetMapping("/follow/singer")
    public Result<List<SingerVO>> followSingers() {
        return Result.ok(userService.followSingers());
    }
}
