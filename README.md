# fafantoとは
fafantoはシンプルな静的サイトビルダー/CMSのWebアプリで、とてもコンパクトで軽いサイト（ブログ）を作るのに便利です。  
既存のStatic Site GeneatorはGUIがなくて難しかったので素のJavaScriptとHTML,CSSで簡単に作りました。  
※サーバーにファイルをアップロードする機能はありません。

## fafantoの特徴
* WebアプリなのでWindows,Mac,Linuxに対応
* 軽量でサクサク動作
* テンプレートは1つのみで各ページのカスタムが簡単
* エディターは高機能な**Visual Studio Code**のWeb版を使用（Microsoftが開発しているMonaco editor）
* 一部の更新で全ページの更新はしないため、記事が増えて重くなるようなことない
* オープンソースなので改造も自由
## 必要な環境
fafantoは**PC用**のWebアプリです。  
ローカルファイルを読み書きする機能のFile System Access APIがPC版のChromium系のブラウザにしか実装されてないためです。  
なのでブラウザは**PC版**の**Google Chrome**か**Microsoft Edge**か**Chromium**をお使い下さい。  
モバイル版のChromium系ブラウザはAPIが実装されていないので動作しません。Braveは意図的に対応してないようです。  
## fafantoの始め方
1. PCのローカル環境にfafanto用のフォルダを1つ作ります
2. fafanto.appにアクセスして作ったフォルダを選択します
3. 「設定」の項目を埋めます
4. アプリをリロードしたらPost（ブログ）やPageで記事を書き始められます
