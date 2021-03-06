### fafantoとは
[fafanto/ファファント](https://www.fafanto.app/)はシンプルな静的サイトビルダー/CMSのWebアプリで、小規模な個人向けのサイトやブログを作るのに適しています。  
既存のStatic Site GeneatorはGUIがなくエンジニアさん向けでしたので、WordPressのように最低限のGUIが付いたCMSを作りました。  
### fafantoの特徴
* Webアプリなので環境を選ばない（PCは必須）
* テンプレートは1つのみで各ページのカスタムが簡単
* エディターは高機能な**Visual Studio Code**のブラウザ版を使用（Microsoftが開発している [Monaco Editor](https://microsoft.github.io/monaco-editor)）
* 記事が増えてもセーブで重くならない
### fafantoにできないこと
* ファイルをサーバーにアップロード
* プラグインで機能を拡張
* 複数人でサイトを作る

### 必要な環境
fafantoは**PC用**のWebアプリなのでブラウザは**PC版**の**Google Chrome**か**Microsoft Edge**か**Chromium**をお使い下さい。  
PC用の理由はローカルファイルを読み書きする機能のFile System Access APIがPC版のChromium系のブラウザにしか実装されてないためです。  
Chromium系以外やモバイル版のブラウザでは現状動作しません。
### fafantoの始め方
1. PCのローカル環境にfafanto用のフォルダを1つ作ります
2. [fafanto.app](https://www.fafanto.app/)にアクセスして作ったフォルダを選択します
3. 「設定」の項目を埋めてアプリをリロードします
4. 同じフォルダを選択してPost（ブログ）やPage（固定ページ）で記事を書き始められます  

サーバーにアップロードする機能はないため、サイトを更新したらNetlifyなりホスティングサーバーにアップロードしてください。
