
document.addEventListener('DOMContentLoaded', () => {

  // headerのレスポンシブメニュー
  document.querySelector('.menu-icon').onclick = (e) => {
    const pagli = document.querySelector('.header .page-links');
    pagli.classList.toggle('show');
    document.querySelector('.head-icons').classList.toggle('show');
    if (pagli.classList.contains('show')) e.target.classList.add('close-btn');
    else e.target.classList.remove('close-btn');
  }

  // headerのリンクをハイライト
  const headerURLs = [];
  const headerAs = document.querySelectorAll('.head-icons a, .header .page-links a');
  for (const ha of headerAs) {
    const href = ha.getAttribute('href');
    headerURLs.push(href);
  }
  for (const url of headerURLs) if (document.URL.match(url)) {
    const currentLink = document.querySelector(`.header [href="${url}"]`);
    currentLink.style.setProperty('color','var(--link-color-hover');
  }
  
  // ポスト
  if (document.URL.match('/post/')) {
    // シェアボタンのURLコピー
    document.querySelector('.share-copyurl').onclick = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      alert('このページのURLをコピーしました。');
    }
    // ポスト画像をズーム（横幅がPCの場合のみ）
    if(window.innerWidth >= 1040) {
      const thumb = document.querySelector('.thumbnail img');
      if (thumb) thumb.onclick = (e) => e.target.classList.toggle('img-zoom');
      const imgs = document.querySelectorAll('.contents:not(.afi-link) img');
      if (imgs.length) for (const img of imgs) img.onclick = (e) => e.target.classList.toggle('img-zoom');
    }
  }

  // タグページのフィルター機能
  if (document.URL.match('/tags.html')) {
    const polis = document.querySelectorAll('.post-links > li');
    const fidiv = document.querySelectorAll('.filter-btns > div');
    const spans = fidiv[0].querySelectorAll('span');
    const clear = fidiv[1].querySelector('.allclear-btn');
    const viewb = fidiv[1].querySelector('.allview-btn');
    for (const span of spans) span.classList.add('on');
    clear.onclick = () => {
      for (const li of polis) li.classList.add('hide');
      for (const span of spans) span.classList.remove('on');
    }
    viewb.onclick = () => {
      for (const li of polis) li.classList.remove('hide');
      for (const span of spans) span.classList.add('on');
    }
    for (const span of spans) {
      span.onclick = (e) => {
        e.target.classList.toggle('on');
        for (const li of polis) li.classList.add('hide');
        const onTags = fidiv[0].querySelectorAll('.on');
        if(onTags.length) for (const onTag of onTags) {
          for (const li of polis) {
            const is = li.querySelectorAll('i');
            if (is.length) for (const i of is) {
              if (onTag.textContent === i.textContent) {
                li.classList.remove('hide');
                break;
              }
            }
          }
        }
      }
    }
    const query = new URLSearchParams(window.location.search);
    const word = query.get('q');
    if (word) {
      clear.click();
      for (const span of spans) if (span.textContent === word) return span.click();
    }
  }

  // 検索ページの検索機能。（1単語のみ）
  if (document.URL.match('/search.html')) {
    const sebox = document.getElementById('search-box');
    const seres = document.querySelector('.search-result ol');
    const fetchToDoc = async (url) => {
      const response = await fetch(url);
      const html = await response.text();
      return new DOMParser().parseFromString(html,'text/html');
    };
    const search = async () => {
      seres.textContent = '';
      const word = sebox.elements['word'].value;
      if (!word) return seres.textContent = '入力が空です';
      const doc = await fetchToDoc('tags.html');
      const lis = doc.querySelectorAll('.post-links > li');
      // post
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
        if (result) seres.insertAdjacentHTML('beforeend',`<li>Posted in <time>${pd[2]}</time>: <a href="${pd[0]}" target="_blank">${pd[1]}</a></li>\n`);
      }
      // page
      let pagesData = [];
      const pagAs = document.querySelectorAll('.page-links a');
      for (const pa of pagAs) {
        const path = pa.getAttribute('href');
        const title = pa.textContent;
        pagesData.push([path,title]);
      }
      for (const gd of pagesData) {
        const doc = await fetchToDoc(gd[0]);
        const alltxt = doc.querySelector('main')?.textContent?? '';
        const result = alltxt.includes(word);
        if (result) seres.insertAdjacentHTML('beforeend',`<li>Page: <a href="${gd[0]}" target="_blank">${gd[1]}</a></li>\n`);
      }
      if (!seres.textContent) seres.textContent = `"${word}" を含んだ記事は見つかりませんでした。`;
    };
    sebox.elements['btn'].onclick = async () => await search();
    sebox.elements['word'].addEventListener('keydown', async (e) => {
      if (e.keyCode === 13) {
        e.preventDefault();
        await search();
      }
    });
  };
});