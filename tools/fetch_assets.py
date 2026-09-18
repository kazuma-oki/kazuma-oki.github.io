"""現行STUDIOサイトからテキストと画像を抽出する（移植時の一度きり用）。

使い方:
    python tools/fetch_assets.py

- 各ページのテキストを tools/extracted/*.txt に出力する（data/*.json を書くための元ネタ）
- 画像を assets/images/ 配下にダウンロードする
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "https://kazuma-pf.studio.site"
ROOT = Path(__file__).resolve().parent.parent
OUT_TEXT = ROOT / "tools" / "extracted"
OUT_IMG = ROOT / "assets" / "images"

PAGES = {
    "top": "/",
    "about": "/about",
    "contact": "/contact",
    "works-greenloop": "/works/greenloop",
    "works-portfolio": "/works/portfolio",
    "works-kaiza": "/works/kaiza",
}

# 保存先ファイル名 -> 画像URLの判定キーワード
IMG_RULES = [
    ("hero.webp", "studio-design-asset-files"),
]


def dump_page(pg, name, path):
    pg.goto(BASE + path, wait_until="networkidle", timeout=90000)
    pg.wait_for_timeout(1500)
    # 遅延読み込み画像を発火させるため最後までスクロール
    height = pg.evaluate("document.body.scrollHeight")
    y = 0
    while y < height:
        y += 800
        pg.evaluate(f"window.scrollTo(0,{y})")
        pg.wait_for_timeout(250)
        height = pg.evaluate("document.body.scrollHeight")
    pg.evaluate("window.scrollTo(0,0)")
    pg.wait_for_timeout(800)

    text = pg.evaluate(
        """() => {
        const out = [];
        document.querySelectorAll('body *').forEach(el => {
            if (el.childElementCount === 0) {
                const t = el.textContent.trim();
                if (t) out.push(el.tagName + '\\t' + t);
            }
            if (el.tagName === 'IMG' && el.currentSrc) out.push('IMG\\t' + el.currentSrc);
        });
        return out.join('\\n');
    }"""
    )
    (OUT_TEXT / f"{name}.txt").write_text(text, encoding="utf-8")

    imgs = pg.evaluate(
        "() => Array.from(document.querySelectorAll('img')).map(i => i.currentSrc).filter(Boolean)"
    )
    return imgs


def download(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        print(f"  skip  {dest.relative_to(ROOT)}")
        return
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        dest.write_bytes(r.read())
    print(f"  saved {dest.relative_to(ROOT)}  ({dest.stat().st_size // 1024}KB)")


def main():
    OUT_TEXT.mkdir(parents=True, exist_ok=True)
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    found = {}

    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1440, "height": 1000})
        for name, path in PAGES.items():
            print(f"[{name}] {path}")
            found[name] = dump_page(pg, name, path)
            for u in found[name]:
                print("   img:", u.split("?")[0])
        b.close()

    (OUT_TEXT / "images.json").write_text(
        json.dumps(found, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("\n-> tools/extracted/ にテキストと画像URL一覧を出力しました")
    print("   ダウンロードは tools/download_images.py で行います")


if __name__ == "__main__":
    main()
