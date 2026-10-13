# portfolio

GitHub Pages で公開するシンプルなポートフォリオサイト（素の HTML / CSS / JS）。

## 構成

```
index.html          Top（MV・SNS・Instagram・各ページへのリンク）
profile/index.html  プロフィール
works/index.html    作品一覧
members/index.html  ログイン必須ページ（Cloudflare Access で保護）
data/site.json      名前・SNS・Instagram・プロフィールの中身
data/works.json     作品リスト
images/             画像置き場
assets/             CSS / JS
```

## 更新のしかた

中身はすべて `data/` の JSON にあるので、HTML を触る必要はありません。

- 作品を追加：`data/works.json` に1件追加し、画像を `images/` に置く
- プロフィール・SNS の変更：`data/site.json` を編集
- MV の差し替え：`images/` に画像を置き、`site.json` の `mv` を変更

main に push すると 1〜2 分で公開サイトに反映されます。

## Instagram

`site.json` の `instagram` で設定します。

- `feedUrl`：Behold などで発行した JSON フィードの URL（あれば優先）
- `manual`：手動指定。`[{ "image": "images/ig1.jpg", "url": "投稿のURL" }]`
- どちらも空ならグレーのプレースホルダーを表示

## ログイン必須ページ

`/members/` は Cloudflare Access で保護する想定です。設定が済むまでは公開状態なので、非公開の内容は置かないでください。
