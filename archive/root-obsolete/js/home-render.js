/* ============================================================
   whoknow 首页数据加载器
   - 单一数据源：./data/home.json（后期改文案/加段子/调入口只动这个文件）
   - 渲染：品牌文案、轮换段子、App 入口按钮、底部评论卡片
   - 约定：页面用 data-* 钩子占位，本脚本注入内容；类名与 design-tokens / index.html 的 CSS 对齐
   - 无障碍：尊重 prefers-reduced-motion；评论为纯展示（无点击，呼应 BRAND §14.4）
   ============================================================ */
(function () {
  'use strict';

  var DATA_URL = './data/home.json';
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 文本转义，防止注入（段子/评论属用户可管理内容，渲染前必须转义） */
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- 品牌文案 ---------- */
  function renderBrand(data) {
    var b = (data && data.brand) || {};
    var eyebrow = document.querySelector('[data-eyebrow]');
    if (eyebrow && b.eyebrow) eyebrow.textContent = b.eyebrow;

    var sectionTitle = document.querySelector('[data-section-title]');
    if (sectionTitle && b.sectionTitle) sectionTitle.textContent = b.sectionTitle;

    var footer = document.querySelector('[data-footer]');
    if (footer && b.footer) footer.innerHTML = b.footer; // 受信任的站内文案
  }

  /* ---------- 品牌宣言（定位段 · 主标语与 CTA 之间的价值主张） ---------- */
  function renderManifesto(data) {
    var el = document.querySelector('[data-manifesto]');
    if (el && data.manifesto) el.innerHTML = data.manifesto; // 受信任的站内文案
  }

  /* ---------- App 入口按钮 ---------- */
  function renderCTAs(data) {
    var wrap = document.querySelector('[data-ctas]');
    if (!wrap || !data.ctas) return;
    wrap.innerHTML = '';
    data.ctas.forEach(function (c) {
      var a = document.createElement('a');
      a.className = 'btn btn--' + (c.type || 'primary');
      a.href = c.href || '#';
      a.textContent = c.label || '';
      wrap.appendChild(a);
    });
  }

  /* ---------- 底部评论卡片（纯展示） ---------- */
  function renderReviews(data) {
    var wrap = document.querySelector('[data-reviews]');
    if (!wrap || !data.reviews) return;
    wrap.innerHTML = '';
    data.reviews.forEach(function (r) {
      var art = document.createElement('article');
      art.className = 'review-card' +
        (r.status && r.status !== 'live' ? ' is-coming' : '');

      var text = document.createElement('div');
      text.className = 'review-text';
      text.textContent = r.text || '';
      art.appendChild(text);

      var meta = document.createElement('div');
      meta.className = 'review-meta';

      var author = document.createElement('div');
      author.className = 'author';
      var avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = r.avatar || '🙂';
      var name = document.createElement('span');
      name.textContent = r.author || '';
      author.appendChild(avatar);
      author.appendChild(name);

      var stars = document.createElement('div');
      stars.className = 'review-stars';
      stars.textContent = '★'.repeat(r.stars || 5);

      meta.appendChild(author);
      meta.appendChild(stars);
      art.appendChild(meta);

      var product = document.createElement('div');
      product.className = 'review-product';
      var tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = (r.product && r.product.emoji ? r.product.emoji + ' ' : '') +
        (r.product ? r.product.name : '');
      var path = document.createElement('span');
      path.textContent = (r.product && r.product.path) ? r.product.path : '';
      product.appendChild(tag);
      product.appendChild(path);

      if (r.status === 'live') {
        var badge = document.createElement('span');
        badge.className = 'badge-live';
        badge.textContent = r.statusText || '🟢 已上线';
        product.appendChild(badge);
      } else {
        var placeholder = document.createElement('span');
        placeholder.style.marginLeft = 'auto';
        placeholder.textContent = r.statusText || '[规划中]';
        product.appendChild(placeholder);
      }
      art.appendChild(product);
      wrap.appendChild(art);
    });
  }

  /* ---------- 轮换段子 ---------- */
  function renderTagline(data) {
    var topEl = document.getElementById('tagline-top');
    if (!topEl || !data.tagline || !data.tagline.slogans) return;
    var slogans = data.tagline.slogans;
    if (!slogans.length) return;
    var current = slogans[Math.floor(Math.random() * slogans.length)];

    function buildHTML(text) {
      return '<span class="question" aria-hidden="true">?</span>' +
        '<span class="slogan-zh">' + escapeHTML(text) + '</span>';
    }
    function setText(text) { topEl.innerHTML = buildHTML(text); }

    function flyTo(next) {
      var chars = topEl.querySelectorAll('.slogan-zh, .question');
      chars.forEach(function (el) {
        if (el.classList.contains('question')) {
          el.style.setProperty('--dx', (Math.random() - 0.5) * 80 + 'px');
          el.style.setProperty('--dy', (-40 - Math.random() * 50) + 'px');
          el.style.setProperty('--rot', (Math.random() - 0.5) * 240 + 'deg');
          el.classList.add('char-anim');
        } else {
          var t = el.textContent, spans = '';
          for (var i = 0; i < t.length; i++) {
            var dx = (Math.random() - 0.5) * 80,
                dy = -40 - Math.random() * 50,
                rot = (Math.random() - 0.5) * 240;
            spans += '<span class="char-anim" style="--dx:' + dx + 'px;--dy:' +
              dy + 'px;--rot:' + rot + 'deg;">' + escapeHTML(t[i]) + '</span>';
          }
          el.outerHTML = spans;
        }
      });
      topEl.classList.add('flying');
      setTimeout(function () {
        topEl.classList.remove('flying');
        setText(next);
        void topEl.offsetWidth;
        topEl.classList.add('entering');
        setTimeout(function () { topEl.classList.remove('entering'); }, 500);
      }, 500);
    }

    function pickNext() {
      var next;
      do { next = slogans[Math.floor(Math.random() * slogans.length)]; }
      while (next === current && slogans.length > 1);
      current = next;
      return next;
    }

    setText(current);

    /* 段子尾句（WHO KNOWS? · 家人们谁懂）——随 JSON 注入 */
    var tailEl = document.querySelector('[data-tagline-tail]');
    if (tailEl && data.tagline && data.tagline.tail) tailEl.innerHTML = data.tagline.tail;

    if (reduceMotion) {
      // 尊重 reduced-motion：仅静默轮换，无飞散动画
      setInterval(function () { setText(pickNext()); }, 3000);
    } else {
      setInterval(function () { flyTo(pickNext()); }, 3000);
    }
  }

  /* ---------- 启动 ---------- */
  function init(data) {
    renderBrand(data);
    renderManifesto(data);
    renderCTAs(data);
    renderReviews(data);
    renderTagline(data);
  }

  function load() {
    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(init)
      .catch(function (err) {
        // 服务不可达（如直接 file:// 打开）→ 回退到页内兜底 JSON（与 data/home.json 镜像）
        var fb = document.getElementById('home-data');
        if (fb && fb.textContent && fb.textContent.trim()) {
          try { init(JSON.parse(fb.textContent)); return; }
          catch (e) { console.error('[home-render] 兜底 JSON 解析失败：', e); }
        }
        console.error('[home-render] 加载 ' + DATA_URL + ' 失败：', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
