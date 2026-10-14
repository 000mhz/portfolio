// soblue gallery — photos come from data/soblue.json
// [{ "image": "images/soblue/01.webp", "caption": "" }, ...]
(() => {
  const ROOT = document.body.dataset.root || "./";
  const INDEX_LINKS = document.body.dataset.indexlinks === "1"; // プレビュー環境用
  const DURATION = 4000; // 1枚あたりの表示時間（ミリ秒）

  const $ = (id) => document.getElementById(id);
  const stage = $("g-stage");
  const bar = $("g-bar");
  const src = (p) => (/^(https?:)?\/\//.test(p) ? p : ROOT + p);
  if (INDEX_LINKS) $("g-back").href = ROOT + "index.html";

  let photos = [];
  let slides = [];
  let segs = [];
  let index = 0;
  let elapsed = 0;
  let last = 0;
  let paused = false;
  const wideScreen = matchMedia("(orientation: landscape)");

  // 全画面表示の写真の上ではUIを白に
  function updateUi() {
    const s = slides[index];
    document.body.classList.toggle("ui-light", !!s && s.classList.contains("is-landscape") && wideScreen.matches);
  }
  wideScreen.addEventListener("change", updateUi);

  function load(i) {
    const s = slides[i];
    if (!s || s.dataset.loaded) return;
    s.dataset.loaded = "1";
    const img = s.querySelector("img");
    img.addEventListener("load", () => {
      s.classList.toggle("is-landscape", img.naturalWidth > img.naturalHeight);
      updateUi();
    }, { once: true });
    img.src = src(photos[i].image);
  }

  function show(i) {
    const n = photos.length;
    index = (i + n) % n;
    elapsed = 0;
    [index, index + 1, index - 1].forEach((k) => load((k + n) % n));
    slides.forEach((s, k) => s.classList.toggle("is-active", k === index));
    segs.forEach((g, k) => {
      g.classList.toggle("is-done", k < index);
      g.querySelector("i").style.width = k < index ? "100%" : "0";
      g.setAttribute("aria-current", k === index ? "true" : "false");
    });
    $("g-count").textContent = `${String(index + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
    $("g-caption").textContent = photos[index].caption || "";
    updateUi();
  }

  function tick(t) {
    if (!last) last = t;
    const dt = t - last;
    last = t;
    if (!paused && !document.hidden && photos.length > 1) {
      elapsed += dt;
      const fill = segs[index] && segs[index].querySelector("i");
      if (fill) fill.style.width = Math.min(100, (elapsed / DURATION) * 100) + "%";
      if (elapsed >= DURATION) show(index + 1);
    }
    requestAnimationFrame(tick);
  }

  async function init() {
    photos = await (await fetch(ROOT + "data/soblue.json", { cache: "no-cache" })).json();
    if (!photos.length) return;

    stage.innerHTML = photos
      .map((p, i) => `<figure class="g-slide"><img alt="soblue ${i + 1}" draggable="false"></figure>`)
      .join("");
    slides = [...stage.children];

    bar.innerHTML = photos
      .map((_, i) => `<button class="g-seg" type="button" aria-label="${i + 1}枚目へ"><span><i></i></span></button>`)
      .join("");
    segs = [...bar.children];
    segs.forEach((g, i) => g.addEventListener("click", () => show(i)));

    $("g-prev").addEventListener("click", () => show(index - 1));
    $("g-next").addEventListener("click", () => show(index + 1));

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(index - 1);
      else if (e.key === "ArrowRight") show(index + 1);
      else if (e.key === " ") { e.preventDefault(); paused = !paused; }
    });

    // ストーリーズ風：押している間は一時停止、横スワイプでページ送り
    let startX = null;
    stage.addEventListener("pointerdown", (e) => { startX = e.clientX; paused = true; });
    const end = (e) => {
      if (startX !== null) {
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      }
      startX = null;
      paused = false;
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    stage.addEventListener("pointerleave", (e) => { if (startX !== null) end(e); });

    show(0);
    requestAnimationFrame(tick);
  }

  init();
})();
