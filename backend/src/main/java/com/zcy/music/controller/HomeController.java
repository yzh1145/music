package com.zcy.music.controller;

import com.zcy.music.common.Result;
import com.zcy.music.service.HomeService;
import com.zcy.music.vo.HomeVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 首页聚合接口。
 */
@RestController
@RequestMapping("/api/home")
public class HomeController {

    private final HomeService homeService;

    public HomeController(HomeService homeService) {
        this.homeService = homeService;
    }

    @GetMapping
    public Result<HomeVO> home() {
        return Result.ok(homeService.home());
    }
}
