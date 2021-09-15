# fafantoとは
fafantoはシンプルな静的サイトビルダー/CMSのWebアプリで、コンパクトで軽い個人向けのサイト（ブログ）を作るのに適しています。  
既存のStatic Site GeneatorはGUIがなくエンジニアさん向けでしたので、WordPressとはいかないまでも最低限のGUIが付いたCMSがあればいいなと思って作りました。  
## fafantoの特徴
* WebアプリなのでWindows,Mac,Linuxに対応
* 軽量でサクサク動作
* テンプレートは1つのみで各ページのカスタムが簡単
* エディターは高機能な**Visual Studio Code**のWeb版を使用（Microsoftが開発している [Monaco Editor](https://microsoft.github.io/monaco-editor)）
* 一部の更新で全ページの更新はしないため記事が増えても重くならない
* オープンソースなので改造が自由
## fafantoにできないこと
* ファイルをサーバーにアップロード
* プラグインで機能を拡張
* テーマを選択
* 複数人でサイトを作る

## 必要な環境
fafantoは**PC用**のWebアプリなのでブラウザは**PC版**の**Google Chrome**か**Microsoft Edge**か**Chromium**をお使い下さい。  
ローカルファイルを読み書きする機能のFile System Access APIがPC版のChromium系のブラウザにしか実装されてないためです。  
Chromium系以外やモバイル版のブラウザでは現状動作しません。
## fafantoの始め方
1. PCのローカル環境にfafanto用のフォルダを1つ作ります
2. [fafant.app](https://www.fafanto.app/)にアクセスして作ったフォルダを選択します
3. 「設定」の項目を埋めてアプリをリロードします
4. 同じフォルダを選択してPost（ブログ）やPage（固定ページ）で記事を書き始められます
