// 中身はすべて data/*.json から読み込みます。HTMLを直接いじらなくても更新できます。
const ROOT = document.body.dataset.root || "./";
const INDEX_LINKS = document.body.dataset.indexlinks === "1"; // プレビュー環境用
const $ = (sel) => document.querySelector(sel);
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const src = (p) => (/^(https?:)?\/\//.test(p) ? p : ROOT + p);
const pageUrl = (dir) => ROOT + (dir ? dir + "/" : "") + (INDEX_LINKS ? "index.html" : "");

async function getJSON(path) {
  const res = await fetch(ROOT + path, { cache: "no-cache" });
  return res.json();
}

// シンプルな線のアイコン（ブランドロゴは使わない）
const ICONS = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" stroke="none"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4l16 16M20 4L4 20"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l4.5-4.5 3.5 3.5 2.5-2.5L20 19"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
};
// メールアドレスは迷惑メール対策のため、ファイルには逆順＋Base64で保存し、表示時にだけ組み立てる
const decodeMail = (v) => { try { return atob(v).split("").reverse().join(""); } catch (_) { return ""; } };
const linkAttrs = (s) => s.mail
  ? `href="#" data-mail="${esc(s.mail)}"`
  : `href="${esc(s.url)}" target="_blank" rel="noopener"`;
function wireMail(root = document) {
  root.querySelectorAll("[data-mail]").forEach((a) => {
    const addr = decodeMail(a.dataset.mail);
    a.querySelectorAll(".js-mail").forEach((el) => (el.textContent = addr));
    a.addEventListener("click", (e) => { e.preventDefault(); location.href = "mailto:" + addr; });
  });
}
const iconFor = (s) => ICONS[(s.icon || s.label || "").toLowerCase()] || ICONS.link;

function renderSide(site, current) {
  const nav = [
    ["Top", "", "top"],
    ["Profile", "profile", "profile"],
    ["Studies", "works", "works"],
  ]
    .map(([label, dir, key]) =>
      `<a href="${pageUrl(dir)}"${key === (current === "logos" ? "works" : current) ? ' aria-current="page"' : ""}>${label}</a>`)
    .join("");
  const p = site.profile || {};
  const footer = `<p class="site-footer">© ${new Date().getFullYear()} ${esc(site.siteName || site.name)}</p>`;

  // 全ページ共通：サイト名とメニューを上部に固定したヘッダー
  if (!$(".site-header")) {
    document.body.insertAdjacentHTML("afterbegin", `
      <header class="site-header"><div class="site-header-in">
        <a class="site-name" href="${pageUrl("")}">${esc(site.siteName || site.name)}</a>
        <nav class="side-nav" aria-label="Pages">${nav}</nav>
      </div></header>`);
  }

  // Top以外のページは左カラムを空にして、中身の位置だけTopとそろえる
  if (current !== "top") {
    const titles = { profile: "Profile", works: "Studies", members: "Members", logos: "Logos of 365" };
    $("#side").classList.add("is-compact");
    $("#side").innerHTML = `<h1 class="page-title">${titles[current] || ""}</h1>` +
      (current === "logos" ? `<p class="page-meta">2013 · <i>Graphic Design</i><br>365 logos, one a day</p><a class="page-back" href="${pageUrl("works")}">← Studies</a>` : "");
    $("#side").dataset.title = titles[current] || "";
    $("#main").dataset.title = titles[current] || "";
    $(".layout").insertAdjacentHTML("beforeend", `<footer class="page-footer">${footer}</footer>`);
    return;
  }
  $("#side").dataset.title = site.name || "";
  $("#side").innerHTML = `
    ${p.photo ? `<img class="avatar" src="${esc(src(p.photo))}" alt="${esc(site.name)}">` : `<span class="avatar avatar-empty" aria-hidden="true">${ICONS.image}</span>`}
    <div>
      <h1>${esc(site.name)}</h1>
      <p class="role">${esc(site.role || "")}</p>
    </div>
    ${site.tagline ? `<p class="tagline">${esc(site.tagline)}</p>` : ""}
    ${site.location ? `<p class="loc">${esc(site.location)}</p>` : ""}
    <div class="theme-dots" role="group" aria-label="Theme">
      <button class="theme-dot dot-default" type="button" data-theme="" title="Default" aria-label="Default"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18.5h10.2a3.8 3.8 0 0 0 .5-7.57A5.5 5.5 0 0 0 7.2 9.6 4.45 4.45 0 0 0 7 18.5z" fill="#fff" stroke="#161616" stroke-width="1.4" stroke-linejoin="round"/></svg></button>
      <button class="theme-dot dot-dark" type="button" data-theme="dark" title="Dark mode" aria-label="Dark mode"><svg viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="bh-glow" r=".5"><stop offset=".45" stop-color="#ffb35c"/><stop offset=".62" stop-color="#d4562a"/><stop offset="1" stop-color="#d4562a" stop-opacity="0"/></radialGradient></defs><circle cx="12" cy="12" r="11" fill="url(#bh-glow)"/><ellipse cx="12" cy="12" rx="11" ry="3.2" fill="none" stroke="#ffd59a" stroke-width="1.3" transform="rotate(-18 12 12)"/><circle cx="12" cy="12" r="5.2" fill="#000"/></svg></button>
      <button class="theme-dot dot-mac" type="button" data-theme="mac" title="Mac OS 8" aria-label="Mac OS 8"><svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="1" width="8" height="12" fill="#e6e1d6"/><rect x="6" y="3" width="4" height="4" fill="#fff"/><g fill="#161616"><rect x="4" y="1" width="8" height="1"/><rect x="3" y="2" width="1" height="1"/><rect x="12" y="2" width="1" height="1"/><rect x="3" y="3" width="1" height="1"/><rect x="5" y="3" width="6" height="1"/><rect x="12" y="3" width="1" height="1"/><rect x="3" y="4" width="1" height="1"/><rect x="5" y="4" width="1" height="1"/><rect x="10" y="4" width="1" height="1"/><rect x="12" y="4" width="1" height="1"/><rect x="3" y="5" width="1" height="1"/><rect x="5" y="5" width="1" height="1"/><rect x="10" y="5" width="1" height="1"/><rect x="12" y="5" width="1" height="1"/><rect x="3" y="6" width="1" height="1"/><rect x="5" y="6" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/><rect x="12" y="6" width="1" height="1"/><rect x="3" y="7" width="1" height="1"/><rect x="5" y="7" width="6" height="1"/><rect x="12" y="7" width="1" height="1"/><rect x="3" y="8" width="1" height="1"/><rect x="12" y="8" width="1" height="1"/><rect x="3" y="9" width="1" height="1"/><rect x="6" y="9" width="2" height="1"/><rect x="12" y="9" width="1" height="1"/><rect x="3" y="10" width="1" height="1"/><rect x="12" y="10" width="1" height="1"/><rect x="3" y="11" width="10" height="1"/><rect x="3" y="12" width="1" height="1"/><rect x="12" y="12" width="1" height="1"/><rect x="3" y="13" width="10" height="1"/></g></svg></button>
      <button class="theme-dot dot-win" type="button" data-theme="win" title="Windows 95" aria-label="Windows 95"><svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="1" y="2" width="14" height="12" fill="#000"/><rect x="1" y="2" width="13" height="11" fill="#fff"/><rect x="2" y="3" width="12" height="10" fill="#c0c0c0"/><rect x="3" y="4" width="10" height="3" fill="#000080"/><rect x="11" y="5" width="1" height="1" fill="#fff"/><rect x="3" y="8" width="10" height="4" fill="#fff"/><rect x="3" y="8" width="10" height="1" fill="#808080"/></svg></button>
    </div>
    ${footer}`;
  // ドットを押すとその見た目に切り替え（いちばん左が元の白）。選んだ見た目は全ページで保持
  const dots = document.querySelectorAll(".theme-dot");
  const sync = () => dots.forEach((d) => d.setAttribute("aria-pressed", String((document.documentElement.dataset.theme || "") === d.dataset.theme)));
  dots.forEach((d) => d.addEventListener("click", () => {
    const next = d.dataset.theme;
    if (window.applyTheme) window.applyTheme(next);
    else if (next) document.documentElement.dataset.theme = next;
    else delete document.documentElement.dataset.theme;
    sync();
  }));
  sync();
  // スマホでは左カラムが上に来るので、コピーライトはページ最下部にも置いて切り替える
  $(".layout").insertAdjacentHTML("beforeend", `<footer class="page-footer top-footer">${footer}</footer>`);
}

async function loadInstagram(cfg) {
  const count = cfg.count || 4;
  if (cfg.feedUrl) {
    try {
      const data = await (await fetch(cfg.feedUrl)).json();
      const posts = Array.isArray(data) ? data : data.posts || [];
      // フィードにユーザー名があれば、タイルの表示とリンク先に使う
      if (data.username) {
        cfg.handle = "@" + data.username;
        cfg.profileUrl = "https://www.instagram.com/" + data.username + "/";
      }
      return posts.slice(0, count).map((p) => ({
        image:
          (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) ||
          (p.mediaType === "VIDEO" ? p.thumbnailUrl : p.mediaUrl) ||
          p.thumbnailUrl,
        url: p.permalink,
      }));
    } catch (e) {
      console.warn("Instagram feed failed, falling back", e);
    }
  }
  return (cfg.manual || []).slice(0, count);
}

async function renderTop(site) {
  const works = await getJSON("data/works.json");
  // メインビジュアル：Worksの画像からランダムに1枚（横長だけ。縦位置・正方形はトリミングで崩れるので除外）
  // 作品に "mv" があればトップ用にその画像を使う（サムネイルが縦長・正方形の作品向け）
  const pool = works
    .filter((w) => w.mv || w.image)
    .map((w) => ({ ...w, image: w.mv || w.image }))
    .sort(() => Math.random() - 0.5);
  const isWide = (url) =>
    new Promise((ok) => {
      const im = new Image();
      im.onload = () => ok(im.naturalWidth > im.naturalHeight * 1.1);
      im.onerror = () => ok(false);
      im.src = url;
    });
  let mv = null;
  for (const w of pool) if (await isWide(src(w.image))) { mv = w; break; }
  const ig = site.instagram || {};
  // "top": false のものはトップに出さない（プロフィールのContactには出る）
  const sns = (site.sns || []).filter((s) => (s.icon || s.label || "").toLowerCase() !== "instagram" && s.top !== false);

  // 「Now」タイル（時刻・天気／オーロラ／月）はSNSタイルと同じ1マスに並べる
  const small = sns.length + 1;
  const nowWide = small % 2 === 1 && sns.length === 0;
  const nowTile = `<section class="tile t-now${nowWide ? " w2 is-wide" : ""}" data-title="Now" aria-label="Now">
      <div class="now-row"><span class="now-k">Kanagawa</span><span class="now-big"><b id="now-time">—</b></span><span class="now-sub" id="now-wx"></span></div>
      <div class="now-row"><span class="now-k">Aurora</span><span class="now-big"><small>Kp</small> <b id="now-kp">—</b></span><span class="now-sub"><span id="now-kp-note"></span><svg id="now-kp-spark" class="now-spark" aria-hidden="true"></svg></span></div>
      <div class="now-row"><span class="now-k">Moon</span><span class="now-big"><svg id="now-moon" class="now-moon" viewBox="0 0 16 16" aria-hidden="true"></svg><b id="now-moon-age">—</b> <small>days</small></span><span class="now-sub" id="now-moon-name"></span></div>
    </section>`;
  const snsTiles = sns
    .map((s, i) => {
      const wide = small % 2 === 1 && i === sns.length - 1 ? " w2" : "";
      return `<a class="tile t-sns${wide}" data-title="${esc(s.label)}" ${linkAttrs(s)}>
        <span class="icon-chip">${iconFor(s)}</span><span class="arrow">↗</span>
        <span class="bottom"><span class="name">${esc(s.label)}</span><br><span class="handle${s.mail ? " js-mail" : ""}">${esc(s.handle || "")}</span></span>
      </a>`;
    })
    .join("");

  const thumbs = works
    .slice(0, 3)
    .map((w) => `<img src="${esc(src(w.image))}" alt="" loading="lazy">`)
    .join("");

  $("#main").innerHTML = `
    <div class="bento">
      ${mv ? `<div class="tile t-mv w4 h2" data-title="${esc(mv.title)}${mv.subtitle ? " " + esc(mv.subtitle) : ""}"><img src="${esc(src(mv.image))}" alt="${esc(mv.title)}"></div>` : ""}
      <section class="tile t-insta w2 h2" data-title="Instagram">
        <a class="head" href="${esc(ig.profileUrl || "#")}" target="_blank" rel="noopener">
          <span class="icon-chip">${ICONS.instagram}</span>
          <span class="name">Instagram</span>
          <span class="handle">${esc(ig.handle || "")} ↗</span>
        </a>
        <div class="insta-grid" id="insta-grid"></div>
      </section>
      ${nowTile}
      ${snsTiles}
      <a class="tile t-link w2" data-title="Profile" href="${pageUrl("profile")}">
        <span class="arrow">→</span><h2>Profile</h2><p>About me</p>
      </a>
      <a class="tile t-link t-works w4" data-title="Studies" href="${pageUrl("works")}">
        <span class="text"><span class="arrow">→</span><h2>Studies</h2><p>${works.length} pieces</p></span>
        <span class="thumbs">${thumbs}</span>
      </a>
    </div>`;

  wireMail($("#main"));
  if (window.initNow) window.initNow();
  const posts = await loadInstagram(ig);
  const head = document.querySelector(".t-insta .head");
  if (head && ig.profileUrl) head.href = ig.profileUrl;
  const h = document.querySelector(".t-insta .head .handle");
  if (h && ig.handle) h.textContent = ig.handle + " ↗";
  const n = ig.count || 4;
  const cells = [];
  for (let i = 0; i < n; i++) {
    const p = posts[i];
    cells.push(
      p
        ? `<a href="${esc(p.url || ig.profileUrl || "#")}" target="_blank" rel="noopener"><img src="${esc(src(p.image))}" alt="" loading="lazy"></a>`
        : `<div class="ph"></div>`
    );
  }
  $("#insta-grid").innerHTML = cells.join("");
}

async function renderProfile(site) {
  const p = site.profile || {};
  const block = (lang, d) => d ? `
    <section class="profile-text" lang="${lang}">
      <p class="p-name">${esc(d.name || "")}</p>
      <p class="p-origin">${esc(d.origin || "")}</p>
      ${(d.bio || []).map((t) => `<p class="p-bio">${esc(t)}</p>`).join("")}
      ${d.likes && d.likes.length ? `
        <h3 class="p-likes-head">${esc(d.likesLabel || "")}</h3>
        <dl class="p-likes">${d.likes
          .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
          .join("")}</dl>` : ""}
    </section>` : "";
  $("#main").innerHTML = `
    <div class="panel profile-panel">
      ${p.photo ? `<img class="p-photo" src="${esc(src(p.photo))}" alt="${esc(site.name)}">` : ""}
      ${block("ja", p.ja)}
      ${block("en", p.en)}
      <section class="profile-contact"><h2>Contact</h2><div class="chips">${(site.sns || [])
        .map((s) => `<a ${linkAttrs(s)}>${esc(s.label)} ↗</a>`)
        .join("")}</div></section>
    </div>`;
}

async function renderWorks(site) {
  const works = await getJSON("data/works.json");
  const cats = site.workCategories || [...new Set(works.map((w) => w.category).filter(Boolean))];
  const slug = (c) => c.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const row = (w, i) => {
    const inner = `<span class="w-year">${esc(w.year || "")}</span>
      <span class="w-title">${esc(w.title)}${w.subtitle ? ` <small class="w-sub">${esc(w.subtitle)}</small>` : ""}</span>
      <span class="w-cat">${esc(w.category || "")}</span>
      <i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i>`;
    if (/^https?:\/\//.test(w.url || ""))
      return `<li><a class="w-row" href="${esc(w.url)}" target="_blank" rel="noopener">${inner}</a></li>`;
    if (w.url) {
      // サイト内のページ（例: works/soblue/）
      const href = ROOT + w.url + (INDEX_LINKS && w.url.endsWith("/") ? "index.html" : "");
      return `<li><a class="w-row" href="${esc(href)}">${inner}</a></li>`;
    }
    // リンク先がない作品は、クリックで画像を大きく表示
    if (w.image) return `<li><button class="w-row work-zoom" type="button" data-i="${i}">${inner}</button></li>`;
    return `<li><span class="w-row">${inner}</span></li>`;
  };

  $("#main").innerHTML = `
    <nav class="w-tabs" aria-label="Categories">
      <button type="button" data-cat="all">All</button>
      ${cats.map((c) => `<button type="button" data-cat="${slug(c)}">${esc(c)}</button>`).join("")}
    </nav>
    <ul class="w-list" id="works-grid"></ul>
    <p class="w-empty" id="w-empty" hidden>Coming soon.</p>
    <div class="lightbox" id="lightbox" hidden>
      <button class="lb-close" type="button" aria-label="閉じる">×</button>
      <img alt="">
      <p class="lb-cap"></p>
    </div>`;

  const grid = $("#works-grid");
  const show = (key) => {
    if (key !== "all" && !cats.some((c) => slug(c) === key)) key = "all";
    const list = works.map((w, i) => [w, i]).filter(([w]) => key === "all" || slug(w.category || "") === key);
    grid.innerHTML = list.length
      ? `<li class="w-rules" aria-hidden="true"><i></i><i></i><i></i></li>` + list.map(([w, i]) => row(w, i)).join("")
      : "";
    $("#w-empty").hidden = list.length > 0;
    document.querySelectorAll(".w-tabs button").forEach((b) =>
      b.setAttribute("aria-current", b.dataset.cat === key ? "true" : "false"));
  };
  document.querySelector(".w-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    show(b.dataset.cat);
    try { history.replaceState(null, "", b.dataset.cat === "all" ? location.pathname : "#" + b.dataset.cat); } catch (_) {}
  });
  show((location.hash || "#all").slice(1));
  addEventListener("hashchange", () => show((location.hash || "#all").slice(1)));

  // lightbox
  const lb = $("#lightbox");
  const close = () => { lb.hidden = true; document.body.style.overflow = ""; };
  grid.addEventListener("click", (e) => {
    const b = e.target.closest(".work-zoom");
    if (!b) return;
    const w = works[+b.dataset.i];
    lb.querySelector("img").src = src(w.image);
    lb.querySelector("img").alt = w.title;
    lb.querySelector(".lb-cap").textContent = w.title;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lb.querySelector(".lb-close").focus();
  });
  lb.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) close(); });
}

// Logos of 365：ロゴを正方形のグリッドに並べ、クリックで大きく表示。←→で前後、Escで閉じる
async function renderLogos() {
  const logos = await getJSON("data/logos365.json");
  $("#main").innerHTML = `
    <ol class="logo-grid">${logos.map((l, i) => `<li><button type="button" class="logo-cell" data-i="${i}" aria-label="No. ${l.n}">
      <img src="${src("images/logos365/thumb/" + l.n + ".webp")}" alt="" loading="lazy" width="560" height="560"><span>${l.n}</span></button></li>`).join("")}</ol>
    <div class="lightbox logo-lb" id="lightbox" hidden>
      <button class="lb-close" type="button" aria-label="閉じる">×</button>
      <img alt="">
      <p class="lb-cap"></p>
    </div>`;
  const lb = $("#lightbox"), img = lb.querySelector("img"), cap = lb.querySelector(".lb-cap");
  let cur = 0;
  const show = (i) => {
    cur = (i + logos.length) % logos.length;
    const l = logos[cur];
    img.src = src("images/logos365/thumb/" + l.n + ".webp");
    img.alt = "Logo No. " + l.n;
    cap.textContent = "No. " + l.n + " / 365";
  };
  const close = () => { lb.hidden = true; document.body.style.overflow = ""; };
  $(".logo-grid").addEventListener("click", (e) => {
    const b = e.target.closest(".logo-cell");
    if (!b) return;
    show(+b.dataset.i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lb.querySelector(".lb-close").focus();
  });
  lb.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") show(cur + 1);
    if (e.key === "ArrowLeft") show(cur - 1);
  });
}

(async () => {
  const page = document.body.dataset.page;
  const site = await getJSON("data/site.json");
  const titles = { profile: "Profile", works: "Studies", members: "Members", logos: "Logos of 365" };
  document.title = page === "top" ? site.siteName || site.name : `${titles[page] || page} — ${site.siteName || site.name}`;
  renderSide(site, page);
  const render = { top: renderTop, profile: renderProfile, works: renderWorks, logos: renderLogos }[page];
  if (render) await render(site);
  if (page === "profile") wireMail($("#main"));
})();
