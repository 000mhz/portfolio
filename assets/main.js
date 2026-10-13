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
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
};
const iconFor = (s) => ICONS[(s.icon || s.label || "").toLowerCase()] || ICONS.link;

function renderSide(site, current) {
  const nav = [
    ["Top", "", "top"],
    ["Profile", "profile", "profile"],
    ["Works", "works", "works"],
  ]
    .map(([label, dir, key]) =>
      `<a href="${pageUrl(dir)}"${key === current ? ' aria-current="page"' : ""}>${label}</a>`)
    .join("");
  const p = site.profile || {};
  $("#side").innerHTML = `
    <a class="site-name" href="${pageUrl("")}">${esc(site.siteName || site.name)}</a>
    ${p.photo ? `<img class="avatar" src="${esc(src(p.photo))}" alt="${esc(site.name)}">` : ""}
    <div>
      <h1>${esc(site.name)}</h1>
      <p class="role">${esc(site.role || "")}</p>
    </div>
    ${site.tagline ? `<p class="tagline">${esc(site.tagline)}</p>` : ""}
    ${site.location ? `<p class="loc">${esc(site.location)}</p>` : ""}
    <nav aria-label="Pages">${nav}</nav>
    <p class="site-footer">© ${new Date().getFullYear()} ${esc(site.siteName || site.name)}</p>`;
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
      ${site.mv ? `<div class="tile t-mv w4 h2"><img src="${esc(src(site.mv))}" alt=""></div>` : ""}
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
        <span class="text"><span class="arrow">→</span><h2>Works</h2><p>${works.length} projects</p></span>
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
  $("#main").innerHTML = `
    <p class="page-head">Profile</p>
    <div class="stack">
      <section class="panel"><h2>About</h2>${(p.bio || []).map((t) => `<p>${esc(t)}</p>`).join("")}</section>
      <section class="panel"><h2>History</h2><ul class="history">${(p.history || [])
        .map((h) => `<li><span class="y">${esc(h.year)}</span><span>${esc(h.text)}</span></li>`)
        .join("")}</ul></section>
      <section class="panel"><h2>Skills</h2><div class="chips">${(p.skills || [])
        .map((s) => `<span>${esc(s)}</span>`)
        .join("")}</div></section>
      <section class="panel"><h2>Contact</h2><div class="chips">${(site.sns || [])
        .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`)
        .join("")}</div></section>
    </div>`;
}

async function renderWorks() {
  const works = await getJSON("data/works.json");
  $("#main").innerHTML = `
    <p class="page-head">Works</p>
    <div class="works-grid">${works
      .map((w) => {
        const inner = `<img src="${esc(src(w.image))}" alt="${esc(w.title)}" loading="lazy">
          <div class="body"><div class="meta">${esc(w.year)} · ${esc(w.category)}</div>
          <h3>${esc(w.title)}</h3><p>${esc(w.description)}</p></div>`;
        return w.url
          ? `<a class="work" href="${esc(w.url)}" target="_blank" rel="noopener">${inner}</a>`
          : `<article class="work">${inner}</article>`;
      })
      .join("")}</div>`;
}

(async () => {
  const page = document.body.dataset.page;
  const site = await getJSON("data/site.json");
  document.title = page === "top" ? site.siteName || site.name : `${page[0].toUpperCase() + page.slice(1)} — ${site.siteName || site.name}`;
  renderSide(site, page);
  const render = { top: renderTop, profile: renderProfile, works: renderWorks }[page];
  if (render) await render(site);
})();
