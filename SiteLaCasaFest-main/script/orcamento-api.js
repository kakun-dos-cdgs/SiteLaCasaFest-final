/**
 * La Casa Fest — Integração do formulário de orçamento (site público)
 * Sem token. Conecta em:
 *   POST /api/orcamentos
 *   GET  /api/orcamentos/datas-bloqueadas
 *
 * Como usar no HTML:
 *   <script src="orcamento-api.js"></script>
 *   (ou cole este código no final do body / no seu script principal)
 */

(function () {
  'use strict';

  // ============================================================
  // CONFIGURAÇÃO — altere só aqui em produção
  // ============================================================
  const API_BASE = 'http://localhost:8080/api/orcamentos';
  // Em produção, troque por algo como:
  // const API_BASE = 'https://sua-api.com/api/orcamentos';

  // ============================================================
  // Elementos
  // ============================================================
  const form = document.getElementById('orcamentoForm');
  const formCard = document.getElementById('formCard');
  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');
  const successPanel = document.getElementById('successPanel');
  const btnEnviar = document.getElementById('btnEnviar');
  const btnWhatsapp = document.getElementById('btnWhatsapp');
  const btnNovo = document.getElementById('btnNovo');
  const dataInput = document.getElementById('dataEvento');
  const dataHint = document.getElementById('dataHint');
  const telefoneInput = document.getElementById('telefone');

  if (!form) {
    console.warn('[La Casa Fest] Formulário #orcamentoForm não encontrado.');
    return;
  }

  // ============================================================
  // Estado
  // ============================================================
  let datasBloqueadas = new Set(); // 'YYYY-MM-DD'

  // ============================================================
  // UI helpers
  // ============================================================
  function showError(msg) {
    if (!formError) return;
    formError.textContent = msg;
    formError.classList.add('visible', 'show');
    formError.style.display = 'block';
    formError.hidden = false;
    if (formSuccess) {
      formSuccess.style.display = 'none';
      formSuccess.hidden = true;
    }
  }

  function hideAlerts() {
    if (formError) {
      formError.textContent = '';
      formError.style.display = 'none';
      formError.hidden = true;
      formError.classList.remove('visible', 'show');
    }
    if (formSuccess) {
      formSuccess.textContent = '';
      formSuccess.style.display = 'none';
      formSuccess.hidden = true;
    }
  }

  function setLoading(loading) {
    if (!btnEnviar) return;
    btnEnviar.disabled = loading;
    btnEnviar.textContent = loading ? 'Enviando...' : 'Enviar solicitação';
  }

  function showSuccessPanel(linkWhatsapp) {
    if (form) form.style.display = 'none';
    if (successPanel) {
      successPanel.classList.add('visible', 'show');
      successPanel.style.display = 'block';
      successPanel.hidden = false;
    }
    if (btnWhatsapp) {
      if (linkWhatsapp) {
        btnWhatsapp.href = linkWhatsapp;
        btnWhatsapp.style.display = '';
      } else {
        // Fallback genérico se o backend não devolver o link
        btnWhatsapp.href = 'https://wa.me/5511977941642';
      }
    }
    hideAlerts();
  }

  function resetForm() {
    form.reset();
    form.style.display = '';
    if (successPanel) {
      successPanel.style.display = 'none';
      successPanel.hidden = true;
      successPanel.classList.remove('visible', 'show');
    }
    hideAlerts();
    // Redefine data mínima (hoje)
    if (dataInput) {
      dataInput.min = todayISO();
    }
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ============================================================
  // Máscara de telefone (opcional, UX)
  // ============================================================
  if (telefoneInput) {
    telefoneInput.addEventListener('input', () => {
      let v = telefoneInput.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 6) {
        telefoneInput.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
      } else if (v.length > 2) {
        telefoneInput.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      } else if (v.length > 0) {
        telefoneInput.value = `(${v}`;
      } else {
        telefoneInput.value = '';
      }
    });
  }

  // ============================================================
  // Datas bloqueadas
  // ============================================================
  async function carregarDatasBloqueadas() {
    try {
      const res = await fetch(`${API_BASE}/datas-bloqueadas`);
      if (!res.ok) return;
      const lista = await res.json();
      // Backend devolve array de "YYYY-MM-DD" (LocalDate)
      datasBloqueadas = new Set(
        (Array.isArray(lista) ? lista : []).map((d) => String(d).slice(0, 10))
      );
      aplicarBloqueioDeDatas();
      if (dataHint) {
        dataHint.textContent = datasBloqueadas.size
          ? `${datasBloqueadas.size} data(s) já reservada(s). Escolha outra se necessário.`
          : 'Datas já reservadas aparecem bloqueadas.';
      }
    } catch (err) {
      console.warn('[La Casa Fest] Não foi possível carregar datas bloqueadas:', err);
    }
  }

  function aplicarBloqueioDeDatas() {
    if (!dataInput) return;
    dataInput.min = todayISO();

    // Validação no change/input (input type="date" não desabilita dias individualmente
    // de forma nativa em todos os browsers — validamos ao escolher e no submit)
    dataInput.addEventListener('change', () => {
      const valor = dataInput.value;
      if (valor && datasBloqueadas.has(valor)) {
        showError('Esta data já está reservada. Escolha outra data.');
        dataInput.value = '';
      } else {
        hideAlerts();
      }
    });
  }

  // ============================================================
  // Submit do formulário → POST /api/orcamentos (sem token)
  // ============================================================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();

    const nome = document.getElementById('nome')?.value?.trim() || '';
    const telefone = document.getElementById('telefone')?.value?.trim() || '';
    const tipoEvento = document.getElementById('tipoEvento')?.value || '';
    const dataEvento = document.getElementById('dataEvento')?.value || '';
    const quantidadeConvidados = Number(
      document.getElementById('quantidadeConvidados')?.value
    );
    const mensagem = document.getElementById('mensagem')?.value?.trim() || '';

    // Validações básicas no front (o backend também valida)
    if (!nome || !telefone || !tipoEvento || !dataEvento || !quantidadeConvidados) {
      showError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (quantidadeConvidados < 1) {
      showError('A quantidade de convidados deve ser maior que zero.');
      return;
    }
    if (dataEvento < todayISO()) {
      showError('A data do evento não pode estar no passado.');
      return;
    }
    if (datasBloqueadas.has(dataEvento)) {
      showError('Esta data já está reservada. Escolha outra data.');
      return;
    }

    // Telefone: backend aceita 10–20 chars com dígitos, espaços, (), + e -
    const telLimpo = telefone.replace(/\s/g, '');
    if (telLimpo.replace(/\D/g, '').length < 10) {
      showError('Informe um telefone válido com DDD.');
      return;
    }

    const payload = {
      nome,
      telefone,
      tipoEvento,
      dataEvento, // YYYY-MM-DD
      quantidadeConvidados,
      mensagem: mensagem || null,
    };

    setLoading(true);

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        // Data já reservada
        let msg = 'Esta data já está reservada. Escolha outra data.';
        try {
          const body = await res.json();
          if (body.message || body.mensagem) msg = body.message || body.mensagem;
        } catch (_) {}
        showError(msg);
        // Atualiza lista de bloqueadas
        carregarDatasBloqueadas();
        return;
      }

      if (res.status === 429) {
        showError('Muitas solicitações. Aguarde alguns minutos e tente novamente.');
        return;
      }

      if (res.status === 400) {
        let msg = 'Dados inválidos. Verifique os campos e tente novamente.';
        try {
          const body = await res.json();
          // Spring pode devolver { mensagem } ou estrutura de validação
          if (body.mensagem) msg = body.mensagem;
          else if (body.message) msg = body.message;
          else if (body.errors && Array.isArray(body.errors) && body.errors[0]?.defaultMessage) {
            msg = body.errors[0].defaultMessage;
          }
        } catch (_) {}
        showError(msg);
        return;
      }

      if (!res.ok) {
        showError(`Não foi possível enviar (${res.status}). Tente novamente.`);
        return;
      }

      const criado = await res.json();
      // Backend devolve linkWhatsapp montado no POST
      const link = criado.linkWhatsapp || criado.link_whatsapp || null;

      // Marca a data como bloqueada localmente
      if (dataEvento) datasBloqueadas.add(dataEvento);

      showSuccessPanel(link);
    } catch (err) {
      console.error(err);
      showError(
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  });

  // ============================================================
  // Nova solicitação
  // ============================================================
  if (btnNovo) {
    btnNovo.addEventListener('click', () => {
      resetForm();
      carregarDatasBloqueadas();
    });
  }

  // ============================================================
  // Init
  // ============================================================
  if (dataInput) dataInput.min = todayISO();
  carregarDatasBloqueadas();
})();
