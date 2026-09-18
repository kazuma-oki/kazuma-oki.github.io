"""STUDIOのストレージから画像を assets/images/ へダウンロードする（移植時の一度きり用）。

URLは tools/fetch_assets.py の出力（tools/extracted/）で確認したものを直接指定している。
"""

import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "images"

CMS = "https://storage.googleapis.com/studio-cms-assets/projects/RQqJdQoBWg/"
DESIGN = "https://storage.googleapis.com/studio-design-asset-files/projects/RQqJdQoBWg/"

# 保存先 -> 候補URL（先頭から順に試し、取得できたものを使う）
TARGETS = {
    "hero.webp": [DESIGN + "s-1600x2400_v-frms_webp_72cae652-19aa-4fea-8f89-d8881574897c_regular.webp"],
    # Works一覧のサムネイル（一覧用と詳細用でアセットIDが異なる）
    "works/greenloop-thumb.webp": [
        CMS + "s-974x730_v-fs_webp_8e16f492-7458-438c-9ead-cb9c85d5fb83.webp",
        CMS + "s-974x730_v-fs_webp_8e16f492-7458-438c-9ead-cb9c85d5fb83_large.webp",
        CMS + "s-974x730_v-fs_webp_8e16f492-7458-438c-9ead-cb9c85d5fb83_small.webp",
    ],
    "works/portfolio-thumb.webp": [
        CMS + "s-973x730_v-fs_webp_b9a2db6d-f887-4ee6-a4f8-7197de8dced8.webp",
        CMS + "s-973x730_v-fs_webp_b9a2db6d-f887-4ee6-a4f8-7197de8dced8_large.webp",
        CMS + "s-973x730_v-fs_webp_b9a2db6d-f887-4ee6-a4f8-7197de8dced8_small.webp",
    ],
    "works/kaiza-thumb.webp": [
        CMS + "s-974x730_v-fs_webp_0fecd3a3-9313-40e7-b8d5-3dd551690d7d.webp",
        CMS + "s-974x730_v-fs_webp_0fecd3a3-9313-40e7-b8d5-3dd551690d7d_large.webp",
        CMS + "s-974x730_v-fs_webp_0fecd3a3-9313-40e7-b8d5-3dd551690d7d_small.webp",
    ],
    # Works詳細のメイン画像
    "works/greenloop-main.png": [CMS + "s-974x730_v-fs_webp_d6a72f28-6382-47cd-865c-efe40013eb31.png"],
    "works/portfolio-main.png": [CMS + "s-973x730_v-fs_webp_676be846-2452-4330-bbce-79873e51836e.png"],
    "works/kaiza-main.png": [CMS + "s-974x730_v-fs_webp_5b675467-02c3-4513-adb3-acef3eac5384.png"],
    # 全体デザイン（縦長キャプチャ）
    "works/greenloop-full.png": [CMS + "s-1060x2400_v-frms_webp_22eb88cc-f1ec-4fa0-a6eb-2ab5e95d232c.png"],
}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    for name, candidates in TARGETS.items():
        dest = OUT / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        for url in candidates:
            try:
                data = fetch(url)
            except urllib.error.HTTPError as e:
                print(f"  {e.code} {url.rsplit('/', 1)[-1]}")
                continue
            dest.write_bytes(data)
            print(f"OK {name}  {len(data) // 1024}KB  <- {url.rsplit('/', 1)[-1]}")
            break
        else:
            print(f"NG {name} : 取得できませんでした")


if __name__ == "__main__":
    main()
