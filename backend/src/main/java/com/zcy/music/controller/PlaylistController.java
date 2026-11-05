package com.zcy.music.controller;

import com.zcy.music.common.PageResult;
import com.zcy.music.common.Result;
import com.zcy.music.entity.Playlist;
import com.zcy.music.service.PlaylistService;
import com.zcy.music.vo.PlaylistDetailVO;
import com.zcy.music.vo.PlaylistVO;
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
 * 歌单接口：浏览、详情、增删改、收藏。
 */
@RestController
@RequestMapping("/api/playlist")
public class PlaylistController {

    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @GetMapping("/page")
    public Result<PageResult<PlaylistVO>> page(@RequestParam(required = false) String keyword,
                                              @RequestParam(required = false) String category,
                                              @RequestParam(required = false) Integer recommend,
                                              @RequestParam(defaultValue = "1") int page,
                                              @RequestParam(defaultValue = "10") int size) {
        return Result.ok(playlistService.page(keyword, category, recommend, page, size));
    }

    @GetMapping("/{id}")
    public Result<PlaylistDetailVO> detail(@PathVariable Long id) {
        return Result.ok(playlistService.detail(id));
    }

    /** 我创建的歌单 */
    @GetMapping("/mine")
    public Result<List<PlaylistVO>> mine() {
        return Result.ok(playlistService.created());
    }

    /** 我收藏的歌单 */
    @GetMapping("/collected")
    public Result<List<PlaylistVO>> collected() {
        return Result.ok(playlistService.collected());
    }

    @PostMapping
    public Result<PlaylistVO> create(@RequestBody Playlist playlist) {
        return Result.ok(playlistService.create(playlist));
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Playlist playlist) {
        playlist.setId(id);
        playlistService.update(playlist);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        playlistService.delete(id);
        return Result.ok();
    }

    @PostMapping("/{id}/song/{songId}")
    public Result<Void> addSong(@PathVariable Long id, @PathVariable Long songId) {
        playlistService.addSong(id, songId);
        return Result.ok();
    }

    @DeleteMapping("/{id}/song/{songId}")
    public Result<Void> removeSong(@PathVariable Long id, @PathVariable Long songId) {
        playlistService.removeSong(id, songId);
        return Result.ok();
    }

    @PostMapping("/{id}/play")
    public Result<Void> play(@PathVariable Long id) {
        playlistService.addPlayCount(id);
        return Result.ok();
    }

    @PostMapping("/{id}/collect")
    public Result<Boolean> collect(@PathVariable Long id) {
        return Result.ok(playlistService.toggleCollect(id));
    }
}
