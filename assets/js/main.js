(function () {
  "use strict";

  /* ---------- ハンバーガーメニュー ---------- */
  var toggle = document.getElementById("navToggle");
  var gnav = document.getElementById("gnav");

  if (toggle && gnav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
      gnav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    gnav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 840) setOpen(false);
    });
  }

  /* ---------- スクロールで要素をフェードイン ---------- */
  var targets = document.querySelectorAll(".appear");

  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    Array.prototype.forEach.call(targets, function (el) {
      io.observe(el);
    });
  }

  /* ---------- Contactフォーム（Googleフォームへ送信） ---------- */
  var form = document.getElementById("contactForm");
  var thanks = document.getElementById("contactThanks");
  var iframe = document.getElementById("hidden_iframe");

  if (form && thanks && iframe) {
    var submitted = false;

    form.addEventListener("submit", function () {
      if (!form.getAttribute("action")) return;
      submitted = true;
    });

    // Googleフォームは応答をJSから読めないため、iframeの読み込み完了で成功とみなす
    iframe.addEventListener("load", function () {
      if (!submitted) return;
      form.hidden = true;
      thanks.hidden = false;
      thanks.setAttribute("tabindex", "-1");
      thanks.focus();
    });
  }
})();
