document.addEventListener('DOMContentLoaded', () => {
  // Check user's browser supports (file API)
  if (window.showOpenFilePicker) console.log('File System is available');
  else document.querySelector('#guide div').innerHTML = '<span class="exclamation">Oops...This app works with Google Chrome, MS Edge and Opera for PC.</span>';
  // Registering Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
    .then((reg) => {
      // registration worked
      console.log('Registration succeeded. Scope is ' + reg.scope);
    }).catch((error) => {
      // registration failed
      console.log('Registration failed with ' + error);
    });
  }
  // global constant
  const DOMP = new DOMParser();
  const DATE = new Date().toISOString();
  const SAVE = document.getElementById('save');
  const PREV = document.getElementById('preview');
  const ACTF = document.getElementById('actfile');
  const OPEN = document.getElementById('open-dir');
  const H2SE = document.querySelector('h2');
  const POST = document.forms['post'];
  const PAGE = document.forms['page'];
  const STYL = document.forms['style'];
  const TEMP = document.forms['template'];
  const SETT = document.forms['setting'];
  const RENW = document.forms['allsave'];
  const POSNW = document.getElementById('post-new');
  const POSTG = document.getElementById('post-tagbox');
  const POSLI = document.getElementById('post-list');
  const POSBO = document.getElementById('post-box');
  const POSPA = ['table-of-contents','comment','freespace'];
  const PAGNW = document.getElementById('page-new');
  const PAGLI = document.getElementById('page-list');
  const PAGBO = document.getElementById('page-box');
  const CNFST = SETT.elements['site-title'];
  const LINKS = document.getElementById('links');
  const IMAGS = document.getElementById('images');
  // load default template and style
  fetch('default-template.html').then((response) => {
    return response.text();
  }).then((html) => {
    TEMP.elements['ta'].value = html;
  });
  fetch('default-style.css').then((response) => {
    return response.text();
  }).then((css) => {
    STYL.elements['ta'].value = css;
  });
  // all file handle into array
  listAll = async (dir) => {
    const files = [];
    for await (const entry of dir.values()) {
      if (entry.kind === 'directory') {
        files.push(entry);
        files.push(...await listAll(entry));
      } else files.push(entry);
    }
    return files;
  };
  //normalization
  const normal = {
    url: () => {
      const url = SETT.elements['url'].value;
      return url.replace(/\/$/,'/');
    }
  };
  //dialog
  const dialog = {
    confirmSave: (fileName) => {
      const result = confirm(`Do you want to save "${fileName}" ?`);
      if (!result) {
        alert('Stopped saving.');
        throw new Error('Stopped saving.');
      }
    },
    successSave: (fileName) => {
      alert(`👍 Succeeded in saving "${fileName}".`);
    },
    completeSave: () => {
      alert('Saving is complete.');
    },
    nameEmpty: () => {
      alert('👎 Failed to save.File name is empty.');
      throw new Error('Failed to save.File name is empty.');
    },
    nameExists: () => {
      alert('👎 Failed to save.Same file name exists.');
      throw new Error('Failed to save.Same file name exists.');
    },
    notTag: (tag) => {
      alert(`⚠ "${tag}" does not exist in the template.`);
      throw new Error(`"${tag}" does not exist in the template.`);
    }
  };
  //date
  const date = {
    nowYmdTime: () => {
      return DATE.slice(0,16); //2021-05-26T14:00
    },
    nowYmd: () => {
      return DATE.slice(0,10); //2021-05-26
    },
    nowYear: () => {
      return DATE.slice(0,4); //2021
    },
    changeFormat: (ymd) => {
      if(!ymd) return '';
      const year = ymd.slice(0,4);
      const month = ymd.slice(5,7);
      const monthInt = month.replace(/\b0+/, '');
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const monthName = monthNames[monthInt];
      const day = ymd.slice(8,10);
      const dt = SETT.elements['date-type'].value;
      if (dt === 'yyyy-mm-dd') return `${year}-${month}-${day}`;
      else if (dt === 'dd-mm-yyyy') return `${day} ${monthName}, ${year}`;
      else if (dt === 'mm-dd-yyyy') return `${monthName} ${day}, ${year}`;
    }
  };
  POSNW.elements['date'].value = date.nowYmdTime();
//Text Editor
  class TextEditor {
    constructor() {
      const section = H2SE.dataset.section;
      this.ta = document.getElementById(section).elements['ta'];
      let path = '../../'
      if (section === 'page') path = '../';
      this.path = path;
    };
    addTag(btnTxt) {
      if (btnTxt === "p") this.surroundSelectedText('<p>','</p>\n');
      else if (btnTxt === "br") this.insertText('<br />\n');
      else if (btnTxt === "b") this.surroundSelectedText('<b>','</b>');
      else if (btnTxt === "h2") this.surroundSelectedText('<h2>','</h2>\n');
      else if (btnTxt === "h3") this.surroundSelectedText('<h3>','</h3>\n');
      else if (btnTxt === "h4") this.surroundSelectedText('<h4>','</h4>\n');
      else if (btnTxt === "a") this.surroundSelectedText('<a href="" target="_blank">','</a>');
      else if (btnTxt === "small") this.surroundSelectedText('<small>','</small>');
      else if (btnTxt === "big") this.surroundSelectedText('<big>','</big>');
      else if (btnTxt === "strong") this.surroundSelectedText('<strong>','</strong>');
      else if (btnTxt === "mark") this.surroundSelectedText('<mark>','</mark>');
      else if (btnTxt === "ul") this.insertText('<ul>\n  <li></li>\n  <li></li>\n  <li></li>\n</ul>\n');
      else if (btnTxt === "code") this.surroundSelectedText('<code>','</code>');
      else if (btnTxt === "pre code") this.surroundSelectedText('<pre><code>\n','</code></pre>\n');
      else if (btnTxt === "textarea") this.surroundSelectedText('<textarea>','</textarea>\n');
      else if (btnTxt === "img") this.insertText('<img src="" alt="" target="_blank" />');
      else if (btnTxt === "q") this.surroundSelectedText('<q>','</q>');
      else if (btnTxt === "blockquote") this.surroundSelectedText('<blockquote>','</blockquote>\n');
      else if (btnTxt === "table") this.insertText('<table>\n  <tr><th></th><th></th></tr>\n  <tr><td></td><td></td></tr>\n</table>\n');
      else if (btnTxt === "i") this.surroundSelectedText('<i>','</i>');
      else if (btnTxt === "h5") this.surroundSelectedText('<h5>','</h5>\n');
      else if (btnTxt === "h6") this.surroundSelectedText('<h6>','</h6>\n');
      else if (btnTxt === "s") this.surroundSelectedText('<s>','</s>');
      else if (btnTxt === "ol") this.insertText('<ol>\n<li></li>\n<li></li>\n<li></li>\n</ol>\n');
    };
    getSelection() {
      const start = this.ta.selectionStart;
      const end = this.ta.selectionEnd;
      return {
        start: start,
        end: end,
        length: end - start,
        text: this.ta.value.slice(start, end)
      };
    };
    surroundSelectedText(before,after) {
      const selection = this.getSelection();
      this.ta.value = this.ta.value.slice(0, selection.start) + before + selection.text + after + this.ta.value.slice(selection.end);
      this.ta.selectionEnd = selection.end + before.length + after.length;
      this.ta.blur();
      this.ta.focus();
    };
    insertText(text) {
      const selection = this.getSelection();
      this.ta.value = this.ta.value.slice(0, selection.start) + text + this.ta.value.slice(selection.end);
      this.ta.selectionEnd = selection.end + text.length;
      this.ta.blur();
      this.ta.focus();
    };
  };
//Mutation Observer
  obsSection = () => {
    SAVE.removeAttribute('data-file');
    ACTF.textContent = '';
    SAVE.classList.add('disable');
    PREV.classList.add('disable');
    const section = H2SE.dataset.section;
    if (section === 'post' || section === 'page') {
      if(document.getElementById(`${section}-box`).className !== 'hide') {
        const fileName = document.getElementById(section).querySelector('fieldset:not(.hide)').dataset.name;
        SAVE.dataset.file = fileName;
        ACTF.textContent = fileName;
        SAVE.classList.remove('disable');
        PREV.classList.remove('disable');
      }
    }
    else if (section === 'template' || section === 'setting') {
      SAVE.dataset.file = `${section}.html`;
      ACTF.textContent = `${section}.html`;
      SAVE.classList.remove('disable');
    }
    else if (section === 'style') {
      SAVE.dataset.file = `${section}.css`;
      ACTF.textContent = `${section}.css`;
      SAVE.classList.remove('disable');
    }
  };
  obsPost = () => {
    if (POSBO.classList.contains('hide')) {
      SAVE.removeAttribute('data-file');
      SAVE.classList.add('disable');
      PREV.classList.add('disable');
      POST.elements['years'].classList.remove('hide');
      ACTF.textContent = '';
      const txtas = document.querySelectorAll('.box-right textarea');
      for (const txta of txtas) txta.value = '';
      for (const part of POSPA) POST.elements[part].checked = true;
      for (const part of POSPA) POST.elements[part].value = '';
      for (const span of POSTG.querySelectorAll('i')) span.removeAttribute('class');
      return;
    }
    const fileName = document.querySelector('#post fieldset:not(.hide)').dataset.name;
    SAVE.dataset.file = fileName;
    ACTF.textContent = fileName;
    SAVE.classList.remove('disable');
    PREV.classList.remove('disable');
    POST.elements['years'].classList.add('hide');
  };
  obsPage = () => {
    if (PAGBO.classList.contains('hide')) {
      SAVE.removeAttribute('data-file');
      SAVE.classList.add('disable');
      PREV.classList.add('disable');
      ACTF.textContent = '';
      return;
    }
    const fileName = document.querySelector('#page fieldset:not(.hide)').dataset.name;
    SAVE.dataset.file = fileName;
    ACTF.textContent = fileName;
    SAVE.classList.remove('disable');
    PREV.classList.remove('disable');
  };
  const activeSection = new MutationObserver(obsSection);
  const activePostFile = new MutationObserver(obsPost);
  const activePageFile = new MutationObserver(obsPage);
  const obsConfig1 = {
    attributes: true,
    attributeFilter: ['data-section']
  };
  const obsConfig2 = {
    attributes: true,
    attributeFilter: ['class']
  };
  activeSection.observe(H2SE, obsConfig1);
  activePostFile.observe(POSBO, obsConfig2);
  activePageFile.observe(PAGBO, obsConfig2);
//event
  //click left menu
  document.querySelector('nav').onclick = (e) => {
    if (e.target.tagName === 'P') {
      const section = e.target.dataset.nav;
      H2SE.innerHTML = section.charAt(0).toUpperCase() + section.slice(1);
      H2SE.dataset.section = section;
      const navp = document.querySelectorAll('nav p');
      for (let i = 0; i < navp.length; i++) {
        navp[i].removeAttribute('class');
        document.forms[i].classList.remove('show');
      }
      document.getElementById(section).classList.add('show');
      e.target.setAttribute('class','on');
    }
  };
  //click spellcheck
  document.getElementById('spellcheck').onclick = () => {
    const spl = document.getElementById('spellcheck');
    spl.classList.toggle('off');
    const frms = ['input','textarea'];
    if (spl.classList.contains('off')) {
      for (const frm of frms) {
        const inps = document.querySelectorAll(frm);
        for (const inp of inps) inp.setAttribute('spellcheck','false');
      }
    } else {
      for (const frm of frms) {
        const inps = document.querySelectorAll(frm);
        for (const inp of inps) inp.setAttribute('spellcheck','true');
      }
    }
  };
  //click dark mode
  document.getElementById('mode').onclick = () => {
    document.querySelector('header').classList.toggle('dark');
    document.querySelector('main').classList.toggle('dark');
  };
  //click text editor panel
  for (const panel of ['post-panel','page-panel']) {
    document.getElementById(panel).onclick = (e) => {
      if (e.target.tagName === 'I') new TextEditor().addTag(e.target.textContent);
    };
  }
  //click right block title
  for (const boxr of document.querySelectorAll('.box-right h3')) {
    boxr.onclick = (e) => {
      if (e.target.tagName === 'B') {
        e.target.parentNode.nextElementSibling.classList.toggle('hide');
        e.target.classList.toggle('arrdown');
      }
    };
  }
  //click tags
  POSTG.onclick = (e) => {
    if (e.target.tagName === 'I') e.target.classList.toggle('on');
    const ons = POSTG.querySelectorAll('.on');
    let tagsHtml = '';
    for(const on of ons) tagsHtml += `<span>${on.textContent}</span>`
    POST.elements['tags'].value = tagsHtml;
  };
  (() => {
    //adjust Height
    const fh = document.querySelector('form').offsetHeight;
    const nh = POSNW.offsetHeight;
    const ph = document.getElementById('post-panel').offsetHeight;
    const ch = fh - (nh + ph) + 'px';
    POST.elements['ta'].style.height = ch;
    PAGE.elements['ta'].style.height = ch;
    //set translate="no"
    const elems = ['nav','header','#post-panel','#page-panel','#post-tagbox','#custom'];
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
  })();
//// open picker ////
  OPEN.onclick = async () => {
    const dirHandle = await window.showDirectoryPicker(); //dialog accept
    //create file and folder
    const tmpHandle = await dirHandle.getFileHandle('template.html',{create:true});
    const setHandle = await dirHandle.getFileHandle('setting.html',{create:true});
    const blgHandle = await dirHandle.getDirectoryHandle('site',{create:true});
    const idxHandle = await blgHandle.getFileHandle('index.html',{create:true});
    const styHandle = await blgHandle.getFileHandle('style.css',{create:true});
    const allHandle = await blgHandle.getFileHandle('allpost.html',{create:true});
    const srhHandle = await blgHandle.getFileHandle('search.html',{create:true});
    const icoHandle = await blgHandle.getFileHandle('favicon.svg',{create:true});
    const mjsHandle = await blgHandle.getFileHandle('main.js',{create:true});
    const posHandle = await blgHandle.getDirectoryHandle('post',{create:true});
    const pagHandle = await blgHandle.getDirectoryHandle('page',{create:true});
    const medHandle = await blgHandle.getDirectoryHandle('media',{create:true});
    await posHandle.getDirectoryHandle(date.nowYear(),{create:true});
    await medHandle.getDirectoryHandle(date.nowYear(),{create:true});
    //store file and directory handles
    const singleChest = [];
    singleChest.push(tmpHandle,setHandle,idxHandle,styHandle,allHandle,srhHandle,icoHandle,mjsHandle);
    const postChest = await listAll(posHandle);
    const pageChest = await listAll(pagHandle);
    const mediaChest = await listAll(medHandle);
    console.log(singleChest,postChest,pageChest,mediaChest);
    const postFolders = [];
    for (const folder of postChest.values()) {
      if (folder.kind === 'directory') postFolders.push(folder.name);
    };
    const mediaFolders = [];
    for (const folder of mediaChest.values()) {
      if (folder.kind === 'directory') mediaFolders.push(folder.name);
    };
    class ViewImg {
      constructor(fileName) {
        this.fileName = fileName;
        this.chest = mediaChest;
      };
      async Url() {
        const handle = this.chest.find(({name}) => name === this.fileName);
        const get = await handle.getFile();
        return URL.createObjectURL(get);
      };
    };
    //file handler class
    class HandleFile {
      constructor(fileName,chest) {
        this.fileName = fileName;
        this.chest = chest;
      };
      handle() {
        return this.chest.find(({name}) => name === this.fileName);
      };
      async txt() {
        const file = await this.handle().getFile();
        return file.text();
      };
      async document() {
        const txt = await this.txt();
        return DOMP.parseFromString(txt,'text/html');
      };
      async write(str) {
        const w = await this.handle().createWritable();
        await w.write(str);
        await w.close();
      };
    };
    class HandleText extends HandleFile {
      async writeURLToFile() {
        const writable = await this.handle().createWritable();
        const response = await fetch(this.url);
        await response.body.pipeTo(writable);
      };
      async load() {
        const str = await this.txt();
        if (!str) {
          const rem = this.ta.value.substring(this.ta.value.indexOf("\n") + 1);
          this.ta.value = rem;
        }
        else this.ta.value = str;
      };
      async save() {
        await this.write(this.ta.value);
      };
    }
    class HandleTemplate extends HandleText {
      constructor(fileName,chest) {
        super(fileName,chest);
        this.fileName = 'template.html';
        this.chest = singleChest;
        this.url = 'default-template.html';
        this.ta = TEMP.elements['ta'];
      };
      document() {
        return DOMP.parseFromString(this.ta.value,'text/html');
      };
    };
    class HandleStyle extends HandleText {
      constructor(fileName,chest) {
        super(fileName,chest);
        this.fileName = 'style.css';
        this.chest = singleChest;
        this.url = 'default-style.css';
        this.ta = STYL.elements['ta'];
      };
      document() {
        return DOMP.parseFromString(this.ta.value,'text/html');
      };
    };
    class HandleFavicon extends HandleText {
      constructor(fileName,chest) {
        super(fileName,chest);
        this.fileName = 'favicon.svg';
        this.chest = singleChest;
        this.url = 'favicon.svg';
      };
    };
    class HandleMainJS extends HandleText {
      constructor(fileName,chest) {
        super(fileName,chest);
        this.fileName = 'main.js';
        this.chest = singleChest;
        this.url = 'default-main.js'
      };
    };
    class HandleSetting extends HandleText {
      constructor(fileName,chest) {
        super(fileName,chest);
        this.fileName = 'setting.html';
        this.chest = singleChest;
        this.setts = ['site-title','site-subtitle','url','image','latest-posts','index-desc','allpost-title','allpost-desc','search-title','search-desc','auther','date-type','tags','custom-editor'];
      };
      async load() {
        const doc = await this.document();
        for (const sett of this.setts) {
          const txt = doc.getElementById(sett)?.innerHTML?? '';
          SETT.elements[sett].value = txt;
        }
        POSTG.textContent = '';
        const ctgs = doc.getElementById('tags');
        if (ctgs) {
          const tags = ctgs.querySelectorAll('i');
          for (const tag of tags) {
            tag.setAttribute('data-tag',tag.textContent);
            POSTG.insertAdjacentHTML('beforeend',tag.outerHTML);
          }
        }
      };
      async save() {
        let str = [];
        for (const cnf of this.confs) {
          const txt = SETT.elements[cnf].value;
          str += `<p id="${cnf}">${txt}</p>\n`
        }
        await this.write(str);
      };
    };
    const template = new HandleTemplate();
    const style = new HandleStyle();
    const favicon = new HandleFavicon();
    const mainjs = new HandleMainJS();
    const setting = new HandleSetting();
    //HTML file Handler
    class HandleHTML extends HandleFile {
      templateToDoc() {
        const doc = template.document();
        //remove not class
        const hnt = doc.head.querySelectorAll(`[class]:not(.${this.class})`);
        for (const i of hnt) i.remove();
        const hdt = doc.head.querySelectorAll(`.${this.class}`);
        for (const i of hdt) i.removeAttribute('class');
        const not = doc.body.querySelectorAll(`if:not(.${this.class})`);
        for (const i of not) i.remove();
        const cpo = doc.body.querySelectorAll(`if.${this.class}`);
        for (const i of cpo) {
          i.insertAdjacentHTML('afterend',i.innerHTML);
          i.remove();
        }
        return doc;
      };
      existsRequiredElems(doc) {
        const reqElems = ['title','[rel=stylesheet]','script','[name=description]','[rel=icon]','.site-title','.page-list','.link-allpost','.link-search','.copyright'];
        if (this.req) for (const word of this.req) reqElems.push(word);
        console.log(reqElems,this.req)
        for (const elem of reqElems) {
          if (!doc.querySelector(elem)) dialog.notTag(elem);
        }
      };
      async insertCommonElems(doc) {
        const elems = [
          ['[rel=stylesheet]','href',`${this.path}style.css`],
          ['script','src',`${this.path}main.js`],
          ['[rel=icon]','href',`${this.path}favicon.svg`],
          ['[property="og:site_name"]','content',CNFST.value],
          ['[property="og:image"]','content',normal.url() + SETT.elements['image'].value]
        ];
        for (const elem of elems) doc.head.querySelector(elem[0]).setAttribute(elem[1],elem[2]);
        doc.querySelector('.site-title').innerHTML = `<a href="${this.path}">${CNFST.value}</a>`;
        if (pageChest) {
          const data = await HandlePage.allData();
          for (const d of data) doc.querySelector('.page-list').innerHTML += `<li><a href="${this.path}page/${d[0]}">${d[1]}</a></li>\n`;
        } else doc.querySelector('.page-list').remove();
        const allps = doc.querySelectorAll('.link-allpost');
        for (const allp of allps) allp.setAttribute('href',`${this.path}allpost.html`);
        const serhs = doc.querySelectorAll('.link-search');
        for (const serh of serhs) serh.setAttribute('href',`${this.path}search.html`);
        doc.querySelector('.copyright').insertAdjacentHTML('afterbegin',`©${date.nowYear()} <a href="${this.path}">${CNFST.value}</a>`);
      };
      insertHeadTitle(doc,value) {
        doc.head.querySelector('title').textContent = value;
        doc.head.querySelector('[property="og:title"]').setAttribute('content',value);
      };
      insertBodyTitle(doc,value) {
        doc.querySelector('.title').insertAdjacentHTML('afterbegin',value);
      };
      insertDescription(doc,value) {
        doc.head.querySelector('[name=description]').setAttribute('content',value);
        doc.head.querySelector('[property="og:description"]').setAttribute('content',value);
      };
      insertOGPUrl(doc,value) {
        doc.head.querySelector('[property="og:url"]').setAttribute('content',value);
      };
      async makeHTMLCommon() {
        const doc = this.templateToDoc();
        this.existsRequiredElems(doc);
        await this.insertCommonElems(doc);
        return doc;
      };
      docToHTMLStr(doc) {
        const str = doc.documentElement.outerHTML;
        const rstr = str.replace(/^\s*[\r\n]/gm, ''); //remove white line
        return `<!DOCTYPE html>\n${rstr}`;
      };
      async preview() {
        const doc = await this.makeHTMLCommon();
        await this.makeHTMLSpecial(doc);
        // const elems =[['[rel=stylesheet]','href','site/style.css'],['script','src','site/main.js'],['[rel=icon]','href','site/favicon.svg']];
        // for (const elem of elems ) doc.head.querySelector(elem[0]).setAttribute(elem[1],elem[2]);
        // const imgs = doc.querySelectorAll('img');
        // for (const img of imgs) {
        //   const src = img.getAttribute('src');
        //   const presrc = src.replace('media','site/media');
        //   img.setAttribute('src',presrc);
        // }
        const imgs = doc.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src');
          const arr = src.split("/");
          const filename = arr[arr.length -1];
          const url = await new ViewImg(filename).Url();
          img.setAttribute('src',url);
        }
        const str = this.docToHTMLStr(doc);
        const ope = window.open('preview',this.fileName,`height=${window.screen.height},width=${window.screen.width},scrollbars=yes,`);
        ope.document.write(str);
      };
      async save() {
        const doc = await this.makeHTMLCommon();
        await this.makeHTMLSpecial(doc);
        const str = this.docToHTMLStr(doc);
        await this.write(str);
      };
    };
    class HandleIndex extends HandleHTML {
      constructor(fileName,chest) {
        super(fileName,chest);
        this.fileName = 'index.html';
        this.chest = singleChest;
        this.class = 'index';
        this.title = SETT.elements['site-subtitle'];
        this.desc = SETT.elements['index-desc'];
        this.req = ['.latest-posts'];
        this.path = './';
      };
      async makeHTMLSpecial(doc) {
        this.insertHeadTitle(doc,`${CNFST.value} - ${this.title.value}`);
        this.insertDescription(doc,this.desc.value);
        this.insertOGPUrl(doc,normal.url());
        const lat = doc.querySelector('.latest-posts');
        const num = SETT.elements['latest-posts'].value;
        if (num > 0 && num < 21) await HandlePost.insertLatestPostsNum(num,lat);
        const imgs = lat.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src');
          const nsrc = src.replace('../../','');
          img.setAttribute('src',nsrc);
        }
      };
    };
    class HandleAllpost extends HandleHTML {
      constructor(fileName,chest) {
        super(fileName,chest);
        this.fileName = 'allpost.html';
        this.chest = singleChest;
        this.class = 'allpost';
        this.title = SETT.elements['allpost-title'];
        this.desc = SETT.elements['allpost-desc'];
        this.req = ['.allpost-btns','.latest-posts'];
        this.path = './';
      };
      async makeHTMLSpecial(doc) {
        this.insertHeadTitle(doc,`${this.title.value} - ${CNFST.value}`);
        this.insertDescription(doc,this.desc.value);
        this.insertOGPUrl(doc,normal.url() + this.fileName);
        this.insertBodyTitle(doc,this.title.value);
        const mabp = doc.querySelector('.allpost-btns').querySelectorAll('*');
        const flds = HandlePost.sortLatestDir();
        for (const fld of flds) mabp[0].insertAdjacentHTML('beforeend',`<U data-btn="fld-${fld}" class="on">${fld}</U>`);
        const str = SETT.elements['tags'].value;
        const dom = DOMP.parseFromString(str,'text/html');
        const tags = dom.querySelectorAll('i');
        for (const tag of tags) {
          const editag = tag.textContent.replace(/ /g,'-');
          mabp[1].insertAdjacentHTML('afterbegin',`<span data-btn="tag-${editag}" class="on">${tag.textContent}</span>`);
        }
        const lat = doc.querySelector('.latest-posts');
        await HandlePost.insertLatestPostsAll(lat);
        const imgs = lat.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src');
          const nsrc = src.replace('../../','');
          img.setAttribute('src',nsrc);
          img.setAttribute('loading','lazy');
        }
      };
    };
    class HandleSearch extends HandleHTML {
      constructor(fileName,chest) {
        super(fileName,chest);
        this.fileName = 'search.html';
        this.chest = singleChest;
        this.class = 'search';
        this.title = SETT.elements['search-title'];
        this.desc = SETT.elements['search-desc'];
        this.path = './';
      };
      makeHTMLSpecial(doc) {
        this.insertHeadTitle(doc,`${this.title.value} - ${CNFST.value}`);
        this.insertDescription(doc,this.desc.value);
        this.insertOGPUrl(doc,normal.url() + this.fileName);
        this.insertBodyTitle(doc,this.title.value);
      };
    };
    const index = new HandleIndex();
    const allpost = new HandleAllpost();
    const search = new HandleSearch();
    class HandleArticle extends HandleHTML {
      constructor(fileName,chest) {
        super(fileName,chest);
        this.req = ['.title','.contents'];
      };
      checkNewFileName() {
        if (this.fileName === '.html') dialog.nameEmpty();
        const result = this.chest.findIndex(({name}) => name === this.fileName);
        if (result !== -1) dialog.nameExists();
      };
      loadDescription(doc) {
        return doc.head.querySelector('[name=description][content]')?.content?? '';
      };
      loadTitle(doc) {
        return doc.querySelector('.title')?.textContent?? '';
      };
      loadContents(doc) {
        return doc.querySelector('.contents')?.innerHTML?? '';
      };
      insertContents(doc,value) {
          doc.querySelector('.contents').insertAdjacentHTML('afterbegin',value);
      };
      transHTMLCommon(doc,beforeDoc) {
        this.insertDescription(doc,this.loadDescription(beforeDoc));
        this.insertHeadTitle(doc,`${this.loadTitle(beforeDoc)} - ${CNFST.value}`);
        this.insertBodyTitle(doc,this.loadTitle(beforeDoc));
        this.insertContents(doc,this.loadContents(beforeDoc));
      };
      async saveTransfer() {
        const doc = await this.makeHTMLCommon();
        const beforeDoc = await this.document();
        await this.transHTMLCommon(doc,beforeDoc);
        await this.transHTMLSpecial(doc,beforeDoc);
        const str = this.docToHTMLStr(doc);
        await this.write(str);
      };
    };
    class HandlePost extends HandleArticle {
      constructor(fileName,chest) {
        super(fileName,chest);
        this.chest = postChest;
        this.class = 'post';
        this.path = '../../';
        this.title = POST.querySelector(`[data-name="${this.fileName}"] input`);
        this.time = POST.querySelectorAll(`[data-name="${this.fileName}"] input`)[1];
        this.ta = POST.elements['ta'];
        this.img = POST.elements['img'];
        this.tags = POST.elements['tags'];
        this.desc = POST.elements['desc'];
      };
      async dirName() {
        const rsv = await posHandle.resolve(this.handle());
        return rsv[0];
      };
      async fullURL() {
        const dir = await this.dirName();
        return `${normal.url()}post/${dir}/${this.fileName}`;
      };
      loadContents(doc) {
        const cnt = doc.querySelector('.contents');
        const h23 = cnt.querySelectorAll('h2,h3');
        if (h23.length) for (const h of h23) h.removeAttribute('id');
        return doc.querySelector('.contents').innerHTML?? '';
      };
      loadImg(doc) {
        const src = doc.querySelector('.top-image img')?.getAttribute('src')?? '';
        return src.replace(this.path,'');
      };
      loadTime(doc) {
        return doc.querySelector('.time')?.getAttribute('datetime')?? '';
      };
      loadTags(doc) {
        return doc.querySelector('.tags')?.innerHTML?? '';
      };
      async loadElements() {
        const doc = await this.document();
        this.ta.value = this.loadContents(doc);
        this.img.value = this.loadImg(doc);
        this.desc.value = this.loadDescription(doc);
        this.tags.value = this.loadTags(doc);
        const spans = doc.querySelectorAll('.tags span');
        for (const span of spans) POSTG.querySelector(`[data-tag="${span.textContent}"]`)?.setAttribute('class','on');
        for (const part of POSPA) {
          if (!doc.querySelector(`.${part}`)) POST.elements[part].checked = false;
        }
      };
      insertTime(doc,value) {
        const elems = doc.querySelectorAll('time');
        if (!elems) return;
        elems[0].innerHTML = date.changeFormat(value);
        elems[0].setAttribute('datetime',value);
        if (date.nowYmd() === value.slice(0,10)) {
          elems[1].remove();
          return;
        }
        const cTime = date.changeFormat(date.nowYmdTime())
        elems[1].insertAdjacentHTML('beforeend',cTime);
        elems[1].setAttribute('datetime',date.nowYmdTime());
      };
      insertImg(doc,value,title) {
        const elem = doc.querySelector('.top-image');
        if (!elem) return;
        if (!value) {
          elem.remove();
          return;
        }
        elem.innerHTML = `<img src="${this.path}${value}" alt="${title}" />`;
        doc.head.querySelector('[property="og:image"]').setAttribute('content',normal.url() + value);
      };
      insertAuther(doc,value) {
        const elems = doc.querySelectorAll('.auther');
        if (!elems) return;
        if (!value) {
          for (const elem of elems) elem.remove();
          return;
        }
        for (const elem of elems) elem.innerHTML = value;
      };
      insertTags(doc,value) {
        const elems = doc.querySelectorAll('.tags');
        if (!elems) return;
        if (!value) {
          for (const elem of elems) elem.remove();
          return;
        }
        for (const elem of elems) elem.innerHTML = value;
      };
      findIndex(data) {
        for (let i = 0; i < data.length; i++) {
          if (data[i][0] === this.fileName) return i;
        }
      };
      async setPrevNextLink(doc) {
        const prev = doc.querySelector('.link-prev');
        const next = doc.querySelector('.link-next');
        const data = await HandlePost.allLatestData();
        const index = this.findIndex(data);
        console.log(index)
        if (data[index + 1]) {
          const path = `${this.path}post/${data[index + 1][2]}/${data[index + 1][0]}`;
          prev.setAttribute('href',path);
          prev.setAttribute('title',data[index + 1][1]);
        }
        else prev.classList.add('isDisabled');
        if (data[index - 1]) {
          const path = `${this.path}post/${data[index - 1][2]}/${data[index - 1][0]}`;
          next.setAttribute('href',path);
          next.setAttribute('title',data[index - 1][1]);
        }
        else next.classList.add('isDisabled');
      };
      editParts(doc) {
        for(const part of POSPA) {
          if (!POST.elements[part].checked) doc.querySelector(`.${part}`).remove();
        }
        //table of contents
        const elem = doc.querySelector('.table-of-contents');
        if (!elem) return;
        const cnt = doc.querySelector('.contents');
        const h23 = cnt.querySelectorAll('h2,h3');
        if (!h23) {
          elem.remove();
          return;
        }
        elem.innerHTML += '<ul></ul>';
        const h2Ul = elem.querySelector('ul');
        for (let i = 0; i < h23.length; i++) {
          const htx = h23[i].textContent;
          const tgn = h23[i].tagName;
          if (tgn === 'H2') h2Ul.innerHTML += `<li><a href="#index${i}">${htx}</a></li>\n<ul></ul>\n`;
          if (tgn === 'H3') {
            const preUl = h2Ul.querySelector('ul:last-child');
            const h3Li = `<li><a href="#index${i}">${htx}</a></li>\n`;
            if (preUl) preUl.innerHTML += h3Li;
            else h2Ul.innerHTML += h3Li;
          }
          h23[i].setAttribute('id',`index${i}`);
        }
        const h3Uls = h2Ul.querySelectorAll('ul');
        for (const h3Ul of h3Uls) {
          if (!h3Ul.textContent) h3Ul.remove();
        }
      };
      async makeHTMLSpecial(doc) {
        this.insertHeadTitle(doc,`${this.title.value} - ${CNFST.value}`);
        this.insertDescription(doc,this.desc.value);
        this.insertBodyTitle(doc,this.title.value);
        this.insertContents(doc,this.ta.value);
        this.insertTime(doc,this.time.value);
        this.insertImg(doc,this.img.value,this.title.value);
        this.insertAuther(doc,SETT.elements['auther'].value);
        this.insertTags(doc,this.tags.value);
        this.editParts(doc);
      };
      async save() {
        const doc = await this.makeHTMLCommon();
        await this.makeHTMLSpecial(doc);
        this.insertOGPUrl(doc,await this.fullURL());
        await this.setPrevNextLink(doc);
        const str = this.docToHTMLStr(doc);
        await this.write(str);
      };
      async saveNew() {
        this.checkNewFileName();
        const thisYear = this.chest.find(({name}) => name === date.nowYear());
        const newFile = await thisYear.getFileHandle(this.fileName,{create:true});
        this.chest.push(newFile);
        await this.save();
        for (const input of POSNW.elements) input.value = '';
      };
      async transHTMLSpecial(doc,beforeDoc) {
        this.insertOGPUrl(doc,await this.fullURL());
        this.insertTime(doc,this.loadTime(beforeDoc));
        this.insertImg(doc,this.loadImg(beforeDoc),this.loadTitle(beforeDoc));
        this.insertAuther(doc,SETT.elements['auther'].value);
        this.insertTags(doc,this.loadTags(beforeDoc));
        await this.setPrevNextLink(doc);
        for(const part of POSPA) {
          const elem = beforeDoc.querySelector(`.${part}`);
          if (!elem) doc.querySelector(`.${part}`).remove();
        }
      };
      static sortLatestDir()  {
        return postFolders.sort((a, b) => b - a);
      };
      static addDirsList()  {
        const dirs = this.sortLatestDir();
        for (const dir of dirs) {
          POST.elements['years'].insertAdjacentHTML('beforeend',`<option value="${dir}" class="years">${dir}</option>`);
        }
        POST.elements['years'].value = date.nowYear();
      };
      static async getPostData(fileName,dirName) {
        const post = new HandlePost(fileName);
        const doc = await post.document();
        const tit = post.loadTitle(doc);
        const dti = post.loadTime(doc);
        const rti = dti.replace('T','.').replace(/[^0-9\.]/g,'');
        const img = post.loadImg(doc);
        const tgs = post.loadTags(doc);
        const dsc = post.loadDescription(doc);
        return [fileName,tit,dirName,dti,rti,img,tgs,dsc]; //0:filename, 1:title, 2:dirctory name, 3:datetime, 4:datetime(num), 5:image 6:tags 7:description
      };
      static async dirLatestData(dirName) {
        const dHandle = postChest.find(({name}) => name === dirName);
        const data = [];
        for await (const file of dHandle.values()) {
          if (file.kind === 'file') {
            const array = await this.getPostData(file.name,dirName);
            data.push(array);
          }
        }
        return data.sort((a, b) => b[4] - a[4]);
      };
      static async allLatestData() {
        const flds = this.sortLatestDir();
        const allData = [];
        for (const fld of flds) {
          const data = await this.dirLatestData(fld);
          allData.push(...data);
        }
        console.log(allData)
        return allData;
      };
      static async addListInDir(dirName) {
        POSBO.classList.add('hide');
        POSLI.textContent = '';
        POSNW.elements['btn'].classList.remove('btn-close');
        const data = await this.dirLatestData(dirName);
        for (const d of data) {
          POSLI.insertAdjacentHTML('beforeend',`<fieldset data-name="${d[0]}"><input value="${d[1]}"><input type="datetime-local" value="${d[3]}"><u>${d[0]}</u><button type="button" class="btn-edit"></button></fieldset>`);
        }
      };
      static async insertLatestPostsNum(num,elem) {
        const d = await this.allLatestData();
        for (let i = 0; i < num; i++) {
          let mid = '';
          if (d[i][5]) mid = `<img src="${d[i][5]}" alt="${d[i][1]}" />`;
          else {
            if (d[i][7]) mid = `<p class="headline">${d[i][7]}</p>`;
          }
          elem.insertAdjacentHTML('beforeend',`<div><a href="./post/${d[i][2]}/${d[i][0]}"><h3>${d[i][1]}</h3>${mid}<p class="time"><time>${date.changeFormat(d[i][3])}</time>${d[i][6]}</p></a></div>\n`);
        }
      };
      static async insertLatestPostsAll(elem) {
        const data = await this.allLatestData();
        for (const d of data) {
          const tagHTML = d[7];
          let classes = '';
          if (!tagHTML) classes = 'tag-No-Tag';
          else {
            const sht = DOMP.parseFromString(tagHTML,'text/html');
            const spans = sht.querySelectorAll('span');
            for (const span of spans) classes += ` tag-${span.textContent.replace(/ /g,'-')}`;
          }
          let mid = '';
          if (d[5]) mid = `<img src="${d[5]}" alt="${d[1]}" />`;
          else {
            if (d[7]) mid = `<p class="headline">${d[7]}</p>`;
          }
          elem.insertAdjacentHTML('beforeend',`<div class="${classes.trim()} fld-${d[2]}"><a href="./post/${d[2]}/${d[0]}"><h3>${d[1]}</h3>${mid}<p class="time"><time>${date.changeFormat(d[3])}</time>${d[6]}</p></a></div>\n`);
        }
      };
    };
    class HandlePage extends HandleArticle {
      constructor(fileName,chest) {
        super(fileName,chest);
        this.chest = pageChest;
        this.class = 'page';
        this.path = '../';
        this.title = PAGE.querySelector(`[data-name="${this.fileName}"] input`);
        this.ta = PAGE.elements['ta'];
        this.desc = PAGE.elements['desc'];
      };
      fullURL() {
        return `${normal.url()}page/${this.fileName}`;
      };
      async loadElements() {
        const doc = await this.document();
        this.ta.value = this.loadContents(doc);
        this.desc.value = this.loadDescription(doc);
      };
      makeHTMLSpecial(doc) {
        this.insertHeadTitle(doc,this.title.value);
        this.insertDescription(doc,this.desc.value);
        this.insertOGPUrl(doc,this.fullURL());
        this.insertBodyTitle(doc,this.title.value);
        this.insertContents(doc,this.ta.value);
      };
      async saveNew() {
        this.checkNewFileName();
        const newFile = await pagHandle.getFileHandle(this.fileName,{create:true});
        this.chest.push(newFile);
        await this.save();
        for (const input of PAGNW.elements) input.value = '';
      };
      async transHTMLSpecial(doc) {
        this.insertOGPUrl(doc,this.fullURL());
      };
      static async allData() {
        const data = [];
        for (const file of pageChest.values()) {
          if (file.kind === 'file') {
            const page = new HandlePage(file.name);
            const doc = await page.document();
            const title = page.loadTitle(doc);
            data.push([file.name,title]); //0:filename 1:title
          }
        }
        return data;
      };
      static async addPageList() {
        PAGBO.classList.add('hide');
        PAGLI.textContent = '';
        PAGNW.elements['btn'].classList.remove('btn-close');
        const data = await this.allData();
        for (const d of data)
        PAGLI.insertAdjacentHTML('beforeend',`<fieldset data-name="${d[0]}"><input value="${d[1]}"><u>${d[0]}</u><button type="button" class="btn-edit"></button></fieldset>`);
      };
    };
    //tetx editor exe
    class AList extends TextEditor {
      addA() {
        LINKS.classList.toggle('hide');
        IMAGS.classList.add('hide');
        LINKS.querySelector('div').onclick = (e) => {
          if (e.target.tagName === 'P') {
            const dirName = LINKS.elements['flds'].value;
            this.insertText(`<a href="${this.path}post/${dirName}/${e.target.dataset.name}" target="_blank">${e.target.dataset.title}</a>`);
          }
        }
      };
      static async addList(dirName) {
        LINKS.querySelector('div').textContent ='';
        const data = await HandlePost.dirLatestData(dirName);
        for (const d of data) LINKS.querySelector('div').insertAdjacentHTML('beforeend',`<p data-name="${d[0]}" data-title="${d[1]}">${d[3]}<br />${d[1]}<br />${d[0]}</p>`);
        LINKS.elements['flds'].value = dirName;
      };
       static addFolders() {
        LINKS.elements['flds'].textContent ='';
        for (const handle of postChest.values()) {
          if (handle.kind === 'directory') LINKS.elements['flds'].insertAdjacentHTML('beforeend',`<option value="${handle.name}">${handle.name}</option>`);
        }
        LINKS.elements['flds'].value = date.nowYear();
      };
    };
    class ImgList extends TextEditor {
      addImgTag() {
        IMAGS.classList.toggle('hide');
        LINKS.classList.add('hide');
        IMAGS.querySelector('div').onclick = (e) => {
          if (e.target.tagName === 'IMG') {
            const dirName = IMAGS.elements['flds'].value;
            this.insertText(`<img src="${this.path}media/${dirName}/${e.target.title}" alt="" />\n`);
          }
        }
      };
      async addImgPath() {
        IMAGS.classList.toggle('hide');
        LINKS.classList.add('hide');
        ImgList.addFolders();
        await ImgList.addList(date.nowYear());
        IMAGS.querySelector('div').onclick = (e) => {
          if (e.target.tagName === 'IMG') {
            POST.elements['img'].value = `media/${IMAGS.elements['flds'].value}/${e.target.title}`;
          }
        }
      };
      static async addList(dirName) {
        IMAGS.querySelector('div').textContent ='';
        const dHandle = mediaChest.find(({name}) => name === dirName);
        for await (const file of dHandle.values()) {
          if (file.kind === 'file') {
            if (file.name.match(/(.jpg|.jpeg|.png|.gif|.apng|.svg|.jfif|.pjpeg|.pjp|.ico|.cur)/i)) {
              IMAGS.querySelector('div').innerHTML += `<img src="site/media/${dirName}/${file.name}" title="${file.name}" loading="lazy" />`;
            }
          }
        }
        IMAGS.elements['flds'].value = dirName;
      };
      static addFolders() {
        IMAGS.elements['flds'].textContent ='';
        for (const handle of mediaChest.values()) {
          if (handle.kind === 'directory') IMAGS.elements['flds'].insertAdjacentHTML('beforeend',`<option value="${handle.name}">${handle.name}</option>`);
        }
        IMAGS.elements['flds'].value = date.nowYear();
      };
    };
    class Custom extends TextEditor {
      addCustomTag(tag) {
        this.insertText(tag);
      };
      static replaceBtn() {
        const ctm = SETT.elements['custom-editor'].value;
        document.getElementById('post-panel').innerHTML = ctm;
        document.getElementById('page-panel').innerHTML = ctm;
      };
    };
  //// Event ////
    document.getElementById('home').onclick = async () => await index.preview();
    document.getElementById('map').onclick = async () => await allpost.preview();
    //click Save button
    SAVE.onclick = async () => {
      const section = H2SE.dataset.section;
      const fileName = SAVE.dataset.file;
      console.log(section,fileName)
      const files = [index,allpost];
      let saveName = fileName;
      if (section === 'post') saveName += ', index.html, allpost.html'
      dialog.confirmSave(saveName);
      if (section === 'post') {
        if (!POSNW.classList.contains('hide')) {
          const newName = `${POSNW.elements['name'].value}.html`
          await new HandlePost(newName).saveNew();
          const data = await HandlePost.dirLatestData(date.nowYear());
          await new HandlePost(data[1][0]).saveTransfer();
          await HandlePost.addListInDir(date.nowYear());
        } else {
          await new HandlePost(fileName).save();
        }
        saveName = fileName;
        for (const file of files) {
          await file.save();
          saveName += `, ${file.fileName}`;
        }
      }
      else if (section === 'page') {
        if (!PAGNW.classList.contains('hide')) {
          const newName = `${PAGNW.elements['name'].value}.html`
          await new HandlePage(newName).saveNew();
          await HandlePage.addPageList();
        } else {
          await new HandlePage(fileName).save();
        }
      }
      else if (section === 'style')  await style.save();
      else if (section === 'template') await template.save();
      else if (section === 'setting') await setting.save();
      dialog.successSave(saveName);
    };
    //click Preview button
    PREV.onclick = async () => {
      const fileName = SAVE.dataset.file;
      const section = H2SE.dataset.section;
      if (section === 'post') await new HandlePost(fileName).preview();
      else if (section === 'page') await new HandlePage(fileName).preview();
    };
  //Post
    POST.elements['years'].addEventListener('input', async () => {
      const dirName = POST.elements['years'].value;
      await HandlePost.addListInDir(dirName);
    });
    POST.elements['img-open'].onclick = () => new ImgList(POST).addImgPath();
    ( async () => {
    //Post, Page
      const elems = [[POSLI,POSBO,POSNW,'post',HandlePost,POST],[PAGLI,PAGBO,PAGNW,'page',HandlePage,PAGE]];
      for (const elem of elems) {
        //click edit/close button
        elem[0].onclick = async (e) => {
          if (e.target.tagName === 'BUTTON') {
            elem[1].classList.toggle('hide');
            e.target.classList.toggle('btn-close');
            elem[2].classList.toggle('hide');
            const fileName = e.target.parentNode.dataset.name;
            const fs = document.querySelectorAll(`#${elem[3]}-list fieldset:not([data-name="${fileName}"])`);
            for (const f of fs) f.classList.toggle('hide');
            if (!elem[1].classList.contains('hide')) await new elem[4](fileName).loadElements();
          }
        };
        //click new button
        elem[2].elements['btn'].onclick = (e) => {
          elem[5].elements['ta'].value = '';
          elem[1].classList.toggle('hide');
          e.target.classList.toggle('btn-close');
          const fs = elem[0].querySelectorAll('fieldset');
          for (const f of fs) f.classList.toggle('hide');
        };
        //input new name
        elem[2].elements['name'].addEventListener('input', () => {
          const filename = elem[2].elements['name'].value;
          ACTF.textContent = `${filename}.html`;
          SAVE.dataset.file = `${filename}.html`;
          elem[2].dataset.name = `${filename}.html`;
        });
        //click text editor panel
        document.getElementById(`${elem[3]}-panel`).onclick = (e) => {
          if (e.target.tagName === 'I') new TextEditor().addTag(e.target.textContent);
          else if (e.target.title === 'link') new AList(elem[5]).addA();
          else if (e.target.title === 'img') new ImgList(elem[5]).addImgTag();
          else if (e.target.tagName === 'U') new Custom(elem[5]).addCustomTag(e.target.title);
        };
        elem[1].classList.toggle('hide');
      }
      //A list, Img list
      const lists = [[LINKS,AList],[IMAGS,ImgList]];
      for (const list of lists) {
        list[0].elements['flds'].addEventListener('input', async () => {
          const dirName = list[0].elements['flds'].value;
          await list[1].addList(dirName);
        });
        list[0].elements['btn'].onclick = () => list[0].classList.add('hide');
        list[1].addList(date.nowYear());
        list[1].addFolders();
      }
      //load files
      for (const file of [template,style,setting]) await file.load();
      //check if parts exsits in template
      const tmpDoc = await template.document();
      for (const part of POSPA) {
        if (!tmpDoc.querySelector(`.${part}`)) POST.elements[part].parentNode.classList.add('disable');
      }
    })();
  //allsave
    //append number
    RENW.elements['post'].parentNode.insertAdjacentHTML('beforeend',`(${postChest.length - postFolders.length})`);
    RENW.elements['page'].parentNode.insertAdjacentHTML('beforeend',`(${pageChest.length})`);
    //click start saving
    RENW.elements['save'].onclick = async () => {
      const log = RENW.querySelector('.log');
      log.textContent = '';
      dialog.confirmSave('checked files');
      for (const file of [['index',index],['allpost',allpost],['search',search]]) {
        if (RENW.elements[file[0]].checked) {
          await file[1].save();
          log.insertAdjacentHTML('beforeend',`<p>Succeeded in saving ${file[1].fileName}</p>`);
        }
      }
      for (const art of [['post',postChest,HandlePost],['page',pageChest,HandlePage]]) {
        if (RENW.elements[art[0]].checked) {
          for (const file of art[1].values()) {
            if (file.kind === 'file') {
              await new art[2](file.name).saveTransfer();
              log.insertAdjacentHTML('beforeend',`<p>Succeeded in saving ${file.name}</p>`);
            }
          }
        }
      }
      log.insertAdjacentHTML('beforeend',`<p>Saving is complete.</p>`);
      dialog.completeSave();
    };
    document.getElementById('guide').classList.add('hide');
    POSNW.elements['date'].value = date.nowYmdTime();
    HandlePost.addDirsList();
    await HandlePost.addListInDir(date.nowYear());
    await HandlePage.addPageList();
    if (SETT.elements['custom-editor'].value) Custom.replaceBtn();
    for (const file of [style,favicon,mainjs]) {
      const txt = await file.txt();
      if (!txt) await file.writeURLToFile();
    }
  };
});

    //page lister
    // addPageList = async () => {
    //   PAGBO.classList.add('hide');
    //   PAGLI.textContent = '';
    //   PAGNW.elements['btn'].classList.remove('btn-close');
    //   for (const file of pageChest.values()) {
    //     if (file.kind === 'file') {
    //       const page = new HandlePage(file.name);
    //       const pdoc = await page.document();
    //       const title = page.loadTitle(pdoc);
    //       PAGLI.insertAdjacentHTML('beforeend',`<fieldset data-name="${file.name}"><input value="${title}"><u>${file.name}</u><button type="button" class="btn-edit"></button></fieldset>`);
    //     }
    //   }
    // };

    //post lister obj
    // const latestPosts = {
    //   sortLatestDir: () => {
    //     return postFolders.sort((a, b) => b - a);
    //   },
    //   addDirsList: () => {
    //     const flds = latestPosts.sortLatestDir();
    //     for (const fld of flds) {
    //       POST.elements['years'].insertAdjacentHTML('beforeend',`<option value="${fld}" class="years">${fld}</option>`);
    //     }
    //     POST.elements['years'].value = date.nowYear();
    //   },
    //   getPostData: async(fileName,dirName) => {
    //     const post = new HandlePost(fileName);
    //     const doc = await post.document();
    //     const tit = post.loadTitle(doc);
    //     const dti = post.loadTime(doc);
    //     const rti = dti.replace('T','.').replace(/[^0-9\.]/g,'');
    //     const img = post.loadImg(doc);
    //     const tgs = post.loadTags(doc);
    //     const dsc = post.loadDescription(doc);
    //     return [fileName,tit,dirName,dti,rti,img,tgs,dsc];//0:filename, 1:title, 2:dirctory name, 3:datetime, 4:datetime(num), 5:image 6:tags 7:description
    //   },
    //   makeOneDirData: async(dirName) => {
    //     const dHandle = postChest.find(({name}) => name === dirName);
    //     const data = [];
    //     for await (const file of dHandle.values()) {
    //       if (file.kind === 'file') {
    //         const array = await latestPosts.getPostData(file.name,dirName);
    //         data.push(array);
    //       }
    //     }
    //     return data.sort((a, b) => b[4] - a[4]);
    //   },
    //   makeAllData: async() => {
    //     const flds = latestPosts.sortLatestDir();
    //     const allData = [];
    //     for (const fld of flds) {
    //       const data = await latestPosts.makeOneDirData(fld);
    //       allData.push(...data);
    //     }
    //     console.log(allData)
    //     return allData;
    //   },
    //   addListOfDir: async(dirName) => {
    //     POSBO.classList.add('hide');
    //     POSLI.textContent = '';
    //     POSNW.elements['btn'].classList.remove('btn-close');
    //     const data = await latestPosts.makeOneDirData(dirName);
    //     for (const d of data) {
    //       POSLI.insertAdjacentHTML('beforeend',`<fieldset data-name="${d[0]}"><input value="${d[1]}"><input type="datetime-local" value="${d[3]}"><u>${d[0]}</u><button type="button" class="btn-edit"></button></fieldset>`);
    //     }
    //   },
    //   insertNumber: async(num,elem) => {
    //     const d = await latestPosts.makeAllData();
    //     for (let i = 0; i < num; i++) {
    //       let mid = '';
    //       if (d[i][5]) mid = `<img src="${d[i][5]}" alt="${d[i][1]}" />`;
    //       else {
    //         if (d[i][7]) mid = `<p class="headline">${d[i][7]}</p>`;
    //       }
    //       elem.insertAdjacentHTML('beforeend',`<div><a href="./post/${d[i][2]}/${d[i][0]}"><h3>${d[i][1]}</h3>${mid}<p class="time"><time>${date.changeFormat(d[i][3])}</time>${d[i][6]}</p></a></div>\n`);
    //     }
    //   },
    //   insertAll: async(elem) => {
    //     const data = await latestPosts.makeAllData();
    //     for (const d of data) {
    //       const tagHTML = d[7];
    //       let classes = '';
    //       if (!tagHTML) classes = 'tag-No-Tag';
    //       else {
    //         const sht = DOMP.parseFromString(tagHTML,'text/html');
    //         const spans = sht.querySelectorAll('span');
    //         for (const span of spans) classes += ` tag-${span.textContent.replace(/ /g,'-')}`;
    //       }
    //       let mid = '';
    //       if (d[5]) mid = `<img src="${d[5]}" alt="${d[1]}" />`;
    //       else {
    //         if (d[7]) mid = `<p class="headline">${d[7]}</p>`;
    //       }
    //       elem.insertAdjacentHTML('beforeend',`<div class="${classes.trim()} fld-${d[2]}"><a href="./post/${d[2]}/${d[0]}"><h3>${d[1]}</h3>${mid}<p class="time"><time>${date.changeFormat(d[3])}</time>${d[6]}</p></a></div>\n`);
    //     }
    //   }
    // };

// const index = data.findIndex(([name]) => name === this.fileName);

      // setPreviousLink(doc,value) {
      //   const elem = doc.querySelector('.link-prev');
      //   if (!elem) return;
      //   if (!value) {
      //     elem.setAttribute('class','isDisabled');
      //     return;
      //   }
      //   elem.setAttribute('href',`${this.path}post/${value}`);
      // };
      // setNextLink(doc,value) {
      //   const elem = doc.querySelector('.link-next');
      //   if (!elem) return;
      //   if (!value) {
      //     elem.setAttribute('class','isDisabled');
      //     return;
      //   }
      //   elem.setAttribute('href',`${this.path}post/${value}`);
      // };

        // elem.innerHTML += '<ul></ul>';
        // const ul = elem.querySelector('ul');
        // let num = 0;
        // for (let i = 0; i < h23.length; i++) {
        //   const htx = h23[i].textContent;
        //   const tgn = h23[i].tagName;
        //   if (tgn === 'H2') num++;
        //   ul.innerHTML += `<li class="${tgn} i${num}"><a href="#index${i}">${htx}</a></li>\n`;
        //   h23[i].setAttribute('id',`index${i}`);
        // }
        // if (ul.querySelector('.H3') === null) return;
        // const h2 = ul.querySelectorAll('.H2');
        // for (let i = 0; i < h2.length; i++) {
        //   const h3li = ul.querySelectorAll(`.H3.i${i+1}`);
        //   if (h3li.length == true) {
        //     h3li[0].insertAdjacentHTML('beforebegin',`<ul></ul>`);
        //     for (const li of h3li) {
        //       const myul = ul.querySelectorAll('ul');
        //       console.log(myul,myul[i],i)
        //       myul[myul.length - 1].appendChild(li);
        //     }
        //   }
        // }
        // const lis = elem.querySelectorAll('li');
        // for (const li of lis ) li.removeAttribute('class');


    // class Today {
  //   constructor() {
  //     this.date = new Date();
  //   };
  // const today = new Today();

    // year() {
    //   return this.date.getFullYear();
    // };
    // syear() {
    //   return String(this.year());
    // };
    // month() {
    //   return ('0'+(this.date.getMonth()+1)).slice(-2);
    // };
    // monthName() {
    //   const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    //   return monthNames[this.date.getMonth()];
    // };
    // day() {
    //   return ('0'+this.date.getDate()).slice(-2);
    // };
    // hours() {
    //   return ('0'+this.date.getHours()).slice(-2);
    // };
    // minutes() {
    //   return ('0'+this.date.getMinutes()).slice(-2);
    // };
    // ymd() {
    //   return `${this.year()}-${this.month()}-${this.day()}`;
    // };
    // dmy() {
    //   return `${this.day()} ${this.monthName()}, ${this.year()}`;
    // };
    // mdy() {
    //   return `${this.monthName()} ${this.day()}, ${this.year()}`;
    // };
    // ymdAndTime() {
    //   return `${this.ymd()}T${this.hours()}:${this.minutes()}`;
    // };
        // dateType() {
    //   const dt = SETT.elements['date-type'].value;
    //   if (dt === 'yyyy-mm-dd') return this.ymd();
    //   else if (dt === 'dd-mm-yyyy') return this.dmy();
    //   else if (dt === 'mm-dd-yyyy') return this.mdy();
    // };

      // insertRelatedPost: async(doc) => {
        // const elem = doc.querySelector('.related-post');
        // const text = POST.elements['related'].value;
        // if (text == false) {
        //   elem.remove();
        //   return;
        // }
        // const names = text.replace(/,\s*$/,'').split(',');
        // for (const name of names) {
        //   console.log(name)
        //   const fileName = name.replace(/　/g,' ').trim();
        //   const parentName = await new HandlePost(fileName).parentName();
        //   const data = await latestPosts.getPostData(fileName,parentName);
        //   elem.insertAdjacentHTML('beforeend',`<div><a href="../../post/${data[4]}/${data[1]}">${data[6]}<h3>${data[3]}</h3><p><time>${data[2]}</time>${data[7]}</p></a></div>\n`);
        // }
      // },

      // addInputs(doc) {
      //     const items = [['title',`${this.title.value} - `],['.title',this.title.value],['.contents',this.ta.value]];
      //     for (let item of items) {
      //       doc.querySelector(item[0]).insertAdjacentHTML('afterbegin',item[1]);
      //     }
      //     const time = doc.querySelectorAll('time');
      //     const pTime = this.time.value;
      //     time[0].innerHTML = date.changeFormat(pTime);
      //     time[0].setAttribute('datetime',pTime);
      //     if (date.ymd() === pTime.slice(0,10)) {
      //       time[1].remove();
      //       return;
      //     }
      //     const cTime = date.changeFormat(date.ymdAndTime())
      //     time[1].insertAdjacentHTML('beforeend',cTime);
      //     time[1].setAttribute('datetime',date.ymdAndTime());
      // };

        // const items = [['.auther',this.insertAuther],['.top-image',this.insertImg],['.tags',this.insertTags],['.table-of-contents',this.tableOfContents],['.comment',this.comment],['.freespace',this.freespace]];
        // for (let item of items) {
        //   if (doc.querySelector(item[0]) !== null) item[1](doc);
        // }

// insertRelatedPost: async(doc) => {
//   const elem = doc.querySelector('.related-post');
//   const text = POST.elements['related'].value;
//   if (text == false) {
//     elem.remove();
//     return;
//   }
//   const names = text.replace(/,\s*$/,'').split(',');
//   for (const name of names) {
//     console.log(name)
//     const fileName = name.replace(/　/g,' ').trim();
//     const parentName = await new HandlePost(fileName).parentName();
//     const data = await latestPosts.getPostData(fileName,parentName);
//     elem.insertAdjacentHTML('beforeend',`<div><a href="../../post/${data[4]}/${data[1]}">${data[6]}<h3>${data[3]}</h3><p><time>${data[2]}</time>${data[7]}</p></a></div>\n`);
//   }
// },

    // const sitHandle = await blgHandle.getFileHandle('sitemap.xml',{create:true});

        // class HandleSitemap extends HandleText {
    //   constructor(fileName,chest) {
    //     super(fileName,chest);
    //     this.fileName = 'sitemap.xml';
    //     this.chest = singleChest;
    //   };
    //   async save() {
    //     const format = `<?xml version="1.0" encoding="UTF-8"?><urlset>\n</urlset>`;
    //     const xmlDoc = DOMP.parseFromString(format,'text/xml');
    //     const url = normal.url();
    //     const urlset = xmlDoc.getElementsByTagName('urlset')[0];
    //     const files = [index,allpost];
    //     for (const file of files) {
    //       const doc = await file.document();
    //       const date = doc.head.querySelector('[name="date"]')?.getAttribute('content')?? date.ymd();
    //       urlset.innerHTML += `<url><loc>${url}${file.fileName}</loc><lastmod>${date}</lastmod></url>\n`;
    //     }
    //     for (const file of pageChest.values()) {
    //       if (file.kind === 'file') {
    //         const doc = await new HandlePage(file.name).document();
    //         const date = doc.head.querySelector('[name="date"]')?.getAttribute('content')?? date.ymd();
    //         urlset.innerHTML += `<url><loc>${url}page/${file.name}</loc><lastmod>${date}</lastmod></url>\n`;
    //       }
    //     }
    //     for (const file of postChest.values()) {
    //       if (file.kind === 'file') {
    //         const post = await new HandlePost(file.name);
    //         const doc = await post.document();
    //         const date = doc.head.querySelector('[name="date"]')?.getAttribute('content')?? date.ymd();
    //         const fld = await post.parentName();
    //         urlset.innerHTML += `<url><loc>${url}post/${fld}/${file.name}</loc><lastmod>${date}</lastmod></url>\n`;
    //       }
    //     }
    //     urlset.setAttribute('xmlns','http://www.sitemaps.org/schemas/sitemap/0.9');
    //     const str = new XMLSerializer().serializeToString(xmlDoc);
    //     await this.write(str);
    //   };
    // };
    
    //spellcheck
    // if (SETT.elements['spellcheck'].value === 'off') {
    //   const frms = ['input','textarea'];
    //   for (const frm of frms) {
    //     const inps = document.querySelectorAll(frm);
    //     for (const inp of inps) inp.setAttribute('spellcheck','false');
    //   }
    // }
    //save files for first step

      // insertTime(doc) {
      //   const inp = POST.querySelectorAll(`[data-name="${this.fileName}"] input`);
      //   console.log(inp)
      //   const time = doc.querySelectorAll('time');
      //   time[0].insertAdjacentHTML('afterbegin',inp[1].value);
      //   time[0].setAttribute('datetime',inp[1].title);
      //   if (date.ymd() === inp[1].title.slice(0,10)) {
      //     time[1].remove();
      //     return;
      //   }
      //   time[1].insertAdjacentHTML('beforeend',date.dateType());
      //   time[1].setAttribute('datetime',date.ymdAndTime());
      // };

        // this.insertImg(doc);
        // this.insertAuther(doc);
        // this.insertTags(doc);
        // if (POST.elements['table-of-contents'].checked === true) this.ifTableOfContents(doc);
        // else doc.querySelector('.table-of-contents')?.remove() ?? '';
        // if (POST.elements['comment'].checked === false) doc.querySelector('.comment')?.remove() ?? '';
        // if (POST.elements['freespace'].checked === false) doc.querySelector('.freespace')?.remove() ?? '';

    // class PostLister {
    //   constructor() {
    //     this.postFolders = postFolders;
    //   };
    //   sortLatestDir() {
    //     return this.postFolders.sort((a, b) => b - a);
    //   };
    //   insertFolders() {
    //     const flds = this.sortLatestDir();
    //     for (const fld of flds) {
    //       POST.elements['years'].insertAdjacentHTML('beforeend',`<option value="${fld}" class="years">${fld}</option>`);
    //     }
    //     POST.elements['years'].value = date.syear();
    //   };
    //   async getPostData(fileName,dirName) {
    //     const doc = await new HandlePost(fileName).document();
    //     const tit = doc.querySelector('.title')?.textContent?? '';
    //     const dti = doc.querySelector('time')?.getAttribute('datetime')?? '';
    //     const rti = dti.replace('T','.').replace(/[^0-9\.]/g,'');
    //     const tim = doc.querySelector('time')?.textContent?? '';
    //     const tif = doc.querySelector('.top-image')?.innerHTML?? '';
    //     const tgs = doc.querySelector('.tags')?.innerHTML?? '';
    //     return [rti,fileName,tim,tit,dirName,dti,tif,tgs];
    //   };
    //   async makeOneDirData(dirName) {
    //     const fldHandle = postChest.find(({name}) => name === dirName);
    //     let data = [];
    //     for await (const file of fldHandle.values()) {
    //       if (file.kind === 'file') {
    //         const arr = await this.getPostData(file.name,dirName);
    //         data.push(arr);
    //       }
    //     }
    //     return data.sort((a, b) => b[0] - a[0]);
    //   };
    //   async makeAllData() {
    //     const flds = this.sortLatestDir();
    //     let makeAllData = [];
    //     for (const fld of flds) {
    //       const data = await this.makeOneDirData(fld)
    //       makeAllData.push(...data);
    //     }
    //     console.log(makeAllData)
    //     return makeAllData;
    //   };
    //   async addListOfDir(dirName) {
    //     const data = await this.makeOneDirData(dirName);
    //     for (const d of data) {
    //       POSLI.insertAdjacentHTML('beforeend',`<fieldset data-name="${d[1]}"><input value="${d[3]}"><input value="${d[2]}" title="${d[5]}"><u>${d[1]}</u><button type="button" class="btn-edit"></button></fieldset>`);
    //     }
    //   };
    //   async insertRelatedPost(doc) {
    //     const elem = doc.querySelector('.related-post');
    //     const text = POST.elements['related'].value;
    //     if (text == false) {
    //       elem.remove();
    //       return;
    //     }
    //     const names = text.replace(/,\s*$/,'').split(',');
    //     for (const name of names) {
    //       console.log(name)
    //       const fileName = name.replace(/　/g,' ').trim();
    //       const parentName = await new HandlePost(fileName).parentName();
    //       const data = await this.getPostData(fileName,parentName);
    //       elem.insertAdjacentHTML('beforeend',`<div><a href="../../post/${data[4]}/${data[1]}">${data[6]}<h3>${data[3]}</h3><p><time>${data[2]}</time>${data[7]}</p></a></div>\n`);
    //     }
    //   };
    //   async insertNumber(num,elem) {
    //     const data = await this.makeAllData();
    //     for (let i = 0; i < num; i++) {
    //       elem.insertAdjacentHTML('beforeend',`<div><a href="./post/${data[i][4]}/${data[i][1]}">${data[i][6]}<h3>${data[i][3]}</h3><p><time>${data[i][2]}</time>${data[i][7]}</p></a></div>\n`);
    //     }
    //   };
    //   async insertAll(elem) {
    //     const data = await this.allData();
    //     for (let i = 0; i < data.length; i++) {
    //       const tagHTML = data[i][7];
    //       let classes = '';
    //       if (tagHTML === '') classes = 'tag-No-Tag';
    //       else {
    //         const sht = DOMP.parseFromString(tagHTML,'text/html');
    //         const spans = sht.querySelectorAll('span');
    //         for (const span of spans) classes += ` tag-${span.textContent.replace(/ /g,'-')}`;
    //       }
    //       elem.insertAdjacentHTML('beforeend',`<div class="${classes.trim()} fld-${data[i][4]}"><a href="./post/${data[i][4]}/${data[i][1]}">${data[i][6]}<h3>${data[i][3]}</h3><p><time>${data[i][2]}</time>${data[i][7]}</p></a></div>\n`);
    //     }
    //   };
    // };
    // const latestPosts = new PostLister();

    // class AllpostJS extends HandleFile {
    //   constructor(fileName,chest) {
    //     super(fileName,chest);
    //     this.fileName = 'allpost.js';
    //     this.chest = singleChest;
    //     this.url = 'default-allpost.js'
    //   };
    // };
//         const js = `<script>
// document.addEventListener('DOMContentLoaded', () => {
//   const LATPO = document.querySelector('.latest-posts');
//   const POSTS = LATPO.querySelectorAll('div');
//   const POSBT = document.querySelector('.allpost-btns');
//   const BTNPS = POSBT.querySelectorAll('p');
//   viewSwitch = (e) => {
//     e.target.classList.toggle('on');
//     for (const post of POSTS) post.classList.add('hide');
//     const flds = BTNPS[0].querySelectorAll('.on');
//     const tags = BTNPS[1].querySelectorAll('.on');
//     for (const fld of flds) {
//       const dirName = fld.dataset.btn;
//       for (const tag of tags) {
//         const tagName = tag.dataset.btn;
//         const acts = LATPO.querySelectorAll(\`.\${tagName}.\${dirName}\`);
//         for (const act of acts) act.classList.remove('hide');
//       }
//     }
//   };
//   POSBT.onclick = (e) => {
//     if (e.target.tagName === 'U') viewSwitch(e);
//     else if (e.target.tagName === 'SPAN') viewSwitch(e);
//     else if (e.target.className === 'allclear-btn') {
//       for (const post of POSTS) post.classList.add('hide');
//       const ons = BTNPS[1].querySelectorAll('.on');
//       for (const on of ons) on.classList.remove('on');
//     }
//     else if (e.target.className === 'allview-btn') {
//       const flds = BTNPS[0].querySelectorAll('.on');
//       const spans = BTNPS[1].querySelectorAll('span');
//       for (const fld of flds) {
//         const dirName = fld.dataset.btn;
//         for (const span of spans) {
//           span.classList.add('on');
//           const tagName = span.dataset.btn;
//           const acts = LATPO.querySelectorAll(\`.\${tagName}.\${dirName}\`);
//           for (const act of acts) act.classList.remove('hide');
//         }
//       }
//     }
//   };
// });
// </script>\n`;
//         doc.head.insertAdjacentHTML('beforeend',js);

        //doc.querySelector('.title').textContent = 'HandlePost Map';
        // mabp[1].insertAdjacentHTML('beforeend','<span data-btn="tag-No-Tag" class="on">No Tag</span>');
        // mabp[2].insertAdjacentHTML('beforeend','<b class="allclear-btn">All Clear</b><b class="allview-btn">All View</b>');
        //cnt.insertAdjacentHTML('afterbegin','<div class="latest-posts"></div>');
// LINKS.elements['btn'].onclick = () => LINKS.classList.add('hide');
// IMAGS.elements['btn'].onclick = () => IMAGS.classList.add('hide');

    //AList.addFolders();
    // AList.addList(date.syear());
    //ImgList.addFolders();
    // ImgList.addList(date.syear());
  //   IMAGS.elements['flds'].addEventListener('input', async () => {
  //     const dirName = IMAGS.elements['flds'].value;
  //     await ImgList.addList(dirName);
  //   });
    //Edit-Close button
    // POSLI.onclick = async (e) => {
    //   if (e.target.tagName === 'BUTTON') {
    //     POSBO.classList.toggle('hide');
    //     e.target.classList.toggle('btn-close');
    //     POSNW.classList.toggle('hide');
    //     POST.elements['years'].classList.toggle('hide');
    //     const fileName = e.target.parentNode.dataset.name;
    //     const fs = document.querySelectorAll(`#post-list fieldset:not([data-name="${fileName}"])`);
    //     for (const f of fs) f.classList.toggle('hide');
    //     if (POSBO.classList.contains('hide') === false) await new HandlePost(fileName).loadElements();
    //   }
    // };
    // POSNW.elements['btn'].onclick = (e) => {
    //   POST.elements['ta'].value = '';
    //   POSBO.classList.toggle('hide');
    //   POST.elements['years'].classList.toggle('hide');
    //   e.target.classList.toggle('btn-close');
    //   const fs = POSLI.querySelectorAll('fieldset');
    //   for (const f of fs) f.classList.toggle('hide');
    // };

    //new filename input
    // PAGNW.elements['name'].addEventListener('input', () => {
    //   const filename = PAGNW.elements['name'].value;
    //   ACTF.textContent = `${filename}.html`;
    //   SAVE.dataset.file = `${filename}.html`;
    //   PAGNW.dataset.name = `${filename}.html`;
    // });

    // document.getElementById('post-panel').onclick = (e) => {
    //   if (e.target.tagName === 'I') postEditor.addTag(e.target.textContent);
    //   else if (e.target.title === 'link') new AList(POST).addA();
    //   else if (e.target.title === 'img') new ImgList(POST).addImgTag();
    //   else if (e.target.tagName === 'U') new Custom(POST).addCustomTag(e.target.title);
    // };
    // document.getElementById('page-panel').onclick = (e) => {
    //   if (e.target.tagName === 'I') pageEditor.addTag(e.target.textContent);
    //   else if (e.target.title === 'link') new AList(PAGE).addA();
    //   else if (e.target.title === 'img') new ImgList(PAGE).addImgTag();
    //   else if (e.target.tagName === 'U') new Custom(PAGE).addCustomTag(e.target.title);
    // };
    // static lastmodToYmd(doc) {
    //   const dat = new Date(doc.lastModified);
    //   const iso = dat.toISOString();
    //   return iso.slice(0,10);
    // };

// fetch('default-template.html').then((response) => {
//   return response.text();
// }).then((html) => {
//   TEMP.elements['ta'].value = html;
// }).catch((err) => {
//   console.warn('Something went wrong.', err);
// });

        // const aut = doc.getElementById('auther')?.textContent?? '';
        // SETT.elements['auther'].value = aut;
        // const tit = doc.getElementById('site-title')?.textContent?? '';
        // SETT.elements['site-title'].value = tit;
        // const sub = doc.getElementById('site-subtitle')?.textContent?? '';
        // SETT.elements['site-subtitle'].value = sub;
        // const url = doc.getElementById('url')?.textContent?? '';
        // SETT.elements['url'].value = url;
        // const dat = doc.getElementById('date-type')?.textContent?? '';
        // SETT.elements['date-type'].value = dat;

//         const spl = SETT.elements['spellcheck'].value;
//         const aut = SETT.elements['auther'].value;
//         const dat = SETT.elements['date-type'].value;
//         const tgs = SETT.elements['tags'].value;
//         const idc = SETT.elements['index-desc'].value;
//         const num = SETT.elements['latest-posts'].value;
//         const ctm = SETT.elements['custom-editor'].value;
//         const str = `<p id="site-title">${CNFST.value}</p>
// <p id="site-subtitle">${CNFST.value}</p>
// <p id="url">${CNFUR.value}</p>
// <p id="auther">${aut}</p>
// <p id="date-type">${dat}</p>
// <p id="index-desc">${idc}</p>
// <p id="latest-posts">${num}</p>
// <p id="tags">${tgs}</p>
// <p id="spellcheck">${spl}</p>
// <p id="custom-editor">${ctm}</p>`;
        // const atg = tgs.replace(/,\s*$/,'').split(',');
        // let list = '';
        // for (const i of atg) list += `  <span>${i.replace(/　/g,' ').trim()}</span>\n`;

//e.preventDefault();
    // dateType() {
    //   const dt = SETT.elements['date-type'].value;
    //   if (dt === 'ymd') return this.ymd();
    //   if (dt === 'dmy') return this.dmy();
    //   if (dt === 'mdy') return this.mdy();
    // };

    // document.querySelectorAll('.panel-imgs')[0].onclick = () => {
    //   LIIM.classList.toggle('hide');
    //   addList(date.syear());
    // };
    // document.querySelectorAll('.panel-imgs')[1].onclick = () => {
    //   LIIM.classList.toggle('hide');
    //   addList(date.syear());
    // };

    // addList = async (dirName) => {
    //   LIMBO.textContent ='';
    //   const folder = mediaChest.find(({name}) => name === dirName);
    //   for await (const file of folder.values()) {
    //     if (file.kind === 'file') {
    //       if (file.name.match(/(.jpg|.jpeg|.png|.gif|.apng|.svg|.jfif|.pjpeg|.pjp|.ico|.cur)/i)) {
    //         LIMBO.innerHTML += `<img src="site/media/${dirName}/${file.name}" title="${file.name}" loading="lazy" />`;
    //       }
    //     }
    //   }
    //   LIMFO.value = dirName;
    // };
    // addFolders = () => {
    //   for (const handle of mediaChest.values()) {
    //     if (handle.kind === 'directory') {
    //       LIMFO.insertAdjacentHTML('beforeend',`<option value="${handle.name}">${handle.name}</option>`);
    //     }
    //   }
    //   //LIMFO.value = date.syear();
    // };
  // obsImages = () => {
  //   if (LIMBO.classList.contains('hide') === false) {
  //     const pth = POST.elements['ta'].offsetHeight;
  //     const imh = LIIM.offsetHeight;
  //     POST.elements['ta'].style.height = pth - imh + 'px';
  //   } else {
  //     const ajt = adjustTextareaHeight();
  //     POST.elements['ta'].style.height = ajt;
  //   }
  // };
  //const ActiveImages = new MutationObserver(() => obsImages());
  //ActiveImages.observe(IMAG, obsConfig2);

//text editor
  //original code from https://www.annytab.com/create-html-editor-with-pure-javascript/
  // class TextEditor {
  //   constructor(panel,textarea) {
  //     this.panel = panel;
  //     this.ta = textarea;
  //   };
  //   addTag (btnTxt) {
  //     // Insert the tag
  //     if (btnTxt === "b") {
  //         this.surroundSelectedText('<b>', '</b>');
  //     }
  //     else if (btnTxt === "strong") {
  //       this.surroundSelectedText('<strong>', '</strong>');
  //     }
  //     else if (btnTxt === "i") {
  //       this.surroundSelectedText('<i>', '</i>');
  //     }
  //     else if (btnTxt === "mark") {
  //       this.surroundSelectedText('<mark>', '</mark>');
  //     }
  //     else if (btnTxt === "h2") {
  //       this.surroundSelectedText('<h2>', '</h2>\n');
  //     }
  //     else if (btnTxt === "h3") {
  //       this.surroundSelectedText('<h3>', '</h3>\n');
  //     }
  //     else if (btnTxt === "h4") {
  //       this.surroundSelectedText('<h4>', '</h4>\n');
  //     }
  //     else if (btnTxt === "p") {
  //       this.surroundSelectedText('<p>', '</p>\n');
  //     }
  //     else if (btnTxt === "code") {
  //       this.surroundSelectedText('<code>', '</code>');
  //     }
  //     else if (btnTxt === "pre code") {
  //       this.surroundSelectedText('<pre><code>\n', '</code></pre>\n');
  //     }
  //     else if (btnTxt === "url") {
  //       this.surroundSelectedText('<a href="" target="_blank">', '</a>');
  //     }
  //     else if (btnTxt === "blockquote") {
  //       this.surroundSelectedText('<blockquote>','</blockquote>\n');
  //     }
  //     else if (btnTxt === "ul") {
  //       this.insertText('<ul>\n<li></li>\n<li></li>\n<li></li>\n</ul>\n');
  //     }
  //     else if (btnTxt === "table") {
  //       this.insertText('<table>\n<tr><th></th><th></th></tr>\n<tr><td></td><td></td></tr>\n</table>\n');
  //     }
  //     else if (btnTxt === "links") {
  //       const section = document.querySelector('h2').dataset.section;
  //       document.getElementById('linkimg-box').onclick = (e) => {
  //           if (e.target.tagName === 'IMG') {
  //               const dirName = document.getElementById('linkimg-folder').value;
  //               if (section === 'post') {
  //                 this.insertText(`<img src="../../media/${dirName}/${e.target.title}" alt="" />\n`);
  //                   return;
  //               }
  //               if (section === 'page') {
  //                 this.insertText(`<img src="../media/${dirName}/${e.target.title}" alt="" />\n`);
  //                   return;
  //               }
  //           }
  //       }
  //     }
  //     else if (btnTxt === "images") {
  //       const section = document.querySelector('h2').dataset.section;
  //       document.getElementById('linkimg-box').onclick = (e) => {
  //           if (e.target.tagName === 'IMG') {
  //               const dirName = document.getElementById('linkimg-folder').value;
  //               if (section === 'post') {
  //                 this.insertText(`<img src="../../media/${dirName}/${e.target.title}" alt="" />\n`);
  //                   return;
  //               }
  //               if (section === 'page') {
  //                 this.insertText(`<img src="../media/${dirName}/${e.target.title}" alt="" />\n`);
  //                   return;
  //               }
  //           }
  //       }
  //     }
  //   };
  //   // addEvents(ec, container)  {
  //   //   // Get buttons
  //   //   const buttons = container.querySelectorAll('#page-panel b');
  //   //   // Loop buttons
  //   //   for (let i = 0; i < buttons.length; i++) {
  //   //     // Add a click event
  //   //     window.onload = buttons[i].addEventListener('click', function (event) {
  //   //         // Prevent default click behavior
  //   //         event.preventDefault();
  //   //         // Add a tag
  //   //         ec.addTag(this);
  //   //     }, false);
  //   //   }
  //   // };
  //   // Get a selection
  //   getSelection() {
  //     const start = this.ta.selectionStart;
  //     const end = this.ta.selectionEnd;
  //     return {
  //       start: start,
  //       end: end,
  //       length: end - start,
  //       text: this.ta.value.slice(start, end)
  //     };
  //   };
  //   // Surround selected text
  //   surroundSelectedText(before,after) {
  //     // Get selection
  //     const selection = getSelection();
  //     // Replace text
  //     this.ta.value = this.ta.value.slice(0, selection.start) + before + selection.text + after + this.ta.value.slice(selection.end);
  //     // Set cursor
  //     this.ta.selectionEnd = selection.end + before.length + after.length;
  //     this.ta.blur();
  //     this.ta.focus();
  //   };
  //   // Insert text at selection
  //   insertText(text) {
  //     // Get selection
  //     const selection = getSelection();
  //     // Insert text
  //     this.ta.value = this.ta.value.slice(0, selection.start) + text + this.ta.value.slice(selection.end);
  //     // Set cursor
  //     this.ta.selectionEnd = selection.end + text.length;
  //     this.ta.blur();
  //     this.ta.focus();
  //   };
  // };
  
  // //const editor = new TextEditor(pagpanel,pagtxta);
  // document.getElementById('page-panel').onclick = (e) => {
  //   if (e.target.tagName === 'B') {
  //     //e.preventDefault();
  //     const pagpanel = document.getElementById('page-panel');
  //     const pagtxta = PAGE.elements['ta'];
  //     const txt = e.target.textContent;
  //     console.log(txt)
  //     new TextEditor(pagpanel,pagtxta).addTag(txt);
  //   }
  // };
        // const ncs = doc.head.querySelectorAll(`:not(.${className})`);
        // for (const i of ncs) {
        //   if (i.hasAttribute('class') === true)  i.remove();
        // }
        // const cls = doc.head.querySelectorAll(`.${className}`);
        // for (const i of cls) i.removeAttribute('class');

    // insertNumPost = async () => {
    //   const d = await template.document();
    //   const c = d.querySelector('.contents');
    //   const data = await sortNewerAllPost(c);
    //   let num = 5; //default
    //   if (NUMOP.value > 0) {
    //     num = NUMOP.value;
    //   }
    //   // for (let i = 0; i < num; i++) {
    //   //   doc.getElementById('contents').insertAdjacentHTML('beforeend',`<h2><a href="./post/${data[i][4]}/${data[i][1]}">${data[i][3]}</a></h2>\n<time datetime="${data[i][5]}">${data[i][2]}</time>\n`);
    //   // }
    //   new ReplaceTemplate(d,'index').editTag();
    //   await new HandleFile(singleChest,'index.html').writeHTML(d);
    // };
    // addFolders = () => {
    //   const years = sortNewerYear();
    //   for (const year of years) {
    //     POST.elements['years'].insertAdjacentHTML('beforeend',`<option value="${year}" class="years">${year}</option>`);
    //   }
    //   POST.elements['years'].value = date.syear();
    // };
    // insertYearPostList = async (yearName,elem) => {
    //   const y = postChest.find(({name}) => name === yearName);
    //   let data = [];
    //   for await (const file of y.values()) {
    //     if (file.kind === 'file') {
    //       const o = await new HandlePost(file.name).document();
    //       const d = o.querySelector('time')?.getAttribute('datetime')?? '';
    //       const t = o.querySelector('time')?.textContent?? '';
    //       const h = o.querySelector('h1')?.textContent?? '';
    //       const e = d.replace(/[^0-9]/g, '');
    //       data.push([ e, file.name, t, h, yearName, d]);
    //     }
    //     data.sort((a, b) => b[0] - a[0]);
    //   }
    //   if (POSBO.classList.contains('hide') === true) {
    //     for (const d of data) {
    //       elem.insertAdjacentHTML('beforeend',`<fieldset data-name="${d[1]}"><input value="${d[3]}"><input value="${d[2]}" title="${d[5]}"><u>${d[1]}</u><button type="button" class="btn-edit"></button></fieldset>`);
    //     }
    //     return;
    //   } 
    //   for (let i = 0; i < data.length; i++) {
    //     elem.insertAdjacentHTML('beforeend',`<h2><a href="./post/${data[i][4]}/${data[i][1]}">${data[i][3]}</a></h2>\n<time datetime="${data[i][5]}">${data[i][2]}</time>\n`);
    //   }
    // };
    // sortNewerYear = () => {
    //   let years = [];
    //   for (const year of postChest.values()) {
    //     if (year.kind === 'directory') years.push(year.name);
    //   }
    //   years.sort((a, b) => b - a);
    //   return years;
    // };
    // sortNewerAllPost = async (elm) => {
    //   const years = sortNewerYear();
    //   for await (const year of years) await insertYearPostList(year,elm);
    // };
  //Post
    // preSaveNewPost = async () => {
    //   const f = postChest.find(({name}) => name === date.syear());
    //   const n = await f.getFileHandle(`${t}.html`,{create:true});
    //   postChest.push(n);
    // };
    // saveallpost = async () => {
    //   const d = await template.document();
    //   const c = d.getElementById('contents');
    //   await sortNewerAllPost(c);
    //   new ReplaceTemplate(d,'allpost').insertForallpost();
    //   await allpost.writeHTML(d);
    // };
    // addTableOfContents = (doc) => {
    //   const cnt = doc.querySelector('.contents');
    //   const h23 = cnt.querySelectorAll('h2,h3');
    //   for (let i = 0; i < h23.length; i++) {
    //     const c = h23[i].textContent;
    //     const g = h23[i].tagName;
    //     doc.querySelector('.table-of-contents').innerHTML += `<p class="table-${g}"><a href="#index${i}">${c}</a></p>\n`;
    //     h23[i].setAttribute('id',`index${i}`);
    //   }
    // };
        // const css = await style.txt();
        // doc.querySelector('head').insertAdjacentHTML('afterbegin',`<style>${css}</style>`);
        // const b = doc.body.innerHTML;
        // const h = doc.querySelector('head').innerHTML;
        // const relativePath = await posHandle.resolve(this.handle());
        // const pre = window.open(`${LCURL}/site/post/${relativePath[0]}/${this.fileName}`);
        // pre.onload = () => {
        //   pre.document.querySelector('head').innerHTML = h;
        //   pre.document.body.innerHTML = b;
        // };

//const index = [].indexOf.call(e.target.parentNode.children, e.target);

        // while (i.firstChild) {
        //   i.parentNode.insertBefore(i.firstChild, i);
        // }
        // i.remove();

    //static editCloseBtn(e,name) {
      // const s = e.target.closest('form').id;
      // const b = document.getElementById(`${s}-box`);
      // b.classList.toggle('hide');
      // const f = document.querySelectorAll(`#${s}-list fieldset`);
      // for (const i of f) {
      //   i.classList.toggle('hide');
      // }
      // const index = [].indexOf.call(f, e.target.parentNode);
      // f[index].classList.toggle('hide');
      // ACTF.textContent = '';
      // if (b.className === 'hide') {
      //   SAVE.removeAttribute('data-file');
      //   b.dataset.file = '';
      // } else {
      //   SAVE.setAttribute('class',name);
      //   b.dataset.file = name;
      //   ACTF.insertAdjacentHTML('afterbegin',name);
      // }
      // SwitchView.hasAttr(SAVE,'class') 
      // e.target.classList.toggle('btn-close');
    //};
    //static leftMenu(e) {
    //   const index = [].indexOf.call(e.target.parentNode.children, e.target);
    //   for (let i = 0; i < SCTNS.length; i++) {
    //     SCTNS[i].classList.remove('show');
    //     NAVP[i].removeAttribute('class');
    //   }
    //   SCTNS[index].classList.add('show');
    //   e.target.setAttribute('class','on');
    //   ACTF.textContent = '';
    //   SAVE.removeAttribute('data-file');
    //   if (index < 5) {
    //     const i = SCTNS[index].querySelector('form').getAttribute('id');
    //     toggle.removeSetAttr(SAVE,'name',i);
    //     if (i === 'post' || i === 'template') {
    //       if(document.getElementById(`${i}-box`).className !== 'hide'){
    //         const n = document.getElementById(`${i}-box`).dataset.file;
    //         SAVE.setAttribute('class',n);
    //         ACTF.insertAdjacentHTML('afterbegin',n);
    //       }
    //     }
    //     if (i === 'setting') {
    //       SAVE.setAttribute('class',i+'.html');
    //       ACTF.insertAdjacentHTML('afterbegin',i+'.html');
    //     }
    //   }
    //   SwitchView.hasAttr(SAVE,'class');
    // };

//const index = [].indexOf.call(e.target.parentNode.children, e.target);

  // attrRemSet = (elm,attr,name) => {
  //   elm.removeAttribute(attr);
  //   elm.setAttribute(attr,name);
  // };

  // class DateTime {
  //   constructor() {
  //     this.D = new Date();
  //   }
  //   year() {
  //     return this.D.getFullYear();
  //   };
  //   month() {
  //     return this.o(this.D.getMonth() + 1);
  //   };
  //   date() {
  //       return this.o(this.D.getDate());
  //   };
  //   o(s) {
  //     return ('0' + s).slice(-2);
  //   }
  //   ymd() {
  //     return this.year() + this._month() + this.date();
  //   };
  // }
