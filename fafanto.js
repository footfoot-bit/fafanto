document.addEventListener('DOMContentLoaded', async () => {

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
  const LOAD = document.getElementById('loading');
  const DOMP = new DOMParser();
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
  const POSNW = POST.elements['new'];
  const POSTG = POST.elements['tagbtns'];
  const POSLI = POST.querySelector('.artlist');
  const POSBE = POST.querySelector('.bench');
  const PAGNW = PAGE.elements['new'];
  const PAGLI = PAGE.querySelector('.artlist');
  const PAGBE = PAGE.querySelector('.bench');
  const CNFST = SETT.elements['site-title'];
  const LINKS = document.getElementById('links');
  const IMAGS = document.getElementById('images');

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
      const dt = SETT.elements['date-type'].value;
      if (dt === 'yyyy-mm-dd') return `${year}-${month}-${day}`;
      else if (dt === 'dd-mm-yyyy') return `${day} ${monthName}, ${year}`;
      else if (dt === 'mm-dd-yyyy') return `${monthName} ${day}, ${year}`;
    }
  };
  POSNW.elements['date'].value = date.ymdTime();

//// monaco editor ////
  require.config({ paths: { vs: "monaco-editor/min/vs" } });
  class Monaco {
    constructor(formName, monacoEditor, path) {
      this.editor = monacoEditor;
      this.form = formName;
      this.path = path;
    }
    static async defaultText (filename) {
      const def = await fetch(`default-${filename}`);
      return await def.text();
    };
    static opt (value, language) {
      return {
        value: value,
        language: language,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        isWholeLine: true,
        wordWrap: 'on',
        // wrappingStrategy: 'advanced',
        minimap: {enabled: false}
        // overviewRulerLanes: 0
      }
    };
    static whatfafanto = '<>'
    static tag = {
      block: ['p','h2','h3','h4','h5','h6','h1','pre','div','blockquote','section','header','footer','main','nav'],
      inline: ['small','i','b','strong','mark','code','span','q',],
      attr: [['a','href="" target="_blank"']],
      child: [['ul','li'],['ol','li'],['table','td']],
      single: ['br','hr','img src="" alt=""']
    };
    static postPath = '../..';
    static pagePath = '..';
    static viewSwitch (elem1, elem2) {
      elem1.classList.toggle('hide');
      elem2.classList.add('hide');
    };
    addHtmlTag() {
      document.forms[this.form].querySelector('[name=panelbtns]').onclick = (e) => {
        const sel = this.editor.getSelection();
        const val = this.editor.getModel().getValueInRange(sel);
        const insert = (text) => {
          this.editor.executeEdits('', [{ range: sel, text: text, forceMoveMarkers: true}]);
          this.editor.focus();
        };
        if (e.target.tagName === 'I') {
          for (const t of Monaco.tag.attr) {
            if (e.target.textContent === t[0]) {
              insert(`<${t[0]} ${t[1]}>${val}</${t[0]}>`);
              return;
            }
          }
          for (const t of Monaco.tag.child) {
            if (e.target.textContent === t[0]) {
              insert(`<${t[0]}>\n  <${t[1]}>${val}</${t[1]}>\n  <${t[1]}></${t[1]}>\n  <${t[1]}></${t[1]}>\n</${t[0]}>`);
              return;
            }
          }
          for (const t of Monaco.tag.block) {
            if (e.target.textContent === t) {
              insert(`<${t}>${val}</${t}>\n`);
              return;
            }
          }
          for (const t of Monaco.tag.inline) {
            if (e.target.textContent === t) {
              insert(`<${t}>${val}</${t}>`);
              return;
            }
          }
          for (const t of Monaco.tag.single) {
            if (e.target.textContent === t) {
              insert(`<${t}>\n${val}`);
              return;
            }
          }
        }
        if (e.target.tagName === 'U') {
          insert(`${e.target.title}\n${val}`);
          return;
        }
        if (e.target.title === 'link') {
          Monaco.viewSwitch(LINKS, IMAGS);
          LINKS.querySelector('div').onclick = (e) => {
            if (e.target.tagName === 'P') {
              const dirName = LINKS.elements['dirs'].value;
              insert(`<a href="${this.path}/${this.form}/${dirName}/${e.target.dataset.name}" target="_blank">${e.target.dataset.title}</a>`);
            }
          }
          return;
        }
        if (e.target.title === 'img') {
          Monaco.viewSwitch(IMAGS, LINKS);
          IMAGS.querySelector('div').onclick = (e) => {
            if (e.target.tagName === 'IMG') {
              const dirName = IMAGS.elements['dirs'].value;
              insert(`<img src="${this.path}/media/${dirName}/${e.target.title}" alt="">\n`);
            }
          }
        }
      }
    };
  };
  // create monaco editor
  const mePostDesc = monaco.editor.create(POST.elements['description'], Monaco.opt('\nAdd Description Text\n', 'plaintext'));
  const mePostContents = monaco.editor.create(POST.elements['contents'], Monaco.opt('Add Contents\n', 'html'));
  const mePageDesc = monaco.editor.create(PAGE.elements['description'], Monaco.opt('\nAdd Description\n', 'plaintext'));
  const mePageContents = monaco.editor.create(PAGE.elements['contents'], Monaco.opt('Add Contents\n', 'html'));
  const meBaseTemplate = monaco.editor.create(BASE.elements['template'], Monaco.opt(await Monaco.defaultText('template.html'), 'html'));
  const meBaseStyle = monaco.editor.create(BASE.elements['style'], Monaco.opt(await Monaco.defaultText('style.css'), 'css'));
  const meBaseMain = monaco.editor.create(BASE.elements['main'], Monaco.opt(await Monaco.defaultText('main.js'), 'javascript'));
  // instance for add html-tag button
  const meBtnsPosDesc = new Monaco('post', mePostDesc, Monaco.postPath);
  const meBtnsPosCont = new Monaco('post', mePostContents, Monaco.postPath);
  const meBtnsPagDesc = new Monaco('page', mePageDesc, Monaco.pagePath);
  const meBtnsPagCont = new Monaco('page', mePageContents, Monaco.pagePath);
  // click to close button in links and imgs list
  LINKS.elements['btn'].onclick = () => LINKS.classList.add('hide');
  IMAGS.elements['btn'].onclick = () => IMAGS.classList.add('hide');

//event

  //click left menu
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
  };

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
  };

  //click lightness
  document.getElementById('lightness').onclick = () => {
    // document.querySelector('nav').classList.toggle('dark');
    // document.querySelector('header').classList.toggle('dark');
    document.querySelector('html').classList.toggle('dark');
  };

  //click right block arrow to open/close
  for (const sidet of document.querySelectorAll('.side h3')) {
    sidet.onclick = (e) => {
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

  // custom color
  // SETT.elements['hue'].addEventListener('input', () =>{
  //   const deg36 = SETT.elements['hue'].value;
  //   const sets = [
  //     ['--bordercolor',`hsl(${deg36*10},30%,88%)`],
  //     ['--primary-color',`hsl(${deg36*10},50%,60%)`],
  //     ['--huedeg',`hue-rotate(${deg36*10 + 160}deg)`]
  //   ];
  //   for (const set of sets) document.documentElement.style.setProperty(set[0],set[1]);
  // });

  (() => {
    //click paneltab
    const paneltab = (form,e) => {
      const btns = form.elements['paneltab'].querySelectorAll('button');
      for (const btn of btns) btn.classList.remove('on');
      if (e.target.tagName === 'BUTTON') e.target.classList.toggle('on');
      const editors = form.querySelectorAll('.monacos');
      for (const editor of editors) editor.classList.add('hide');
      const on = form.elements['paneltab'].querySelector('button.on');
      form.elements['paneltab'].dataset.currenttab = on.dataset.tab;
    };
    POST.elements['paneltab'].onclick = (e) => {
      paneltab(POST,e);
      POST.elements[e.target.dataset.tab].classList.remove('hide');
    }
    BASE.elements['paneltab'].onclick = (e) => {
      paneltab(BASE,e);
      BASE.elements[e.target.dataset.tab.split('.')[0]].classList.remove('hide');
    }

    //set translate="no"
    const elems = ['nav','header','#post .panel','#page .panel','#post [name=tagbtns]','#custom'];
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

//// click select folder ////
  OPEN.onclick = async () => {
    const dirHandle = await window.showDirectoryPicker(); //dialog accept for load
    //create and get Handle of file/folder
    const tmpHandle = await dirHandle.getFileHandle('template.html',{create:true}); //dialog accept for save
    const setHandle = await dirHandle.getFileHandle('setting.html',{create:true});
    const webHandle = await dirHandle.getDirectoryHandle('webfiles',{create:true});
    const idxHandle = await webHandle.getFileHandle('index.html',{create:true});
    const stlHandle = await webHandle.getFileHandle('style.css',{create:true});
    const mjsHandle = await webHandle.getFileHandle('main.js',{create:true});
    const allHandle = await webHandle.getFileHandle('allpost.html',{create:true});
    const srhHandle = await webHandle.getFileHandle('search.html',{create:true});
    const icoHandle = await webHandle.getFileHandle('favicon.svg',{create:true});
    const posHandle = await webHandle.getDirectoryHandle('post',{create:true});
    const pagHandle = await webHandle.getDirectoryHandle('page',{create:true});
    const medHandle = await webHandle.getDirectoryHandle('media',{create:true});
    await posHandle.getDirectoryHandle(date.year(),{create:true});
    await medHandle.getDirectoryHandle(date.year(),{create:true});
    const singleBox = [];
    singleBox.push(tmpHandle,setHandle,mjsHandle,idxHandle,stlHandle,allHandle,srhHandle,icoHandle);
    const postBox = await listAll(posHandle);
    const pageBox = await listAll(pagHandle);
    const mediaBox = await listAll(medHandle);
    console.log(singleBox,postBox,pageBox,mediaBox);

    //file class
    class EditFile {
      constructor(fileName,handleBox) {
        this.fileName = fileName;
        this.box = handleBox;
      };
      handle() {
        return this.box.find(({name}) => name === this.fileName);
      };
      async txt() {
        const fileHdl = await this.handle().getFile();
        return fileHdl.text();
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
    class EditTextFile extends EditFile {
      async writeURLToFile() {
        const writable = await this.handle().createWritable();
        const response = await fetch(this.url);
        await response.body.pipeTo(writable);
      };
    };
    class EditSetting extends EditTextFile {
      constructor(fileName,handleBox) {
        super(fileName,handleBox);
        this.fileName = 'setting.html';
        this.box = singleBox;
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
        for (const sett of this.setts) {
          const txt = SETT.elements[sett].value;
          str += `<p id="${sett}">${txt}</p>\n`
        }
        await this.write(str);
      };
    };
    const setting = new EditSetting();
    await setting.load();

    //bases
    class EditBases extends EditTextFile {
      constructor(fileName,handleBox,monacoEditor) {
        super(fileName,handleBox);
        this.fileName = fileName;
        this.box = singleBox;
        this.url = `default-${fileName}`;
        this.me = monacoEditor;
      };
      document() {
        return DOMP.parseFromString(this.me.getValue(),'text/html');
      };
      async load() {
        const text = await this.txt();
        if (text) this.me.setValue(text);
        else {
          const val = this.me.getValue();
          const def = val.substring(val.indexOf("\n") + 1);
          this.me.setValue(def);
          await this.write(def);
        }
      };
      async save() {
        await this.write(this.me.getValue());
      };
    };
    const template = new EditBases('template.html',null,meBaseTemplate);
    const style = new EditBases('style.css',null,meBaseStyle);
    const main = new EditBases('main.js',null,meBaseMain);
    for (const baseFile of [template,style,main]) await baseFile.load();
    const favicon = new EditBases('favicon.svg',null);
    //others
    // class EditOthes extends EditTextFile {
    //   constructor(fileName,handleBox,url) {
    //     super(fileName,handleBox);
    //     this.fileName = fileName;
    //     this.box = handleBox;
    //     this.url = url;
    //   };
    // };
    // const favicon = new EditOthes('favicon.svg',singleBox,'favicon.svg');
    for (const file of [favicon]) {
      const txt = await file.txt();
      if (!txt) await file.writeURLToFile();
    }
    
    //HTML
    class EditHTML extends EditFile {
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
        const reqElems = ['title','[rel=stylesheet]','script','[rel=icon]','.link-allpost','.link-search'];
        if (this.req) for (const word of this.req) reqElems.push(word);
        console.log(reqElems,this.req)
        for (const elem of reqElems) {
          if (!doc.querySelector(elem)) dialog.notTag(elem);
        }
      };
      async insertCommonElems(doc) {
        // Required elements
        const reqElems = [
          ['[rel=stylesheet]','href',`${this.path}style.css`],
          ['script','src',`${this.path}main.js`],
          ['[rel=icon]','href',`${this.path}favicon.svg`]
        ];
        for (const elem of reqElems) doc.head.querySelector(elem[0]).setAttribute(elem[1],elem[2]);
        const allps = doc.querySelectorAll('.link-allpost');
        for (const allp of allps) allp.setAttribute('href',`${this.path}allpost.html`);
        const serhs = doc.querySelectorAll('.link-search');
        for (const serh of serhs) serh.setAttribute('href',`${this.path}search.html`);
        // non-Required elements
        const nreqElems = [
          ['[property="og:site_name"]','content',CNFST.value],
          ['[property="og:description"]','content',SETT.elements['index-desc']],
          ['[property="og:image"]','content',normal.url() + SETT.elements['image'].value]
        ];
        for (const elem of nreqElems) {
          const slct = doc.head.querySelector(elem[0]);
          if (slct) slct.setAttribute(elem[1],elem[2]);
        }
        const siteTitle = doc.querySelector('.site-title');
        if (siteTitle) siteTitle.innerHTML = `<a href="${this.path}">${CNFST.value}</a>`;
        const pageList = doc.querySelector('.page-list');
        if (pageList) {
          if (pageBox) {
            const data = await EditPage.allData();
            for (const d of data) pageList.innerHTML += `<a href="${this.path}page/${d[0]}">${d[1]}</a>\n`;
          } else pageList.remove();
        } 
        const copyright = doc.querySelector('.copyright');
        if (copyright) copyright.insertAdjacentHTML('afterbegin',`©${date.year()} <a href="${this.path}">${CNFST.value}</a>`);
      };
      insertHeadTitle(doc,value) {
        doc.head.querySelector('title').textContent = value;
        const ogTitle = doc.head.querySelector('[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content',value);
      };
      insertBodyTitle(doc,value) {
        doc.querySelector('.title').insertAdjacentHTML('afterbegin',value);
      };
      insertHeadDescription(doc,value) {
        const mtDesc = doc.head.querySelector('[name=description]');
        const ogDesc = doc.head.querySelector('[property="og:description"]');
        if (!value) {
          mtDesc.remove();
          return;
        }
        for (const desc of [mtDesc,ogDesc]) {
          if (desc) desc.setAttribute('content',value);
        }
      };
      insertOGPUrl(doc,value) {
        const ogUrl = doc.head.querySelector('[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content',value);
        else ogUrl.remove();
      };
      async makeHTMLCommon() {
        const doc = this.templateToDoc();
        this.existsRequiredElems(doc);
        await this.insertCommonElems(doc);
        return doc;
      };
      docToHTMLStr(doc) {
        const str = doc.documentElement.outerHTML;
        // const rstr = str.replace(/^\s*[\r\n]/gm, '');//remove white line
        return `<!DOCTYPE html>\n${str}`;
      };
      async preview() {
        const doc = await this.makeHTMLCommon();
        await this.makeHTMLSpecial(doc);
        const css = meBaseStyle.getValue();
        const mjs = meBaseMain.getValue();
        doc.head.insertAdjacentHTML('beforeend',`<style>${css}</style><script>${mjs}</script>`);
        const imgs = doc.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src');
          const arr = src.split("/");
          const fileName = arr[arr.length -1];
          const dirName = arr[arr.length -2];
          const url = await EditMedia.searchToUrl(fileName,dirName);
          img.setAttribute('src',url);
        }
        const str = this.docToHTMLStr(doc);
        const previewTab = window.open();
        // const previewWindow = window.open('preview.html',this.fileName,`height=${window.screen.height},width=${window.screen.width},scrollbars=yes,`);
        previewTab.document.write(str);
      };
      async save() {
        const doc = await this.makeHTMLCommon();
        await this.makeHTMLSpecial(doc);
        const str = this.docToHTMLStr(doc);
        await this.write(str);
      };
    };

    class EditIndex extends EditHTML {
      constructor(fileName,handleBox) {
        super(fileName,handleBox);
        this.fileName = 'index.html';
        this.box = singleBox;
        this.class = 'index';
        this.title = SETT.elements['site-subtitle'];
        this.desc = SETT.elements['index-desc'];
        this.req = ['.latest-posts'];
        this.path = './';
      };
      async makeHTMLSpecial(doc) {
        this.insertHeadTitle(doc,`${CNFST.value} - ${this.title.value}`);
        this.insertHeadDescription(doc,this.desc.value);
        this.insertOGPUrl(doc,normal.url());
        const lat = doc.querySelector('.latest-posts');
        const num = SETT.elements['latest-posts'].value;
        if (num > 0 && num < 21) await EditPost.insertLatestPostsNum(num,lat);
        const imgs = lat.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src');
          const nsrc = src.replace('../../','');
          img.setAttribute('src',nsrc);
        }
      };
    };

    class EditAllpost extends EditHTML {
      constructor(fileName,handleBox) {
        super(fileName,handleBox);
        this.fileName = 'allpost.html';
        this.box = singleBox;
        this.class = 'allpost';
        this.title = SETT.elements['allpost-title'];
        this.desc = SETT.elements['allpost-desc'];
        this.req = ['.allpost-btns','.latest-posts'];
        this.path = './';
      };
      async makeHTMLSpecial(doc) {
        this.insertHeadTitle(doc,`${this.title.value} - ${CNFST.value}`);
        this.insertHeadDescription(doc,this.desc.value);
        this.insertOGPUrl(doc,normal.url() + this.fileName);
        this.insertBodyTitle(doc,this.title.value);
        const mabp = doc.querySelector('.allpost-btns').querySelectorAll('*');
        const dirs = EditPost.latestDirs();
        for (const dir of dirs) mabp[0].insertAdjacentHTML('beforeend',`<U data-btn="dir-${dir}" class="on">${dir}</U>`);
        const str = SETT.elements['tags'].value;
        const dom = DOMP.parseFromString(str,'text/html');
        const tags = dom.querySelectorAll('i');
        for (const tag of tags) {
          const editag = tag.textContent.replace(/ /g,'-');
          mabp[1].insertAdjacentHTML('afterbegin',`<span data-btn="tag-${editag}" class="on">${tag.textContent}</span>`);
        }
        const lat = doc.querySelector('.latest-posts');
        await EditPost.insertLatestPostsAll(lat);
        const imgs = lat.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src');
          const nsrc = src.replace('../../','');
          img.setAttribute('src',nsrc);
          img.setAttribute('loading','lazy');
        }
      };
    };

    class EditSearch extends EditHTML {
      constructor(fileName,handleBox) {
        super(fileName,handleBox);
        this.fileName = 'search.html';
        this.box = singleBox;
        this.class = 'search';
        this.title = SETT.elements['search-title'];
        this.desc = SETT.elements['search-desc'];
        this.path = './';
      };
      makeHTMLSpecial(doc) {
        this.insertHeadTitle(doc,`${this.title.value} - ${CNFST.value}`);
        this.insertHeadDescription(doc,this.desc.value);
        this.insertOGPUrl(doc,normal.url() + this.fileName);
        this.insertBodyTitle(doc,this.title.value);
      };
    };
    const index = new EditIndex();
    const allpost = new EditAllpost();
    const search = new EditSearch();

    // post and page common class
    class EditArticle extends EditHTML {
      checkNewFileName() {
        if (this.fileName === '.html') dialog.nameEmpty();
        const result = this.box.findIndex(({name}) => name === this.fileName);
        if (result !== -1) dialog.nameExists();
      };
      loadDescription(doc) {
        return doc.querySelector('.description')?.innerHTML?? '';
      };
      loadTitle(doc) {
        return doc.querySelector('.title')?.textContent?? '';
      };
      loadContents(doc) {
        return doc.querySelector('.contents')?.innerHTML?? '';
      };
      insertBodyDescription(doc,value) {
        const desc = doc.querySelector('.description');
        if (!desc) return;
        if (!value) {
          desc.remove();
          return;
        }
        desc.insertAdjacentHTML('afterbegin',value);
      };
      insertContents(doc,value) {
          doc.querySelector('.contents').insertAdjacentHTML('afterbegin',value);
      };
      editParts(doc) {
        for(const part of this.parts) {
          const elem = doc.querySelector(`.${part}`);
          if (elem) {
            if (!this.form.elements[part].checked) elem.remove();
          }
        }
        //table of contents
        const toc = doc.querySelector('.table-of-contents');
        if (!toc) return;
        const cnt = doc.querySelector('.contents');
        const h23 = cnt.querySelectorAll('h2,h3');
        if (!h23.length) {
          toc.remove();
          return;
        }
        toc.innerHTML += '<ul></ul>';
        const h2Ul = toc.querySelector('ul');
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
      transHTMLCommon(doc,beforeDoc) {
        this.insertHeadTitle(doc,`${this.loadTitle(beforeDoc)} - ${CNFST.value}`);
        this.insertBodyTitle(doc,this.loadTitle(beforeDoc));
        this.insertBodyDescription(doc,this.loadDescription(beforeDoc));
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
      clickEditBackBtn() {
        this.form.querySelector('.artlist').onclick = async (e) => {
          if (e.target.tagName === 'BUTTON') {
            this.form.querySelector('.bench').classList.toggle('hide');
            e.target.classList.toggle('btn-close');
            this.form.elements['new'].classList.toggle('hide');
            const fileName = e.target.parentNode.dataset.name;
            const fs = this.form.querySelectorAll(`.artlist fieldset:not([data-name="${fileName}"])`);
            for (const f of fs) f.classList.toggle('hide');
            if (!this.form.querySelector('.bench').classList.contains('hide')) await new this.name(fileName).loadElements();
          }
        };
      };
      clickNewBtn() {
        this.form.elements['btn'].onclick = (e) => {
          this.form.querySelector('.bench').classList.toggle('hide');
          e.target.classList.toggle('btn-close');
          const fs = this.form.querySelector('.artlist').querySelectorAll('fieldset');
          for (const f of fs) f.classList.toggle('hide');
          this.ct.setValue('\n\n\n');
          if (this.form === POST) this.desc.setValue('\n\n\n');
        };
      };
      inputNewName () {
        const newName = this.form.elements['name'];
        newName.addEventListener('input', () => {
          const filename = newName.value;
          ACTF.textContent = `${filename}.html`;
          SAVE.dataset.file = `${filename}.html`;
          this.form.elements['new'].dataset.name = `${filename}.html`;
        });
      };
      async existElements() {
        const article = new this.name();
        const tmpDoc = await article.templateToDoc();
        for (const part of article.parts) {
          if (!tmpDoc.querySelector(`.${part}`)) {
            this.form.elements[part].parentNode.classList.add('noexist');
            this.form.elements[part].parentNode.setAttribute('title','This class does not exist in the template');
          }
        }
      };
    };

    // post class
    class EditPost extends EditArticle {
      constructor(fileName,handleBox) {
        super(fileName,handleBox);
        this.box = postBox;
        this.class = 'post';
        this.path = '../../';
        this.req = ['.title','.contents','.time'];
        this.parts = ['table-of-contents','comment','freespace'];
        this.form = POST;
        this.title = POST.querySelector(`[data-name="${this.fileName}"] input`);
        this.time = POST.querySelectorAll(`[data-name="${this.fileName}"] input`)[1];
        this.desc = mePostDesc;
        this.ct = mePostContents;
        this.thumb = POST.elements['thumbnail'];
        this.tags = POST.elements['tags'];
        this.name = EditPost;
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
        this.desc.setValue(this.loadDescription(doc));
        this.ct.setValue(this.loadContents(doc));
        this.thumb.value = this.loadImg(doc);
        this.desc.value = this.loadDescription(doc);
        this.tags.value = this.loadTags(doc);
        const spans = doc.querySelectorAll('.tags span');
        for (const span of spans) POSTG.querySelector(`[data-tag="${span.textContent}"]`)?.setAttribute('class','on');
        for (const part of this.parts) {
          if (!doc.querySelector(`.${part}`)) POST.elements[part].checked = false;
        }
      };

      insertTime(doc,ymdTime) {
        const time = doc.querySelector('.time');
        if (!time) return;
        if (ymdTime) {
          time.innerHTML = date.changeFormat(ymdTime);
          time.setAttribute('datetime',ymdTime);
        } else time.remove();
        const modTime = doc.querySelector('time[itemprop=modified]');
        if (modTime) {
          if (date.ymd().replaceAll('-','') <= ymdTime.slice(0,10).replaceAll('-','')) {
            modTime.remove();
            return;
          }
        }
        const cTime = date.changeFormat(date.ymdTime())
        modTime.insertAdjacentHTML('beforeend',cTime);
        modTime.setAttribute('datetime',date.ymdTime());
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
        if (!elems.length) return;
        if (!value) {
          for (const elem of elems) elem.remove();
          return;
        }
        for (const elem of elems) elem.innerHTML = value;
      };
      insertTags(doc,value) {
        const elems = doc.querySelectorAll('.tags');
        if (!elems.length) return;
        if (!value) {
          for (const elem of elems) elem.remove();
          return;
        }
        for (const elem of elems) elem.innerHTML = value;
      };
      findIndex(allData) {
        for (let i = 0; i < allData.length; i++) {
          if (allData[i][0] === this.fileName) return i;
        }
      };
      async setPrevNextLink(doc) {
        const prev = doc.querySelector('.link-prev');
        const next = doc.querySelector('.link-next');
        const data = await EditPost.allLatestData();
        const index = this.findIndex(data);
        if (prev) {
          if (data[index + 1]) {
            const path = `${this.path}post/${data[index + 1][2]}/${data[index + 1][0]}`;
            prev.setAttribute('href',path);
            prev.setAttribute('title',data[index + 1][1]);
          } else prev.classList.add('isDisabled');
        }
        if (next) {
          if (data[index - 1]) {
            const path = `${this.path}post/${data[index - 1][2]}/${data[index - 1][0]}`;
            next.setAttribute('href',path);
            next.setAttribute('title',data[index - 1][1]);
          } else next.classList.add('isDisabled');
        }
      };
      async makeHTMLSpecial(doc) {
        this.insertHeadTitle(doc,`${this.title.value} - ${CNFST.value}`);
        this.insertHeadDescription(doc,this.desc.getValue());
        this.insertBodyTitle(doc,this.title.value);
        this.insertBodyDescription(doc,this.desc.getValue());
        this.insertContents(doc,this.ct.getValue());
        this.insertTime(doc,this.time.value);
        this.insertImg(doc,this.thumb.value,this.title.value);
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
        const thisYear = this.box.find(({name}) => name === date.year());
        const newFile = await thisYear.getFileHandle(this.fileName,{create:true});
        this.box.push(newFile);
        await this.save();
        for (const input of POSNW.elements) input.value = '';
      };
      async transHTMLSpecial(doc,beforeDoc) {
        this.insertOGPUrl(doc,await this.fullURL());
        this.insertBodyDescription(doc,this.loadDescription(beforeDoc));
        this.insertTime(doc,this.loadTime(beforeDoc));
        this.insertImg(doc,this.loadImg(beforeDoc),this.loadTitle(beforeDoc));
        this.insertAuther(doc,SETT.elements['auther'].value);
        this.insertTags(doc,this.loadTags(beforeDoc));
        await this.setPrevNextLink(doc);
        for(const part of this.parts) {
          const elem = beforeDoc.querySelector(`.${part}`);
          if (!elem) doc.querySelector(`.${part}`).remove();
        }
      };
      static latestDirs()  {
        const postDirs = [];
        for (const dir of postBox.values()) {
          if (dir.kind === 'directory') postDirs.push(dir.name);
        };
        return postDirs.sort((a, b) => b - a);
      };
      static addDirsList(form)  {
        const dirs = this.latestDirs();
        for (const dir of dirs) {
          form.elements['dirs'].insertAdjacentHTML('beforeend',`<option value="${dir}">${dir}</option>`);
        }
        form.elements['dirs'].value = date.year();
      };
      static async getPostData(fileName,dirName) {
        const post = new EditPost(fileName);
        const doc = await post.document();
        const tit = post.loadTitle(doc);
        const dti = post.loadTime(doc);
        const rti = dti.replace('T','.').replace(/[^0-9\.]/g,'');
        const img = post.loadImg(doc);
        const tgs = post.loadTags(doc);
        const dsc = post.loadDescription(doc);
        return [fileName,tit,dirName,dti,rti,img,tgs,dsc]; //0:filename, 1:title, 2:dirctory name, 3:datetime, 4:datetime(num), 5:image 6:tags 7:description
      };
      static async latestDataInDir(dirName) {
        const dHandle = postBox.find(({name}) => name === dirName);
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
        const dirs = this.latestDirs();
        const allData = [];
        for (const dir of dirs) {
          const data = await this.latestDataInDir(dir);
          allData.push(...data);
        }
        console.log(allData)
        return allData;
      };
      static async addListInDir(dirName) {
        POSLI.textContent = '';
        POSBE.classList.add('hide');
        POST.elements['dirs'].classList.remove('hide');
        POSNW.elements['btn'].classList.remove('btn-close');
        const data = await this.latestDataInDir(dirName);
        for (const d of data) {
          POSLI.insertAdjacentHTML('beforeend',`<fieldset data-name="${d[0]}"><input value="${d[1]}"><input type="datetime-local" value="${d[3]}"><u>${d[0]}</u><button type="button"></button></fieldset>`);
        }
      };
      static async addListInDirForLinks(dirName) {
        LINKS.querySelector('div').textContent ='';
        const data = await this.latestDataInDir(dirName);
        for (const d of data) LINKS.querySelector('div').insertAdjacentHTML('beforeend',`<p data-name="${d[0]}" data-title="${d[1]}">${d[3]}<br>${d[1]}<br>${d[0]}</p>`);
        LINKS.elements['dirs'].value = dirName; 
      };
      static dirSelect() {
        POST.elements['dirs'].addEventListener('input', async (e) => {
          const dirName = e.target.value;
          await this.addListInDir(dirName);
        });
      };
      static selectDirForLinks() {
        LINKS.elements['dirs'].addEventListener('input', async (e) => {
          const dirName = e.target.value;
          await this.addListInDirForLinks(dirName);
        });
      };
      static async insertLatestPostsNum(num,elem) {
        const d = await this.allLatestData();
        for (let i = 0; i < num; i++) {
          let image = '';
          let description = '';
          if (d[i][5]) image = `<img src="${d[i][5]}" alt="${d[i][1]}" />`;
          else {
            if (d[i][7]) description = `<div>${d[i][7]}</div>`;
          }
          elem.insertAdjacentHTML('beforeend',
          `<a href="./post/${d[i][2]}/${d[i][0]}">${image}<h3>${d[i][1]}</h3>${description}<span>${d[i][6]}</span><time>${date.changeFormat(d[i][3])}</time></a>\n`);
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
          let image = '';
          let description = '';
          if (d[5]) image = `<img src="${d[5]}" alt="${d[1]}" />`;
          else {
            if (d[7]) description = `<div>${d[7]}</div>`;
          }
          elem.insertAdjacentHTML('beforeend',`<a class="${classes.trim()} dir-${d[2]}" href="./post/${d[2]}/${d[0]}">${image}<h3>${d[1]}</h3>${description}<span>${d[6]}</span><time>${date.changeFormat(d[3])}</time></a>\n`);
        }
      };
    };
    new EditPost().clickEditBackBtn();
    new EditPost().clickNewBtn();
    new EditPost().inputNewName();
    new EditPost().existElements();
    EditPost.addDirsList(POST);
    EditPost.addDirsList(LINKS);
    EditPost.dirSelect();
    EditPost.selectDirForLinks();
    EditPost.addListInDir(date.year());
    EditPost.addListInDirForLinks(date.year());

    // page class
    class EditPage extends EditArticle {
      constructor(fileName,handleBox) {
        super(fileName,handleBox);
        this.box = pageBox;
        this.class = 'page';
        this.path = '../';
        this.req = ['.title','.contents'];
        this.parts = ['table-of-contents'];
        this.form = PAGE;
        this.title = PAGE.querySelector(`[data-name="${this.fileName}"] input`);
        this.desc = mePageDesc;
        this.ct = mePageContents;
        this.name = EditPage;
      };
      fullURL() {
        return `${normal.url()}page/${this.fileName}`;
      };
      async loadElements() {
        const doc = await this.document();
        this.ct.setValue(this.loadContents(doc));
        this.desc.value = this.loadDescription(doc);
      };
      makeHTMLSpecial(doc) {
        this.insertHeadTitle(doc,this.title.value);
        this.insertHeadDescription(doc,this.desc.getValue());
        this.insertOGPUrl(doc,this.fullURL());
        this.insertBodyTitle(doc,this.title.value);
        this.insertBodyDescription(doc,this.desc.getValue());
        this.insertContents(doc,this.ct.getValue());
        this.editParts(doc);
      };
      async saveNew() {
        this.checkNewFileName();
        const newFile = await pagHandle.getFileHandle(this.fileName,{create:true});
        this.box.push(newFile);
        await this.save();
        for (const input of PAGNW.elements) input.value = '';
      };
      async transHTMLSpecial(doc) {
        this.insertOGPUrl(doc,this.fullURL());
        this.insertBodyDescription(doc,this.loadDescription(beforeDoc));
      };
      static async allData() {
        const data = [];
        for (const file of pageBox.values()) {
          if (file.kind === 'file') {
            const page = new EditPage(file.name);
            const doc = await page.document();
            const title = page.loadTitle(doc);
            data.push([file.name,title]); //0:filename 1:title
          }
        }
        return data;
      };
      static async addPageList() {
        PAGBE.classList.add('hide');
        PAGLI.textContent = '';
        PAGNW.elements['btn'].classList.remove('btn-close');
        const data = await this.allData();
        for (const d of data)
        PAGLI.insertAdjacentHTML('beforeend',`<fieldset data-name="${d[0]}"><input value="${d[1]}"><u>${d[0]}</u><button type="button"></button></fieldset>`);
      };
    };
    new EditPage().clickEditBackBtn();
    new EditPage().clickNewBtn();
    new EditPage().inputNewName();
    new EditPage().existElements();
    await EditPage.addPageList();

    // media class
    class EditMedia {
      static async searchToUrl(fileName,dirName) {
        const dirHdl = mediaBox.find(({name}) => name === dirName);
        for await (const img of dirHdl.values()) {
          if (img.name === fileName) return await this.localUrl(img);
        }
      };
      static dirsHdls() {
        const dirsHdls = [];
        for (const dir of mediaBox.values()) {
          if (dir.kind === 'directory') dirsHdls.push(dir);
        }
        return dirsHdls;
      };
      static async imgHdlsInDir(dirName) {
        const imgHdls = [];
        const dirHdl = mediaBox.find(({name}) => name === dirName);
        for await (const img of dirHdl.values()) {
          if(img.kind === 'file') {
            if (img.name.match(/(.jpg|.jpeg|.png|.gif|.apng|.svg|.jfif|.pjpeg|.pjp|.ico|.cur)/i)) imgHdls.push(img);
          }
        }
        return imgHdls;
      };
      static async localUrl(fileHandle) {
        const getFile = await fileHandle.getFile();
        return URL.createObjectURL(getFile);
      };
      static addDirsList() {
        IMAGS.elements['dirs'].textContent ='';
        const dirHdls = this.dirsHdls();
        for (const dir of dirHdls) IMAGS.elements['dirs'].insertAdjacentHTML('beforeend',`<option value="${dir.name}">${dir.name}</option>`);
        IMAGS.elements['dirs'].value = date.year();
      };
      static async addListInDir(dirName) {
        IMAGS.querySelector('div').textContent ='';
          const imgHdls = await this.imgHdlsInDir(dirName);
          for (const img of imgHdls ) {
            const url = await this.localUrl(img);
            IMAGS.querySelector('div').innerHTML += `<img src="${url}" title="${img.name}" loading="lazy" />`;
          }
        IMAGS.elements['dirs'].value = dirName;
      };
      static dirSelect() {
        IMAGS.elements['dirs'].addEventListener('input', async (e) => {
          const dirName = e.target.value;
          await this.addListInDir(dirName);
        });
      };
      static thumbSelect() {
        POST.elements['thumbbtn'].onclick = () => {
          IMAGS.classList.toggle('hide');
          IMAGS.querySelector('div').onclick = (e) => {
            if (e.target.tagName === 'IMG') {
              const dirName = IMAGS.elements['dirs'].value;
              POST.elements['thumbnail'].value = `media/${dirName}/${e.target.title}`;
            }
          }
        }
      };
    };
    EditMedia.addDirsList();
    EditMedia.addListInDir(date.year());
    EditMedia.dirSelect();
    EditMedia.thumbSelect();

  /// event ///
    document.getElementById('home').onclick = async () => await index.preview();
    document.getElementById('map').onclick = async () => await allpost.preview();

    //click Save button
    SAVE.onclick = async () => {
      const form = H2SE.dataset.form;
      const fileName = SAVE.dataset.file;
      console.log(form,fileName)
      const files = [index,allpost];
      let saveName = fileName;
      if (form === 'post') saveName += ', index.html, allpost.html'
      dialog.confirmSave(saveName);
      if (form === 'post') {
        if (!POSNW.classList.contains('hide')) {
          const newName = `${POSNW.elements['name'].value}.html`
          await new EditPost(newName).saveNew();
          const data = await EditPost.latestDataInDir(date.year());
          await new EditPost(data[1][0]).saveTransfer();
          await EditPost.addListInDir(date.year());
        } else {
          await new EditPost(fileName).save();
        }
        saveName = fileName;
        for (const file of files) {
          await file.save();
          saveName += `, ${file.fileName}`;
        }
      }
      else if (form === 'page') {
        if (!PAGNW.classList.contains('hide')) {
          const newName = `${PAGNW.elements['name'].value}.html`
          await new EditPage(newName).saveNew();
          await EditPage.addPageList();
        } else {
          await new EditPage(fileName).save();
        }
      }
      else if (form === 'bases') {
        for (const base of [['template.html',template],['style.css',style],['main.js',main]])
        if (fileName === base[0]) await base[1].save();
      }
      else if (form === 'setting') await setting.save();
      dialog.successSave(saveName);
    };

    //click Preview button
    PREV.onclick = async () => {
      const fileName = SAVE.dataset.file;
      const form = H2SE.dataset.form;
      if (form === 'post') await new EditPost(fileName).preview();
      else if (form === 'page') await new EditPage(fileName).preview();
    };

  //allsave
    //append article number
    ALLS.elements['post'].parentNode.insertAdjacentHTML('beforeend',`(${postBox.length - EditPost.latestDirs().length})`);
    ALLS.elements['page'].parentNode.insertAdjacentHTML('beforeend',`(${pageBox.length})`);
    //click start saving
    ALLS.elements['save'].onclick = async () => {
      const log = ALLS.querySelector('.log');
      log.textContent = '';
      dialog.confirmSave('checked files');
      for (const file of [['index',index],['allpost',allpost],['search',search]]) {
        if (ALLS.elements[file[0]].checked) {
          await file[1].save();
          log.insertAdjacentHTML('beforeend',`<p>Succeeded in saving ${file[1].fileName}</p>`);
        }
      }
      for (const art of [['post',postBox,EditPost],['page',pageBox,EditPage]]) {
        if (ALLS.elements[art[0]].checked) {
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
    POSNW.elements['date'].value = date.ymdTime();
  /// Mutation Observer ///
    obsForm = () => {
      SAVE.removeAttribute('data-file');
      ACTF.textContent = '';
      SAVE.classList.add('disable');
      PREV.classList.add('disable');
      const form = H2SE.dataset.form;
      if (form === 'post' || form === 'page') {
        if(document.querySelector(`#${form} .bench`).className !== 'hide') {
          const fileName = document.getElementById(form).querySelector('.portal fieldset:not(.hide)').dataset.name;
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
        SAVE.dataset.file = `${form}.html`;
        ACTF.textContent = `${form}.html`;
        SAVE.classList.remove('disable');
      }
    };
    obsPost = () => {
      if (POSBE.classList.contains('hide')) {
        SAVE.removeAttribute('data-file');
        SAVE.classList.add('disable');
        PREV.classList.add('disable');
        POST.elements['dirs'].classList.remove('hide');
        ACTF.textContent = '';
        const parts = new EditPost().parts;
        for (const part of parts) POST.elements[part].checked = true;
        // for (const part of parts) POST.elements[part].value = '';
        for (const span of POSTG.querySelectorAll('i')) span.removeAttribute('class');
        return;
      }
      const fileName = POST.querySelector('.portal fieldset:not(.hide)').dataset.name;
      SAVE.dataset.file = fileName;
      ACTF.textContent = fileName;
      SAVE.classList.remove('disable');
      PREV.classList.remove('disable');
      POST.elements['dirs'].classList.add('hide');
    };
    obsInsertTag = (form,editor1,tabname1,editor2,tabname2) => {
      const tabname = form.elements['paneltab'].dataset.currenttab;
      if (tabname === tabname1) editor1.addHtmlTag();
      else if (tabname === tabname2) editor2.addHtmlTag();
    }
    obsPage = () => {
      if (PAGBE.classList.contains('hide')) {
        SAVE.removeAttribute('data-file');
        SAVE.classList.add('disable');
        PREV.classList.add('disable');
        ACTF.textContent = '';
        const parts = new EditPage().parts;
        for (const part of parts) PAGE.elements[part].checked = true;
        // for (const part of parts) POST.elements[part].value = '';
        return;
      }
      const fileName = PAGE.querySelector('.portal fieldset:not(.hide)').dataset.name;
      SAVE.dataset.file = fileName;
      ACTF.textContent = fileName;
      SAVE.classList.remove('disable');
      PREV.classList.remove('disable');
    };
    obsArticleList = () => {

    };
    obsBasesTab = () => {
      const filename = BASE.elements['paneltab'].dataset.currenttab;
      SAVE.dataset.file = filename;
      ACTF.textContent = filename;
      // SAVE.classList.remove('disable');
    };
    const currentForm = new MutationObserver(obsForm);
    const currentPostFile = new MutationObserver(obsPost);
    const currentTab = new MutationObserver(() => obsInsertTag(POST,meBtnsPosCont,'contents',meBtnsPosDesc,'description'));
    const currentPageFile = new MutationObserver(obsPage);
    const currentThemaFile = new MutationObserver(obsBasesTab);
    const obsConfig = (attr) => {
      return {attributes: true, attributeFilter: [attr]};
    };
    currentForm.observe(H2SE, obsConfig('data-form'));
    currentPostFile.observe(POSBE, obsConfig('class'));
    currentTab.observe(POST.elements['paneltab'], obsConfig('data-currenttab'));
    currentPageFile.observe(PAGBE, obsConfig('class'));
    currentThemaFile.observe(BASE.elements['paneltab'], obsConfig('data-currenttab'));
    //for when app stating
    POST.elements['paneltab'].dataset.currenttab = 'contents';
    PAGE.elements['paneltab'].dataset.currenttab = 'contents';
  };
  LOAD.classList.add('hide');
});

                // insertDescription(doc,value) {
      //   const desc = doc.querySelector('.description');
      //   if (!desc) return;
      //   if (!value) {
      //     desc.remove();
      //     return;
      //   }
      //   desc.insertAdjacentHTML('afterbegin',value);
      // };
      // clickCopyFromHeadline() {
      //   this.form.elements['copybtn'].onclick = () => {
      //     const val = this.desc.getValue();
      //     const cleanText = val.replace(/<\/?[^>]+(>|$)/g, "");
      //     this.desc.value = cleanText;
      //   };
      // };
    // new EditPost().clickCopyFromHeadline();

            // const thmHandle = await dirHandle.getDirectoryHandle('thema',{create:true}); //dialog accept for save
    // await thmHandle.getDirectoryHandle('default',{create:true});
    // const themaDirsBox = [];
    // for await (const dir of thmHandle.values()) {
    //   if (dir.kind === 'directory') {
    //     themaDirsBox.push(dir);
    //     SETT.elements['thema'].insertAdjacentHTML('beforeend',`<option value="${dir.name}">${dir.name}</option>`);
    //   }
    // }
          // static selectedThema() {
      //   const value = SETT.elements['thema'].value;
      //   if (value) return value;
      //   SETT.elements['thema'].value = 'default';
      //   return 'default';
      // };
    // const themaBox = [];
    // const selectedThemaHdl = new EditFile(EditSetting.selectedThema(),themaDirsBox).handle();
    // for (themaFile of ['template.html','style.css','main.js']) {
    //   const fileHdl = await selectedThemaHdl.getFileHandle(themaFile,{create:true});
    //   themaBox.push(fileHdl);
    // }
    // console.log(themaBox)
          // static addThemaName() {
      //   const dirSelect = SETT.elements['thema'].value;
      //   THEM.elements['dir'].innerHTML = dirSelect;
      // };

    // const tmpHandle = await defHandle.getFileHandle('template.html',{create:true});
    // const styHandle = await defHandle.getFileHandle('style.css',{create:true});
    // const mjsHandle = await defHandle.getFileHandle('main.js',{create:true});

  // const defTemp = await fetch('default-template.html');
  // const defTempTxt = await defTemp.text();
  // const defStyl = await fetch('default-style.css');
  // const defStylTxt = await defStyl.text();

    // static opt = {
    //   common: {
    //     value: '\nAdd Headline\n',
    //     language: 'html',
    //     automaticLayout: true,
    //     scrollBeyondLastLine: false,
    //     isWholeLine: true,
    //     wordWrap: 'on',
    //     // wrappingStrategy: 'advanced',
    //     minimap: {enabled: false}
    //     // overviewRulerLanes: 0
    //   },
    //   headline: {
    //     value: '\nAdd Headline\n',
    //     language: 'html'
    //   },
    //   contents: {
    //     value: '\n<h2>Add Contents</h2>\n\n\n<ul class="sample">\n  <li></li>\n  <li></li>\n  <li></li></ul>',
    //     language: 'html'
    //   },
    //   template: {
    //     value: defTempTxt,
    //     language: 'html'
    //   },
    //   style: {
    //     value: defStylTxt,
    //     language: 'css'
    //   }
    // };
    // static mergeOpt(opt) {
    //   return Object.assign(this.opt.common, opt);
    // };


    //Post, Page
      // const elems = [[POSLI,POSBE,POSNW,EditPost,POST],[PAGLI,PAGBE,PAGNW,EditPage,PAGE]];
      // for (const elem of elems) {
        //click edit/close button
        // elem[0].onclick = async (e) => {
        //   if (e.target.tagName === 'BUTTON') {
        //     elem[1].classList.toggle('hide');
        //     e.target.classList.toggle('btn-close');
        //     elem[2].classList.toggle('hide');
        //     const fileName = e.target.parentNode.dataset.name;
        //     const fs = elem[4].querySelectorAll(`.artlist fieldset:not([data-name="${fileName}"])`);
        //     for (const f of fs) f.classList.toggle('hide');
        //     if (!elem[1].classList.contains('hide')) await new elem[3](fileName).loadElements();
        //   }
        // };
        //click new button
        // elem[2].elements['btn'].onclick = (e) => {
        //   const tas = elem[4].querySelectorAll('.text textarea');
        //   for (const ta of tas) ta.value = ''
        //   // elem[4].elements['contents'].value = '';
        //   elem[1].classList.toggle('hide');
        //   e.target.classList.toggle('btn-close');
        //   const fs = elem[0].querySelectorAll('fieldset');
        //   for (const f of fs) f.classList.toggle('hide');
        // };
        //input new name
        // elem[2].elements['name'].addEventListener('input', () => {
        //   const filename = elem[2].elements['name'].value;
        //   ACTF.textContent = `${filename}.html`;
        //   SAVE.dataset.file = `${filename}.html`;
        //   elem[2].dataset.name = `${filename}.html`;
        // });
        //.bench hide
        // elem[1].classList.toggle('hide');
        //check if exsits in template
        // const article = new elem[3]();
        // const tmpDoc = await article.templateToDoc();
        // for (const part of article.parts) {
        //   if (!tmpDoc.querySelector(`.${part}`)) {
        //     elem[4].elements[part].parentNode.classList.add('noexist');
        //     elem[4].elements[part].parentNode.setAttribute('title','This class does not exist in the template');
        //   }
        // }
        // if (!tmpDoc.querySelector('.top-image')) POST.elements['img'].parentNode.classList.add('noexist');

// /// Mutation Observer ///
//   obsForm = () => {
//     SAVE.removeAttribute('data-file');
//     ACTF.textContent = '';
//     SAVE.classList.add('disable');
//     PREV.classList.add('disable');
//     const form = H2SE.dataset.form;
//     if (form === 'post' || form === 'page') {
//       if(document.querySelector(`#${form} .bench`).className !== 'hide') {
//         const fileName = document.getElementById(form).querySelector('.portal fieldset:not(.hide)').dataset.name;
//         SAVE.dataset.file = fileName;
//         ACTF.textContent = fileName;
//         SAVE.classList.remove('disable');
//         PREV.classList.remove('disable');
//       }
//     }
//     else if (form === 'thema') {
//       const filename = THEM.elements['paneltab'].dataset.currenttab;
//       SAVE.dataset.file = filename;
//       ACTF.textContent = filename;
//       SAVE.classList.remove('disable');
//     }
//     else if (form === 'setting') {
//       SAVE.dataset.file = `${form}.html`;
//       ACTF.textContent = `${form}.html`;
//       SAVE.classList.remove('disable');
//     }
//   };
//   obsPost = () => {
//     if (POSBE.classList.contains('hide')) {
//       SAVE.removeAttribute('data-file');
//       SAVE.classList.add('disable');
//       PREV.classList.add('disable');
//       POST.elements['dirs'].classList.remove('hide');
//       ACTF.textContent = '';
//       const txtas = POST.querySelectorAll('.side textarea');
//       for (const txta of txtas) txta.value = '';
//       const parts = ['table-of-contents','comment','freespace'];
//       for (const part of parts) POST.elements[part].checked = true;
//       // for (const part of parts) POST.elements[part].value = '';
//       for (const span of POSTG.querySelectorAll('i')) span.removeAttribute('class');
//       return;
//     }
//     const fileName = POST.querySelector('.portal fieldset:not(.hide)').dataset.name;
//     SAVE.dataset.file = fileName;
//     ACTF.textContent = fileName;
//     SAVE.classList.remove('disable');
//     PREV.classList.remove('disable');
//     POST.elements['dirs'].classList.add('hide');
//   };
//   obsInsertTag = (form,editor1,tabname1,editor2,tabname2) => {
//     const tabname = form.elements['paneltab'].dataset.currenttab;
//     if (tabname === tabname1) editor1.addHtmlTag();
//     else if (tabname === tabname2) editor2.addHtmlTag();
//   }
//   obsPage = () => {
//     if (PAGBE.classList.contains('hide')) {
//       SAVE.removeAttribute('data-file');
//       SAVE.classList.add('disable');
//       PREV.classList.add('disable');
//       ACTF.textContent = '';
//       const txtas = PAGE.querySelectorAll('.side textarea');
//       for (const txta of txtas) txta.value = '';
//       const parts = ['table-of-contents'];
//       for (const part of parts) POST.elements[part].checked = true;
//       // for (const part of parts) POST.elements[part].value = '';
//       return;
//     }
//     const fileName = PAGE.querySelector('.portal fieldset:not(.hide)').dataset.name;
//     SAVE.dataset.file = fileName;
//     ACTF.textContent = fileName;
//     SAVE.classList.remove('disable');
//     PREV.classList.remove('disable');
//   };
//   obsBasesTab = () => {
//     const filename = THEM.elements['paneltab'].dataset.currenttab;
//     SAVE.dataset.file = filename;
//     ACTF.textContent = filename;
//     // SAVE.classList.remove('disable');
//   };
//   const currentForm = new MutationObserver(obsForm);
//   const currentPostFile = new MutationObserver(obsPost);
//   const currentTab = new MutationObserver(() => obsInsertTag(POST,meBtnsPosCont,'contents',meBtnsPosHead,'headline'));
//   const currentPageFile = new MutationObserver(obsPage);
//   const currentThemaFile = new MutationObserver(obsBasesTab);
//   const obsConfig = (attr) => {
//     return {attributes: true, attributeFilter: [attr]};
//   };
//   currentForm.observe(H2SE, obsConfig('data-form'));
//   currentPostFile.observe(POSBE, obsConfig('class'));
//   currentTab.observe(POST.elements['paneltab'], obsConfig('data-currenttab'));
//   currentPageFile.observe(PAGBE, obsConfig('class'));
//   currentThemaFile.observe(THEM.elements['paneltab'], obsConfig('data-currenttab'));
//   //for when app stating
//   POST.elements['paneltab'].dataset.currenttab = 'contents';
//   PAGE.elements['paneltab'].dataset.currenttab = 'contents';

  // const obsConfig1 = {
  //   attributes: true,
  //   attributeFilter: ['data-form']
  // };
  // const obsConfig2 = {
  //   attributes: true,
  //   attributeFilter: ['class']
  // };
  // const obsConfig3 = {
  //   attributes: true,
  //   attributeFilter: ['data-currenttab']
  // };

  // class TextEditor {
  //   constructor() {
  //     const section = H2SE.dataset.section;
  //     this.ta = document.querySelector(`#${section} .text textarea:not(.hide)`);
  //     let path = '../../'
  //     if (section === 'page') path = '../';
  //     this.path = path;
  //   };
  //   addTag(btnTxt) {
  //     if (btnTxt === "p") this.surroundSelectedText('<p>','</p>\n');
  //     else if (btnTxt === "br") this.insertText('<br />\n');
  //     else if (btnTxt === "b") this.surroundSelectedText('<b>','</b>');
  //     else if (btnTxt === "h2") this.surroundSelectedText('<h2>','</h2>\n');
  //     else if (btnTxt === "h3") this.surroundSelectedText('<h3>','</h3>\n');
  //     else if (btnTxt === "h4") this.surroundSelectedText('<h4>','</h4>\n');
  //     else if (btnTxt === "a") this.surroundSelectedText('<a href="" target="_blank">','</a>');
  //     else if (btnTxt === "small") this.surroundSelectedText('<small>','</small>');
  //     else if (btnTxt === "big") this.surroundSelectedText('<big>','</big>');
  //     else if (btnTxt === "strong") this.surroundSelectedText('<strong>','</strong>');
  //     else if (btnTxt === "mark") this.surroundSelectedText('<mark>','</mark>');
  //     else if (btnTxt === "ul") this.insertText('<ul>\n  <li></li>\n  <li></li>\n  <li></li>\n</ul>\n');
  //     else if (btnTxt === "code") this.surroundSelectedText('<code>','</code>');
  //     else if (btnTxt === "pre code") this.surroundSelectedText('<pre><code>\n','</code></pre>\n');
  //     else if (btnTxt === "textarea") this.surroundSelectedText('<textarea>','</textarea>\n');
  //     else if (btnTxt === "img") this.insertText('<img src="" alt="" target="_blank" />');
  //     else if (btnTxt === "q") this.surroundSelectedText('<q>','</q>');
  //     else if (btnTxt === "blockquote") this.surroundSelectedText('<blockquote>','</blockquote>\n');
  //     else if (btnTxt === "table") this.insertText('<table>\n  <tr><th></th><th></th></tr>\n  <tr><td></td><td></td></tr>\n</table>\n');
  //     else if (btnTxt === "i") this.surroundSelectedText('<i>','</i>');
  //     else if (btnTxt === "h5") this.surroundSelectedText('<h5>','</h5>\n');
  //     else if (btnTxt === "h6") this.surroundSelectedText('<h6>','</h6>\n');
  //     else if (btnTxt === "s") this.surroundSelectedText('<s>','</s>');
  //     else if (btnTxt === "ol") this.insertText('<ol>\n<li></li>\n<li></li>\n<li></li>\n</ol>\n');
  //   };
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
  //   surroundSelectedText(before,after) {
  //     const selection = this.getSelection();
  //     this.ta.value = this.ta.value.slice(0, selection.start) + before + selection.text + after + this.ta.value.slice(selection.end);
  //     this.ta.selectionEnd = selection.end + before.length + after.length;
  //     this.ta.blur();
  //     this.ta.focus();
  //   };
  //   insertText(text) {
  //     const selection = this.getSelection();
  //     this.ta.value = this.ta.value.slice(0, selection.start) + text + this.ta.value.slice(selection.end);
  //     this.ta.selectionEnd = selection.end + text.length;
  //     this.ta.blur();
  //     this.ta.focus();
  //   };
  // };

  // class AList extends TextEditor {
  //   addA() {
  //     LINKS.classList.toggle('hide');
  //     IMAGS.classList.add('hide');
  //     LINKS.querySelector('div').onclick = (e) => {
  //       if (e.target.tagName === 'P') {
  //         const dirName = LINKS.elements['dirs'].value;
  //         this.insertText(`<a href="${this.path}post/${dirName}/${e.target.dataset.name}" target="_blank">${e.target.dataset.title}</a>`);
  //       }
  //     }
  //   };
  //   static async addList(dirName) {
  //     LINKS.querySelector('div').textContent ='';
  //     const data = await EditPost.latestDataInDir(dirName);
  //     for (const d of data) LINKS.querySelector('div').insertAdjacentHTML('beforeend',`<p data-name="${d[0]}" data-title="${d[1]}">${d[3]}<br />${d[1]}<br />${d[0]}</p>`);
  //     LINKS.elements['dirs'].value = dirName;
  //   };
  //   static addDirs() {
  //     LINKS.elements['dirs'].textContent ='';
  //     for (const handle of postBox.values()) {
  //       if (handle.kind === 'directory') LINKS.elements['dirs'].insertAdjacentHTML('beforeend',`<option value="${handle.name}">${handle.name}</option>`);
  //     }
  //     LINKS.elements['dirs'].value = date.year();
  //   };
  // };
  // class ImgList extends TextEditor {
  //   addImgTag() {
  //     IMAGS.classList.toggle('hide');
  //     LINKS.classList.add('hide');
  //     IMAGS.querySelector('div').onclick = (e) => {
  //       if (e.target.tagName === 'IMG') {
  //         const dirName = IMAGS.elements['dirs'].value;
  //         this.insertText(`<img src="${this.path}media/${dirName}/${e.target.title}" alt="" />\n`);
  //       }
  //     }
  //   };
  //   async addImgPath() {
  //     IMAGS.classList.toggle('hide');
  //     LINKS.classList.add('hide');
  //     EditMedia.addDirs();
  //     await EditMedia.addList(date.year());
  //     IMAGS.querySelector('div').onclick = (e) => {
  //       if (e.target.tagName === 'IMG') {
  //         POST.elements['img'].value = `media/${IMAGS.elements['dirs'].value}/${e.target.title}`;
  //       }
  //     }
  //   };
  // };
  // class Custom extends TextEditor {
  //   addCustomTag(tag) {
  //     this.insertText(tag);
  //   };
  //   static replaceBtn() {
  //     const ctm = SETT.elements['custom-editor'].value;
  //     POST.elements['panelbtns'].innerHTML = ctm;
  //     PAGE.elements['panelbtns'].innerHTML = ctm;
  //   };
  // };

  // const lists = [[LINKS,AList],[IMAGS,EditMedia]];
  // for (const list of lists) {
  //   list[0].elements['dirs'].addEventListener('input', async () => {
  //     const dirName = list[0].elements['dirs'].value;
  //     await list[1].addList(dirName);
  //   });
  //   list[0].elements['btn'].onclick = () => list[0].classList.add('hide');
  //   list[1].addList(date.year());
  //   list[1].addDirs();
  // }
        //click text editor panel
        // elem[4].elements['panelbtns'].onclick = (e) => {
        //   if (e.target.tagName === 'I') new TextEditor().addTag(e.target.textContent);
        //   else if (e.target.title === 'link') new AList(elem[4]).addA();
        //   else if (e.target.title === 'img') new ImgList(elem[4]).addImgTag();
        //   else if (e.target.tagName === 'U') new Custom(elem[4]).addCustomTag(e.target.title);
        // };


    // require(['vs/editor/editor.main'], function () {
    // });

      // const monacoElems = [
      //   ['headline','html','Add headline'],
      //   ['contents','html',['','<h2>Add Contents</h2>','','','<ul class="sample">','  <li></li>','  <li></li>','  <li></li>','</ul>'].join('\n')],
      //   ['template','html',defTempTxt],
      //   ['style','css',defStylTxt]
      // ];
      // for (const edit of monacoElems) {
      //   monaco.editor.create(document.getElementById(edit[0]), {
      //     value: edit[2],
      //     language: edit[1],
      //     automaticLayout: true,
      //     scrollBeyondLastLine: false,
      //     wordWrap: 'on',
      //     // wrappingStrategy: 'advanced',
      //     minimap: {enabled: false},
      //     overviewRulerLanes: 0
      //   });
      // }

      // var meTemp = monaco.editor.create(document.getElementById('template'), {
      //   value: defTempTxt,
      //   language: "html",
      //   automaticLayout: true,
      //   scrollBeyondLastLine: false,
      //   wordWrap: 'on',
      //   wrappingStrategy: 'advanced',
      //   minimap: {enabled: false},
      //   overviewRulerLanes: 0
      // });
      // var meStyl = monaco.editor.create(document.getElementById('style'), {
      //   value: ["html{ color: red;}"].join("\n"),
      //   language: "css",
      //   automaticLayout: true
      // });

    //ace editor
    // const temp = ace.edit("template");
    // const styl = ace.edit("style");
    // for (const edit of [[temp,'html','template'],[styl,'css','style']]) {
    //   edit[0].$blockScrolling = Infinity;
    //   edit[0].setFontSize(14);
    //   edit[0].getSession().setMode(`ace/mode/${edit[1]}`);
    //   // edit.insert('Add Template');
    //   edit[0].getSession().setUseWrapMode(true);
    //   edit[0].setShowPrintMargin(false);
    //   fetch(`default-${edit[2]}.${edit[1]}`).then((response) => {
    //     return response.text();
    //   }).then((code) => {
    //     edit[0].session.setValue(code);
    //   });
    // }

    // fetch('default-template.html').then((response) => {
    //   return response.text();
    // }).then((html) => {
    //   // THEM.elements['template'].value = html;
    //   temp.session.setValue(html);
    // });
    // fetch('default-style.css').then((response) => {
    //   return response.text();
    // }).then((css) => {
    //   // THEM.elements['style'].value = css;
    // });

    //Code Mirror
    // const cmTemplate = CodeMirror.fromTextArea(THEM.elements['template'],
    // {
    //   mode:"htmlmixed",
    //   lineNumbers: true,
    //   lineWrapping: true
    // });
    // const cmStyle = CodeMirror.fromTextArea(THEM.elements['style'],
    // {
    //   mode:"css",
    //   lineNumbers: true,
    //   lineWrapping: true
    // });
// const paneltab = (form,e) => {
//   const inputs = form.elements['paneltab'].querySelectorAll('input');
//   for (const input of inputs) input.classList.remove('on');
//   if (e.target.tagName === 'INPUT') e.target.classList.toggle('on');
//   const tas = form.querySelectorAll('.text textarea.source-code');
//   for (const ta of tas) ta.nextElementSibling.classList.add('hide');
//   form.elements[e.target.value.toLowerCase()].nextElementSibling.classList.remove('hide');
// };
// POST.elements['paneltab'].onclick = (e) => paneltab(POST,e);
// THEM.elements['paneltab'].onclick = (e) => {
//   paneltab(THEM,e);
//   const on = THEM.elements['paneltab'].querySelector('input.on');
//   THEM.elements['paneltab'].setAttribute('data-section',on.dataset.name);
// };
// THEM.elements['style'].nextElementSibling.classList.add('hide');
// fetch('default-template.html').then((response) => {
//   return response.text();
// }).then((html) => {
//   const doc = cmTemplate.getDoc();
//   doc.setValue(html);
//   cmTemplate.clearHistory();
// });
// fetch('default-style.css').then((response) => {
//   return response.text();
// }).then((css) => {
//   const doc = cmStyle.getDoc();
//   doc.setValue(css);
//   cmStyle.clearHistory();
// });

    // else if (section === 'template' || section === 'setting') {
    //   SAVE.dataset.file = `${section}.html`;
    //   ACTF.textContent = `${section}.html`;
    //   SAVE.classList.remove('disable');
    // }
    // else if (section === 'style') {
    //   SAVE.dataset.file = `${section}.css`;
    //   ACTF.textContent = `${section}.css`;
    //   SAVE.classList.remove('disable');
    // }

    // class HandleFavicon extends EditTextFile {
    //   constructor(fileName,box) {
    //     super(fileName,box);
    //     this.fileName = 'favicon.svg';
    //     this.box = singleBox;
    //     this.url = 'favicon.svg';
    //   };
    // };
    // class HandleMainJS extends EditTextFile {
    //   constructor(fileName,box) {
    //     super(fileName,box);
    //     this.fileName = 'main.js';
    //     this.box = singleBox;
    //     this.url = 'default-main.js'
    //   };
    // };
    // const favicon = new HandleFavicon();
    // const mainjs = new HandleMainJS();

        //load files
        // EditBases.addDirs();
        // for (const file of [template,style,setting]) await file.load();
        // EditBases.printDir();

        // const value = SETT.elements['thema'].value;
        // SETT.elements['thema'].querySelector(`option[value="${value}"]`).setAttribute('selected','selected');

    // class HandleTemplate extends EditTextFile {
    //   constructor(fileName,box) {
    //     super(fileName,box);
    //     this.fileName = 'template.html';
    //     this.box = singleBox;
    //     this.url = 'default-template.html';
    //     this.ta = THEM.elements['template'];
    //   };
    //   document() {
    //     return DOMP.parseFromString(this.ta.value,'text/html');
    //   };
    // };
    // class HandleStyle extends EditTextFile {
    //   constructor(fileName,box) {
    //     super(fileName,box);
    //     this.fileName = 'style.css';
    //     this.box = singleBox;
    //     this.url = 'default-style.css';
    //     this.ta = THEM.elements['style'];
    //   };
    //   document() {
    //     return DOMP.parseFromString(this.ta.value,'text/html');
    //   };
    // };

  // const STYL = document.forms['style'];
  // const TEMP = document.forms['template'];

    // const postFolders = [];
    // for (const folder of postBox.values()) {
    //   if (folder.kind === 'directory') postFolders.push(folder.name);
    // };

    //adjust Height
    // const fh = document.querySelector('form').offsetHeight;
    // const nh = POSNW.offsetHeight;
    // const ph = document.querySelector('.panel').offsetHeight;
    // const ch = fh - (nh + ph) + 'px';
    // POST.elements['ta'].style.height = ch;
    // PAGE.elements['ta'].style.height = ch;

      // const monthInt = date.month().replace(/\b0+/, '');

// const DATE = new Date().toISOString();
// nowYmdTime: () => {
//   return DATE.slice(0,16); //2021-05-26T14:00
// },
// nowYmd: () => {
//   return DATE.slice(0,10); //2021-05-26
// },
// nowYear: () => {
//   return DATE.slice(0,4); //2021
// },

// const postFolders = [];
// for (const folder of postBox.values()) {
//   if (folder.kind === 'directory') postFolders.push(folder.name);
// };
// const mediaFolders = [];
// for (const folder of mediaBox.values()) {
//   if (folder.kind === 'directory') mediaFolders.push(folder.name);
// };

      // editParts(doc) {
      //   for(const part of POSPA) {
      //     if (!POST.elements[part].checked) doc.querySelector(`.${part}`).remove();
      //   }
      //   //table of contents
      //   const elem = doc.querySelector('.table-of-contents');
      //   if (!elem) return;
      //   const cnt = doc.querySelector('.contents');
      //   const h23 = cnt.querySelectorAll('h2,h3');
      //   if (!h23) {
      //     elem.remove();
      //     return;
      //   }
      //   elem.innerHTML += '<ul></ul>';
      //   const h2Ul = elem.querySelector('ul');
      //   for (let i = 0; i < h23.length; i++) {
      //     const htx = h23[i].textContent;
      //     const tgn = h23[i].tagName;
      //     if (tgn === 'H2') h2Ul.innerHTML += `<li><a href="#index${i}">${htx}</a></li>\n<ul></ul>\n`;
      //     if (tgn === 'H3') {
      //       const preUl = h2Ul.querySelector('ul:last-child');
      //       const h3Li = `<li><a href="#index${i}">${htx}</a></li>\n`;
      //       if (preUl) preUl.innerHTML += h3Li;
      //       else h2Ul.innerHTML += h3Li;
      //     }
      //     h23[i].setAttribute('id',`index${i}`);
      //   }
      //   const h3Uls = h2Ul.querySelectorAll('ul');
      //   for (const h3Ul of h3Uls) {
      //     if (!h3Ul.textContent) h3Ul.remove();
      //   }
      // };

      // static async addList(dirName) {
      //   IMAGS.querySelector('div').textContent ='';
      //   const dHandle = mediaBox.find(({name}) => name === dirName);
      //   for await (const file of dHandle.values()) {
      //     if (file.kind === 'file') {
      //       if (file.name.match(/(.jpg|.jpeg|.png|.gif|.apng|.svg|.jfif|.pjpeg|.pjp|.ico|.cur)/i)) {
      //         const url = await new ViewImg(file.name).url(dirName);
      //         IMAGS.querySelector('div').innerHTML += `<img src="${url}" title="${file.name}" loading="lazy" />`;
      //       }
      //     }
      //   }
      //   IMAGS.elements['dirs'].value = dirName;
      // };
      // static addFolders() {
      //   IMAGS.elements['dirs'].textContent ='';
      //   for (const handle of mediaBox.values()) {
      //     if (handle.kind === 'directory') IMAGS.elements['dirs'].insertAdjacentHTML('beforeend',`<option value="${handle.name}">${handle.name}</option>`);
      //   }
      //   IMAGS.elements['dirs'].value = date.nowYear();
      // };

        // const elems =[['[rel=stylesheet]','href','site/style.css'],['script','src','site/main.js'],['[rel=icon]','href','site/favicon.svg']];
        // for (const elem of elems ) doc.head.querySelector(elem[0]).setAttribute(elem[1],elem[2]);
        // const imgs = doc.querySelectorAll('img');
        // for (const img of imgs) {
        //   const src = img.getAttribute('src');
        //   const presrc = src.replace('media','site/media');
        //   img.setAttribute('src',presrc);
        // }

    //page lister
    // addPageList = async () => {
    //   PAGBE.classList.add('hide');
    //   PAGLI.textContent = '';
    //   PAGNW.elements['btn'].classList.remove('btn-close');
    //   for (const file of pageBox.values()) {
    //     if (file.kind === 'file') {
    //       const page = new EditPage(file.name);
    //       const pdoc = await page.document();
    //       const title = page.loadTitle(pdoc);
    //       PAGLI.insertAdjacentHTML('beforeend',`<fieldset data-name="${file.name}"><input value="${title}"><u>${file.name}</u><button type="button" class="btn-edit"></button></fieldset>`);
    //     }
    //   }
    // };

    //post lister obj
    // const latestPosts = {
    //   latestDirs: () => {
    //     return postFolders.sort((a, b) => b - a);
    //   },
    //   addDirsList: () => {
    //     const dirs = latestPosts.latestDirs();
    //     for (const dir of dirs) {
    //       POST.elements['dirs'].insertAdjacentHTML('beforeend',`<option value="${dir}" class="dirs">${dir}</option>`);
    //     }
    //     POST.elements['dirs'].value = date.nowYear();
    //   },
    //   getPostData: async(fileName,dirName) => {
    //     const post = new EditPost(fileName);
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
    //     const dHandle = postBox.find(({name}) => name === dirName);
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
    //     const dirs = latestPosts.latestDirs();
    //     const allData = [];
    //     for (const dir of dirs) {
    //       const data = await latestPosts.makeOneDirData(dir);
    //       allData.push(...data);
    //     }
    //     console.log(allData)
    //     return allData;
    //   },
    //   addListOfDir: async(dirName) => {
    //     POSBE.classList.add('hide');
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
    //       elem.insertAdjacentHTML('beforeend',`<div class="${classes.trim()} dir-${d[2]}"><a href="./post/${d[2]}/${d[0]}"><h3>${d[1]}</h3>${mid}<p class="time"><time>${date.changeFormat(d[3])}</time>${d[6]}</p></a></div>\n`);
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
        //   const parentName = await new EditPost(fileName).parentName();
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
//     const parentName = await new EditPost(fileName).parentName();
//     const data = await latestPosts.getPostData(fileName,parentName);
//     elem.insertAdjacentHTML('beforeend',`<div><a href="../../post/${data[4]}/${data[1]}">${data[6]}<h3>${data[3]}</h3><p><time>${data[2]}</time>${data[7]}</p></a></div>\n`);
//   }
// },

    // const sitHandle = await webHandle.getFileHandle('sitemap.xml',{create:true});

        // class HandleSitemap extends EditTextFile {
    //   constructor(fileName,box) {
    //     super(fileName,box);
    //     this.fileName = 'sitemap.xml';
    //     this.box = singleBox;
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
    //     for (const file of pageBox.values()) {
    //       if (file.kind === 'file') {
    //         const doc = await new EditPage(file.name).document();
    //         const date = doc.head.querySelector('[name="date"]')?.getAttribute('content')?? date.ymd();
    //         urlset.innerHTML += `<url><loc>${url}page/${file.name}</loc><lastmod>${date}</lastmod></url>\n`;
    //       }
    //     }
    //     for (const file of postBox.values()) {
    //       if (file.kind === 'file') {
    //         const post = await new EditPost(file.name);
    //         const doc = await post.document();
    //         const date = doc.head.querySelector('[name="date"]')?.getAttribute('content')?? date.ymd();
    //         const dir = await post.parentName();
    //         urlset.innerHTML += `<url><loc>${url}post/${dir}/${file.name}</loc><lastmod>${date}</lastmod></url>\n`;
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
    //   latestDirs() {
    //     return this.postFolders.sort((a, b) => b - a);
    //   };
    //   insertFolders() {
    //     const dirs = this.latestDirs();
    //     for (const dir of dirs) {
    //       POST.elements['dirs'].insertAdjacentHTML('beforeend',`<option value="${dir}" class="dirs">${dir}</option>`);
    //     }
    //     POST.elements['dirs'].value = date.syear();
    //   };
    //   async getPostData(fileName,dirName) {
    //     const doc = await new EditPost(fileName).document();
    //     const tit = doc.querySelector('.title')?.textContent?? '';
    //     const dti = doc.querySelector('time')?.getAttribute('datetime')?? '';
    //     const rti = dti.replace('T','.').replace(/[^0-9\.]/g,'');
    //     const tim = doc.querySelector('time')?.textContent?? '';
    //     const tif = doc.querySelector('.top-image')?.innerHTML?? '';
    //     const tgs = doc.querySelector('.tags')?.innerHTML?? '';
    //     return [rti,fileName,tim,tit,dirName,dti,tif,tgs];
    //   };
    //   async makeOneDirData(dirName) {
    //     const fldHandle = postBox.find(({name}) => name === dirName);
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
    //     const dirs = this.latestDirs();
    //     let makeAllData = [];
    //     for (const dir of dirs) {
    //       const data = await this.makeOneDirData(dir)
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
    //       const parentName = await new EditPost(fileName).parentName();
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
    //       elem.insertAdjacentHTML('beforeend',`<div class="${classes.trim()} dir-${data[i][4]}"><a href="./post/${data[i][4]}/${data[i][1]}">${data[i][6]}<h3>${data[i][3]}</h3><p><time>${data[i][2]}</time>${data[i][7]}</p></a></div>\n`);
    //     }
    //   };
    // };
    // const latestPosts = new PostLister();

    // class AllpostJS extends EditFile {
    //   constructor(fileName,box) {
    //     super(fileName,box);
    //     this.fileName = 'allpost.js';
    //     this.box = singleBox;
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
//     const dirs = BTNPS[0].querySelectorAll('.on');
//     const tags = BTNPS[1].querySelectorAll('.on');
//     for (const dir of dirs) {
//       const dirName = dir.dataset.btn;
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
//       const dirs = BTNPS[0].querySelectorAll('.on');
//       const spans = BTNPS[1].querySelectorAll('span');
//       for (const dir of dirs) {
//         const dirName = dir.dataset.btn;
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

        //doc.querySelector('.title').textContent = 'EditPost Map';
        // mabp[1].insertAdjacentHTML('beforeend','<span data-btn="tag-No-Tag" class="on">No Tag</span>');
        // mabp[2].insertAdjacentHTML('beforeend','<b class="allclear-btn">All Clear</b><b class="allview-btn">All View</b>');
        //cnt.insertAdjacentHTML('afterbegin','<div class="latest-posts"></div>');
// LINKS.elements['btn'].onclick = () => LINKS.classList.add('hide');
// IMAGS.elements['btn'].onclick = () => IMAGS.classList.add('hide');

    //AList.addFolders();
    // AList.addList(date.syear());
    //ImgList.addFolders();
    // ImgList.addList(date.syear());
  //   IMAGS.elements['dirs'].addEventListener('input', async () => {
  //     const dirName = IMAGS.elements['dirs'].value;
  //     await ImgList.addList(dirName);
  //   });
    //Edit-Close button
    // POSLI.onclick = async (e) => {
    //   if (e.target.tagName === 'BUTTON') {
    //     POSBE.classList.toggle('hide');
    //     e.target.classList.toggle('btn-close');
    //     POSNW.classList.toggle('hide');
    //     POST.elements['dirs'].classList.toggle('hide');
    //     const fileName = e.target.parentNode.dataset.name;
    //     const fs = document.querySelectorAll(`#post-list fieldset:not([data-name="${fileName}"])`);
    //     for (const f of fs) f.classList.toggle('hide');
    //     if (POSBE.classList.contains('hide') === false) await new EditPost(fileName).loadElements();
    //   }
    // };
    // POSNW.elements['btn'].onclick = (e) => {
    //   POST.elements['ta'].value = '';
    //   POSBE.classList.toggle('hide');
    //   POST.elements['dirs'].classList.toggle('hide');
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
    //   const folder = mediaBox.find(({name}) => name === dirName);
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
    //   for (const handle of mediaBox.values()) {
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
    //   await new EditFile(singleBox,'index.html').writeHTML(d);
    // };
    // addFolders = () => {
    //   const dirs = sortNewerYear();
    //   for (const year of dirs) {
    //     POST.elements['dirs'].insertAdjacentHTML('beforeend',`<option value="${year}" class="dirs">${year}</option>`);
    //   }
    //   POST.elements['dirs'].value = date.syear();
    // };
    // insertYearPostList = async (yearName,elem) => {
    //   const y = postBox.find(({name}) => name === yearName);
    //   let data = [];
    //   for await (const file of y.values()) {
    //     if (file.kind === 'file') {
    //       const o = await new EditPost(file.name).document();
    //       const d = o.querySelector('time')?.getAttribute('datetime')?? '';
    //       const t = o.querySelector('time')?.textContent?? '';
    //       const h = o.querySelector('h1')?.textContent?? '';
    //       const e = d.replace(/[^0-9]/g, '');
    //       data.push([ e, file.name, t, h, yearName, d]);
    //     }
    //     data.sort((a, b) => b[0] - a[0]);
    //   }
    //   if (POSBE.classList.contains('hide') === true) {
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
    //   let dirs = [];
    //   for (const year of postBox.values()) {
    //     if (year.kind === 'directory') dirs.push(year.name);
    //   }
    //   dirs.sort((a, b) => b - a);
    //   return dirs;
    // };
    // sortNewerAllPost = async (elm) => {
    //   const dirs = sortNewerYear();
    //   for await (const year of dirs) await insertYearPostList(year,elm);
    // };
  //Post
    // preSaveNewPost = async () => {
    //   const f = postBox.find(({name}) => name === date.syear());
    //   const n = await f.getFileHandle(`${t}.html`,{create:true});
    //   postBox.push(n);
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
