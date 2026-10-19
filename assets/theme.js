// テーマ（見た目）の切り替え。ページ描画前に読み込んで、選んだ見た目を最初から当てる。
// 選択はこのブラウザの localStorage に保存（使えない環境では毎回白に戻るだけ）。
(function () {
  var d = document.documentElement;
  // 網点1マス（6px）：中心が黒、外側ほど白のグラデーション
  var HT_CELL = "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6"><defs><radialGradient id="g" r=".72">' +
    '<stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient></defs>' +
    '<rect width="6" height="6" fill="url(#g)"/></svg>');
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
      '</feComponentTransfer></filter>' +
      // ハーフトーン：明るさに応じて大きさの変わる網点（白黒）に置き換える
      '<filter id="ht-filter" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values=".299 .587 .114 0 0 .299 .587 .114 0 0 .299 .587 .114 0 0 0 0 0 1 0" result="gray"/>' +
      '<feImage width="6" height="6" result="cell" href="' + HT_CELL + '"/>' +
      '<feTile in="cell"/>' +
      // 網点の面積が明るさに比例するように補正（中心からの距離²）
      '<feComponentTransfer result="cells">' +
      '<feFuncR type="table" tableValues="0 .016 .064 .145 .258 .403 .58 .79 1 1 1"/>' +
      '<feFuncG type="table" tableValues="0 .016 .064 .145 .258 .403 .58 .79 1 1 1"/>' +
      '<feFuncB type="table" tableValues="0 .016 .064 .145 .258 .403 .58 .79 1 1 1"/>' +
      '</feComponentTransfer>' +
      '<feGaussianBlur in="gray" stdDeviation=".7" result="soft"/>' +
      '<feComposite in="soft" in2="cells" operator="arithmetic" k2="1" k3="1" k4="-.5"/>' +
      '<feComponentTransfer>' +
      '<feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/>' +
      '<feFuncA type="discrete" tableValues="1 1"/>' +
      '</feComponentTransfer>' +
      '<feComposite in2="SourceGraphic" operator="in"/></filter></svg>');
  });
})();
