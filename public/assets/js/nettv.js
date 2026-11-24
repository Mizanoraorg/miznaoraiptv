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
  fetch("/api/embed?action=config").then(function (r) { return r.json(); }).then(function (data) {
    if (!data || !data.ok) return;
    config = data;
    var exp = data.experience || {};
    IMDB_KEY = String(exp.imdbApiKey || "").trim();
    try { if (!IMDB_KEY) IMDB_KEY = String(localStorage.getItem("mz_imdb_key") || "").trim(); } catch (e) {}
    if (exp.verification) {
      var meta = document.createElement("meta");
      meta.name = "google-site-verification";
      meta.content = String(exp.verification).replace(/^google-site-verification=/, "");
      document.head.appendChild(meta);
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

  /* ---------- Siravex player modal (/play/tt<imdbId>) ---------- */
  var modal = $("siravexModal");
  function openSiravex(imdbId, title) {
    var frame = $("siravexFrame");
    var head = $("siravexTitle");
    if (!modal || !frame) { window.open("https://siravex.netlify.app/play/" + encodeURIComponent(imdbId), "_blank", "noopener"); return; }
    if (head) head.textContent = title || "Mizanora Net TV Player";
    frame.src = "https://siravex.netlify.app/play/" + encodeURIComponent(imdbId);
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

  /* ---------- Netflix-style 3D rows (movies + series from IMDb catalog) ---------- */
  var rowsHost = $("ntvRows");
  var ART_GRADS = [
    "linear-gradient(150deg,#1c2f6e,#5b2c92)", "linear-gradient(150deg,#0f4c5c,#1c6b8c)",
    "linear-gradient(150deg,#5c1a33,#a13a63)", "linear-gradient(150deg,#234026,#3f7d3c)",
    "linear-gradient(150deg,#5c3a12,#a9701f)", "linear-gradient(150deg,#2a1c5c,#6237b8)"
  ];
  function posterUrl(item, kind) {
    if (item.poster) return item.poster;
    if (IMDB_KEY && item.imdbId) {
      return "https://www.omdbapi.com/?i=" + encodeURIComponent(item.imdbId) + "&apikey=" + encodeURIComponent(IMDB_KEY);
    }
    return "";
  }
  function buildCard(item, kind) {
    var card = document.createElement("article");
    card.className = "ntv-card";
    card.setAttribute("data-tilt", "");
    var img = document.createElement("img");
    var art = document.createElement("div");
    art.className = "ntv-art";
    art.style.background = ART_GRADS[(String(item.title || "?").length + (kind === "series" ? 2 : 0)) % ART_GRADS.length];
    var letter = document.createElement("div");
    letter.className = "letter";
    letter.textContent = String(item.title || "?").trim().charAt(0).toUpperCase();
    art.appendChild(letter);
    var src = posterUrl(item, kind);
    if (src && /^https?:\/\//.test(src)) {
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.onerror = function () { img.remove(); };
      img.src = src;
      card.appendChild(art);
      card.appendChild(img);
    } else {
      card.appendChild(art);
    }
    var badges = document.createElement("div");
    badges.className = "ntv-badge-row";
    if (item.rating) {
      var rate = document.createElement("span");
      rate.className = "ntv-chip-rating";
      rate.textContent = "⭐ " + item.rating;
      badges.appendChild(rate);
    }
    var free = document.createElement("span");
    free.className = "ntv-chip-free";
    free.textContent = kind === "series" ? "SERIES" : "MOVIE";
    badges.appendChild(free);
    card.appendChild(badges);
    var info = document.createElement("div");
    info.className = "ntv-info";
    var b = document.createElement("b");
    b.textContent = item.title || "";
    var small = document.createElement("small");
    small.textContent = [item.year, (item.genres || []).slice(0, 2).join(" · ")].filter(Boolean).join(" · ");
    info.appendChild(b);
    info.appendChild(small);
    card.appendChild(info);
    var play = document.createElement("div");
    play.className = "ntv-play";
    play.innerHTML = "<span>▶</span>";
    card.appendChild(play);
    card.addEventListener("click", function () {
      if (item.imdbId && /^tt/.test(item.imdbId)) openSiravex(item.imdbId, item.title);
      else playSplash("COMING SOON", item.title || "Mizanora Net TV");
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
    wrap.appendChild(head);
    wrap.appendChild(strip);
    host.appendChild(wrap);
  }
  if (rowsHost) {
    Promise.all([
      fetch("/api/embed?action=movies&limit=12&sort=rating-desc").then(function (r) { return r.json(); }).catch(function () { return null; }),
      fetch("/api/embed?action=movies&limit=12&q=Pakistani").then(function (r) { return r.json(); }).catch(function () { return null; }),
      fetch("/api/embed?action=series&limit=12&sort=rating-desc").then(function (r) { return r.json(); }).catch(function () { return null; })
    ]).then(function (all) {
      var movies = all[0] && all[0].movies || [];
      var pk = all[1] && all[1].movies || [];
      var series = all[2] && all[2].series || [];
      renderRow(rowsHost, "🔥 Trending Movies", movies, "movie");
      renderRow(rowsHost, "🇵🇰 Pakistani Blockbusters", pk.filter(function (m) { return movies.indexOf(m) < 0; }).slice(0, 12), "movie");
      renderRow(rowsHost, "📺 Binge-Worthy Series", series, "series");
      if (!movies.length && !series.length) rowsHost.innerHTML = "";
    }).catch(function () {});
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
      .then(function (r) { return r.json(); })
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
    $("googleLogin") && $("googleLogin").addEventListener("click", function () {
      import("/assets/js/firebase-client.js").then(function (FB) {
        return FB.loginWithGoogle();
      }).then(function (user) {
        if (user) { setUser(user); toast("Welcome, " + (user.displayName || user.email) + "!"); profileMenu.classList.remove("open"); }
      }).catch(function (err) { toast("Google login fail: " + (err && err.message || "popup blocked"), true); });
    });
    $("emailLogin") && $("emailLogin").addEventListener("click", function () {
      var email = window.prompt("Email address:");
      var pass = window.prompt("Password:");
      if (!email || !pass) return;
      import("/assets/js/firebase-client.js").then(function (FB) {
        return FB.loginWithEmailPassword(email, pass);
      }).then(function (user) {
        if (user) { setUser(user); toast("Welcome back!"); profileMenu.classList.remove("open"); }
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
