 (function () {
      // ========== CONFIGURAÇÃO ==========
      // Troque pela URL da API de orçamentos em produção.
      const API_BASE = "http://localhost:8080/api/orcamentos";

      let datasBloqueadas = new Set();

      const form = document.getElementById("orcamentoForm");
      const formError = document.getElementById("formError");
      const successPanel = document.getElementById("successPanel");
      const btnWhatsapp = document.getElementById("btnWhatsapp");
      const btnEnviar = document.getElementById("btnEnviar");
      const btnNovo = document.getElementById("btnNovo");
      const dataInput = document.getElementById("dataEvento");
      const dataHint = document.getElementById("dataHint");

      function showAlert(el, msg) {
        el.textContent = msg;
        el.classList.add("show");
      }

      function hideAlert(el) {
        el.classList.remove("show");
        el.textContent = "";
      }

      function hojeISO() {
        return new Date().toISOString().slice(0, 10);
      }

      async function carregarDatasBloqueadas() {
        try {
          const res = await fetch(`${API_BASE}/datas-bloqueadas`);
          if (!res.ok) throw new Error("Falha ao carregar datas");
          const datas = await res.json();
          datasBloqueadas = new Set(datas);
          dataInput.min = hojeISO();
          validarDataSelecionada();
        } catch (e) {
          console.warn("Não foi possível carregar datas bloqueadas:", e.message);
          dataInput.min = hojeISO();
        }
      }

      function validarDataSelecionada() {
        const val = dataInput.value;
        if (!val) {
          dataHint.textContent = "Datas já reservadas aparecem bloqueadas.";
          dataHint.classList.remove("blocked");
          return true;
        }
        if (datasBloqueadas.has(val)) {
          dataHint.textContent = "Esta data já está reservada. Escolha outra.";
          dataHint.classList.add("blocked");
          return false;
        }
        dataHint.textContent = "Data disponível ✓";
        dataHint.classList.remove("blocked");
        return true;
      }

      dataInput.addEventListener("change", validarDataSelecionada);
      dataInput.addEventListener("input", validarDataSelecionada);

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideAlert(formError);

        if (!validarDataSelecionada()) {
          showAlert(formError, "Esta data já está reservada. Escolha outra data.");
          return;
        }

        const payload = {
          nome: document.getElementById("nome").value.trim(),
          telefone: document.getElementById("telefone").value.trim(),
          tipoEvento: document.getElementById("tipoEvento").value,
          dataEvento: dataInput.value,
          quantidadeConvidados: Number(document.getElementById("quantidadeConvidados").value),
          mensagem: document.getElementById("mensagem").value.trim() || null,
        };

        btnEnviar.disabled = true;
        btnEnviar.innerHTML = '<span class="spinner"></span> Enviando...';

        try {
          const res = await fetch(API_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            const msg =
              data.message ||
              data.error ||
              (res.status === 409
                ? "Esta data já está reservada. Escolha outra data."
                : res.status === 429
                  ? "Muitas solicitações. Aguarde um momento e tente de novo."
                  : "Não foi possível enviar. Verifique os dados e tente novamente.");
            showAlert(formError, msg);
            return;
          }

          form.style.display = "none";
          successPanel.classList.add("show");

          if (data.linkWhatsapp) {
            btnWhatsapp.href = data.linkWhatsapp;
            btnWhatsapp.style.display = "inline-flex";
          } else {
            btnWhatsapp.style.display = "none";
          }

          if (payload.dataEvento) datasBloqueadas.add(payload.dataEvento);
        } catch (err) {
          showAlert(formError, "Erro de conexão. Verifique se a API está online.");
        } finally {
          btnEnviar.disabled = false;
          btnEnviar.textContent = "Enviar solicitação";
        }
      });

      btnNovo.addEventListener("click", () => {
        form.reset();
        form.style.display = "block";
        successPanel.classList.remove("show");
        hideAlert(formError);
        dataHint.textContent = "Datas já reservadas aparecem bloqueadas.";
        dataHint.classList.remove("blocked");
      });

      carregarDatasBloqueadas();
    })();