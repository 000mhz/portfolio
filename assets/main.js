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
const iconFor = (s) => ICONS[(s.icon || s.label || "").toLowerCase()] || ICONS.link;

function renderSide(site, current) {
  const nav = [
    ["Top", "", "top"],
    ["Profile", "profile", "profile"],
    ["Studies", "works", "works"],
  ]
    .map(([label, dir, key]) =>
      `<a href="${pageUrl(dir)}"${key === current ? ' aria-current="page"' : ""}>${label}</a>`)
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
    const titles = { profile: "Profile", works: "Studies", members: "Members" };
    $("#side").classList.add("is-compact");
    $("#side").innerHTML = `<h1 class="page-title">${titles[current] || ""}</h1>`;
    $(".layout").insertAdjacentHTML("beforeend", `<footer class="page-footer">${footer}</footer>`);
    return;
  }
  $("#side").innerHTML = `
    ${p.photo ? `<img class="avatar" src="${esc(src(p.photo))}" alt="${esc(site.name)}">` : `<span class="avatar avatar-empty" aria-hidden="true">${ICONS.image}</span>`}
    <div>
      <h1>${esc(site.name)}</h1>
      <p class="role">${esc(site.role || "")}</p>
    </div>
    ${site.tagline ? `<p class="tagline">${esc(site.tagline)}</p>` : ""}
    ${site.location ? `<p class="loc">${esc(site.location)}</p>` : ""}
    ${footer}`;
}

async function loadInstagram(cfg) {
  const count = cfg.count || 4;
  if (cfg.feedUrl) {
    try {
      const data = await (await fetch(cfg.feedUrl)).json();
      const posts = Array.isArray(data) ? data : data.posts || [];
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
  const sns = (site.sns || []).filter((s) => (s.icon || s.label || "").toLowerCase() !== "instagram");

  const snsTiles = sns
    .map((s, i) => {
      const wide = sns.length % 2 === 1 && i === sns.length - 1 ? " w2" : "";
      return `<a class="tile t-sns${wide}" href="${esc(s.url)}" target="_blank" rel="noopener">
        <span class="icon-chip">${iconFor(s)}</span><span class="arrow">↗</span>
        <span class="bottom"><span class="name">${esc(s.label)}</span><br><span class="handle">${esc(s.handle || "")}</span></span>
      </a>`;
    })
    .join("");

  const thumbs = works
    .slice(0, 3)
    .map((w) => `<img src="${esc(src(w.image))}" alt="" loading="lazy">`)
    .join("");

  $("#main").innerHTML = `
    <div class="bento">
      ${mv ? `<div class="tile t-mv w4 h2"><img src="${esc(src(mv.image))}" alt="${esc(mv.title)}"></div>` : ""}
      <section class="tile t-insta w2 h2">
        <a class="head" href="${esc(ig.profileUrl || "#")}" target="_blank" rel="noopener">
          <span class="icon-chip">${ICONS.instagram}</span>
          <span class="name">Instagram</span>
          <span class="handle">${esc(ig.handle || "")} ↗</span>
        </a>
        <div class="insta-grid" id="insta-grid"></div>
      </section>
      ${snsTiles}
      <a class="tile t-link w2" href="${pageUrl("profile")}">
        <span class="arrow">→</span><h2>Profile</h2><p>About me</p>
      </a>
      <a class="tile t-link t-works w4" href="${pageUrl("works")}">
        <span class="text"><span class="arrow">→</span><h2>Studies</h2><p>${works.length} pieces</p></span>
        <span class="thumbs">${thumbs}</span>
      </a>
    </div>`;

  const posts = await loadInstagram(ig);
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
        .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`)
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

(async () => {
  const page = document.body.dataset.page;
  const site = await getJSON("data/site.json");
  const titles = { profile: "Profile", works: "Studies", members: "Members" };
  document.title = page === "top" ? site.siteName || site.name : `${titles[page] || page} — ${site.siteName || site.name}`;
  renderSide(site, page);
  const render = { top: renderTop, profile: renderProfile, works: renderWorks }[page];
  if (render) await render(site);
})();
