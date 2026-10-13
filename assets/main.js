// 中身はすべて data/*.json から読み込みます。HTMLを直接いじらなくても更新できます。
const ROOT = document.body.dataset.root || "./";
const $ = (sel) => document.querySelector(sel);
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const src = (p) => (/^(https?:)?\/\//.test(p) ? p : ROOT + p);

async function getJSON(path) {
  const res = await fetch(ROOT + path, { cache: "no-cache" });
  return res.json();
}

async function loadInstagram(cfg) {
  const count = cfg.count || 4;
  // 1) Behold などのフィードURLがあればそこから取得
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
  // 2) 手動で指定した画像
  return (cfg.manual || []).slice(0, count);
}

async function renderTop() {
  const site = await getJSON("data/site.json");
  document.title = site.name;
  $("#logo").textContent = site.name;
  $("#mv-img").src = src(site.mv);
  $("#mv-name").textContent = site.name;
  $("#mv-sub").textContent = site.location || "";
  $("#role").textContent = site.role;
  $("#tagline").textContent = site.tagline;

  $("#sns-slot").innerHTML = site.sns
    .map(
      (s) => `<a class="tile t-sns" href="${esc(s.url)}" target="_blank" rel="noopener">
        <span class="arrow">↗</span><span class="label">SNS</span><span class="name">${esc(s.label)}</span></a>`
    )
    .join("");

  const ig = site.instagram || {};
  $("#insta-link").href = ig.profileUrl || "#";
  const posts = await loadInstagram(ig);
  const count = ig.count || 4;
  const cells = [];
  for (let i = 0; i < count; i++) {
    const p = posts[i];
    cells.push(
      p
        ? `<a href="${esc(p.url || ig.profileUrl || "#")}" target="_blank" rel="noopener"><img src="${esc(src(p.image))}" alt="" loading="lazy"></a>`
        : `<div class="ph"></div>`
    );
  }
  $("#insta-grid").innerHTML = cells.join("");
}

async function renderProfile() {
  const site = await getJSON("data/site.json");
  const p = site.profile || {};
  document.title = `Profile — ${site.name}`;
  $("#logo").textContent = site.name;
  $("#p-name").textContent = site.name;
  $("#p-role").textContent = site.role;
  if (p.photo) $("#p-photo").src = src(p.photo);
  $("#p-bio").innerHTML = (p.bio || []).map((t) => `<p>${esc(t)}</p>`).join("");
  $("#p-history").innerHTML = (p.history || [])
    .map((h) => `<li><span class="y">${esc(h.year)}</span><span>${esc(h.text)}</span></li>`)
    .join("");
  $("#p-skills").innerHTML = (p.skills || []).map((s) => `<span>${esc(s)}</span>`).join("");
  $("#p-sns").innerHTML = site.sns
    .map((s) => `<span><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></span>`)
    .join("");
}

async function renderWorks() {
  const [site, works] = await Promise.all([getJSON("data/site.json"), getJSON("data/works.json")]);
  document.title = `Works — ${site.name}`;
  $("#logo").textContent = site.name;
  $("#works").innerHTML = works
    .map((w) => {
      const inner = `<img src="${esc(src(w.image))}" alt="${esc(w.title)}" loading="lazy">
        <div class="body"><div class="meta">${esc(w.year)} · ${esc(w.category)}</div>
        <h3>${esc(w.title)}</h3><p>${esc(w.description)}</p></div>`;
      return w.url
        ? `<a class="work" href="${esc(w.url)}" target="_blank" rel="noopener">${inner}</a>`
        : `<article class="work">${inner}</article>`;
    })
    .join("");
}

const page = document.body.dataset.page;
({ top: renderTop, profile: renderProfile, works: renderWorks }[page] || (() => {}))();
$("#year") && ($("#year").textContent = new Date().getFullYear());
