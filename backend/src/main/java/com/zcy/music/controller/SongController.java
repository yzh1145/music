package com.zcy.music.controller;

import com.zcy.music.common.PageResult;
import com.zcy.music.common.Result;
import com.zcy.music.service.SongService;
import com.zcy.music.service.UserService;
import com.zcy.music.vo.SongVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 歌曲接口：分页、详情、播放计数、喜欢。
 */
@RestController
@RequestMapping("/api/song")
public class SongController {

    private final SongService songService;
    private final UserService userService;

    public SongController(SongService songService, UserService userService) {
        this.songService = songService;
        this.userService = userService;
    }

    @GetMapping("/page")
    public Result<PageResult<SongVO>> page(@RequestParam(required = false) String keyword,
                                          @RequestParam(required = false) Long singerId,
                                          @RequestParam(required = false) Long albumId,
                                          @RequestParam(required = false) Integer categoryId,
                                          @RequestParam(required = false) Integer recommend,
                                          @RequestParam(required = false) Integer status,
                                          @RequestParam(defaultValue = "new") String sort,
                                          @RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "10") int size) {
        return Result.ok(songService.page(keyword, singerId, albumId, categoryId, recommend, status, sort, page, size));
    }

    @GetMapping("/{id}")
    public Result<SongVO> detail(@PathVariable Long id) {
        return Result.ok(songService.detail(id));
    }

    /** 播放量 +1，前端开始播放时调用 */
    @PostMapping("/{id}/play")
    public Result<Void> play(@PathVariable Long id) {
        songService.addPlayCount(id);
        return Result.ok();
    }

    /** 喜欢 / 取消喜欢，返回切换后的状态 */
    @PostMapping("/{id}/like")
    public Result<Boolean> like(@PathVariable Long id) {
        return Result.ok(userService.toggleLike(id));
    }
}
