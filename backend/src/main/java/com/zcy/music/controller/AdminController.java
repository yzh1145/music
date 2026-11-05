package com.zcy.music.controller;

import com.zcy.music.common.PageResult;
import com.zcy.music.common.Result;
import com.zcy.music.common.UserContext;
import com.zcy.music.entity.Album;
import com.zcy.music.entity.Banner;
import com.zcy.music.entity.Playlist;
import com.zcy.music.entity.Singer;
import com.zcy.music.entity.Song;
import com.zcy.music.service.AdminService;
import com.zcy.music.service.AlbumService;
import com.zcy.music.service.SingerService;
import com.zcy.music.vo.AdminStatsVO;
import com.zcy.music.vo.AlbumVO;
import com.zcy.music.vo.PlaylistVO;
import com.zcy.music.vo.SingerVO;
import com.zcy.music.vo.SongVO;
import com.zcy.music.vo.UserVO;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 后台管理接口：所有方法都会校验管理员身份。
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final SingerService singerService;
    private final AlbumService albumService;

    public AdminController(AdminService adminService, SingerService singerService, AlbumService albumService) {
        this.adminService = adminService;
        this.singerService = singerService;
        this.albumService = albumService;
    }

    /** 数据看板 */
    @GetMapping("/stats")
    public Result<AdminStatsVO> stats() {
        UserContext.requireAdmin();
        return Result.ok(adminService.stats());
    }

    /* ==================== 歌曲 ==================== */

    @GetMapping("/song/page")
    public Result<PageResult<SongVO>> songs(@RequestParam(required = false) String keyword,
                                            @RequestParam(required = false) Integer status,
                                            @RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        UserContext.requireAdmin();
        return Result.ok(adminService.songs(keyword, status, page, size));
    }

    @PostMapping("/song")
    public Result<Void> saveSong(@RequestBody Song song) {
        UserContext.requireAdmin();
        adminService.saveSong(song);
        return Result.ok();
    }

    @DeleteMapping("/song/{id}")
    public Result<Void> deleteSong(@PathVariable Long id) {
        UserContext.requireAdmin();
        adminService.deleteSong(id);
        return Result.ok();
    }

    /* ==================== 歌手 ==================== */

    @GetMapping("/singer/page")
    public Result<PageResult<SingerVO>> singers(@RequestParam(required = false) String keyword,
                                                @RequestParam(defaultValue = "1") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        UserContext.requireAdmin();
        return Result.ok(singerService.page(keyword, null, page, size));
    }

    @PostMapping("/singer")
    public Result<Void> saveSinger(@RequestBody Singer singer) {
        UserContext.requireAdmin();
        adminService.saveSinger(singer);
        return Result.ok();
    }

    @DeleteMapping("/singer/{id}")
    public Result<Void> deleteSinger(@PathVariable Long id) {
        UserContext.requireAdmin();
        adminService.deleteSinger(id);
        return Result.ok();
    }

    /* ==================== 专辑 ==================== */

    @GetMapping("/album/page")
    public Result<PageResult<AlbumVO>> albums(@RequestParam(required = false) String keyword,
                                              @RequestParam(required = false) Long singerId,
                                              @RequestParam(defaultValue = "1") int page,
                                              @RequestParam(defaultValue = "10") int size) {
        UserContext.requireAdmin();
        return Result.ok(albumService.page(keyword, singerId, page, size));
    }

    @PostMapping("/album")
    public Result<Void> saveAlbum(@RequestBody Album album) {
        UserContext.requireAdmin();
        adminService.saveAlbum(album);
        return Result.ok();
    }

    @DeleteMapping("/album/{id}")
    public Result<Void> deleteAlbum(@PathVariable Long id) {
        UserContext.requireAdmin();
        adminService.deleteAlbum(id);
        return Result.ok();
    }

    /* ==================== 歌单 ==================== */

    @GetMapping("/playlist/page")
    public Result<PageResult<PlaylistVO>> playlists(@RequestParam(required = false) String keyword,
                                                    @RequestParam(defaultValue = "1") int page,
                                                    @RequestParam(defaultValue = "10") int size) {
        UserContext.requireAdmin();
        return Result.ok(adminService.playlists(keyword, page, size));
    }

    @PostMapping("/playlist")
    public Result<Void> savePlaylist(@RequestBody Playlist playlist) {
        UserContext.requireAdmin();
        adminService.savePlaylist(playlist);
        return Result.ok();
    }

    @DeleteMapping("/playlist/{id}")
    public Result<Void> deletePlaylist(@PathVariable Long id) {
        UserContext.requireAdmin();
        adminService.deletePlaylist(id);
        return Result.ok();
    }

    /* ==================== 轮播图 ==================== */

    @GetMapping("/banner/list")
    public Result<List<Banner>> banners() {
        UserContext.requireAdmin();
        return Result.ok(adminService.banners());
    }

    @PostMapping("/banner")
    public Result<Void> saveBanner(@RequestBody Banner banner) {
        UserContext.requireAdmin();
        adminService.saveBanner(banner);
        return Result.ok();
    }

    @DeleteMapping("/banner/{id}")
    public Result<Void> deleteBanner(@PathVariable Long id) {
        UserContext.requireAdmin();
        adminService.deleteBanner(id);
        return Result.ok();
    }

    /* ==================== 用户 ==================== */

    @GetMapping("/user/page")
    public Result<PageResult<UserVO>> users(@RequestParam(required = false) String keyword,
                                            @RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        UserContext.requireAdmin();
        return Result.ok(adminService.users(keyword, page, size));
    }

    /** 修改用户角色 / 状态 */
    @PutMapping("/user/{id}")
    public Result<Void> updateUser(@PathVariable Long id,
                                   @RequestParam(required = false) Integer role,
                                   @RequestParam(required = false) Integer status) {
        UserContext.requireAdmin();
        adminService.updateUser(id, role, status);
        return Result.ok();
    }
}
