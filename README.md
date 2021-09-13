# fafantoとは
fafantoはシンプルな静的サイトビルダー/CMSのWebアプリで、コンパクトで軽い個人向けのサイト（ブログ）を作るのに適しています。  
既存のStatic Site GeneatorはGUIがなくエンジニアさん向けでしたので、WordPressとはいかないまでも最低限のGUIが付いたCMSがあればいいなと思って作りました。 
## fafantoの特徴
* WebアプリなのでWindows,Mac,Linuxに対応
* 軽量でサクサク動作
* テンプレートは1つのみで各ページのカスタムが簡単
* エディターは高機能な**Visual Studio Code**のWeb版を使用（Microsoftが開発しているMonaco editor）
* 一部の更新で全ページの更新はしないため、記事が増えて重くなるようなことない
* オープンソースなので改造も自由
## fafantoにできないこと
* ファイルをサーバーにアップロード
* プラグインで機能を拡張
* テーマを選択
拡張性はないのでもし欲しい機能がありましたら**自分で実装**してください。fafantoの本体は素のJavaScriptですので難易度は低いと思います。
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
