document.addEventListener('DOMContentLoaded', () => {
  const LATPO = document.querySelector('.latest-posts');
  const POSTS = LATPO.querySelectorAll('div');
  const POSBT = document.querySelector('.allpost-btns');
  const BTNPS = POSBT.querySelectorAll('p');
  viewSwitch = (e) => {
    e.target.classList.toggle('on');
    for (const post of POSTS) post.classList.add('hide');
    const flds = BTNPS[0].querySelectorAll('.on');
    const tags = BTNPS[1].querySelectorAll('.on');
    for (const fld of flds) {
      const fldName = fld.dataset.btn;
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
      const flds = BTNPS[0].querySelectorAll('.on');
      const spans = BTNPS[1].querySelectorAll('span');
      for (const fld of flds) {
        const fldName = fld.dataset.btn;
        for (const span of spans) {
          span.classList.add('on');
          const tagName = span.dataset.btn;
          const acts = LATPO.querySelectorAll(`.${tagName}.${fldName}`);
          for (const act of acts) act.classList.remove('hide');
        }
      }
    }
  };
});