package com.zcy.music.controller;

import com.zcy.music.common.PageResult;
import com.zcy.music.common.Result;
import com.zcy.music.service.AlbumService;
import com.zcy.music.vo.AlbumDetailVO;
import com.zcy.music.vo.AlbumVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 专辑接口。
 */
@RestController
@RequestMapping("/api/album")
public class AlbumController {

    private final AlbumService albumService;

    public AlbumController(AlbumService albumService) {
        this.albumService = albumService;
    }

    @GetMapping("/page")
    public Result<PageResult<AlbumVO>> page(@RequestParam(required = false) String keyword,
                                           @RequestParam(required = false) Long singerId,
                                           @RequestParam(defaultValue = "1") int page,
                                           @RequestParam(defaultValue = "10") int size) {
        return Result.ok(albumService.page(keyword, singerId, page, size));
    }

    @GetMapping("/{id}")
    public Result<AlbumDetailVO> detail(@PathVariable Long id) {
        return Result.ok(albumService.detail(id));
    }
}
