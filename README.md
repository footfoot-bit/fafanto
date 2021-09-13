# fafantoとは
fafantoはシンプルな静的サイトビルダー/CMSのWebアプリです。  既存のStatic Site GeneatorはGUIがなくて難しかったので素のJavaScriptとHTML,CSSで簡単に作ってみました。

## fafantoの特徴
* WebアプリなのでWindows,Mac,Linuxに対応（ロード時にフォルダ選択と許可は必要）
* シンプルな作りなので軽量でサクサク動作
* テンプレートは1つのみでとても簡単に各ページのHTML構造を編集できます
* クリーンなHTMLを保ちます
* VS Codeライクなエディターで編集できます（Microsoftが開発しているMonaco editorを使用）
* 拡張性は高くありませんがオープンソースなので改造して使うのも自由です
## 必要な環境
ブラウザはPC版のGoogle ChromeかMicrosoft EdgeかChromiumをお使い下さい。
このWebアプリはPC版のChromium系にしか実装されてないFile System Access APIでロカールファイルの読み書きをしています。
モバイル版のChromium系ブラウザはAPIが実装されていないので動作しません。Braveは意図的に対応してないようです。
## fafantoの始め方
1. PCのローカル環境にfafanto用のフォルダを1つ作ります
2. fafanto.appにアクセスして作ったフォルダを選択します
3. 「設定」の項目を埋めます
4. アプリをリロードしたらPost（ブログ）やPageで記事を書き始められます
