// トップの「Now」タイル：神奈川の時刻と天気・オーロラ指数（Kp）・月齢
// どれもAPIキー不要。取得に失敗した項目は「—」のまま表示する。
(function () {
  const TZ = "Asia/Tokyo";
  const LAT = 35.44, LON = 139.64; // 横浜あたり
  const WX = "https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON +
    "&current=temperature_2m,weather_code&timezone=Asia%2FTokyo";
  const KP = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
  const $ = (id) => document.getElementById(id);

  function wxLabel(c) {
    if (c === 0) return "Clear";
    if (c <= 2) return "Partly cloudy";
    if (c === 3) return "Cloudy";
    if (c === 45 || c === 48) return "Fog";
    if (c >= 51 && c <= 57) return "Drizzle";
    if (c >= 61 && c <= 67) return "Rain";
    if (c >= 71 && c <= 77) return "Snow";
    if (c >= 80 && c <= 82) return "Showers";
    if (c >= 85 && c <= 86) return "Snow";
    if (c >= 95) return "Thunder";
    return "";
  }

  function tick() {
    const el = $("now-time");
    if (el) el.textContent = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  }

  async function weather() {
    try {
      const d = await (await fetch(WX)).json();
      const t = Math.round(d.current.temperature_2m);
      $("now-wx").textContent = t + "° " + wxLabel(d.current.weather_code);
    } catch (e) { /* keep placeholder */ }
  }

  // NOAAの3時間ごとのKp指数。形式が配列の配列でもオブジェクトの配列でも読めるようにしておく
  async function aurora() {
    try {
      const d = await (await fetch(KP)).json();
      let vals;
      if (Array.isArray(d[0])) {
        const i = d[0].findIndex((h) => String(h).toLowerCase() === "kp");
        vals = d.slice(1).map((r) => parseFloat(r[i < 0 ? 1 : i]));
      } else {
        vals = d.map((r) => parseFloat(r.Kp != null ? r.Kp : r.kp_index != null ? r.kp_index : r.kp));
      }
      vals = vals.filter((v) => !isNaN(v)).slice(-8);
      if (!vals.length) return;
      const kp = vals[vals.length - 1];
      $("now-kp").textContent = kp.toFixed(1);
      $("now-kp-note").textContent = kp >= 7 ? "Storm" : kp >= 5 ? "Active" : kp >= 4 ? "Unsettled" : "Quiet";
      // 直近24時間のミニ棒グラフ（Kp 0〜9）
      const w = 4, gap = 2, h = 14;
      $("now-kp-spark").innerHTML = vals.map((v, n) => {
        const bh = Math.max(1, Math.round((v / 9) * h));
        return '<rect x="' + n * (w + gap) + '" y="' + (h - bh) + '" width="' + w + '" height="' + bh + '"' + (n === vals.length - 1 ? ' class="now-last"' : "") + "/>";
      }).join("");
      $("now-kp-spark").setAttribute("viewBox", "0 0 " + (vals.length * (w + gap) - gap) + " " + h);
    } catch (e) { /* keep placeholder */ }
  }

  // 月齢：基準の新月（2000-01-06 18:14 UTC）からの経過で計算
  function moon() {
    const SYN = 29.530588853;
    const days = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5;
    const age = ((days % SYN) + SYN) % SYN;
    const p = age / SYN;
    const r = 7, cx = 8, cy = 8;
    const k = Math.cos(2 * Math.PI * p);
    const rx = Math.abs(k) * r;
    const waxing = p < 0.5;
    const s1 = waxing ? 1 : 0;
    const s2 = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
    const lit = "M" + cx + " " + (cy - r) + " A" + r + " " + r + " 0 0 " + s1 + " " + cx + " " + (cy + r) +
      " A" + rx.toFixed(2) + " " + r + " 0 0 " + s2 + " " + cx + " " + (cy - r) + "Z";
    $("now-moon").innerHTML = '<circle cx="8" cy="8" r="7" class="now-moon-dark"/><path d="' + lit + '" class="now-moon-lit"/>';
    const names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
    $("now-moon-age").textContent = age.toFixed(1);
    $("now-moon-name").textContent = names[Math.round(p * 8) % 8];
  }

  window.initNow = function () {
    if (!$("now-time")) return;
    tick(); moon(); weather(); aurora();
    setInterval(tick, 20000);
    setInterval(() => { weather(); aurora(); moon(); }, 15 * 60000);
  };
})();
