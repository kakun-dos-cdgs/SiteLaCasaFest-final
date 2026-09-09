(function () {
  "use strict";

  /* ==========================================
     SCROLL REVEAL — LA CASA FEST
     Adiciona ".is-visible" aos elementos ".reveal" / ".reveal-left" /
     ".reveal-right" / ".reveal-scale" quando eles entram na tela.
     A classe ".js-reveal" no <html> (adicionada inline no <head>) é
     o que ativa o estado escondido no CSS — sem ela, nada some.
     ========================================== */

  function initReveal() {
    var targets = document.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right, .reveal-scale"
    );

    if (!targets.length) return;

    function showAll() {
      Array.prototype.forEach.call(targets, function (el) {
        el.classList.add("is-visible");
      });
    }

    if (!("IntersectionObserver" in window)) {
      // Navegador sem suporte: mostra tudo direto, sem deixar conteúdo oculto.
      showAll();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );

    Array.prototype.forEach.call(targets, function (el) {
      observer.observe(el);
    });
  }

  // Funciona tanto com o script no fim do body quanto se ele for movido para o head.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReveal);
  } else {
    initReveal();
  }
})();
