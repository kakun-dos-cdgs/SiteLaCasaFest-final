(function () {
  "use strict";

  /* ==========================================
     CARROSSEL INFINITO — LA CASA FEST
     ========================================== */

  const VELOCIDADE = 40; // pixels por segundo
  const SENTIDO = -1;    // -1 = esquerda | 1 = direita

  const feed = document.getElementById("feed");
  const trilho = document.getElementById("trilho");

  if (!feed || !trilho) return;

  const catalogo =
    feed.closest(".catalogo") || feed.parentElement;

  const btnVoltar = catalogo
    ? catalogo.querySelector(".botao.esquerda")
    : null;

  const btnAvancar = catalogo
    ? catalogo.querySelector(".botao.direita")
    : null;

  /* ==========================================
     POSTS ORIGINAIS
     ========================================== */

  const originais = Array.from(trilho.children);

  if (!originais.length) return;

  /* ==========================================
     ESTADO
     ========================================== */

  let ciclo = 0;
  let posicao = 0;
  let anterior = performance.now();

  let arrastando = false;
  let animandoBotao = false;
  let pausado = false;

  /* ==========================================
     REMOVE CLONES
     ========================================== */

  function limparClones() {
    trilho
      .querySelectorAll(".post-clone")
      .forEach(function (clone) {
        clone.remove();
      });
  }

  /* ==========================================
     CLONA OS POSTS
     ========================================== */

  function clonarConjunto() {
    const fragmento = document.createDocumentFragment();

    originais.forEach(function (post) {
      const clone = post.cloneNode(true);

      clone.classList.add("post-clone");
      clone.setAttribute("aria-hidden", "true");

      clone
        .querySelectorAll("a, button, input")
        .forEach(function (elemento) {
          elemento.setAttribute("tabindex", "-1");
        });

      fragmento.appendChild(clone);
    });

    trilho.appendChild(fragmento);
  }

  /* ==========================================
     MEDE UM CONJUNTO COMPLETO
     ========================================== */

  function medir() {
    limparClones();

    const primeiro = originais[0];
    const ultimo = originais[originais.length - 1];

    const inicio =
      primeiro.getBoundingClientRect().left;

    const fim =
      ultimo.getBoundingClientRect().right;

    const margem =
      parseFloat(
        getComputedStyle(ultimo).marginRight
      ) || 0;

    ciclo =
      fim -
      inicio +
      margem;

    if (ciclo <= 0) return;

    /*
     * Colocamos vários conjuntos.
     * Assim nunca falta conteúdo na tela.
     */
    clonarConjunto();
    clonarConjunto();

    while (
      trilho.scrollWidth <
      feed.clientWidth + ciclo * 2
    ) {
      clonarConjunto();

      if (
        trilho.children.length >
        originais.length * 20
      ) {
        break;
      }
    }

    normalizar();
    aplicar();
  }

  /* ==========================================
     NORMALIZA POSIÇÃO
     ========================================== */

  function normalizar() {
    if (ciclo <= 0) return;

    posicao %= ciclo;

    if (posicao > 0) {
      posicao -= ciclo;
    }
  }

  /* ==========================================
     APLICA TRANSFORMAÇÃO
     ========================================== */

  function aplicar() {
    trilho.style.transform =
      `translate3d(${posicao}px, 0, 0)`;
  }

  /* ==========================================
     MOVE O TRILHO
     ========================================== */

  function mover(delta) {
    posicao += delta;

    normalizar();
    aplicar();
  }

  /* ==========================================
     ANIMAÇÃO AUTOMÁTICA
     ========================================== */

  function animar(agora) {
    const deltaTempo =
      Math.min(
        (agora - anterior) / 1000,
        0.05
      );

    anterior = agora;

    if (
      !arrastando &&
      !animandoBotao &&
      !pausado &&
      ciclo > 0
    ) {
      mover(
        SENTIDO *
        VELOCIDADE *
        deltaTempo
      );
    }

    requestAnimationFrame(animar);
  }

  /* ==========================================
     ARRASTE
     ========================================== */

  let inicioX = 0;
  let posicaoInicial = 0;
  let arrastou = false;

  feed.addEventListener(
    "pointerdown",
    function (evento) {

      if (
        evento.pointerType === "mouse" &&
        evento.button !== 0
      ) {
        return;
      }

      arrastando = true;
      arrastou = false;

      /*
       * Se estava com mouse em cima de um card,
       * continua pausado durante o arraste.
       */
      pausado = true;

      inicioX = evento.clientX;
      posicaoInicial = posicao;

      feed.classList.add("arrastando");

      feed.setPointerCapture(
        evento.pointerId
      );
    }
  );

  feed.addEventListener(
    "pointermove",
    function (evento) {

      if (!arrastando) return;

      const distancia =
        evento.clientX - inicioX;

      if (Math.abs(distancia) > 4) {
        arrastou = true;
      }

      posicao =
        posicaoInicial +
        distancia;

      normalizar();
      aplicar();
    }
  );

  [
    "pointerup",
    "pointercancel"
  ].forEach(function (nome) {

    feed.addEventListener(
      nome,
      function () {

        arrastando = false;

        feed.classList.remove(
          "arrastando"
        );

        /*
         * Se o mouse ainda estiver sobre
         * algum card, continua pausado.
         */
        const card =
          document.elementFromPoint(
            ultimoMouseX,
            ultimoMouseY
          );

        if (
          card &&
          card.closest &&
          card.closest(".post")
        ) {
          pausado = true;
        } else {
          pausado = false;
        }
      }
    );
  });

  /* ==========================================
     ARMAZENA POSIÇÃO DO MOUSE
     ========================================== */

  let ultimoMouseX = 0;
  let ultimoMouseY = 0;

  feed.addEventListener(
    "pointermove",
    function (evento) {

      ultimoMouseX = evento.clientX;
      ultimoMouseY = evento.clientY;
    }
  );

  /* ==========================================
     EVITA ARRASTO NATIVO
     ========================================== */

  feed.addEventListener(
    "dragstart",
    function (evento) {
      evento.preventDefault();
    }
  );

  /* ==========================================
     EVITA CLIQUE APÓS ARRASTAR
     ========================================== */

  feed.addEventListener(
    "click",
    function (evento) {

      if (arrastou) {

        evento.preventDefault();
        evento.stopPropagation();

        arrastou = false;
      }
    },
    true
  );

  /* ==========================================
     PLAY DO VÍDEO + PAUSA DO CARROSSEL
     ========================================== */

  feed.addEventListener(
    "mouseover",
    function (evento) {

      const card =
        evento.target.closest(".post");

      if (!card) return;

      /*
       * Ignora movimentação entre elementos
       * internos do mesmo card.
       */
      const anteriorElemento =
        evento.relatedTarget;

      if (
        anteriorElemento &&
        card.contains(anteriorElemento)
      ) {
        return;
      }

      /*
       * PAUSA O CARROSSEL
       */
      pausado = true;

      /*
       * PROCURA O VÍDEO DESTE CARD
       */
      const video =
        card.querySelector("video");

      if (!video) return;

      video.muted = true;
      video.playsInline = true;

      /*
       * COMEÇA O VÍDEO
       */
      const promessa =
        video.play();

      if (promessa) {
        promessa.catch(function () {});
      }
    }
  );

  /* ==========================================
     SAIU DO CARD
     ========================================== */

  feed.addEventListener(
    "mouseout",
    function (evento) {

      const card =
        evento.target.closest(".post");

      if (!card) return;

      const destino =
        evento.relatedTarget;

      /*
       * Ainda está dentro do card.
       */
      if (
        destino &&
        card.contains(destino)
      ) {
        return;
      }

      /*
       * PARA O VÍDEO
       */
      const video =
        card.querySelector("video");

      if (video) {
        video.pause();

        /*
         * Volta para o começo.
         */
        try {
          video.currentTime = 0;
        } catch (erro) {}
      }

      /*
       * LIBERA O CARROSSEL
       */
      pausado = false;
    }
  );

  /* ==========================================
     SETAS
     ========================================== */

  function larguraCard() {

    const primeiro =
      trilho.children[0];

    if (!primeiro) return 300;

    const estilo =
      getComputedStyle(primeiro);

    return (
      primeiro.getBoundingClientRect().width +
      (
        parseFloat(
          estilo.marginRight
        ) || 0
      )
    );
  }

  function moverBotao(delta) {

    if (
      animandoBotao ||
      ciclo <= 0
    ) {
      return;
    }

    const inicio = posicao;
    const destino = inicio + delta;

    const inicioTempo =
      performance.now();

    const duracao = 400;

    animandoBotao = true;
    pausado = true;

    function passo(agora) {

      const progresso =
        Math.min(
          (agora - inicioTempo) /
            duracao,
          1
        );

      const suave =
        1 -
        Math.pow(
          1 - progresso,
          3
        );

      posicao =
        inicio +
        (destino - inicio) *
        suave;

      normalizar();
      aplicar();

      if (progresso < 1) {

        requestAnimationFrame(
          passo
        );

      } else {

        animandoBotao = false;

        /*
         * Depois da seta,
         * volta a rolagem automática.
         */
        pausado = false;
      }
    }

    requestAnimationFrame(passo);
  }

  function avancar() {
    moverBotao(
      -larguraCard()
    );
  }

  function voltar() {
    moverBotao(
      larguraCard()
    );
  }

  if (btnAvancar) {
    btnAvancar.addEventListener(
      "click",
      avancar
    );
  }

  if (btnVoltar) {
    btnVoltar.addEventListener(
      "click",
      voltar
    );
  }

  /* ==========================================
     TECLADO
     ========================================== */

  feed.addEventListener(
    "keydown",
    function (evento) {

      if (
        evento.key === "ArrowRight"
      ) {

        evento.preventDefault();
        avancar();
      }

      if (
        evento.key === "ArrowLeft"
      ) {

        evento.preventDefault();
        voltar();
      }
    }
  );

  /* ==========================================
     INICIALIZAÇÃO
     ========================================== */

  function iniciar() {

    medir();

    anterior =
      performance.now();

    requestAnimationFrame(
      animar
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      iniciar,
      {
        once: true
      }
    );

  } else {

    iniciar();
  }

  /* ==========================================
     RECALCULA AO REDIMENSIONAR
     ========================================== */

  let timerResize = null;

  window.addEventListener(
    "resize",
    function () {

      clearTimeout(
        timerResize
      );

      timerResize =
        setTimeout(
          medir,
          150
        );
    }
  );

})();
