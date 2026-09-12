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