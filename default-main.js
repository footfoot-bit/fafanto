// default main.js

document.addEventListener('DOMContentLoaded', () => {
  
  // headerのレスポンシブメニュー
  document.querySelector('.menu-icon').onclick = (e) => {
    const PAGLI = document.querySelector('.page-list');
    PAGLI.classList.toggle('show');
    document.querySelector('.head-icons').classList.toggle('show');
    if (PAGLI.classList.contains('show')) e.target.classList.add('close-btn');
    else e.target.classList.remove('close-btn');
  };

  // ポスト画像をズーム（横幅がPCの場合のみ）
  if (document.URL.match('/post/') && window.innerWidth >= 1040) {
    const thumb = document.querySelector('.thumbnail img');
    if (thumb) thumb.onclick = (e) => e.target.classList.toggle('img-zoom');
    const imgs = document.querySelectorAll('.contents img');
    if (imgs.length) for (const img of imgs) img.onclick = (e) => e.target.classList.toggle('img-zoom');
  };

  // postfilter.htmlのフィルター機能
  if (document.URL.match('postfilter.html')) {
    const POLIS = document.querySelectorAll('.postlist > li');
    const FIDIV = document.querySelectorAll('.filter-btns > div');
    const SPANS = FIDIV[0].querySelectorAll('span');
    const togglePostLink = (e) => {
      e.target.classList.toggle('on');
      for (const li of POLIS) li.classList.add('hide');
      const onTags = FIDIV[0].querySelectorAll('.on');
      for (const onTag of onTags) {
        const tagName = onTag.textContent;
        for (const li of POLIS) {
          const is = li.querySelectorAll('i');
          if (is.length) for (const i of is ) if (i.textContent === tagName) li.classList.remove('hide');
          const ymdTime = li.querySelector('time')?.getAttribute('datetime')?? '';
          if (ymdTime) if (ymdTime.slice(0,4) === tagName) li.classList.remove('hide');
        }
      }
    };
    const allClear = () => {
      for (const li of POLIS) li.classList.add('hide');
      for (const span of SPANS) span.classList.remove('on');
    };
    document.querySelector('.filter-btns').onclick = (e) => {
      if (e.target.tagName === 'SPAN') togglePostLink(e);
      else if (e.target.className === 'allclear-btn') allClear();
      else if (e.target.className === 'allview-btn') {
        for (const li of POLIS) li.classList.remove('hide');
        for (const span of SPANS) span.classList.add('on');
      }
    };
    const tagStr = new URLSearchParams(window.location.search);
    const tagName = tagStr.get('tag');
    if (tagName) {
      allClear();
      for (const span of SPANS) if (span.textContent === tagName) return span.click();
    }
  };

  // search.htmlの検索機能。（1単語のみ）
  if (document.URL.match('search.html')) {
    const BOX = document.getElementById('search-box');
    const CNT = document.querySelector('.contents');
    const fetchToDoc = async (url) => {
      const response = await fetch(url);
      const html = await response.text();
      return new DOMParser().parseFromString(html,'text/html');
    };
    const search = async () => {
      CNT.textContent = '';
      const word = BOX.elements['word'].value;
      if (!word) return CNT.textContent = 'Input is empty.';
      const doc = await fetchToDoc('postfilter.html');
      const lis = doc.querySelectorAll('.postlist > li');
      const pas = doc.querySelectorAll('.page-list a');
      //ポスト
      let postsData = [];
      for (const li of lis) {
        const path = li.querySelector('a').getAttribute('href');
        const title = li.querySelector('p').textContent;
        const time = li.querySelector('time')?.textContent?? '';
        postsData.push([path,title,time]);
      }
      for (const pd of postsData) {
        const doc = await fetchToDoc(pd[0]);
        const alltxt = [];
        for (const elem of ['.title','.description','.contents']) alltxt.push(doc.querySelector(elem)?.textContent?? '');
        const joinText = alltxt.join('');
        const result = joinText.includes(word);
        if (result) CNT.insertAdjacentHTML('beforeend',`<li>Posted in <time>${pd[2]}</time>: <a href="${pd[0]}" target="_blank">${pd[1]}</a></li>\n`);
      }
      //ページ
      let pagesData = [];
      for (const paa of pas) {
        const path = paa.getAttribute('href');
        const title = paa.textContent;
        pagesData.push([path,title]);
      }
      for (const gd of pagesData) {
        const doc = await fetchToDoc(gd[0]);
        const alltxt = doc.querySelector('main')?.textContent?? '';
        const result = alltxt.includes(word);
        if (result) CNT.insertAdjacentHTML('beforeend',`<li>Page: <a href="${gd[0]}" target="_blank">${gd[1]}</a></li>\n`);
      }
      if (!CNT.textContent) CNT.textContent = `Not found in "${word}".`;
    };
    BOX.elements['btn'].onclick = async () => await search();
    BOX.elements['word'].addEventListener('keydown', async (e) => {
      if (e.keyCode === 13) {
        e.preventDefault();
        await search();
      }
    });
  };
});