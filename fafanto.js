document.addEventListener('DOMContentLoaded', async () => {

  // Check user's browser supports (file API)
  if (window.showOpenFilePicker) console.log('File System is available');
  else document.querySelector('#guide div').innerHTML = 
  '<span class="exclamation">お使いのブラウザはこのアプリに対応していません。<b>PC版</b>の<b>Google Chrome</b>や<b>Microsoft Edge</b>(Chromium系のブラウザ)でアクセスしてください。</span>';

  // Registering Service Worker
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.register('sw.js')
  //   .then((reg) => {
  //     // registration worked
  //     console.log('Registration succeeded. Scope is ' + reg.scope);
  //   }).catch((error) => {
  //     // registration failed
  //     console.log('Registration failed with ' + error);
  //   });
  // }
  console.log(window.location.hostname,location.hostname,)
  //グローバル定数
  const LOAD = document.getElementById('loading');
  const DOMP = new DOMParser();
  const STAT = document.getElementById('status');
  const SAVE = document.getElementById('save');
  const PREV = document.getElementById('preview');
  const ACTF = document.getElementById('actfile');
  const OPEN = document.getElementById('open-dir');
  const H2SE = document.querySelector('h2');
  const POST = document.forms['post'];
  const PAGE = document.forms['page'];
  const BASE = document.forms['bases']
  const SETT = document.forms['setting'];
  const ALLS = document.forms['allsave'];
  const POSLI = POST.querySelector('.artlist');
  const POSBE = POST.querySelector('.bench');
  const PAGLI = PAGE.querySelector('.artlist');
  const PAGBE = PAGE.querySelector('.bench');
  const SETST = SETT.elements['index-title'];
  const LINKS = document.getElementById('links');
  const IMAGS = document.getElementById('images');

  //正規化
  const normal = {
    url: () => {
      const url = SETT.elements['index-url'].value;
      return url.replace(/\/$/, '/');
    },
    removeAllLineBreaks: (str) => {
      return str.replace(/(\r\n|\n|\r)/gm, '');
    },
    removeAllWhiteLine: (str) => {
      return str.replace(/^\s*[\r\n]/gm, '');
    }
  }
  //見つける
  const find = {
    dirBox: (box, dirName) => {
      for (let i = 0; i < box.length; i++) {
        if (box[i][0] === dirName) return box[i][1];
      }
    },
    exsist: (dirBox, fileName) => {
      for (const hdl of dirBox) {
        if (hdl.name === fileName) return true;
        else false;
      }
    },
    postIndex: (postData, fileName) => {
      for (let i = 0; i < postData.length; i++) {
        if (postData[i][0] === fileName) return i;
      }
    },
    numAll: (nestHdls) => {
      let i = 0;
      for (const array of nestHdls)  i = i + array[1].length;
      return i;
    }
  }

  //ダイアログとエラー
  const dialog = {
    confirmSave: (fileName) => {
      const result = confirm(`"${fileName}" をセーブしてもいいですか？`);
      if (!result) {
        alert('セーブを中止しました。');
        throw new Error('Stopped saving');
      }
    },
    successSave: (fileName) => {
      alert(`👍 "${fileName}" のセーブは成功しました。`);
    },
    completeSave: () => {
      alert('全てのファイルのセーブが完了しました。');
    },
    nameEmpty: () => {
      alert('⚠ ファイル名が空です。');
      throw new Error('Failed to save.File name is empty.');
    },
    nameExists: () => {
      alert('⚠ フォルダに同じファイル名が存在します。');
      throw new Error('Failed to save.Same file name exists.');
    },
    notTag: (tag) => {
      alert(`⚠ テンプレートに "${tag}" が存在していません。`);
      throw new Error(`"${tag}" does not exist in the template.`);
    }
  }

  //日付
  const date = {
    d: () => {
      return new Date();
    },
    year: () => {
      return String(date.d().getFullYear());
    },
    month: () => {
      return ('0'+ (date.d().getMonth()+1)).slice(-2);
    },
    day: () => {
      return ('0'+ date.d().getDate()).slice(-2);
    },
    hours: () => {
      return ('0'+ date.d().getHours()).slice(-2);
    },
    minutes: () => {
      return ('0'+ date.d().getMinutes()).slice(-2);
    },
    ymd: () => {
      return `${date.year()}-${date.month()}-${date.day()}`; //2021-05-26
    },
    ymdTime: () => {
      return `${date.year()}-${date.month()}-${date.day()}T${date.hours()}:${date.minutes()}`; //2021-05-26T14:00
    },
    changeFormat: (ymdTime) => {
      if(!ymdTime) return '';
      const year = ymdTime.slice(0,4);
      const month = ymdTime.slice(5,7);
      const day = ymdTime.slice(8,10);
      const monthInt = month.replace(/\b0+/, '');
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const monthName = monthNames[monthInt];
      const dt = SETT.elements['post-date-type'].value;
      if (dt === 'yyyy-mm-dd') return `${year}-${month}-${day}`;
      else if (dt === 'dd-mm-yyyy') return `${day} ${monthName}, ${year}`;
      else if (dt === 'mm-dd-yyyy') return `${monthName} ${day}, ${year}`;
    }
  }
  POST.querySelector('.artlist [type=datetime-local]').value = date.ymdTime();
  PAGE.querySelector('.artlist [type=datetime-local]').value = date.ymdTime();
  
  // 変換
  const convert = {
    docToHTMLStr:(doc) => {
      const str = doc.documentElement.outerHTML;
      return `<!DOCTYPE html>\n${str}`;
    },
    elemsToTextArr: (elems) => {
      if (elems.length) {
        const tagArray = [];
        for (const elem of elems) tagArray.push(elem.textContent);
        return tagArray;
      }
      else return '';
    },
    elemsToHTMLStr: (elems, htmlTag) => {
      const textArr = convert.elemsToTextArr(elems);
      if (textArr.length) {
        let htmlStr = '';
        for (const text of textArr) htmlStr += `<${htmlTag}>${text}</${htmlTag}>`;
        return htmlStr;
      }
    },
    textArrToHTMLStr: (arr, htmlTag) => {
      if (arr.length) {
        let htmlStr = '';
        for (const text of arr) htmlStr += `<${htmlTag}>${text}</${htmlTag}>`;
        return htmlStr;
      }
    },
    toShortString: (str,num,lastStr) => {
      if (str.length > num) return str.substr(0, num) + lastStr;
      else return str;
    },
    strNewLineToArr: (str) => {
      const trim = str.trim();
      return trim.split(/\n/);
    },
    checkboxToArr: (elem) => {
      const arr = [];
      const checkboxes = elem.querySelectorAll('[type="checkbox"]');
      for (const checkbox of checkboxes) {
        if(checkbox.checked == true) {
          const name = checkbox.getAttribute('name');
          arr.push(name);
        }
      }
      return arr;
    },
    strToArr: (str,separatText) => {
      const arr = [];
      if (str) {
        const sArr = str.split(separatText);
        for (const text of sArr) arr.push(text);
      }
      return arr;
    }
  }

//// monaco editor ////
  require.config({ paths: { vs: "monaco-editor/min/vs" } });
  class Monaco {
    constructor(formName, monacoEditor, path) {
      this.editor = monacoEditor;
      this.form = formName;
      this.relpath = path;
    }
    static async defaultText (filename) {
      const def = await fetch(`./thema/default/${filename}`);
      return await def.text();
    }
    static opt (value, language) {
      return {
        value: value,
        language: language,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        isWholeLine: true,
        wordWrap: 'on',
        minimap: {enabled: false}
        // wrappingStrategy: 'advanced',
        // overviewRulerLanes: 0
      }
    }
    static postPath = '../../';
    static pagePath = '../';
    insert (startTag, closeTag) {
      const sel = this.editor.getSelection();
      const val = this.editor.getModel().getValueInRange(sel);
      const tag = startTag + val + closeTag;
      this.editor.executeEdits('', [{ range: sel, text: tag, forceMoveMarkers: true}]);
      this.editor.focus();
    }
    viewSwitch (elem1, elem2) {
      elem1.classList.toggle('hide');
      elem2.classList.add('hide');
    }
    addHtmlTag () {
      document.forms[this.form].querySelector('[name=panelbtns]').onclick = (e) => {
        if (e.target.tagName === 'I') {
          const tag = e.target.dataset.tag;
          const attrEsc = e.target.dataset.attr;
          let attr = '';
          if (attrEsc) attr = ` ${decodeURI(attrEsc)}`;
          const childEsc = e.target.dataset.child;
          let child = '';
          if (childEsc) child = `${decodeURI(childEsc)}`;
          let newline = '';
          if (e.target.hasAttribute('data-newline')) newline = '\n';
          if ('br' === tag || 'hr' === tag || 'img' === tag) {
            this.insert(`<${tag}${attr}>${newline}`, '');
          } else this.insert(`<${tag}${attr}>`,`${child}</${tag}>${newline}`);
          return;
        }
        if (e.target.title === 'link') {
          this.viewSwitch(LINKS, IMAGS);
          LINKS.querySelector('fieldset').onclick = (e) => {
            if (e.target.tagName === 'P') {
              const dirName = LINKS.elements['dirs'].value;
              this.insert(`<a href="${this.relpath}${this.form}/${dirName}/${e.target.dataset.name}">`, `${e.target.dataset.title}</a>`);
            }
          }
          return;
        }
        if (e.target.title === 'img') {
          this.viewSwitch(IMAGS, LINKS);
          IMAGS.querySelector('fieldset').onclick = (e) => {
            let dir = '';
            const dirName = IMAGS.elements['dirs'].value;
            if (dirName !== 'root') dir = `${dirName}/`
            if (e.target.tagName === 'IMG')
            this.insert(`<img src="${this.relpath}media/${dir}${e.target.title}" alt="" loading="lazy">\n`, '');
            else if (e.target.tagName === 'FIGURE')
            this.insert(`<audio src="${this.relpath}media/${dir}${e.target.title}" controls>オーディオ再生に非対応のブラウザです。</audio>\n`, '');
            else if (e.target.tagName === 'VIDEO')
            this.insert(`<video src="${this.relpath}media/${dir}${e.target.title}" controls>ビデオ再生に非対応のブラウザです。</video>\n`, '');
            else if (e.target.tagName !== 'FIELDSET')
            this.insert(`<a href="${this.relpath}media/${dir}${e.target.title}">`, `${e.target.title}</a>\n`);
          }
        }
      }
    }
  }
  // monaco editorを作成
  const mePostContents = monaco.editor.create(POST.elements['contents'], Monaco.opt('Add Contents\n', 'html'));
  const mePageContents = monaco.editor.create(PAGE.elements['contents'], Monaco.opt('Add Contents\n', 'html'));
  const meBaseTemplate = monaco.editor.create(BASE.elements['template'], Monaco.opt(await Monaco.defaultText('template.html'), 'html'));
  const meBaseStyle = monaco.editor.create(BASE.elements['style'], Monaco.opt(await Monaco.defaultText('style.css'), 'css'));
  const meBaseMain = monaco.editor.create(BASE.elements['main'], Monaco.opt(await Monaco.defaultText('main.js'), 'javascript'));
  // instance for add html-tag button
  const meBtnsPosCont = new Monaco('post', mePostContents, Monaco.postPath);
  meBtnsPosCont.addHtmlTag();
  const meBtnsPagCont = new Monaco('page', mePageContents, Monaco.pagePath);
  meBtnsPagCont.addHtmlTag();
  // click to close button in links and imgs list
  LINKS.elements['btn'].onclick = () => LINKS.classList.add('hide');
  IMAGS.elements['btn'].onclick = () => IMAGS.classList.add('hide');

//event

  //　左アイコンメニュー
  document.querySelector('nav').onclick = (e) => {
    if (e.target.tagName === 'P') {
      const form = e.target.dataset.nav;
      H2SE.innerHTML = form.charAt(0).toUpperCase() + form.slice(1);
      H2SE.dataset.form = form;
      const navp = document.querySelectorAll('nav p');
      for (let i = 0; i < navp.length; i++) {
        navp[i].removeAttribute('class');
        document.forms[i].classList.remove('show');
      }
      document.getElementById(form).classList.add('show');
      e.target.setAttribute('class','on');
    }
  }

  //click spellcheck to on/off
  document.getElementById('spellcheck').onclick = () => {
    const sc = e.target;
    sc.classList.toggle('off');
    const forms = ['input','textarea'];
    if (sc.classList.contains('off')) {
      for (const form of forms) {
        const inps = document.querySelectorAll(form);
        for (const inp of inps) inp.setAttribute('spellcheck','false');
      }
    } else {
      for (const form of forms) {
        const inps = document.querySelectorAll(form);
        for (const inp of inps) inp.setAttribute('spellcheck','true');
      }
    }
  }

  //エディター右の開閉（PostとPage)
  for (const arrowBtn of document.querySelectorAll('.side h3 > b')) {
    arrowBtn.onclick = (e) => {
      e.target.classList.toggle('arrdown');
      e.target.parentNode.nextElementSibling.classList.toggle('hide');
    }
  }
  //タグのON/OFF (Post)
  POST.elements['tagbtns'].onclick = (e) => {
    if (e.target.tagName === 'I') e.target.classList.toggle('on');
  }

  {
    //click paneltab
    const paneltab = (form,e) => {
      const btns = form.elements['paneltab'].querySelectorAll('button');
      for (const btn of btns) btn.classList.remove('on');
      if (e.target.tagName === 'BUTTON') e.target.classList.toggle('on');
      const editors = form.querySelectorAll('.monacos');
      for (const editor of editors) editor.classList.add('hide');
      const on = form.elements['paneltab'].querySelector('button.on');
      form.elements['paneltab'].dataset.currenttab = on.dataset.tab;
    }
    BASE.elements['paneltab'].onclick = (e) => {
      paneltab(BASE,e);
      BASE.elements[e.target.dataset.tab.split('.')[0]].classList.remove('hide');
    }
    const tabs = document.querySelectorAll('#setting > .tab > b');
    const divs = document.querySelectorAll('#setting > div');
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].onclick = () => {
        for (const tab of tabs) tab.classList.remove('on');
        tabs[i].classList.add('on');
        for (const div of divs) div.classList.remove('show');
        divs[i].classList.add('show');
      }
    }
    //set translate="no"
    const elems = ['nav','header','#post .panel','#page .panel','#post [name=tagbtns]'];
    for (const elem of elems) document.querySelector(elem).setAttribute('translate','no');

    //draggable element
    let dragStartX, dragStartY;
    let objInitLeft, objInitTop;
    let inDrag = false;
    const dragTarget = document.querySelector('.drag');
    dragTarget.addEventListener("mousedown", (e) => {
      inDrag = true;
      objInitLeft = dragTarget.offsetLeft;
      objInitTop = dragTarget.offsetTop;
      dragStartX = e.pageX;
      dragStartY = e.pageY;
    });
    document.addEventListener("mousemove", (e) => {
      if (!inDrag) return;
      dragTarget.style.left = (objInitLeft + e.pageX-dragStartX) + "px";
      dragTarget.style.top = (objInitTop + e.pageY-dragStartY) + "px";
    });
    document.addEventListener("mouseup", () => inDrag = false);
  }

//// click select folder ////
  OPEN.onclick = async () => {
    const dirHandle = await window.showDirectoryPicker(); //dialog accept for load
    //create and get Handle of file/folder
     //dialog accept for save
    const setHandle = await dirHandle.getFileHandle('setting.json', {create:true});
    const webHandle = await dirHandle.getDirectoryHandle('webfiles', {create:true});
    const idxHandle = await webHandle.getFileHandle('index.html', {create:true});
    const stlHandle = await webHandle.getFileHandle('style.css', {create:true});
    const mjsHandle = await webHandle.getFileHandle('main.js', {create:true});
    const tagHandle = await webHandle.getFileHandle('tags.html',{create:true});
    const arsHandle = await webHandle.getFileHandle('archives.html', {create:true});
    const srhHandle = await webHandle.getFileHandle('search.html', {create:true});
    const icoHandle = await webHandle.getFileHandle('favicon.svg', {create:true});
    const theHandle = await dirHandle.getDirectoryHandle('thema', {create:true});
    const defHandle = await theHandle.getDirectoryHandle('default', {create:true});
    await defHandle.getFileHandle('template.html', {create:true});
    await defHandle.getFileHandle('style.css', {create:true});
    await defHandle.getFileHandle('main.js', {create:true});
    const posHandle = await webHandle.getDirectoryHandle('post', {create:true});
    const pagHandle = await webHandle.getDirectoryHandle('page', {create:true});
    const arcHandle = await webHandle.getDirectoryHandle('archive', {create:true});
    const medHandle = await webHandle.getDirectoryHandle('media', {create:true});
    await posHandle.getDirectoryHandle(date.year(), {create:true});
    await medHandle.getDirectoryHandle(date.year(), {create:true});
    const singleBox = [];
    singleBox.push(setHandle,mjsHandle,idxHandle,stlHandle,tagHandle,arsHandle,srhHandle,icoHandle);

    const listChild = async (rootDirHandle, arrayBox) => {
      for await (const hdl of rootDirHandle.values()) {
        if (hdl.kind === 'file') arrayBox.push(hdl);
      }
    }
    const listGrandChild = async (rootDirHandle, arrayBox) => {
      const rootFileHdls = [];
      for await (const hdl of rootDirHandle.values()) {
        if (hdl.kind === 'directory') {
          const dirHdls = [hdl.name];
          const fileHdls = [];
          for await (const file of hdl.values()) {
            if (file.kind === 'file') fileHdls.push(file);
          }
          dirHdls.push(fileHdls);
          arrayBox.push(dirHdls);
        }
        else rootFileHdls.push(hdl);
      }
      if (rootFileHdls.length) arrayBox.push(['root', rootFileHdls]);
      arrayBox.sort((a, b) => b[0] - a[0]);
    }
    const pageBox = [];
    const archiveBox = [];
    const themaBox = [];
    const postBox = [];
    const mediaBox = [];
    await listChild(pagHandle, pageBox);
    await listChild(arcHandle, archiveBox);
    await listGrandChild(theHandle, themaBox);
    await listGrandChild(posHandle, postBox);
    await listGrandChild(medHandle, mediaBox);
    console.log(themaBox,postBox,pageBox,mediaBox)

    //file class
    class EditFile {
      constructor(fileName, handleBox) {
        this.fileName = fileName;
        this.box = handleBox;
      }
      handle() {
        return this.box.find(({name}) => name === this.fileName);
      }
      async txt() {
        const getFile = await this.handle().getFile();
        return getFile.text();
      }
      async document() {
        const txt = await this.txt();
        return DOMP.parseFromString(txt,'text/html');
      }
      async write(str) {
        const w = await this.handle().createWritable();
        await w.write(str);
        await w.close();
      }
    }
    class EditTextFile extends EditFile {
      async writeURLToFile() {
        const writable = await this.handle().createWritable();
        const response = await fetch(this.url);
        await response.body.pipeTo(writable);
      }
    }
    {
      const favicon = new EditTextFile('favicon.svg', singleBox);
      const txt = await favicon.txt();
      if (!txt) await favicon.writeURLToFile();
    }
    class EditSetting extends EditTextFile {
      constructor(fileName) {
        super(fileName);
        this.fileName = 'setting.json';
        this.box = singleBox;
        this.setts = [
          'index-title',
          'index-subtitle',
          'index-url',
          'index-desc',
          'index-thumbpath',
          'blank-thumbpath',
          'author',
          'thema',
          'tags-title',
          'tags-desc',
          'archives-title',
          'archives-desc',
          'archive-title',
          'archive-desc',
          'search-title',
          'search-desc',
          'post-date-type',
          'post-taglist',
          'custom'
        ];
      }
      async load() {
        this.loadThemaList();
        const text = await this.txt();
        if (text) {
          const json = JSON.parse(text);
          for (const sett of this.setts) {
            const val = json[sett];
            if (val) SETT.elements[sett].value = val;
          }
        }
        this.loadTagBtnsForPostEditor();
        this.loadThemaText();
      }
      loadTagBtnsForPostEditor() {
        POST.elements['tagbtns'].textContent = '';
        const str = SETT.elements['post-taglist'].value;
        if (str) {
          const tagTextArr = convert.strNewLineToArr(str);
          for (const tagText of tagTextArr) POST.elements['tagbtns'].insertAdjacentHTML('beforeend', `<i data-tag="${tagText}">${tagText}</i>`);
        }
      }
      loadThemaText() {
        BASE.querySelector('[name=paneltab] > span').textContent = SETT.elements['thema'].value;
      }
      loadThemaList() {
        const elem = SETT.elements['thema'];
        elem.textContent = '';
        for (const dir of themaBox) {
          elem.insertAdjacentHTML('beforeend',`<option value="${dir[0]}">${dir[0]}</option>`);
        }
      }
      addCustomBtns() {
        const btnHtml = SETT.elements['custom'].value;
        const doc = DOMP.parseFromString(btnHtml,'text/html');
        const elems = doc.querySelectorAll('body > *');
        const panel = POST.elements['panelbtns'];
        for (const i of panel.querySelectorAll('i')) i.remove();
        for (const elem of elems) {
          const tag = elem.tagName.toLowerCase();
          let btn = elem.getAttribute('btn');
          elem.removeAttribute('btn');
          let newline = '';
          if (elem.hasAttribute('newline')) {
            newline = ' data-newline';
            elem.removeAttribute('newline');
          }
          let child = '';
          const innerHTML = elem.innerHTML;
          if (innerHTML) child = ` data-child="${encodeURI(innerHTML)}"`;
          let attribute = '';
          const attrs = elem.attributes;
          if (attrs.length) {
            let attr = '';
            for (let i = 0; i < attrs.length; i++) {
              attr += `${attrs[i].name}="${attrs[i].value}" `;
            }
            attribute = ` data-attr="${encodeURI(attr.trim())}"`;
          }
          if (!btn) btn = tag;
          panel.insertAdjacentHTML('beforeend', `<i data-tag="${tag}"${attribute}${child}${newline}>${btn}</i>`);
        }
      }
      async save() {
        const json = {};
        for (const sett of this.setts) {
          const val = SETT.elements[sett].value;
          if (val) json[sett] = val;
        }
        await this.write(JSON.stringify(json));
      }
    }
    const setting = new EditSetting();
    await setting.load();
    setting.addCustomBtns();

    //bases
    class EditBases extends EditTextFile {
      constructor(fileName, monacoEditor) {
        super(fileName);
        this.fileName = fileName;
        this.box = find.dirBox(themaBox, SETT.elements['thema'].value);
        console.log(this.box)
        // this.url = `default-${fileName}`;
        this.me = monacoEditor;
      }
      document() {
        return DOMP.parseFromString(this.me.getValue(),'text/html');
      }
      async load() {
        const text = await this.txt();
        if (text) this.me.setValue(text);
        else {
          const val = this.me.getValue();
          const def = val.substring(val.indexOf("\n") + 1);
          this.me.setValue(def);
          await this.write(def);
        }
      }
      async save() {
        await this.write(this.me.getValue());
        if (this.fileName === 'style.css' || this.fileName === 'main.js') {
          await new EditTextFile(this.fileName, singleBox).write(this.me.getValue());
        }
      }

    }
    const template = new EditBases('template.html', meBaseTemplate);
    const style = new EditBases('style.css', meBaseStyle);
    const main = new EditBases('main.js', meBaseMain);
    for (const baseFile of [template, style, main]) await baseFile.load();

    //HTML
    class EditHTML extends EditFile {
      constructor(fileName, handleBox, className, titleElem, descriptionElem, thumbnailPath, RequireArray, relativePath, middlePath) {
        super(fileName, handleBox);
        this.fileName = fileName;
        this.box = handleBox;
        this.class = className;
        this.title = titleElem;
        this.desc = descriptionElem;
        this.thumb = thumbnailPath;
        this.req = RequireArray;
        this.relpath = relativePath;
        this.midpath = middlePath;
      }
      fafantoVals() {
        const vals = {
          'relpath': this.relpath,
          'filename': this.fileName,
          'filename-short': this.fileName.split('.')[0],
          'midpath': this.midpath,
          'url-relative': this.relpath + this.midpath + this.fileName,
          'url': normal.url() + this.midpath + this.fileName,
          'url-encode' : encodeURIComponent(normal.url() + this.midpath + this.fileName),
          'this-year': date.year(),
          'this-month': date.month(),
          'this-day': date.day(),
          'site-url': normal.url(),
          'site-url-encode' : encodeURIComponent(normal.url()),
          'site-title': SETST.value,
          'site-subtitle': SETT.elements['index-subtitle'].value,
          'author': SETT.elements['author'].value,
          'site-description': SETT.elements['index-desc'].value,
          'site-thumbpath': SETT.elements['index-thumbpath'].value,
          'site-thumburl': normal.url() + SETT.elements['index-thumbpath'].value,
          'author': SETT.elements['author'].value,
        }
        return vals;
      }
      fafantoValsVariable() {
        const vals = {
          'title': this.title.value,
          'title-encode' : encodeURIComponent(this.title.value),
          'description': this.desc.value,
          'thumbpath': this.thumb.value
        }
        return vals;
      }
      templateToDoc() {
        const doc = template.document();
        //remove not class
        const hnc = doc.head.querySelectorAll(`[class]:not(.${this.class})`);
        for (const c of hnc) c.remove();
        const htc = doc.head.querySelectorAll(`.${this.class}`);
        for (const c of htc) c.removeAttribute('class');
        const inc = doc.body.querySelectorAll(`if:not(.${this.class})`);
        for (const c of inc) c.remove();
        const itc = doc.body.querySelectorAll(`if.${this.class}`);
        for (const c of itc) {
          c.insertAdjacentHTML('afterend',c.innerHTML);
          c.remove();
        }
        return doc;
      }
      existsRequiredElems(doc) {
        const reqElems = ['html','head','body','title','[rel=stylesheet]','script','.header','.main','.footer'];
        if (this.req) for (const word of this.req) reqElems.push(word);
        console.log(reqElems,this.req)
        for (const elem of reqElems) {
          if (!doc.querySelector(elem)) dialog.notTag(elem);
        }
      }
      insertFafantoHeadVal(doc, vals) {
        const elems = doc.head.querySelectorAll('[f-val]');
        if (elems.length) for (const elem of elems) {
          const strs = elem.getAttribute('f-val');
          const dirtArr = strs.split(/\[|\]/);
          const valArr = dirtArr.filter((a) => a);
          for (let i = 0; i < valArr.length; i++) {
            let val = '';
            if (vals[valArr[i]]) val = vals[valArr[i]];
            if (val) valArr[i] = val;
          }
          elem.insertAdjacentHTML('afterbegin', valArr.join(''));
          elem.removeAttribute('f-val');
        }
      }
      insertFafantoBodyVal(doc, vals) {
        const elems = doc.body.querySelectorAll('f-val');
        if (elems.length) for (const elem of elems) {
          const attrs = elem.attributes;
          if (!attrs.length) return;
          for (let i = 0; i < attrs.length; i++) {
            console.log(attrs,attrs[i].name)
            let val = '';
            if (vals[attrs[i].name]) val = vals[attrs[i].name];
            if (val) elem.insertAdjacentHTML('beforebegin',val);
          }
        }
      }
      insertFafantoAttr(doc, vals) {
        const elems = doc.querySelectorAll('[f-attr]');
        if (elems.length) for (const elem of elems) {
          const strs = elem.getAttribute('f-attr');
          const attrsStr = strs.split(',');
          label:for ( const str of attrsStr) {
            const attr = str.split('^');
            let attrVal = attr[1];
            const attrSpl = attr[1];
            const arr = attrSpl.split('[');
            for (var i = 1; i < arr.length; i++) {
              const tagTxt = arr[i].split(']')[0];
              console.log(tagTxt,vals[tagTxt])
              if (vals[tagTxt]) attrVal = attrVal.replace(`[${tagTxt}]`,vals[tagTxt]);
              else continue label;
            }
            elem.setAttribute(attr[0],attrVal);
          }
          elem.removeAttribute('f-attr');
        }
      }
      insertSiteTitle(doc) {
        const elems = doc.body.querySelectorAll('f-elm[site-title]');
        if (elems.length) for (const elem of elems) {
          const tagAttr = elem.getAttribute('tag');
          let tag = 'h1';
          if (tagAttr) tag = tagAttr;
          elem.insertAdjacentHTML('beforebegin',`<${tag} class="site-title"><a href="${this.relpath}">${SETST.value}</a></${tag}>`);
        }
      }
      insertSiteSubtitle(doc) {
        const elems = doc.body.querySelectorAll('f-elm[site-subtitle]');
        if (elems.length) for (const elem of elems){
          const tagAttr = elem.getAttribute('tag');
          let tag = 'span';
          if (tagAttr) tag = tagAttr;
          elem.insertAdjacentHTML('beforebegin',`<${tag} class="site-subtitle">${SETT.elements['index-subtitle'].value}</${tag}>`);
        }
      }
      insertAuthor(doc) {
        const elems = doc.body.querySelectorAll('f-elm[author]');
        if (elems.length)  for (const elem of elems) {
          elem.insertAdjacentHTML('beforebegin',`<span class="author">${SETT.elements['author'].value}</span>`);
        }
      }
      insertBodyTitle(doc, value) {
        const elems = doc.body.querySelectorAll('f-elm[title]');
        if (elems.length) for (const elem of elems) {
          const tagAttr = elem.getAttribute('tag');
          let tag = 'h1';
          if (tagAttr) tag = tagAttr;
          elem.insertAdjacentHTML('beforebegin',`<${tag} class="title">${value}</${tag}>`);
        }
      }
      insertBodyDescription(doc, value) {
        const elem = doc.body.querySelector('f-elm[description]');
        if (elem) elem.insertAdjacentHTML('beforebegin',`<div class="description">${value}</div>`);
      }
      // insertPostCardDesc(elem,postData) {
      //   const d = postData;
      //   let img = '';
      //   let description = '';
      //   if (d[5]) img = `<img src="${this.relpath}${d[5]}" alt="${d[1]}" loading="lazy">`;
      //   else if (d[7]) description = `<small>${d[7]}</small>`;
      //   let tags = '';
      //   if (d[6]) tags = `<span>${convert.textArrToHTMLStr(d[6],'i')}</span>`;
      //   let time = '';
      //   if (d[3]) time = `<time>${date.changeFormat(d[3])}</time>`;
      //   elem.insertAdjacentHTML('beforebegin',
      //   `<li><a href="${this.relpath}post/${d[2]}/${d[0]}">${img}<p>${d[1]}</p>${description}<div>${tags}${time}</div></a></li>\n`);
      // }
      insertPostCard(elem, postData) {
        const d = postData;
        let imgPath = SETT.elements['blank-thumbpath'].value;
        if (d[5]) imgPath = d[5];
        let tags = '';
        if (d[6]) tags = `<span>${convert.textArrToHTMLStr(d[6],'i')}</span>`;
        let time = '';
        if (d[3]) time = `<time>${date.changeFormat(d[3])}</time>`;
        elem.insertAdjacentHTML('beforeend',
        `<li><a href="${this.relpath}post/${d[2]}/${d[0]}"><img src="${this.relpath}${imgPath}" alt="${d[1]}" loading="lazy"><div>${d[1]}</div><div>${tags}${time}</div></a></li>\n`
        );
      }
      insertLatestPostLinks(doc) {
        const elems = doc.body.querySelectorAll('f-elm[post-links=all]');
        if (elems.length) {
          let num = allPostData.length;
          for (const elem of elems) {
            elem.insertAdjacentHTML('beforebegin','<ul class="post-links"></ul>');
            const dNum = elem.getAttribute('num');
            if (dNum) if (dNum < num) num = dNum;
            const addClass = elem.getAttribute('addclass');
            if (addClass) elem.previousElementSibling.classList.add(addClass);
            for (let i = 0; i < num; i++) this.insertPostCard(elem.previousElementSibling, allPostData[i]);
          }
        }
      }
      insertTagPostLinks(doc) {
        const elems = doc.body.querySelectorAll('f-elm[post-links=tags]');
        if (elems.length) for (const elem of elems) {
          elem.insertAdjacentHTML('beforebegin','<ul class="post-links"></ul>');
          const name = elem.getAttribute('name');
          if (!name) continue;
          let num = allPostData.length;
          const dNum = elem.getAttribute('num');
          if (dNum) num = dNum;
          let i = 0;
          label: for (const pd of allPostData) {
            const tagArr = pd[6];
            if (tagArr.length) for (const tagName of tagArr) if (tagName === name) {
              this.insertPostCard(elem.previousElementSibling, pd);
              i++;
              if (i > num - 1) break label;
            }
          }
        }
      }
      insertDirPostLinks(doc) {
        const elems = doc.body.querySelectorAll('f-elm[post-links=dir]');
        if (elems.length) for (const elem of elems) {
          elem.insertAdjacentHTML('beforebegin','<ul class="post-links"></ul>');
          let dirName = date.year();
          if (this.year) dirName = this.year;
          const nameAttr = elem.getAttribute('name');
          if (nameAttr) dirName = nameAttr;
          let num = dirsData[dirName].length;
          const dNum = elem.getAttribute('num');
          if (dNum) if (dNum < num) num = dNum;
          const startNum = dirsData[dirName].start;
          for (let i = startNum; i < startNum + num; i++) this.insertPostCard(elem.previousElementSibling, allPostData[i]);
        }
      }
      insertPostDirsLinks(doc) {
        const elems = doc.body.querySelectorAll('f-elm[post-dirs]');
        if (elems.length) for (const elem of elems) {
          elem.insertAdjacentHTML('beforebegin','<ul class="post-dirs"></ul>');
          for (const dir in dirsData)
          elem.previousElementSibling.insertAdjacentHTML('beforeend',
          `<li><a href="${this.relpath}archive/${dir}.html">${dir} <span>(${dirsData[dir].length})</span></a></li>`);
        }
      }
      insertPageLinksBoth(doc) {
        if (allPageData.length) for (const link of new EditPage().links) {
          const elem = doc.body.querySelector(`.${link} f-elm[page-links]`);
          if (elem) {
            elem.insertAdjacentHTML('beforebegin','<ul class="page-links"></ul>');
            for (const pd of allPageData) for (const className of pd[6]) {
              if (className === link)
              elem.previousElementSibling.insertAdjacentHTML('beforeend',`<li><a href="${this.relpath}page/${pd[0]}">${pd[1]}</a></li>\n`);
            }
          }
        }
      }
      insertPageLinksAll(doc) {
        const elems = doc.body.querySelectorAll('.main f-elm[page-links]');
        if (elems.length) for (const elem of elems) {
          elem.insertAdjacentHTML('beforebegin','<ul class="page-links"></ul>');
          for (const d of allPageData)
          elem.previousElementSibling.insertAdjacentHTML('beforeend', `<li><a href="${this.relpath}page/${d[0]}">${d[1]}</a></li>`);
        }
      }
      insertTagsWord(doc) {
        const elems = doc.body.querySelectorAll('f-elm[tags-word]');
        if (elems.length) for (const elem of elems) {
          elem.insertAdjacentHTML('beforebegin','<div class="tags-word"></div>');
          const str = SETT.elements['post-taglist'].value;
          const tagTextArr = convert.strNewLineToArr(str);
          for (const tagText of tagTextArr)
          elem.previousElementSibling.insertAdjacentHTML('beforeend',`<span>${tagText}</span>`);
        }
      }
      insertFafantoElm(doc) {
        this.insertSiteTitle(doc);
        this.insertSiteSubtitle(doc);
        this.insertAuthor(doc)
        this.insertLatestPostLinks(doc);
        this.insertTagPostLinks(doc);
        this.insertDirPostLinks(doc);
        this.insertPostDirsLinks(doc);
        this.insertPageLinksBoth(doc);
        this.insertPageLinksAll(doc);
        this.insertTagsWord(doc);
      }
      insertFafantoElmVariable(doc) {
        this.insertBodyTitle(doc, this.title.value);
        this.insertBodyDescription(doc, this.desc.value);
      }
      makeHTMLCommon(doc, vals) {
        this.insertFafantoHeadVal(doc, vals);
        this.insertFafantoBodyVal(doc, vals);
        this.insertFafantoAttr(doc, vals);
      }
      removeFafantoTag(doc) {
        const elems = doc.body.querySelectorAll('f-elm,f-val');
        for (const elem of elems) elem.remove();
      }
      async save() {
        const doc = this.templateToDoc();
        this.existsRequiredElems(doc);
        const vals = Object.assign(this.fafantoVals(), this.fafantoValsVariable());
        this.makeHTMLCommon(doc, vals);
        this.insertFafantoElm(doc);
        this.insertFafantoElmVariable(doc);
        this.removeFafantoTag(doc);
        await this.write(convert.docToHTMLStr(doc));
      }
      async preview() {
        const view = document.getElementById('view');
        const iframe = view.querySelector('iframe');
        const doc = await this.document();
        doc.head.insertAdjacentHTML('beforeend',`<style>${await style.txt()}</style><script>${await main.txt()}</script>`);
        const str = convert.docToHTMLStr(doc);
        iframe.setAttribute('srcdoc', str);
        view.classList.remove('hide');
        view.querySelector('button').onclick = () => {
          view.classList.add('hide');
        }
        view.onclick = () => {
          view.classList.add('hide');
        }
      }
    }
    const index = new EditHTML(
      'index.html',
      singleBox,
      'index',
      SETT.elements['index-title'],
      SETT.elements['index-desc'],
      SETT.elements['index-thumbpath'],
      [],
      './',
      ''
    );
    const tags = new EditHTML(
      'tags.html',
      singleBox,
      'tags',
      SETT.elements['tags-title'],
      SETT.elements['tags-desc'],
      SETT.elements['index-thumbpath'],
      ['.filter-btns'],
      './',
      ''
    );
    const archives = new EditHTML(
      'archives.html',
      singleBox,
      'archives',
      SETT.elements['archives-title'],
      SETT.elements['archives-desc'],
      SETT.elements['index-thumbpath'],
      [],
      './',
      ''
    );
    const search = new EditHTML(
      'search.html',
      singleBox,
      'search',
      SETT.elements['search-title'],
      SETT.elements['search-desc'],
      SETT.elements['index-thumbpath'],
      [],
      './',
      ''
    );
    class EditArchive extends EditHTML {
      constructor(fileName) {
        super(fileName);
        this.box = archiveBox;
        this.class = 'archive';
        this.title = SETT.elements['archive-title'];
        this.desc = SETT.elements['archive-desc'];
        this.thumb = SETT.elements['index-thumbpath'];
        this.req = [];
        this.relpath = '../';
        this.midpath = 'archive/';
        this.year = this.fileName.slice(0,4);
      }
    }
    // post and page common class
    class EditArticle extends EditHTML {
      loadDescription(doc) {
        return doc.head.querySelector('[name="description"]')?.getAttribute('content')?? '';
      }
      loadTitle(doc) {
        return doc.body.querySelector('.title')?.textContent?? '';
      }
      loadTime(doc) {
        return doc.head.querySelector('meta[name="date"]')?.getAttribute('content')?? '';
      }
      loadContents(doc) {
        return doc.body.querySelector('.contents')?.innerHTML?? '';
      }
      loadImage(doc) {
        const url = doc.body.querySelector('.thumbnail img')?.getAttribute('src')?? '';
        return url.replace(this.relpath, '');
      }
      loadPartsCheck(doc) {
        for (const part of this.parts) {
          this.form.elements[part].checked = false;
          if (doc.querySelector(`.${part}`)) this.form.elements[part].checked = true;
        }
      }
      insertContents(doc,value) {
        const elem = doc.body.querySelector('f-elm[contents]');
        if (elem) elem.insertAdjacentHTML('beforebegin',`<div class="contents">\n${value}</div>`);
      }
      insertTime(doc,publishedYmdTime) {
        const elems = doc.body.querySelectorAll('f-elm[dates]');
        const today = date.ymd();
        if (elems.length) for (const elem of elems) {
          let dateStr = `<time datetime="${date.ymdTime()}">${today}</time>`;
          if (publishedYmdTime) {
            const pubYmd = publishedYmdTime.slice(0,10);
            if (today.replaceAll('-', '') > pubYmd.replaceAll('-', ''))
            dateStr = `<span>${pubYmd}</span><time datetime="${date.ymdTime()}">${today}</time>`;
          }
          elem.insertAdjacentHTML('beforebegin',`<span class="dates">${dateStr}</span>`);
        }
      }
      insertImage(doc,thumbpath,title) {
        const elems = doc.body.querySelectorAll('f-elm[thumbnail]');
        if (elems.length && thumbpath) for (const elem of elems)
        elem.insertAdjacentHTML('beforebegin',`<div class="thumbnail"><img src="${this.relpath + thumbpath}" alt="${title}"></div>`);
      }
      insertTableOfContents(doc) {
        const elem = doc.body.querySelector('f-elm[table-of-contents]');
        const cont = doc.body.querySelector('.contents');
        if (elem && cont) {
          const h23 = cont.querySelectorAll('h2,h3');
          if (h23.length) {
            let tocName = 'Contents';
            const attrName = elem.getAttribute('name');
            if (attrName) tocName = attrName;
            elem.insertAdjacentHTML('beforebegin',`<div class="table-of-contents"><b>${tocName}</b>\n<ul></ul></div>`);
            const h2Ul = doc.body.querySelector('.table-of-contents ul');
            for (let i = 0; i < h23.length; i++) {
              const htx = h23[i].textContent;
              const tgn = h23[i].tagName;
              if (tgn === 'H2') h2Ul.innerHTML += `<li><a href="#index${i}">${htx}</a><ul></ul></li>\n`;
              if (tgn === 'H3') {
                const lastUl = h2Ul.querySelector('li:last-child > ul');
                const h3Li = `<li><a href="#index${i}">${htx}</a></li>\n`;
                if (lastUl) lastUl.innerHTML += h3Li;
                else h2Ul.innerHTML += h3Li;
              }
              h23[i].setAttribute('id',`index${i}`);
            }
            const h3Uls = h2Ul.querySelectorAll('ul');
            for (const h3Ul of h3Uls) if (!h3Ul.textContent) h3Ul.remove();
          }
        }
      }
      loadPublicData(doc) {
        if (doc.head.dataset.public) return false;
        else return true;
      }
      insertPublicData(doc, publicBool) {
        if (!publicBool) doc.head.dataset.public = 'false';
        else if (doc.head.dataset.public) doc.head.removeAttribute('data-public');
      }
      setPublicCheck(publicBool) {
        this.public.checked = publicBool;
      }
      checkParts(doc) {
        for(const part of this.parts) {
          const elem = doc.querySelector(`.${part}`);
          if (elem) if (!this.form.elements[part].checked) elem.remove();
        }
      }
      existParts(doc,beforeDoc) {
        for(const part of this.parts) {
          const elem = doc.body.querySelector(`.${part}`);
          const beforeElem = beforeDoc.querySelector(`.${part}`);
          if (elem) if (!beforeElem) elem.remove();
        }
      }
      fafantoValsVariable() {
        const vals = {
          'title': this.title.value,
          'title-encode' : encodeURIComponent(this.title.value),
          'description': this.desc.value,
          'thumbpath': this.thumb.value,
          'published-date': this.time.value
        }
        return vals;
      }
      fafantoValsVariableTrans(beforeDoc) {
        const vals = {
          'title': this.loadTitle(beforeDoc),
          'title-encode' : encodeURIComponent(this.loadTitle(beforeDoc)),
          'description': this.loadDescription(beforeDoc),
          'thumbpath': this.loadImage(beforeDoc),
          // 'thumburl': normal.url() + this.loadImage(beforeDoc),
          'published-date': this.loadTime(beforeDoc)
        }
        return vals;
      }
      transHTMLCommon(doc,beforeDoc) {
        const title = this.loadTitle(beforeDoc);
        this.insertPublicData(doc, this.loadPublicData(beforeDoc))
        this.insertBodyTitle(doc,title);
        this.insertBodyDescription(doc,this.loadDescription(beforeDoc));
        this.insertImage(doc,this.loadImage(beforeDoc),title);
        this.insertTime(doc,this.loadTime(beforeDoc));
        this.insertContents(doc,this.loadContents(beforeDoc));
        this.insertTableOfContents(doc);
        this.existParts(doc,beforeDoc);
      }
      async saveTransfer() {
        const doc = this.templateToDoc();
        const beforeDoc = await this.document();
        const vals = Object.assign(this.fafantoVals(), this.fafantoValsVariableTrans(beforeDoc));
        this.makeHTMLCommon(doc, vals);
        this.transHTMLCommon(doc, beforeDoc);
        this.transHTMLSpecial(doc, beforeDoc);
        this.insertFafantoElm(doc);
        this.removeFafantoTag(doc);
        await this.write(convert.docToHTMLStr(doc));
      }
      static inputFNewFileName(form) {
        const input = form.elements['top'].querySelector('input');
        input.addEventListener('change', (e) => {
          const name = e.target.value.split('.')[0];
          input.value = `${name}.html`;
        });
      }
      // async existElements() {
      //   const article = new this.name();
      //   const tmpDoc = await article.templateToDoc();
      //   for (const part of article.parts) {
      //     if (!tmpDoc.querySelector(`.${part}`)) {
      //       this.form.elements[part].parentNode.classList.add('noexist');
      //       this.form.elements[part].parentNode.setAttribute('title','This class does not exist in the template');
      //     }
      //   }
      // }
    }
    // post class
    class EditPost extends EditArticle {
      constructor(fileName, dirName) {
        super(fileName);
        this.box = find.dirBox(postBox, dirName);
        this.class = 'post';
        this.title = POST.querySelector(`.artlist > [data-name="${this.fileName}"] > input`);
        this.desc = POST.elements['description'];
        this.thumb = POST.elements['thumbpath'];
        this.req = ['f-elm[title]','f-elm[contents]','meta[name="date"]'];
        this.relpath = '../../';
        this.midpath = `post/${dirName}/`;
        this.ct = mePostContents;
        this.public = POST.querySelector(`.artlist > [data-name="${this.fileName}"] label > input`);
        this.time = POST.querySelectorAll(`.artlist > [data-name="${this.fileName}"] > input`)[1];
        this.parts = ['table-of-contents','comment','freespace1','freespace2'];
        this.form = POST;
        this.tagbtns = POST.elements['tagbtns'];
        this.prevNextNum = [+2,+1,-1,-2];
      }
      loadContents(doc) {
        const cnt = doc.querySelector('.contents');
        if (cnt) {
          const h23 = cnt.querySelectorAll('h2,h3');
          if (h23.length) for (const h of h23) h.removeAttribute('id');
          return cnt.innerHTML;
        } else return '';
      }
      loadTagAElems(doc) {
        const tagas = doc.querySelectorAll('.tags-link a');
        if (tagas.length) return tagas;
        else return '';
      }
      loadTagsToGui(doc) {
        const tagAs = this.loadTagAElems(doc);
        if (tagAs.length) {
          for (const tagA of tagAs) this.tagbtns.querySelector(`[data-tag="${tagA.textContent}"]`)?.setAttribute('class','on');
        }
      }
      async loadElements() {
        const doc = await this.document();
        this.setPublicCheck(this.loadPublicData(doc));
        this.desc.value = this.loadDescription(doc);
        this.ct.setValue(this.loadContents(doc));
        this.thumb.value = this.loadImage(doc);
        this.loadTagsToGui(doc);
        this.loadPartsCheck(doc);
      }
      insertTagsLink(doc,tagArr) {
        const elems = doc.body.querySelectorAll('f-elm[tags-link]');
        if (elems.length && tagArr.length)
        for (const elem of elems) {
          elem.insertAdjacentHTML('beforebegin','<div class="tags-link"></div>');
          for (const tagText of tagArr)
          elem.previousElementSibling.insertAdjacentHTML('afterbegin',`<a href="${this.relpath}tags.html?q=${tagText}">${tagText}</a>`);
        }
      }
      insertPostLinksPrevNext(doc) {
        const elems = doc.querySelectorAll('f-elm[post-links=prev-next]');
        if (elems.length) for (const elem of elems) {
          elem.insertAdjacentHTML('beforebegin','<ul class="post-links"></ul>');
          const index = find.postIndex(allPostData, this.fileName);
          for (const pnNum of this.prevNextNum) {
            if (allPostData[index + pnNum]) this.insertPostCard(elem.previousElementSibling, allPostData[index + pnNum]);
          }
        }
      }
      makeHTMLSpecial(doc) {
        this.insertPublicData(doc, this.public.checked);
        this.insertFafantoElmVariable(doc);
        this.insertTime(doc, this.time.value);
        this.insertImage(doc, this.thumb.value, this.title.value);
        this.insertContents(doc, this.ct.getValue());
        this.insertTableOfContents(doc);
        this.insertTagsLink(doc,convert.elemsToTextArr(this.tagbtns.querySelectorAll('.on')), this.relpath);
        this.checkParts(doc);
      }
      async save() {
        const doc = this.templateToDoc();
        const vals = Object.assign(this.fafantoVals(), this.fafantoValsVariable());
        this.makeHTMLCommon(doc, vals);
        this.makeHTMLSpecial(doc);
        await this.write(convert.docToHTMLStr(doc));
        const data = await EditPost.allLatestData(true);
        allPostData = data[0];
        dirsData = data[1];
        await this.saveElems();
      }
      async saveElems() {
        const doc = await this.document();
        this.insertFafantoElm(doc);
        this.insertPostLinksPrevNext(doc);
        this.removeFafantoTag(doc);
        await this.write(convert.docToHTMLStr(doc));
      }
      transHTMLSpecial(doc,beforeDoc) {
        this.insertTagsLink(doc,convert.elemsToTextArr(this.loadTagAElems(beforeDoc)));
        this.insertPostLinksPrevNext(doc);
      }
      static clickEditBackBtn() {
        POST.querySelector('.artlist').onclick = async (e) => {
          if (e.target.tagName === 'BUTTON') {
            POST.querySelector('.bench').classList.toggle('hide');
            e.target.classList.toggle('btn-close');
            const fileName = e.target.parentNode.dataset.name;
            const fs = POST.querySelectorAll(`.artlist fieldset:not([data-name="${fileName}"])`);
            for (const f of fs) f.classList.toggle('hide');
            if (!POST.querySelector('.bench').classList.contains('hide')) await new EditPost(fileName, POST.elements['dirs'].value).loadElements();
          }
        }
      }
      static addDirsList(form)  {
        for (const dir of postBox) {
          form.elements['dirs'].insertAdjacentHTML('beforeend',`<option value="${dir[0]}">${dir[0]}</option>`);
        }
        form.elements['dirs'].value = date.year();
      }
      static async getPostData(fileName, dirName) {
        const post = new EditPost(fileName, dirName);
        const doc = await post.document();
        const tit = post.loadTitle(doc);
        const dti = post.loadTime(doc);
        const rti = dti.replace('T','.').replace(/[^0-9\.]/g,'');
        const img = post.loadImage(doc);
        const tgs = convert.elemsToTextArr(post.loadTagAElems(doc));
        const dsc = post.loadDescription(doc);
        const dft = post.loadPublicData(doc);
        return [fileName,tit,dirName,dti,rti,img,tgs,dsc,dft]; //0:filename, 1:title, 2:dirctory name, 3:datetime, 4:datetime(num), 5:image path 6:tags text array 7:description 8.public boolean
      }
      static async latestDataInDir(dirName, publicBool) {
        // const dHandle = this.box.find(({name}) => name === dirName);
        const fileHdls = find.dirBox(postBox, dirName);
        const data = [];
        for await (const file of fileHdls.values()) {
          if (file.kind === 'file') {
            const array = await this.getPostData(file.name, dirName);
            if (publicBool) {
              if (array[8]) data.push(array);
            } else data.push(array);
          }
        }
        return data.sort((a, b) => b[4] - a[4]);
      }
      static async allLatestData(publicBool) {
        // const dirs = this.latestDirs();
        const allData = [];
        const dirsData = {};
        let i = 0;
        for (const dir of postBox) {
          const data = await this.latestDataInDir(dir[0], publicBool);
          allData.push(...data);
          i = i + data.length;
          dirsData[dir[0]] = {start: i - data.length, length: data.length};
        }
        console.log('make all post data', dirsData);
        return [allData, dirsData];
      }
      
      static async addListInDir(dirName) {
        POSLI.textContent = '';
        POSBE.classList.add('hide');
        POST.elements['top'].classList.remove('hide');
        const data = await this.latestDataInDir(dirName);
        for (const d of data) {
          let checked = '';
          if (d[8]) checked = ' checked';
          POSLI.insertAdjacentHTML('beforeend',
          `<fieldset data-name="${d[0]}">
          <label title="公開"><input type="checkbox"${checked}></label>
          <input value="${d[1]}" placeholder="タイトル" readonly="readonly">
          <input title="公開日" type="datetime-local" value="${d[3]}" readonly="readonly">
          <u>${d[0]}</u>
          <button type="button"></button>
          </fieldset>`
          );
        }
      }
      static async addListInDirForLinks(dirName) {
        const fld = LINKS.querySelector('fieldset');
        fld.textContent ='';
        const data = await this.latestDataInDir(dirName);
        for (const d of data) fld.insertAdjacentHTML('beforeend',`<p data-name="${d[0]}" data-title="${d[1]}">${d[3]}<br>${d[1]}<br>${d[0]}</p>`);
        LINKS.elements['dirs'].value = dirName; 
      }
      static dirSelect() {
        POST.elements['dirs'].addEventListener('input', async (e) => {
          const dirName = e.target.value;
          await this.addListInDir(dirName);
        });
      }
      static selectDirForLinks() {
        LINKS.elements['dirs'].addEventListener('input', async (e) => {
          const dirName = e.target.value;
          await this.addListInDirForLinks(dirName);
        });
      }
      static addNewFile() {
        POST.elements['top'].querySelector('button').onclick = async (e) => {
          const fileName = e.target.previousElementSibling.value;
          const dirName = POST.elements['dirs'].value;
          const box = find.dirBox(postBox, dirName);
          if (!fileName) return dialog.nameEmpty();
          if (find.exsist(box, fileName)) return dialog.nameExists();
          for await (const hdl of posHandle.values()) {
            if (hdl.name === dirName) {
              const fileHdl = await hdl.getFileHandle(fileName, {create:true});
              box.push(fileHdl);
            }
          }
          await EditPost.addListInDir(dirName);
        }
      }
    }
    EditPost.clickEditBackBtn();
    EditPost.addDirsList(POST);
    EditPost.addDirsList(LINKS);
    EditPost.dirSelect();
    EditPost.selectDirForLinks();
    await EditPost.addListInDir(date.year());
    await EditPost.addListInDirForLinks(date.year());
    EditPost.inputFNewFileName(POST);
    EditPost.addNewFile();

    // page class
    class EditPage extends EditArticle {
      constructor(fileName) {
        super(fileName);
        this.box = pageBox;
        this.class = 'page';
        this.title = PAGE.querySelector(`.artlist > [data-name="${this.fileName}"] > input`);
        this.desc = PAGE.elements['description'];
        this.thumb = PAGE.elements['thumbpath'];
        this.req = ['f-elm[title]','f-elm[contents]'];
        this.relpath = '../';
        this.midpath = 'page/';
        this.public = PAGE.querySelector(`.artlist > [data-name="${this.fileName}"] label > input`);
        this.time = PAGE.querySelectorAll(`.artlist > [data-name="${this.fileName}"] > input`)[1];
        this.parts = ['table-of-contents'];
        this.links = ['header','footer'];
        this.form = PAGE;
        this.ct = mePageContents;
      }
      async loadElements() {
        const doc = await this.document();
        this.setPublicCheck(this.loadPublicData(doc));
        this.desc.value = this.loadDescription(doc);
        this.ct.setValue(this.loadContents(doc));
        this.thumb.value = this.loadImage(doc);
        this.loadPartsCheck(doc);
        this.checkDisplayLinks(this.loadDataAttrLinks(doc));
      }
      loadDataAttrLinks(doc) {
        const value = doc.head.getAttribute('data-links');
        const linkArr = convert.strToArr(value,',');
        return linkArr;
      }
      checkDisplayLinks(linkArr) {
        for (const link of this.links) this.form.elements[link].checked = false;
        if (linkArr.length)
        for (const link of linkArr) this.form.elements[link].checked = true;
      }
      insertDispalyDataToHead(doc, linkArr) {
        if (linkArr.length) doc.head.dataset.links = linkArr;
      }
      makeHTMLSpecial(doc) {
        this.insertPublicData(doc, this.public.checked);
        this.insertFafantoElmVariable(doc);
        this.insertDispalyDataToHead(doc, convert.checkboxToArr(PAGE.elements['display-link']));
        this.insertTime(doc, this.time.value);
        this.insertImage(doc, this.thumb.value, this.title.value);
        this.insertContents(doc, this.ct.getValue());
        this.insertTableOfContents(doc);
        this.checkParts(doc);
      }
      async saveElems() {
        const doc = await this.document();
        this.insertFafantoElm(doc);
        this.removeFafantoTag(doc);
        await this.write(convert.docToHTMLStr(doc));
      }
      async transHTMLSpecial(doc, beforeDoc) {
        this.insertDispalyDataToHead(doc, this.loadDataAttrLinks(beforeDoc));
      }
      async save() {
        const doc = this.templateToDoc();
        const vals = Object.assign(this.fafantoVals(), this.fafantoValsVariable());
        this.makeHTMLCommon(doc, vals);
        this.makeHTMLSpecial(doc);
        await this.write(convert.docToHTMLStr(doc));
        allPageData = await EditPage.allData(true);
        await this.saveElems();
      }
      static clickEditBackBtn() {
        PAGE.querySelector('.artlist').onclick = async (e) => {
          if (e.target.tagName === 'BUTTON') {
            PAGE.querySelector('.bench').classList.toggle('hide');
            e.target.classList.toggle('btn-close');
            const fileName = e.target.parentNode.dataset.name;
            const fs = PAGE.querySelectorAll(`.artlist fieldset:not([data-name="${fileName}"])`);
            for (const f of fs) f.classList.toggle('hide');
            if (!PAGE.querySelector('.bench').classList.contains('hide')) await new EditPage(fileName).loadElements();
          }
        }
      }
      static async allData(publicBool) {
        const data = [];
        for (const file of pageBox.values()) {
          if (file.kind === 'file') {
            const page = new EditPage(file.name);
            const doc = await page.document();
            const lkc = page.loadDataAttrLinks(doc);
            const tit = page.loadTitle(doc);
            const dti = page.loadTime(doc);
            const rti = dti.replace('T','.').replace(/[^0-9\.]/g,'');
            const img = page.loadImage(doc);
            const dsc = page.loadDescription(doc);
            const dft = page.loadPublicData(doc);
            const arr = [file.name,tit,dsc,dti,rti,img,lkc,dft];//0:filename 1:title 2:description 3:datetime 4:datetime(num) 5:image path 6: links text array 7:public boolean
            if (publicBool) {
              if (dft) data.push(arr);
            } else data.push(arr); 
          }
        }
        return data;
      }
      static async addPageList() {
        PAGBE.classList.add('hide');
        PAGLI.textContent = '';
        const data = await this.allData(false);
        for (const d of data) {
          let checked = '';
          if (d[7]) checked = ' checked';
          PAGLI.insertAdjacentHTML('beforeend',
          `<fieldset data-name="${d[0]}">
          <label title="公開"><input type="checkbox"${checked}></label>
          <input value="${d[1]}" readonly="readonly">
          <input type="datetime-local" value="${d[3]}" readonly="readonly">
          <u>${d[0]}</u>
          <button type="button"></button>
          </fieldset>`
          );
        }
      }
      static addNewFile() {
        PAGE.elements['top'].querySelector('button').onclick = async (e) => {
          const fileName = e.target.previousElementSibling.value;
          if (!fileName) return dialog.nameEmpty();
          if (find.exsist(pageBox, fileName)) return dialog.nameExists();
          const fileHdl = await pagHandle.getFileHandle(fileName, {create:true});
          pageBox.push(fileHdl);
          await EditPage.addPageList();
        }
      }
    }
    EditPage.clickEditBackBtn();
    await EditPage.addPageList();

    const media = {
      localUrl: async (fileHandle) => {
        const getFile = await fileHandle.getFile();
        return URL.createObjectURL(getFile);
      },
      addDirsList: () => {
        for (const dir of mediaBox) IMAGS.elements['dirs'].insertAdjacentHTML('beforeend',`<option value="${dir[0]}">${dir[0]}</option>`);
        IMAGS.elements['dirs'].value = date.year();
      },
      addListInDir: async (elem, dirName) => {
        const hdles = find.dirBox(mediaBox, dirName);
          for await (const med of hdles) {
            if (med.name.match(/(.jpg|.jpeg|.png|.gif|.apng|.svg|.jfif|.pjpeg|.pjp|.ico|.cur)/i)) {
              const url = await media.localUrl(med);
              elem.innerHTML += `<img src="${url}" title="${med.name}" loading="lazy">`;
            }
            else if (med.name.match(/(.mp3|.ogg|.wav)/i)) {
              const url = await media.localUrl(med);
              elem.innerHTML += `<figure title="${med.name}">${med.name}<audio src="${url}" controls></audio></figure>`;
            }
            else if (med.name.match(/(.mp4|.ogv|.webm)/i)) {
              const url = await media.localUrl(med);
              elem.innerHTML += `<video src="${url}" title="${med.name}" controls></video>`;
            }
            else elem.innerHTML += `<span title="${med.name}">${med.name}</span>`;
          }
        IMAGS.elements['dirs'].value = dirName;
      },
      dirSelect: () => {
        IMAGS.elements['dirs'].addEventListener('input', async (e) => {
          const dirName = e.target.value;
          const dirbox = IMAGS.elements['dirbox'];
          dirbox.textContent ='';
          await media.addListInDir(dirbox, dirName);
        });
      },
      thumbSelect: (form) => {
        form.elements['thumbbtn'].onclick = () => {
          IMAGS.classList.toggle('hide');
          IMAGS.elements['dirbox'].onclick = (e) => {
            if (e.target.tagName === 'IMG') {
              let dir = '';
              const dirName = IMAGS.elements['dirs'].value;
              if (dirName !== 'root') dir = `${dirName}/`
              form.elements['thumbpath'].value = `media/${dir}${e.target.title}`;
            }
          }
        }
      }
    }
    media.addDirsList();
    media.dirSelect();
    media.thumbSelect(POST);
    media.thumbSelect(PAGE);

    //セーブ
    const save = {
      form: () => {
        return H2SE.dataset.form;
      },
      fileName: () => {
        return SAVE.dataset.file;
      },
      prevNextPosts: async () => {
        const index = find.postIndex(allPostData, save.fileName());
        const prevNextNum = new EditPost().prevNextNum;
        for (const num of prevNextNum) {
          if (allPostData[index + num]) await new EditPost(allPostData[index + num][0]).saveTransfer();
        }
      },
      singles: async () => {
        await index.save();
        await tags.save();
        await archives.save();
        await new EditArchive(`${postDirNames[save.fileName()]}.html`).save();
      },
      postSaveFileNames: ['index.html','archives.html','tags.html','前後のポスト'],
      clickBtn: () => {
        SAVE.onclick = async () => {
          const saveName = [];
          saveName.push(save.fileName());
          if (save.form() === 'bases') {
            dialog.confirmSave(saveName);
            for (const base of [['template.html',template],['style.css',style],['main.js',main]])
            if (save.fileName() === base[0]) await base[1].save();
          }
          else if (save.form() === 'setting') {
            dialog.confirmSave(saveName);
            await setting.save();
          }
          else if (save.form() === 'post') {
            for (const name of save.postSaveFileNames) saveName.push(name);
            dialog.confirmSave(saveName);
            allPostData = '';
            dirsData = '';
            allPageData = await EditPage.allData(true);
            console.log(save.fileName())
            await new EditPost(save.fileName(), POST.elements['dirs'].value).save();
            // await save.prevNextPosts();
            // await save.singles();
            // saveName.push(`${await save.postYear()}.html`);
          }
          else if (save.form() === 'page') {
            dialog.confirmSave(saveName);
            allPageData = '';
            const data = await EditPost.allLatestData(true);
            allPostData = data[0];
            dirsData = data[1];
            await new EditPage(save.fileName()).save();
          }
          dialog.successSave(saveName);
        }
      }
    }
    save.clickBtn();

  /// event ///
    //click Preview button
    PREV.onclick = () => {
      const fileName = SAVE.dataset.file;
      const form = H2SE.dataset.form;
      if (form === 'post') new EditPost(fileName, POST.elements['dirs'].value).preview();
      else if (form === 'page') new EditPage(fileName).preview();
    }
    document.getElementById('index').onclick = () => index.preview();
    document.getElementById('tags').onclick = () => tags.preview();

  // まとめてセーブ
    // ファイル数を挿入
    ALLS.elements['archive'].parentNode.insertAdjacentHTML('beforeend', `(${archiveBox.length})`);
    ALLS.elements['post'].parentNode.insertAdjacentHTML('beforeend', `(${find.numAll(postBox)})`);
    ALLS.elements['page'].parentNode.insertAdjacentHTML('beforeend', `(${pageBox.length})`);
    //click start saving
    ALLS.elements['save'].onclick = async () => {
      const log = ALLS.querySelector('.log');
      log.textContent = '';
      dialog.confirmSave('チェックしたファイル');
      const data = await EditPost.allLatestData(true);
      allPostData = data[0];
      dirsData = data[1];
      allPageData = await EditPage.allData(true);
      for (const file of [['index',index],['archives',archives],['tags',tags],['search',search]]) {
        if (ALLS.elements[file[0]].checked) {
          await file[1].save();
          log.insertAdjacentHTML('beforeend', `<p>Succeeded in saving ${file[1].fileName}</p>`);
        }
      }
      if (ALLS.elements['archive'].checked) {
        for (const file of archiveBox.values()) {
          if (file.kind === 'file') {
            await new EditArchive(file.name).save();
            log.insertAdjacentHTML('beforeend', `<p>Succeeded in saving ${file.name}</p>`);
          }
        }
      }
      for (const art of [['post', postBox, EditPost],['page', pageBox, EditPage]]) {
        if (ALLS.elements[art[0]].checked) {
          for (const file of art[1].values()) {
            if (file.kind === 'file') {
              await new art[2](file.name).saveTransfer();
              log.insertAdjacentHTML('beforeend', `<p>Succeeded in saving ${file.name}</p>`);
            }
          }
        }
      }
      log.insertAdjacentHTML('beforeend', `<p>Saving is complete.</p>`);
      dialog.completeSave();
    }

    document.getElementById('guide').classList.add('hide');

  /// Mutation Observer ///
    obsForm = () => {
      SAVE.removeAttribute('data-file');
      ACTF.textContent = '';
      SAVE.classList.add('disable');
      PREV.classList.add('disable');
      const form = H2SE.dataset.form;
      if (form === 'post' || form === 'page') {
        if(document.querySelector(`#${form} .bench`).className !== 'hide') {
          const fileName = document.getElementById(form).querySelector('.artlist fieldset:not(.hide)')?.dataset.name;
          SAVE.dataset.file = fileName;
          ACTF.textContent = fileName;
          SAVE.classList.remove('disable');
          PREV.classList.remove('disable');
        }
      }
      else if (form === 'bases') {
        const filename = BASE.elements['paneltab'].dataset.currenttab;
        SAVE.dataset.file = filename;
        ACTF.textContent = filename;
        SAVE.classList.remove('disable');
      }
      else if (form === 'setting') {
        SAVE.dataset.file = `${form}.json`;
        ACTF.textContent = `${form}.json`;
        SAVE.classList.remove('disable');
      }
    }
    obsPost = () => {
      if (POSBE.classList.contains('hide')) {
        SAVE.removeAttribute('data-file');
        SAVE.classList.add('disable');
        PREV.classList.add('disable');
        POST.elements['top'].classList.remove('hide');
        // POST.elements['new'].classList.remove('hide');
        ACTF.textContent = '';
        const inputs = POST.querySelectorAll('.artlist > fieldset > input');
        for (const input of inputs) input.setAttribute('readonly','readonly');
        for (const span of POST.elements['tagbtns'].querySelectorAll('i')) span.removeAttribute('class');
        return;
      }
      const fileName = POST.querySelector('.artlist > fieldset:not(.hide)').dataset.name;
      SAVE.dataset.file = fileName;
      ACTF.textContent = fileName;
      SAVE.classList.remove('disable');
      PREV.classList.remove('disable');
      POST.elements['top'].classList.add('hide');
      // POST.elements['new'].classList.add('hide');
      const inputs = POST.querySelectorAll(`.artlist > [data-name="${fileName}"] > input`);
      for (const input of inputs) input.removeAttribute('readonly');
    }
    obsPage = () => {
      if (PAGBE.classList.contains('hide')) {
        SAVE.removeAttribute('data-file');
        SAVE.classList.add('disable');
        PREV.classList.add('disable');
        ACTF.textContent = '';
        const inputs = PAGE.querySelectorAll('.artlist > fieldset > input');
        for (const input of inputs) input.setAttribute('readonly','readonly');
        return;
      }
      const fileName = PAGE.querySelector('.artlist > fieldset:not(.hide)').dataset.name;
      SAVE.dataset.file = fileName;
      ACTF.textContent = fileName;
      SAVE.classList.remove('disable');
      PREV.classList.remove('disable');
      const inputs = PAGE.querySelectorAll(`.artlist > [data-name="${fileName}"] > input`);
      for (const input of inputs) input.removeAttribute('readonly');
    }
    obsBasesTab = () => {
      const filename = BASE.elements['paneltab'].dataset.currenttab;
      SAVE.dataset.file = filename;
      ACTF.textContent = filename;
      // SAVE.classList.remove('disable');
    }
    const currentForm = new MutationObserver(obsForm);
    const currentPostFile = new MutationObserver(obsPost);
    const currentPageFile = new MutationObserver(obsPage);
    const currentThemaFile = new MutationObserver(obsBasesTab);
    const obsConfig = (attr) => {
      return {attributes: true, attributeFilter: [attr]};
    }
    currentForm.observe(H2SE, obsConfig('data-form'));
    currentPostFile.observe(POSBE, obsConfig('class'));
    currentPageFile.observe(PAGBE, obsConfig('class'));
    currentThemaFile.observe(BASE.elements['paneltab'], obsConfig('data-currenttab'));
  }
  LOAD.classList.add('hide');
});
              // static tag = {
    //   block: ['p','h2','h3','h4','h5','h6','pre','div','blockquote'],
    //   inline: ['small','i','b','strong','mark','code','span','q',],
    //   attr: [['a','href="" target="_blank"']],
    //   child: [['ul','li'],['ol','li'],['table','td']],
    //   single: ['br','hr','img src="" alt=""']
    // }
          // for (const t of Monaco.tag.attr) {
          //   if (e.target.textContent === t[0]) return this.insert(`<${t[0]} ${t[1]}>`,`</${t[0]}>`);
          // }
          // for (const t of Monaco.tag.child) {
          //   if (e.target.textContent === t[0]) return this.insert(`<${t[0]}>\n  <${t[1]}>`,`</${t[1]}>\n  <${t[1]}></${t[1]}>\n  <${t[1]}></${t[1]}>\n</${t[0]}>`);
          // }
          // for (const t of Monaco.tag.block) {
          //   if (e.target.textContent === t) return this.insert(`<${t}>`,`</${t}>\n`);
          // }
          // for (const t of Monaco.tag.inline) {
          //   if (e.target.textContent === t) return this.insert(`<${t}>`,`</${t}>`);
          // }
          // for (const t of Monaco.tag.single) {
          //   if (e.target.textContent === t) return this.insert(`<${t}>\n`, '');
          // }
        // }

        // if (e.target.tagName === 'U') return this.insert(`${e.target.title}\n`, '');
      //   if (twitter) twitter.setAttribute('href',`https://twitter.com/share?url=${encodeUrl}&text=${encodeTitle}`);
      //   if (facebook) facebook.setAttribute('href',`https://www.facebook.com/sharer/sharer.php?u=${encodeUrl}`);
      //   if (line) line.setAttribute('href',`https://line.me/R/msg/text/?${encodeTitle}%20${encodeUrl}`);

  //再帰的にファイルハンドルを配列に格納
  // listAll = async (dir) => {
  //   const files = [];
  //   for await (const entry of dir.values()) {
  //     if (entry.kind === 'directory') {
  //       files.push(entry);
  //       files.push(...await listAll(entry));
  //     } else files.push(entry);
  //   }
  //   return files;
  // }

      // media class
    // class EditMedia {
    //   static async localUrl(fileHandle) {
    //     const getFile = await fileHandle.getFile();
    //     return URL.createObjectURL(getFile);
    //   }
    //   static addDirsList() {
    //     // IMAGS.elements['dirs'].textContent = '';
    //     // const dirHdls = this.dirHdls();
    //     for (const dir in mediaBox) IMAGS.elements['dirs'].insertAdjacentHTML('afterbegin',`<option value="${dir}">${dir}</option>`);
    //     IMAGS.elements['dirs'].value = date.year();
    //   }
    //   static async addListInDir(elem, dirName) {
    //       // const medHdls = await this.fileHdlesInDir(dirName);
    //       const hdles = mediaBox[dirName];
    //       for await (const med of hdles) {
    //         if (med.name.match(/(.jpg|.jpeg|.png|.gif|.apng|.svg|.jfif|.pjpeg|.pjp|.ico|.cur)/i)) {
    //           const url = await this.localUrl(med);
    //           elem.innerHTML += `<img src="${url}" title="${med.name}" loading="lazy">`;
    //         }
    //         else if (med.name.match(/(.mp3|.ogg|.wav)/i)) {
    //           const url = await this.localUrl(med);
    //           elem.innerHTML += `<figure title="${med.name}">${med.name}<audio src="${url}" controls></audio></figure>`;
    //         }
    //         else if (med.name.match(/(.mp4|.ogv|.webm)/i)) {
    //           const url = await this.localUrl(med);
    //           elem.innerHTML += `<video src="${url}" title="${med.name}" controls></video>`;
    //         }
    //         else elem.innerHTML += `<span title="${med.name}">${med.name}</span>`;
    //       }
    //     IMAGS.elements['dirs'].value = dirName;
    //   }
    //   static async dirSelect() {
    //     IMAGS.elements['dirs'].addEventListener('input', async (e) => {
    //       const dirName = e.target.value;
    //       const dirbox = IMAGS.elements['dirbox'];
    //       dirbox.textContent ='';
    //       await this.addListInDir(dirbox, dirName);
    //     });
    //   }
    //   static thumbSelect(form) {
    //     form.elements['thumbbtn'].onclick = () => {
    //       IMAGS.classList.toggle('hide');
    //       IMAGS.elements['dirbox'].onclick = (e) => {
    //         if (e.target.tagName === 'IMG') {
    //           const dirName = IMAGS.elements['dirs'].value;
    //           form.elements['thumbpath'].value = `media/${dirName}/${e.target.title}`;
    //         }
    //       }
    //     }
    //   }
    // }

    // EditMedia.addDirsList();
    // await EditMedia.dirSelect();
    // EditMedia.thumbSelect(POST);
    // EditMedia.thumbSelect(PAGE);