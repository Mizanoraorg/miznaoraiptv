/* Mizanora IPTV — remote API base bridge (v6.2.1).
 *
 * FREE HYBRID MODE — billing ke bagair:
 *   Firebase Hosting (Spark/free) = static website
 *   Netlify (free)                = API (streams, catalog, panel)
 *
 * Jab site Firebase Hosting par ho aur API Netlify par ho, to neeche
 * DEFAULT_BASE mein apna Netlify API URL bhar dein (trailing slash ke bagair),
 * misaal ke taur par: "https://mizanora.netlify.app"
 * Same-origin deploy (sab kuch ek hi jagah) par ise "" rehne dein.
 *
 * Runtime override (testing ke liye): ?api=https://your-api.example.com
 * — localStorage mein save ho jata hai; hatane ke liye ?api= (khali) use karein.
 *
 * Ye script sirf dynamic API routes (/api/*, player_api.php, get.php, xmltv.php,
 * /live|movie|series, portal.php, stalker_portal, /c/portal.php, /s/*, /playout/*)
 * ko remote base par bhejti hai — CSS/images/pages same origin par rehti hain.
 * Jab DEFAULT_BASE khaali ho to ye bilkul no-op hai. */
(function () {
  "use strict";
  var DEFAULT_BASE = ""; /* ← FREE HYBRID: yahan Netlify/API URL likhein */
  var BASE = String(window.MZ_API_BASE || DEFAULT_BASE || "").replace(/\/+$/, "");
  try {
    var param = new URLSearchParams(location.search).get("api");
    if (param !== null) {
      if (param === "") { localStorage.removeItem("mz_api_base"); }
      else { localStorage.setItem("mz_api_base", param.replace(/\/+$/, "")); }
    }
    var saved = localStorage.getItem("mz_api_base");
    if (saved) BASE = saved.replace(/\/+$/, "");
  } catch (e) { /* private mode — DEFAULT_BASE hi use hoga */ }
  window.MZ_API_BASE = BASE;
  if (!BASE) return;

  var DYNAMIC = /^\/(api\/|player_api\.php|panel_api\.php|get\.php|xmltv\.php|live\/|movie\/|series\/|portal\.php|stalker_portal\/|c\/portal\.php|s\/|playout\/)/;
  function rewrite(url) {
    try {
      if (typeof url !== "string" || !url) return url;
      if (url.charAt(0) === "/" && url.charAt(1) !== "/" && DYNAMIC.test(url)) return BASE + url;
      if (location.origin && url.indexOf(location.origin + "/") === 0) {
        var path = url.slice(location.origin.length);
        if (DYNAMIC.test(path)) return BASE + path;
      }
    } catch (e) { /* leave url untouched */ }
    return url;
  }

  if (window.fetch) {
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      try {
        if (typeof input === "string") input = rewrite(input);
        else if (input && typeof input.url === "string" && typeof Request === "function") {
          var next = rewrite(input.url);
          if (next !== input.url) input = new Request(next, input);
        }
      } catch (e) { /* fall through to native fetch */ }
      return nativeFetch(input, init);
    };
  }
  if (navigator.sendBeacon) {
    var nativeBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      return nativeBeacon(rewrite(String(url)), data);
    };
  }
})();
