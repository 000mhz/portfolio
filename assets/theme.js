// テーマ（見た目）の切り替え。ページ描画前に読み込んで、選んだ見た目を最初から当てる。
// 選択はこのブラウザの localStorage に保存（使えない環境では毎回デフォルトに戻るだけ）。
(function () {
  var d = document.documentElement;
  var THEMES = ["dark", "mac", "win"];
  window.applyTheme = function (t) {
    if (THEMES.indexOf(t) < 0) t = "";
    if (t) d.dataset.look = t;
    else delete d.dataset.look;
    try { t ? localStorage.setItem("look", t) : localStorage.removeItem("look"); } catch (e) {}
  };
  var saved = null;
  try { saved = localStorage.getItem("look"); } catch (e) {}
  if (saved && THEMES.indexOf(saved) >= 0) d.dataset.look = saved;
  else if (saved) window.applyTheme(""); // 廃止したテーマが保存されていたら元に戻す
})();
