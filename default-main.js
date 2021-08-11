// default main.js

document.addEventListener('DOMContentLoaded', () => {
  
  // responsive menu
  const PAGLI = document.querySelector('.page-list');
  document.getElementById('menu-icon').onclick = (e) => {
    PAGLI.classList.toggle('show');
    if (PAGLI.classList.contains('show') === true) e.target.classList.add('close-btn');
    else e.target.classList.remove('close-btn');
  };

  //Used only in allpost.html
  if (document.URL.match('allpost.html')) {
    const LATPO = document.querySelector('.latest-posts');
    const POSTS = LATPO.querySelectorAll('div');
    const POSBT = document.querySelector('.allpost-btns');
    const BTNPS = POSBT.querySelectorAll('p');
    viewSwitch = (e) => {
      e.target.classList.toggle('on');
      for (const post of POSTS) post.classList.add('hide');
      const dirs = BTNPS[0].querySelectorAll('.on');
      const tags = BTNPS[1].querySelectorAll('.on');
      for (const dir of dirs) {
        const fldName = dir.dataset.btn;
        for (const tag of tags) {
          const tagName = tag.dataset.btn;
          const acts = LATPO.querySelectorAll(`.${tagName}.${fldName}`);
          for (const act of acts) act.classList.remove('hide');
        }
      }
    };
    POSBT.onclick = (e) => {
      if (e.target.tagName === 'U') viewSwitch(e);
      else if (e.target.tagName === 'SPAN') viewSwitch(e);
      else if (e.target.className === 'allclear-btn') {
        for (const post of POSTS) post.classList.add('hide');
        const ons = BTNPS[1].querySelectorAll('.on');
        for (const on of ons) on.classList.remove('on');
      }
      else if (e.target.className === 'allview-btn') {
        const dirs = BTNPS[0].querySelectorAll('.on');
        const spans = BTNPS[1].querySelectorAll('span');
        for (const dir of dirs) {
          const dirName = dir.dataset.btn;
          for (const span of spans) {
            span.classList.add('on');
            const tagName = span.dataset.btn;
            const acts = LATPO.querySelectorAll(`.${tagName}.${dirName}`);
            for (const act of acts) act.classList.remove('hide');
          }
        }
      }
    };
  };

  //Used only in search.html
  if (document.URL.match('search.html')) {
    const DOM = new DOMParser();
    const BOX = document.getElementById('search-box');
    const CNT = document.querySelector('.contents');
    const fetchToDoc = async (url) => {
      const response = await fetch(url);
      const html = await response.text();
      return DOM.parseFromString(html,'text/html');
    };
    const search = async () => {
      CNT.textContent = '';
      const word = BOX.elements['txt'].value;
      if (word === '') return CNT.textContent = 'Input is empty.';
      const doc = await fetchToDoc('allpost.html');
      const divs = doc.querySelectorAll('.latest-posts div');
      const paas = doc.querySelectorAll('.page-list a');
      //Search Post
      let postData = [];
      for (const div of divs) {
        const path = div.querySelector('a').getAttribute('href');
        const title = div.querySelector('h3').textContent;
        const time = div.querySelector('time').textContent;
        postData.push([path,title,time]);
      }
      for (const data of postData) {
        const doc = await fetchToDoc(data[0]);
        const alltxt = doc.querySelector('main')?.textContent?? '';
        const result = alltxt.includes(word);
        if (result === true) CNT.insertAdjacentHTML('beforeend',`<p>● Post ${data[2]} <a href="${data[0]}" target="_blank">${data[1]}</a></p>\n`);
      }
      //Search Page
      let pageData = [];
      for (const paa of paas) {
        const path = paa.getAttribute('href');
        const title = paa.textContent;
        pageData.push([path,title]);
      }
      for (const data of pageData) {
        const doc = await fetchToDoc(data[0]);
        const alltxt = doc.querySelector('main')?.textContent?? '';
        const result = alltxt.includes(word);
        if (result === true) CNT.insertAdjacentHTML('beforeend',`<p>● Page <a href="${data[0]}" target="_blank">${data[1]}</a></p>\n`);
      }
      if (CNT.textContent === '') CNT.textContent = `Not found in "${word}".`;
    };
    BOX.elements['btn'].onclick = async () => await search();
    BOX.elements['txt'].addEventListener('keydown', async (e) => {
      if (e.keyCode === 13) {
        e.preventDefault();
        await search();
      }
    });
  };
});