/* ============================================================
   MIZANORA.NET — Net TV app layer (v7)
   3D content rows, Siravex player (/play/tt<imdbId>), tune-in
   splash animations, free songs API, Google/email login, ads +
   Search Console verification injection. Purely additive — the
   core player/forms in site.js keep working unchanged. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var config = { experience: {} };
  var IMDB_KEY = "";

  function toast(message, isError) {
    var item = $("toast");
    if (!item) return;
    item.textContent = String(message);
    item.className = "toast show" + (isError ? " err" : "");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { item.className = "toast"; }, 4200);
  }
  window.NTV = { toast: toast };

  /* ---------- config: verification meta, adsense, posters ---------- */
  function safeJson(r) {
    return r.json().catch(function () { throw new Error("Backend unavailable. Internet / server check karein."); });
  }
  fetch("/api/embed?action=config").then(safeJson).then(function (data) {
    if (!data || !data.ok) return;
    config = data;
    var exp = data.experience || {};
    IMDB_KEY = String(exp.imdbApiKey || "").trim();
    try { if (!IMDB_KEY) IMDB_KEY = String(localStorage.getItem("mz_imdb_key") || "").trim(); } catch (e) {}
    var gsc = String(exp.gscVerification || exp.verification || "").replace(/^google-site-verification=/, "").trim();
    if (gsc) {
      var meta = document.createElement("meta");
      meta.name = "google-site-verification";
      meta.content = gsc;
      document.head.appendChild(meta);
    }
    var bing = String(exp.bingVerification || "").trim();
    if (bing) {
      var bmeta = document.createElement("meta");
      bmeta.name = "msvalidate.01";
      bmeta.content = bing;
      document.head.appendChild(bmeta);
    }
    if (exp.adsenseId) {
      var s = document.createElement("script");
      s.async = true;
      s.crossOrigin = "anonymous";
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(exp.adsenseId);
      document.head.appendChild(s);
      setTimeout(function () {
        document.querySelectorAll("ins.adsbygoogle").forEach(function (ins) {
          try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
        });
      }, 600);
    }
  }).catch(function () { /* offline — app still works */ });

  /* ---------- splash animation (channel / movie tune-in) ---------- */
  var splash = $("playSplash");
  function playSplash(tag, name) {
    if (!splash || reduced) return;
    var tagEl = splash.querySelector(".tag");
    var nameEl = splash.querySelector(".name");
    if (tagEl) tagEl.textContent = String(tag || "NOW PLAYING");
    if (nameEl) nameEl.textContent = String(name || "").slice(0, 60);
    splash.classList.remove("show");
    void splash.offsetWidth;
    splash.classList.add("show");
    clearTimeout(playSplash.timer);
    playSplash.timer = setTimeout(function () { splash.classList.remove("show"); }, 1400);
  }
  window.NTV.splash = playSplash;

  /* Channel tune-in splash: watch the core player dialog open state. */
  try {
    var dialog = $("playerDialog");
    if (dialog && "MutationObserver" in window) {
      var mo = new MutationObserver(function () {
        if (dialog.hasAttribute("open")) {
          var ch = $("introChannel");
          var title = $("playerTitle");
          playSplash("NOW PLAYING", (ch && ch.textContent) || (title && title.textContent) || "Mizanora Net TV");
        }
      });
      mo.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    }
  } catch (e) {}

  /* ---------- Siravex player modal (embed /play/tt<imdbId>) ---------- */
  var modal = $("siravexModal");
  var SIRAVEX_BASE = "https://slast430did.com/play/";
  function siravexBase() {
    var exp = (config && config.experience) || {};
    return String(exp.siravexBase || SIRAVEX_BASE).replace(/\/?$/, "/");
  }
  function openSiravex(imdbId, title) {
    var frame = $("siravexFrame");
    var head = $("siravexTitle");
    var id = String(imdbId || "").trim();
    if (!/^tt\d+$/i.test(id)) { toast("Is title ka IMDb ID available nahi.", true); return; }
    if (!modal || !frame) { window.open(siravexBase() + encodeURIComponent(id), "_blank", "noopener"); return; }
    if (head) head.textContent = title || "Mizanora Net TV Player";
    frame.src = siravexBase() + encodeURIComponent(id);
    playSplash("FEATURE PRESENTATION", title || "Mizanora Net TV");
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  }
  window.NTV.playImdb = openSiravex;
  (function bindModal() {
    if (!modal) return;
    var closeBtn = $("siravexClose");
    function close() {
      var frame = $("siravexFrame");
      if (frame) frame.src = "about:blank";
      if (typeof modal.close === "function") modal.close();
      else modal.removeAttribute("open");
    }
    if (closeBtn) closeBtn.addEventListener("click", close);
    modal.addEventListener("cancel", function (event) { event.preventDefault(); close(); });
    modal.addEventListener("click", function (event) { if (event.target === modal) close(); });
  })();

  /* ---------- Movies & Series (IMDb via Cinemeta + local catalog fallback) ---------- */
  var rowsHost = $("ntvRows");
  var ART_GRADS = [
    "linear-gradient(150deg,#1c2f6e,#5b2c92)", "linear-gradient(150deg,#0f4c5c,#1c6b8c)",
    "linear-gradient(150deg,#5c1a33,#a13a63)", "linear-gradient(150deg,#234026,#3f7d3c)",
    "linear-gradient(150deg,#5c3a12,#a9701f)", "linear-gradient(150deg,#2a1c5c,#6237b8)"
  ];
  function normalizeMeta(m, kind) {
    if (!m) return null;
    var id = String(m.imdb_id || m.imdbId || m.id || "").trim();
    return {
      imdbId: /^tt\d+$/i.test(id) ? id : "",
      title: m.name || m.title || "",
      year: String(m.releaseInfo || m.year || "").slice(0, 4),
      rating: m.imdbRating || m.rating || "",
      poster: m.poster || m.background || "",
      genres: m.genres || m.genre || [],
      plot: m.description || m.plot || "",
      kind: kind
    };
  }
  function posterUrl(item) {
    if (item.poster && /^https?:\/\//.test(item.poster)) return item.poster;
    if (IMDB_KEY && item.imdbId) return "https://www.omdbapi.com/?i=" + encodeURIComponent(item.imdbId) + "&apikey=" + encodeURIComponent(IMDB_KEY);
    if (item.imdbId) return "https://images.metahub.space/poster/small/" + encodeURIComponent(item.imdbId) + "/img";
    return "";
  }
  function buildCard(item, kind) {
    var card = document.createElement("article");
    card.className = "ntv-card";
    card.setAttribute("data-tilt", "");
    var art = document.createElement("div");
    art.className = "ntv-art";
    art.style.background = ART_GRADS[(String(item.title || "?").length + (kind === "series" ? 2 : 0)) % ART_GRADS.length];
    var letter = document.createElement("div");
    letter.className = "letter";
    letter.textContent = String(item.title || "?").trim().charAt(0).toUpperCase();
    art.appendChild(letter);
    card.appendChild(art);
    var src = posterUrl(item);
    if (src) {
      var img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.onerror = function () { img.remove(); };
      img.src = src;
      card.appendChild(img);
    }
    var badges = document.createElement("div");
    badges.className = "ntv-badge-row";
    if (item.rating) { var rate = document.createElement("span"); rate.className = "ntv-chip-rating"; rate.textContent = "⭐ " + item.rating; badges.appendChild(rate); }
    var typeBadge = document.createElement("span");
    typeBadge.className = "ntv-chip-free";
    typeBadge.textContent = kind === "series" ? "SERIES" : "MOVIE";
    badges.appendChild(typeBadge);
    card.appendChild(badges);
    var info = document.createElement("div");
    info.className = "ntv-info";
    var b = document.createElement("b"); b.textContent = item.title || "";
    var small = document.createElement("small");
    var genres = Array.isArray(item.genres) ? item.genres : String(item.genres || "").split(",");
    small.textContent = [item.year, genres.filter(Boolean).slice(0, 2).join(" · ")].filter(Boolean).join(" · ");
    info.appendChild(b); info.appendChild(small);
    card.appendChild(info);
    var play = document.createElement("div");
    play.className = "ntv-play";
    play.innerHTML = "<span>▶</span>";
    card.appendChild(play);
    card.addEventListener("click", function () {
      if (item.imdbId && /^tt/i.test(item.imdbId)) {
        playSplash(kind === "series" ? "SERIES" : "MOVIE", item.title || "Mizanora Net TV");
        openSiravex(item.imdbId, item.title);
      } else {
        playSplash("COMING SOON", item.title || "Mizanora Net TV");
      }
    });
    return card;
  }
  function renderRow(host, title, items, kind) {
    if (!items || !items.length) return;
    var wrap = document.createElement("div");
    var head = document.createElement("div");
    head.className = "ntv-row-head";
    head.innerHTML = "<h3></h3><div class='line'></div>";
    head.querySelector("h3").textContent = title;
    var strip = document.createElement("div");
    strip.className = "ntv-strip";
    items.forEach(function (item) { strip.appendChild(buildCard(item, kind)); });
    wrap.appendChild(head); wrap.appendChild(strip);
    host.appendChild(wrap);
  }
  function fetchCinemeta(kind, path) {
    var url = "https://v3-cinemeta.strem.io/catalog/" + kind + "/" + path + ".json";
    return fetch(url).then(safeJson).then(function (d) {
      return (d && d.metas || []).map(function (m) { return normalizeMeta(m, kind); }).filter(function (m) { return m && m.imdbId; });
    }).catch(function () { return []; });
  }
  function fetchLocalCatalog(kind, params) {
    var q = new URLSearchParams(Object.assign({ action: kind, limit: "12" }, params || {}));
    return fetch("/api/embed?" + q).then(safeJson).then(function (d) {
      var list = (d && (d[kind] || d.movies || d.series)) || [];
      return list.map(function (m) { return normalizeMeta(m, kind); }).filter(Boolean);
    }).catch(function () { return []; });
  }
  if (rowsHost) {
    rowsHost.innerHTML = "<p class='guide-status'>IMDb catalog load ho raha hai…</p>";
    Promise.all([
      fetchCinemeta("movie", "top"),
      fetchCinemeta("movie", "top/search=pakistan"),
      fetchCinemeta("series", "top"),
      fetchLocalCatalog("movies", { sort: "rating-desc" }),
      fetchLocalCatalog("series", { sort: "rating-desc" })
    ]).then(function (all) {
      rowsHost.innerHTML = "";
      var movies = all[0].length ? all[0] : all[3];
      var pk = all[1].length ? all[1] : all[3].filter(function (m) { return /pakistan|urdu|lollywood/i.test([m.title, m.plot, (m.genres||[]).join(" ")].join(" ")); });
      var series = all[2].length ? all[2] : all[4];
      renderRow(rowsHost, "🔥 Trending Movies (IMDb)", movies.slice(0, 14), "movie");
      renderRow(rowsHost, "🇵🇰 Pakistani / Urdu Picks", pk.slice(0, 14), "movie");
      renderRow(rowsHost, "📺 Binge-Worthy Series (IMDb)", series.slice(0, 14), "series");
      if (!movies.length && !series.length) rowsHost.innerHTML = "<p class='guide-status'>Catalog abhi load nahi hua — refresh karein.</p>";
      window.NTV._imdbCatalog = { movies: movies, series: series, pk: pk };
    }).catch(function () {
      rowsHost.innerHTML = "<p class='guide-status'>Catalog abhi load nahi hua — internet check karein.</p>";
    });
  }

  /* ---------- hero 3D stage parallax ---------- */
  if (!reduced) {
    var hero = document.querySelector(".ntv-hero");
    var stage = $("ntvStage");
    if (hero && stage && window.matchMedia && window.matchMedia("(hover:hover)").matches) {
      hero.addEventListener("mousemove", function (event) {
        var r = hero.getBoundingClientRect();
        var px = (event.clientX - r.left) / r.width - 0.5;
        var py = (event.clientY - r.top) / r.height - 0.5;
        stage.style.transform = "rotateY(" + (px * 9).toFixed(2) + "deg) rotateX(" + (-py * 7).toFixed(2) + "deg)";
      }, { passive: true });
      hero.addEventListener("mouseleave", function () { stage.style.transform = ""; }, { passive: true });
    }
  }

  /* ---------- card 3D tilt ---------- */
  if (!reduced && window.matchMedia && window.matchMedia("(hover:hover)").matches) {
    document.addEventListener("mousemove", function (event) {
      var card = event.target.closest && event.target.closest("[data-tilt]");
      if (!card) return;
      var r = card.getBoundingClientRect();
      var px = (event.clientX - r.left) / r.width - 0.5;
      var py = (event.clientY - r.top) / r.height - 0.5;
      card.style.transform = "translateY(-8px) scale(1.035) rotateY(" + (px * 10).toFixed(2) + "deg) rotateX(" + (-py * 10).toFixed(2) + "deg)";
    }, { passive: true });
    document.addEventListener("mouseout", function (event) {
      var card = event.target.closest && event.target.closest("[data-tilt]");
      if (card) card.style.transform = "";
    }, { passive: true });
  }

  /* ---------- Songs — free iTunes Search API ---------- */
  var songGrid = $("songGrid");
  var songBar = $("ntvSongbar");
  var songAudio = $("songAudio");
  var currentSongCard = null;
  function renderSongs(results) {
    if (!songGrid) return;
    songGrid.innerHTML = "";
    if (!results.length) {
      songGrid.innerHTML = "<p class='guide-status'>Koi song nahi mila — doosra search try karein.</p>";
      return;
    }
    results.forEach(function (track) {
      var card = document.createElement("article");
      card.className = "ntv-song";
      card.innerHTML =
        "<img alt='' loading='lazy' decoding='async'>" +
        "<div class='ntv-eq'><i></i><i></i><i></i><i></i></div>" +
        "<div class='meta'><b></b><small></small></div>";
      var img = card.querySelector("img");
      img.src = String(track.artworkUrl100 || "").replace("100x100", "400x400");
      img.onerror = function () { img.remove(); };
      card.querySelector("b").textContent = track.trackName || "";
      card.querySelector("small").textContent = track.artistName || "";
      card.addEventListener("click", function () {
        if (!songAudio || !track.previewUrl) { toast("Is song ka preview available nahi.", true); return; }
        if (currentSongCard) currentSongCard.classList.remove("playing");
        currentSongCard = card;
        card.classList.add("playing");
        songAudio.src = track.previewUrl;
        songAudio.play().catch(function () {});
        if (songBar) {
          songBar.querySelector("img").src = img.src || "";
          songBar.querySelector("b").textContent = track.trackName || "";
          songBar.querySelector("small").textContent = track.artistName || "";
          songBar.classList.add("show");
        }
        playSplash("NOW PLAYING", track.trackName || "Mizanora Net TV");
      });
      songGrid.appendChild(card);
    });
  }
  function searchSongs(term) {
    if (!songGrid) return;
    songGrid.innerHTML = "<p class='guide-status'>Songs load ho rahe hain…</p>";
    fetch("https://itunes.apple.com/search?media=music&limit=18&term=" + encodeURIComponent(term))
      .then(function (r) { if (!r.ok) throw new Error("Songs API busy"); return r.json(); })
      .then(function (data) { renderSongs((data && data.results) || []); })
      .catch(function () {
        songGrid.innerHTML = "<p class='guide-status'>Songs abhi load nahi ho sake — internet check karein.</p>";
      });
  }
  var chips = $("songChips");
  if (chips) {
    chips.addEventListener("click", function (event) {
      var chip = event.target.closest("[data-song-term]");
      if (!chip) return;
      chips.querySelectorAll(".ntv-chip").forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      searchSongs(chip.getAttribute("data-song-term"));
    });
  }
  var songForm = $("songForm");
  if (songForm) {
    songForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = $("songSearch");
      var term = input && input.value.trim();
      if (term) searchSongs(term);
    });
  }
  if (songAudio) {
    songAudio.addEventListener("ended", function () {
      if (currentSongCard) currentSongCard.classList.remove("playing");
      if (songBar) songBar.classList.remove("show");
    });
    var sbToggle = $("songbarToggle");
    if (sbToggle) sbToggle.addEventListener("click", function () {
      if (songAudio.paused) songAudio.play().catch(function () {});
      else songAudio.pause();
      sbToggle.textContent = songAudio.paused ? "▶" : "⏸";
    });
    var sbClose = $("songbarClose");
    if (sbClose) sbClose.addEventListener("click", function () {
      songAudio.pause();
      if (currentSongCard) currentSongCard.classList.remove("playing");
      if (songBar) songBar.classList.remove("show");
    });
    // featured songs on load
    searchSongs("top pakistan songs 2026");
  }

  /* ---------- app tab bar + scrollspy ---------- */
  var tabbar = $("ntvTabbar");
  if (tabbar) {
    tabbar.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-target]");
      if (!btn) return;
      var target = $(btn.getAttribute("data-target"));
      if (target) target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    });
    var sections = Array.prototype.map.call(tabbar.querySelectorAll("[data-target]"), function (btn) {
      return $(btn.getAttribute("data-target"));
    }).filter(Boolean);
    if ("IntersectionObserver" in window && sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          tabbar.querySelectorAll("button").forEach(function (b) {
            b.classList.toggle("active", b.getAttribute("data-target") === entry.target.id);
          });
        });
      }, { rootMargin: "-42% 0px -52% 0px" });
      sections.forEach(function (sec) { spy.observe(sec); });
    }
  }

  /* ---------- Google / email login (Firebase Auth) ---------- */
  var profileBtn = $("profileBtn");
  var profileMenu = $("profileMenu");
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      profileMenu.classList.toggle("open");
    });
    document.addEventListener("click", function (event) {
      if (!profileMenu.contains(event.target) && event.target !== profileBtn) profileMenu.classList.remove("open");
    });
    function setUser(user) {
      var nameEl = $("profileName");
      if (user && user.email) {
        profileBtn.textContent = String(user.email).charAt(0).toUpperCase();
        if (nameEl) nameEl.textContent = user.email;
      } else {
        profileBtn.textContent = "👤";
        if (nameEl) nameEl.textContent = "Guest — login karein";
      }
    }
    setUser(null);
    // Persist auth state
    import("/assets/js/firebase-client.js").then(function(FB){
      if (FB.subscribeAuth) FB.subscribeAuth(function(u){ setUser(u); });
    }).catch(function(){});
    $("googleLogin") && $("googleLogin").addEventListener("click", function () {
      import("/assets/js/firebase-client.js").then(function (FB) {
        return FB.loginWithGoogle();
      }).then(function (res) {
        var user = res && res.ok ? res.user : (res && res.email ? res : null);
        if (user) { setUser(user); toast("Welcome, " + (user.displayName || user.email) + "!"); profileMenu.classList.remove("open"); }
        else if (res && res.error) { toast("Google login: " + res.error, true); }
      }).catch(function (err) { toast("Google login fail: " + (err && err.message || "popup blocked"), true); });
    });
    $("emailLogin") && $("emailLogin").addEventListener("click", function () {
      var email = window.prompt("Email address:");
      if (!email) return;
      var pass = window.prompt("Password (new users: min 6 chars):");
      if (!pass) return;
      import("/assets/js/firebase-client.js").then(function (FB) {
        return FB.loginWithEmailPassword(email, pass).then(function (res) {
          if (res && res.ok) return res;
          // Try creating account if user not found
          if (res && /user-not-found|invalid-credential|invalid-login/i.test(String(res.code || res.error || ""))) {
            return FB.createUserWithEmailPassword ? FB.createUserWithEmailPassword(email, pass) : res;
          }
          return res;
        });
      }).then(function (res) {
        var user = res && res.ok ? res.user : null;
        if (user) { setUser(user); toast("Welcome!"); profileMenu.classList.remove("open"); }
        else if (res && res.error) { toast("Login fail: " + res.error, true); }
      }).catch(function (err) { toast("Login fail: " + (err && err.message || "try Google sign-in"), true); });
    });
    $("logoutBtn") && $("logoutBtn").addEventListener("click", function () {
      import("/assets/js/firebase-client.js").then(function (FB) { return FB.logoutUser(); }).then(function () {
        setUser(null); profileMenu.classList.remove("open"); toast("Logged out.");
      }).catch(function () {});
    });
  }

  /* ---------- premium: scroll + payment copy ---------- */
  document.querySelectorAll("[data-copy-text]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy-text");
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () { toast("Copied: " + text); }).catch(function () {});
      } else toast(text);
    });
  });
})();
