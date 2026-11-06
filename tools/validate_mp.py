#!/usr/bin/env python3
"""微信小程序端静态校验脚本。

小程序无法在命令行里直接运行，这里做能自动化的结构检查：

1. app.json / 页面 json 可解析，pages 与 tabBar 指向的文件齐全
2. usingComponents 路径存在
3. WXML 标签闭合、属性引号正确（把 wx:、bind: 前缀转义后交给 lxml）
4. WXSS 花括号配对，组件样式不写标签选择器
5. WXML 里 bindtap / catchtap 等事件处理函数在对应 JS 中存在
6. 组件 JS 使用 Component()、页面 JS 使用 Page()

用法：python tools/validate_mp.py
"""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MP = ROOT / "miniprogram"

errors: list[str] = []
warnings: list[str] = []

EVENT_ATTR = re.compile(r'(?:bind|catch|capture-bind|capture-catch|mut-bind)[:a-zA-Z]*="([A-Za-z_$][\w$]*)"')

# WXML 允许不写值的布尔属性，XML 解析前补成 ="true"
BOOLEAN_ATTRS = [
    "wx:else",
    "scroll-x",
    "scroll-y",
    "password",
    "auto-height",
    "lazy-load",
    "circular",
    "autoplay",
    "indicator-dots",
    "enhanced",
    "scroll-with-animation",
    "show-scrollbar",
]


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def check_json(path: Path):
    try:
        return json.loads(read(path))
    except Exception as exc:  # noqa: BLE001
        errors.append(f"{rel(path)}: JSON 解析失败 -> {exc}")
        return None


def resolve_component(from_dir: Path, value: str) -> Path | None:
    if value.startswith("/"):
        base = MP / value.lstrip("/")
    else:
        base = from_dir / value
    base = base.resolve()
    for suffix in (".json", ".js", ".wxml"):
        if not (base.with_suffix(suffix)).exists():
            return None
    return base


def check_wxml(path: Path):
    text = read(path)
    normalized = text
    for attr in BOOLEAN_ATTRS:
        normalized = re.sub(
            r"(?<![\w:-])" + re.escape(attr) + r"(?=\s|/?>)", attr + '="true"', normalized
        )
    # WXML 的命名空间写法不属于 XML，换成普通属性后再解析
    normalized = re.sub(r"\b(wx|bind|catch|mut-bind):", r"\1-", normalized)
    # WXML 允许属性值里直接写 &&，XML 需要转义
    normalized = re.sub(r"&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9A-Fa-f]+);)", "&amp;", normalized)
    try:
        ET.fromstring("<root>" + normalized + "</root>")
    except ET.ParseError as exc:
        errors.append(f"{rel(path)}: WXML 不合法 -> {exc}")
        return

    # 事件处理函数是否在 JS 中定义
    js_path = path.with_suffix(".js")
    if not js_path.exists():
        return
    js = read(js_path)
    for handler in sorted(set(EVENT_ATTR.findall(text))):
        if not re.search(r"\b" + re.escape(handler) + r"\s*[:(]", js):
            errors.append(f"{rel(path)}: 事件处理函数 {handler} 未在 {js_path.name} 中定义")


def strip_css_comments(text: str) -> str:
    return re.sub(r"/\*.*?\*/", "", text, flags=re.S)


def check_wxss(path: Path, is_component: bool):
    text = strip_css_comments(read(path))
    if text.count("{") != text.count("}"):
        errors.append(f"{rel(path)}: WXSS 花括号不配对")
    if not is_component:
        return
    # 组件样式只能用 class 选择器（小程序限制）
    for line in text.splitlines():
        stripped = line.strip()
        match = re.match(r"^([a-zA-Z][\w-]*)\s*[,{]", stripped)
        if match and match.group(1) not in ("from", "to"):
            warnings.append(
                f"{rel(path)}: 组件样式使用了标签选择器 `{match.group(1)}`，小程序中可能不生效"
            )


def check_page(page: str, app_json: dict):
    base = MP / page
    for suffix in (".js", ".json", ".wxml", ".wxss"):
        if not base.with_suffix(suffix).exists():
            errors.append(f"缺少页面文件: {rel(base.with_suffix(suffix))}")
            return
    data = check_json(base.with_suffix(".json"))
    if data is None:
        return
    js = read(base.with_suffix(".js"))
    if not re.search(r"\bPage\s*\(", js):
        errors.append(f"{rel(base.with_suffix('.js'))}: 页面应调用 Page()")

    check_wxml(base.with_suffix(".wxml"))
    check_wxss(base.with_suffix(".wxss"), is_component=False)

    for name, component in (data.get("usingComponents") or {}).items():
        target = resolve_component(base.parent, component)
        if target is None:
            errors.append(f"{rel(base.with_suffix('.json'))}: 组件 {name} 路径不存在 -> {component}")


def check_component(folder: Path):
    base = folder / "index"
    for suffix in (".js", ".json", ".wxml", ".wxss"):
        if not base.with_suffix(suffix).exists():
            errors.append(f"缺少组件文件: {rel(base.with_suffix(suffix))}")
            return
    data = check_json(base.with_suffix(".json"))
    if data and not data.get("component"):
        warnings.append(f"{rel(base.with_suffix('.json'))}: 缺少 \"component\": true")

    js = read(base.with_suffix(".js"))
    if not re.search(r"\bComponent\s*\(", js):
        errors.append(f"{rel(base.with_suffix('.js'))}: 组件应调用 Component()")

    check_wxml(base.with_suffix(".wxml"))
    check_wxss(base.with_suffix(".wxss"), is_component=True)


def main() -> int:
    app_json_path = MP / "app.json"
    if not app_json_path.exists():
        print("找不到 miniprogram/app.json")
        return 1
    app_json = check_json(app_json_path)
    if app_json is None:
        return 1

    for page in app_json.get("pages", []):
        check_page(page, app_json)

    tab_pages = {item["pagePath"] for item in app_json.get("tabBar", {}).get("list", [])}
    for item in app_json.get("tabBar", {}).get("list", []):
        for key in ("iconPath", "selectedIconPath"):
            icon = item.get(key)
            if icon and not (MP / icon).exists():
                errors.append(f"tabBar 图标不存在: {icon}")

    for page in tab_pages:
        if page not in app_json.get("pages", []):
            errors.append(f"tabBar 页面未在 pages 中声明: {page}")

    components_dir = MP / "components"
    if components_dir.exists():
        for folder in sorted(p for p in components_dir.iterdir() if p.is_dir()):
            check_component(folder)

    # 关键资源
    for asset in (
        "assets/images/default-cover.png",
        "assets/images/default-avatar.png",
        "assets/images/default-banner.png",
        "utils/format.wxs",
    ):
        if not (MP / asset).exists():
            errors.append(f"缺少资源: miniprogram/{asset}")

    print(f"检查页面 {len(app_json.get('pages', []))} 个，组件 "
          f"{len(list((MP / 'components').iterdir())) if (MP / 'components').exists() else 0} 个")

    for item in warnings:
        print("[WARN]", item)
    for item in errors:
        print("[ERROR]", item)

    if errors:
        print(f"\n共 {len(errors)} 个错误")
        return 1
    print("\n全部检查通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())
