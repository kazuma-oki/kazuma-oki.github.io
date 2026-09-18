# KAZUMA OKI Portfolio

STUDIOで作っていたポートフォリオ（https://kazuma-pf.studio.site/）を、デザインそのままに
STUDIO非依存の静的サイトとして作り直したもの。実績（Works）の掲載数に上限はない。

---

## 1. 実績（Works）を追加する

### 手順

1. 画像を `assets/images/works/` に置く
   - 一覧サムネイル：`<id>-thumb.webp`（横長。974×730くらいの比率）
   - 詳細ページのメイン画像：`<id>-main.webp`
   - 全体デザインの縦長キャプチャ（任意）：`<id>-full.webp`
2. `data/works.json` の **配列の先頭** に1件ぶん追記する（先頭が一覧の左上に並ぶ）
3. 次のコマンドを実行する

```bash
node build.js
```

これで `index.html` のカードと `works/<id>.html` の詳細ページが自動で作られる。

### 書き方（最小構成）

```json
{
  "id": "newwork",
  "title": "作品名",
  "category": "Website",
  "tag": "仮想",
  "date": "2026/9/18",
  "thumb": "assets/images/works/newwork-thumb.webp",
  "mainImage": "assets/images/works/newwork-main.webp",
  "sections": [
    { "heading": "概要", "blocks": [{ "text": "どんな作品かの説明。" }] }
  ]
}
```

| キー | 意味 |
|---|---|
| `id` | URLになる英数字。`works/<id>.html` として出力される |
| `title` | 作品名（一覧・詳細の見出し・ページタイトル） |
| `category` / `tag` | 一覧とメタ表示の「Website \| 仮想」の部分 |
| `date` | 詳細ページの青いバッジ |
| `thumb` | 一覧のサムネイル |
| `mainImage` | 詳細ページ上部の大きい画像（省略可） |
| `sections` | 詳細ページの本文。上から順に並び、間に区切り線が入る |

### `sections` の中身

セクションは `heading`（見出し）と `blocks`（中身）の組み合わせ。
`blocks` は上から順に並ぶ。使えるブロックは4種類。

```json
{
  "heading": "デザインのこだわり",
  "blocks": [
    { "text": "段落。改行したいときは \n を入れる。" },
    { "sub": "太字の小見出し" },
    { "list": ["箇条書き1", "箇条書き2"] },
    { "image": "assets/images/works/newwork-full.webp", "alt": "全体デザイン" }
  ]
}
```

`text` と `list` の中では `[表示したい文字](URL)` と書くとリンクになる。

---

## 2. Contactフォームを有効にする

STUDIOのフォーム機能は使えないので、送信先をGoogleフォームにしてある。
**現在は送信先が未設定で、送信ボタンは押せない状態**。有効にする手順は次のとおり。

1. Googleフォームを新規作成し、記述式の質問を3つ作る
   - 「フルネーム」「Email」「ご連絡・お問い合わせ内容」
2. フォーム編集画面の右上「︙」→ **「事前入力したURLを取得」** をクリック
3. 3つの欄に適当な文字を入れて「リンクを取得」→ 出てきたURLをコピー
4. URLの中の `entry.123456789=...` という部分を3つ探す。この数字が各質問のIDになる
5. `data/site.json` の `googleForm` を埋める

```json
"googleForm": {
  "actionUrl": "https://docs.google.com/forms/d/e/<フォームID>/formResponse",
  "entries": {
    "name": "entry.123456789",
    "email": "entry.987654321",
    "message": "entry.111222333"
  }
}
```

`actionUrl` は事前入力URLの `.../viewform?...` を **`.../formResponse`** に書き換えたもの。

6. `node build.js` を実行する

これで送信ボタンが有効になり、送信内容がGoogleフォームの回答（スプレッドシート）に溜まる。

---

## 3. GitHub Pages で公開する

出力ファイルはリポジトリ直下にあるので、そのまま公開できる。

1. GitHubで新しいリポジトリを作る
2. このフォルダをpushする
3. リポジトリの Settings → Pages → Source を **「Deploy from a branch」/ `main` / `/ (root)`** にする

`kazu451.github.io/<リポジトリ名>/` のようなサブディレクトリでも壊れないよう、
リンクと画像のパスはすべて相対パスで書いてある。

更新するときは `node build.js` を実行してから push する。

---

## 4. その他の編集

### 画像について

詳細ページの画像は **WebP** にしてある（PNGのままだと1枚400KB〜1.5MBあり、表示が重いため）。
新しくPNGを置く場合は、次のコマンドでWebPに変換してから `works.json` のパスを `.webp` にするとよい。

```bash
python -c "from PIL import Image; Image.open('assets/images/works/xxx.png').convert('RGB').save('assets/images/works/xxx.webp','WEBP',quality=90,method=6)"
```

---

| 変えたいもの | 編集する場所 |
|---|---|
| ヒーローの文字、プロフィール文、ナビ、SNSリンク | `data/site.json` |
| Aboutページの画像（現在は「準備中」の枠） | `data/site.json` の `about.image` に画像パスを入れる |
| 色・文字サイズ・余白 | `assets/css/style.css`（先頭の `:root` に色とフォントをまとめてある） |
| ページの骨組み | `templates/` |

---

## 5. ファイル構成

```
data/works.json     ← 実績データ（普段さわるのはここだけ）
data/site.json      ← サイト全体の設定
templates/          ← HTMLの雛形
assets/css/style.css
assets/js/main.js   ← ハンバーガーメニュー / スクロール表示 / フォーム送信
assets/images/      ← 画像
build.js            ← ビルドスクリプト（Node標準機能のみ。npm install 不要）
tools/              ← STUDIOから移植したときに使った抽出スクリプト（通常は使わない）

index.html / about.html / contact.html / works/*.html   ← ビルドで生成される
```

`index.html` などの出力ファイルは `build.js` が上書きするので、直接編集しないこと。
