(function () {
  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var supportsObserver = "IntersectionObserver" in window;

  function showAll() {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  if (reduceMotion.matches || !supportsObserver) {
    showAll();
    return;
  }

  var targets = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  if (!targets.length) return;

  var observer = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach(function (el) { observer.observe(el); });

  window.addEventListener("load", function () {
    window.setTimeout(showAll, 2400);
  });

  initReadingProgress();
  initTocHighlight();
})();

initListenPlayer();

function initEmblemClamp() {
  var emblem = document.querySelector(".page-head__emblem");
  var head = document.querySelector(".page-head");
  var band = document.querySelector(".listen");
  if (!emblem || !head || !band) return;

  function glyphGapPx() {
    try {
      var fs = parseFloat(window.getComputedStyle(emblem).fontSize) || 160;
      var c = document.createElement("canvas");
      var ctx = c.getContext("2d");
      ctx.font = "400 " + fs + "px Sacramento, cursive, sans-serif";
      var m = ctx.measureText("BC");
      if (typeof m.actualBoundingBoxDescent !== "number") return null;
      var emDescent = m.emHeightDescent || fs * 0.2;
      var ink = m.actualBoundingBoxDescent;
      var gap = emDescent - ink;
      return gap > 0 ? gap : 0;
    } catch (err) {
      return null;
    }
  }

  function clamp() {
    var b = band.getBoundingClientRect();
    var ph = head.getBoundingClientRect();
    var border = parseFloat(window.getComputedStyle(head).borderBottomWidth) || 0;
    var contentBottom = ph.bottom - border;

    var gap = glyphGapPx();
    if (gap === null) return;

    emblem.style.top = "auto";
    emblem.style.bottom = (contentBottom - b.bottom - gap) + "px";
  }

  if (document.fonts && document.fonts.ready) {
    clamp();
    document.fonts.ready.then(function () {
      clamp();
      window.addEventListener("load", clamp);
      window.addEventListener("resize", clamp);
    });
  } else {
    clamp();
    window.addEventListener("load", clamp);
    window.addEventListener("resize", clamp);
  }
}

initEmblemClamp();

function initListenPlayer() {
  var items = Array.prototype.slice.call(document.querySelectorAll(".listen__item"));
  if (!items.length) return;

  function iconPlay() {
    return '<svg class="listen__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
  }

  function iconPause() {
    return '<svg class="listen__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  }

  function stop(item) {
    var audio = item.querySelector(".listen__audio");
    var btn = item.querySelector(".listen__play");
    if (!audio || !btn) return;
    audio.pause();
    audio.currentTime = 0;
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = iconPlay();
    item.classList.remove("is-playing");
  }

  items.forEach(function (item) {
    var audio = item.querySelector(".listen__audio");
    var btn = item.querySelector(".listen__play");
    if (!audio || !btn) return;

    var volume = parseFloat(audio.getAttribute("data-volume"));
    if (!isNaN(volume)) audio.volume = volume;

    btn.addEventListener("click", function () {
      if (item.classList.contains("is-playing")) {
        stop(item);
        return;
      }
      items.forEach(stop);
      audio.currentTime = 0;
      audio.play();
      btn.setAttribute("aria-pressed", "true");
      btn.innerHTML = iconPause();
      item.classList.add("is-playing");
    });

    audio.addEventListener("ended", function () {
      stop(item);
    });
  });
}

function initReadingProgress() {
  var bar = document.querySelector(".progress__bar");
  if (!bar) return;

  function update() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? (window.scrollY || doc.scrollTop) / max : 0;
    bar.style.width = (ratio * 100).toFixed(2) + "%";
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

function initTocHighlight() {
  var links = document.querySelectorAll(".toc-link");
  var chapters = document.querySelectorAll(".chapter");
  if (!links.length || !chapters.length || !("IntersectionObserver" in window)) return;

  var byId = {};
  links.forEach(function (link) {
    byId[link.getAttribute("href").slice(1)] = link;
  });

  var activeId = null;
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        var link = byId[id];
        if (!link) return;
        if (activeId) {
          var prev = byId[activeId];
          if (prev) prev.classList.remove("is-active");
          activeId = null;
        }
        link.classList.add("is-active");
        activeId = id;
      });
    },
    { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
  );

  chapters.forEach(function (chapter) { observer.observe(chapter); });
}

initCarousels();
initTheatreTabs();

function initTheatreTabs() {
  var root = document.querySelector("[data-theatre-tabs]");
  if (!root) return;

  var triggers = Array.prototype.slice.call(root.querySelectorAll("[data-theatre-tab]"));
  var panels = Array.prototype.slice.call(root.querySelectorAll("[data-theatre-panel]"));
  if (!triggers.length || !panels.length) return;

  function select(id) {
    triggers.forEach(function (btn) {
      var on = btn.getAttribute("aria-controls") === id;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.id !== id;
    });
  }

  triggers.forEach(function (btn, i) {
    btn.addEventListener("click", function () {
      select(btn.getAttribute("aria-controls"));
    });

    btn.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = triggers[(i + 1) % triggers.length];
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = triggers[(i - 1 + triggers.length) % triggers.length];
      else if (e.key === "Home") next = triggers[0];
      else if (e.key === "End") next = triggers[triggers.length - 1];
      if (next) {
        e.preventDefault();
        select(next.getAttribute("aria-controls"));
        next.focus();
      }
    });
  });
}

function initCarousels() {
  var roots = Array.prototype.slice.call(document.querySelectorAll("[data-carousel]"));
  if (!roots.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ==== Общий лайтбокс для всех каруселей ==== */
  var lightbox = document.querySelector("[data-lightbox]");
  var lbFrame = lightbox ? lightbox.querySelector("[data-lightbox-frame]") : null;
  var lbPicture = lightbox ? lightbox.querySelector("[data-lightbox-picture]") : null;
  var lbCurrent = lightbox ? lightbox.querySelector("[data-lightbox-current]") : null;
  var lbTotal = lightbox ? lightbox.querySelector("[data-lightbox-total]") : null;
  var lbOpen = false;
  var active = null;
  var lbLastFocus = null;

  var lbImg = null;
  if (lightbox && lbPicture) {
    lbImg = document.createElement("img");
    lbImg.alt = "";
    lbImg.decoding = "async";
    lbPicture.appendChild(lbImg);
  }

  function lbUpdateImage(ctrl) {
    if (!lbImg || !ctrl) return;
    var node = ctrl.nodes[ctrl.pos];
    var imgEl = node ? node.querySelector("img") : null;
    lbImg.alt = imgEl ? imgEl.alt : "Фото " + (ctrl.index + 1);
    lbImg.src = imgEl ? imgEl.src : "";
    if (lbCurrent) lbCurrent.textContent = String(ctrl.index + 1);
    if (lbTotal) lbTotal.textContent = String(ctrl.N);
  }

  function lbClose() {
    if (!lbOpen || !lightbox) return;
    lbOpen = false;
    active = null;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    document.documentElement.classList.remove("is-locked");
    if (lbLastFocus && lbLastFocus.focus) lbLastFocus.focus();
  }

  function lbGo(dir) {
    if (!active) return;
    active.go(dir);
    lbUpdateImage(active);
  }

  function openLightbox(ctrl) {
    if (!lightbox || lbOpen || !ctrl) return;
    if (ctrl.nodes[ctrl.pos] && ctrl.nodes[ctrl.pos].classList.contains("is-empty")) return;
    lbOpen = true;
    active = ctrl;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    document.documentElement.classList.add("is-locked");
    lbLastFocus = document.activeElement;
    lbUpdateImage(ctrl);
    var closeBtn = lightbox.querySelector("[data-lightbox-close]");
    if (closeBtn && closeBtn.focus) closeBtn.focus();
  }

  /* ==== Обработчики лайтбокса (общие) ==== */
  if (lightbox) {
    var lbJustSwiped = false;

    lbFrame.addEventListener("click", function (e) {
      if (lbJustSwiped) { lbJustSwiped = false; return; }
      if (e.target === lbPicture || e.target === lbImg) return;
      lbClose();
    });

    lightbox.querySelectorAll("[data-lightbox-close]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (lbJustSwiped) { lbJustSwiped = false; return; }
        lbClose();
      });
    });

    var lbPrevBtn = lightbox.querySelector("[data-lightbox-prev]");
    var lbNextBtn = lightbox.querySelector("[data-lightbox-next]");
    if (lbPrevBtn) lbPrevBtn.addEventListener("click", function () { lbGo(-1); });
    if (lbNextBtn) lbNextBtn.addEventListener("click", function () { lbGo(1); });

    var lbTouch = null;
    lightbox.addEventListener("pointerdown", function (e) {
      lbTouch = e.clientX;
    });
    lightbox.addEventListener("pointerup", function (e) {
      if (lbTouch === null) return;
      var dx = e.clientX - lbTouch;
      lbTouch = null;
      var th = window.innerWidth * 0.12;
      if (dx > th) { lbJustSwiped = true; lbGo(-1); }
      else if (dx < -th) { lbJustSwiped = true; lbGo(1); }
    });

    document.addEventListener("keydown", function (e) {
      if (!lbOpen) return;
      if (e.key === "Escape") { e.preventDefault(); lbClose(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); lbGo(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); lbGo(1); }
      else if (e.key === "Tab") {
        var focusables = lightbox.querySelectorAll("button");
        if (focusables.length) {
          var first = focusables[0];
          var last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    });
  }

  /* ==== Сборка отдельной карусели ==== */
  function buildCarousel(root) {
    var viewport = root.querySelector("[data-carousel-viewport]");
    var track = root.querySelector("[data-carousel-track]");
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-slide]"));
    var prevBtn = root.querySelector("[data-carousel-prev]");
    var nextBtn = root.querySelector("[data-carousel-next]");
    var gallery = root.parentElement;
    var dotsWrap = gallery ? gallery.querySelector("[data-carousel-dots]") : null;
    var currentEl = gallery ? gallery.querySelector("[data-carousel-current]") : null;
    var totalEl = gallery ? gallery.querySelector("[data-carousel-total]") : null;

    if (!track || !slides.length) return null;

    var N = slides.length;
    var total = N * 3;
    var DURATION = 800;
    var timer = null;
    var autoTimer = null;
    var paused = false;

    var ctrl = {
      N: N,
      pos: N,
      index: 0,
      nodes: [],
      go: go,
      jumpTo: jumpTo
    };

    if (totalEl) totalEl.textContent = String(N);

    function cloneSet(dest) {
      slides.forEach(function (slide) {
        var c = slide.cloneNode(true);
        c.removeAttribute("loading");
        dest.appendChild(c);
      });
    }

    function clearTrack() {
      while (track.firstChild) track.removeChild(track.firstChild);
    }

    clearTrack();
    cloneSet(track);
    cloneSet(track);
    cloneSet(track);

    ctrl.nodes = Array.prototype.slice.call(track.querySelectorAll("[data-carousel-slide]"));

    function slideW() {
      return root.clientWidth * 0.6;
    }

    var PER = {
      0: { t: 0, s: 1, ry: 0, op: 1, z: 30, b: 1 },
      1: { t: 0.85, s: 0.82, ry: 26, op: 0.72, z: 20, b: 0.8 },
      2: { t: 1.7, s: 0.68, ry: 44, op: 0.4, z: 10, b: 0.6 }
    };

    function nodeStyleAt(i) {
      var off = i - ctrl.pos;
      var abs = Math.abs(off);
      var cfg = (abs <= 2) ? PER[abs] : { t: 4, s: 0.55, ry: 52, op: 0, z: 1, b: 0.4 };
      var dir = off < 0 ? -1 : 1;
      var w = slideW();
      var tx = cfg.t * w * dir;
      var ry = -cfg.ry * dir;
      if (reduceMotion.matches) ry = 0;
      return {
        transform: "translate(-50%, -50%) translate3d(" + tx + "px, 0, 0) scale(" + cfg.s + ") rotateY(" + ry + "deg)",
        opacity: cfg.op,
        zIndex: cfg.z,
        filter: "brightness(" + cfg.b + ")",
        active: off === 0,
        visible: abs <= 2
      };
    }

    function applyPose(instant) {
      ctrl.nodes.forEach(function (node, i) {
        var p = nodeStyleAt(i);
        if (instant) node.style.transition = "none";
        node.style.transform = p.transform;
        node.style.opacity = p.opacity;
        node.style.zIndex = p.zIndex;
        node.style.filter = p.filter;
        node.style.pointerEvents = p.visible ? "" : "none";
        node.classList.toggle("is-active", p.active);
      });
      if (instant) {
        void track.offsetWidth;
        ctrl.nodes.forEach(function (node) { node.style.transition = ""; });
      } else {
        void track.offsetWidth;
      }
    }

    function syncChrome() {
      if (currentEl) currentEl.textContent = String(ctrl.index + 1);
      if (dotsWrap) {
        dotsWrap.querySelectorAll(".carousel__dot").forEach(function (dot, i) {
          dot.classList.toggle("is-active", i === ctrl.index);
        });
      }
    }

    function normalize() {
      if (ctrl.pos >= 2 * N) ctrl.pos -= N;
      else if (ctrl.pos < N) ctrl.pos += N;
      applyPose(true);
    }

    function fitWithinTrack(dir) {
      if (dir > 0 && ctrl.pos > total - 2) {
        ctrl.pos -= N;
        applyPose(true);
      } else if (dir < 0 && ctrl.pos < 1) {
        ctrl.pos += N;
        applyPose(true);
      }
    }

    var isInstant = reduceMotion.matches;

    function scheduleSettle() {
      if (isInstant) { normalize(); return; }
      if (timer) { window.clearTimeout(timer); timer = null; }
      timer = window.setTimeout(normalize, DURATION + 120);
    }

    function go(dir) {
      if (timer) { window.clearTimeout(timer); timer = null; }
      fitWithinTrack(dir);
      ctrl.pos += dir;
      ctrl.index = (ctrl.index + dir + N) % N;
      applyPose(isInstant);
      syncChrome();
      scheduleSettle();
    }

    function jumpTo(i) {
      if (timer) { window.clearTimeout(timer); timer = null; }
      var steps = i - ctrl.index;
      ctrl.pos += steps;
      while (ctrl.pos < 0) ctrl.pos += N;
      while (ctrl.pos >= total) ctrl.pos -= N;
      ctrl.index = i;
      applyPose(!isInstant);
      syncChrome();
      scheduleSettle();
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { go(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(1); });

    if (dotsWrap) {
      for (var d = 0; d < N; d++) {
        (function (i) {
          var dot = document.createElement("button");
          dot.className = "carousel__dot" + (i === 0 ? " is-active" : "");
          dot.type = "button";
          dot.setAttribute("role", "tab");
          dot.setAttribute("aria-label", "Фото " + (i + 1));
          dot.addEventListener("click", function () { jumpTo(i); });
          dotsWrap.appendChild(dot);
        })(d);
      }
    }

    applyPose(true);
    syncChrome();

    root.setAttribute("tabindex", "0");
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    });

    if (!reduceMotion.matches) {
      function tick() {
        if (paused) return;
        if (!root.matches(":hover") && document.activeElement !== root) go(1);
      }
      autoTimer = window.setInterval(tick, 5000);
      root.addEventListener("pointerenter", function () { paused = true; });
      root.addEventListener("pointerleave", function () { paused = false; });
      root.addEventListener("focusin", function () { paused = true; });
      root.addEventListener("focusout", function () { paused = false; });
    }

    var touchStartX = null;
    track.addEventListener("pointerdown", function (e) {
      touchStartX = e.clientX;
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
    });

    var downNode = null;
    ctrl.nodes.forEach(function (node) {
      node.addEventListener("pointerdown", function () {
        downNode = node;
      });
    });

    track.addEventListener("pointerup", function (e) {
      if (touchStartX === null) return;
      var dx = e.clientX - touchStartX;
      var threshold = root.clientWidth * 0.1;
      if (dx > threshold) go(-1);
      else if (dx < -threshold) go(1);
      else if (downNode) {
        if (downNode.classList.contains("is-active")) {
          openLightbox(ctrl);
        } else if (parseFloat(downNode.style.opacity || "0") > 0.01) {
          jumpTo(ctrl.nodes.indexOf(downNode) % N);
        }
      }
      touchStartX = null;
      downNode = null;
    });

    window.addEventListener("resize", function () { applyPose(true); });
  }

  roots.forEach(buildCarousel);
}