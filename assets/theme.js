// テーマ（見た目）の切り替え。ページ描画前に読み込んで、選んだ見た目を最初から当てる。
// 選択はこのブラウザの localStorage に保存（使えない環境では毎回白に戻るだけ）。
(function () {
  var d = document.documentElement;
  var PIXEL_FONT = "https://fonts.googleapis.com/css2?family=DotGothic16&display=swap";
  function loadFont(t) {
    if ((t === "gb" || t === "sfc") && !document.getElementById("pixel-font")) {
      var l = document.createElement("link");
      l.id = "pixel-font";
      l.rel = "stylesheet";
      l.href = PIXEL_FONT;
      document.head.appendChild(l);
    }
  }
  window.applyTheme = function (t) {
    if (t) d.dataset.theme = t;
    else delete d.dataset.theme;
    loadFont(t);
    try { t ? localStorage.setItem("theme", t) : localStorage.removeItem("theme"); } catch (e) {}
  };
  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  if (saved) { d.dataset.theme = saved; loadFont(saved); }
  // ゲームボーイ風：画像を4階調の緑に置き換えるフィルター
  document.addEventListener("DOMContentLoaded", function () {
    document.body.insertAdjacentHTML("beforeend",
      '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">' +
      '<filter id="gb-filter" color-interpolation-filters="sRGB">' +
      '<feColorMatrix type="matrix" values=".299 .587 .114 0 0 .299 .587 .114 0 0 .299 .587 .114 0 0 0 0 0 1 0"/>' +
      '<feComponentTransfer>' +
      '<feFuncR type="discrete" tableValues=".059 .188 .545 .608"/>' +
      '<feFuncG type="discrete" tableValues=".220 .384 .675 .737"/>' +
      '<feFuncB type="discrete" tableValues=".059 .188 .059 .059"/>' +
      '</feComponentTransfer></filter></svg>');
  });
})();
