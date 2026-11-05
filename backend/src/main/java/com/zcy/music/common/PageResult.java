package com.zcy.music.common;

import java.util.Collections;
import java.util.List;

/**
 * 分页响应结构：{total, list}。
 */
public class PageResult<T> {

    private long total;
    private List<T> list;

    public PageResult() {
    }

    public PageResult(long total, List<T> list) {
        this.total = total;
        this.list = list == null ? Collections.emptyList() : list;
    }

    public static <T> PageResult<T> of(long total, List<T> list) {
        return new PageResult<>(total, list);
    }

    public static <T> PageResult<T> empty() {
        return new PageResult<>(0, Collections.emptyList());
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public List<T> getList() {
        return list;
    }

    public void setList(List<T> list) {
        this.list = list;
    }
}
