package com.zcy.music.controller;

import com.zcy.music.common.PageResult;
import com.zcy.music.common.Result;
import com.zcy.music.service.SingerService;
import com.zcy.music.vo.SingerDetailVO;
import com.zcy.music.vo.SingerVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 歌手接口：分页、详情、关注。
 */
@RestController
@RequestMapping("/api/singer")
public class SingerController {

    private final SingerService singerService;

    public SingerController(SingerService singerService) {
        this.singerService = singerService;
    }

    @GetMapping("/page")
    public Result<PageResult<SingerVO>> page(@RequestParam(required = false) String keyword,
                                            @RequestParam(required = false) String region,
                                            @RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        return Result.ok(singerService.page(keyword, region, page, size));
    }

    @GetMapping("/{id}")
    public Result<SingerDetailVO> detail(@PathVariable Long id) {
        return Result.ok(singerService.detail(id));
    }

    @PostMapping("/{id}/follow")
    public Result<Boolean> follow(@PathVariable Long id) {
        return Result.ok(singerService.toggleFollow(id));
    }
}
