/**
 * La Casa Fest — Integração do formulário de orçamento (site público)
 * Sem token. Conecta em:
 *   POST /api/orcamentos
 *   GET  /api/orcamentos/datas-bloqueadas
 *
 * Configuração: defina window.LCF_API_BASE antes deste script para usar outra API.
 */

(function () {
  'use strict';

  // Em produção, o site usa o backend oficial; localmente, window.LCF_API_BASE pode sobrescrever.
  const API_BASE = String(window.LCF_API_BASE || 'https://backend-olfs.onrender.com/api/orcamentos').replace(/\/$/, '');

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

  let datasBloqueadas = new Set();

  function showError(msg) {
    if (!formError) return;
    formError.textContent = msg;
    formError.classList.add('visible', 'show');
    formError.style.display = 'block';
    formError.hidden = false;
    if (formSuccess) { formSuccess.style.display = 'none'; formSuccess.hidden = true; }
  }

  function hideAlerts() {
    if (formError) {
      formError.textContent = ''; formError.style.display = 'none'; formError.hidden = true;
      formError.classList.remove('visible', 'show');
    }
    if (formSuccess) { formSuccess.textContent = ''; formSuccess.style.display = 'none'; formSuccess.hidden = true; }
  }

  function setLoading(loading) {
    if (!btnEnviar) return;
    btnEnviar.disabled = loading;
    btnEnviar.textContent = loading ? 'Enviando...' : 'Enviar solicitação';
  }

  function showSuccessPanel(linkWhatsapp) {
    if (form) form.style.display = 'none';
    if (successPanel) { successPanel.classList.add('visible', 'show'); successPanel.style.display = 'block'; successPanel.hidden = false; }
    if (btnWhatsapp) {
      btnWhatsapp.href = linkWhatsapp || 'https://wa.me/5511977941642';
      btnWhatsapp.style.display = '';
    }
    hideAlerts();
  }

  function resetForm() {
    form.reset(); form.style.display = '';
    if (successPanel) { successPanel.style.display = 'none'; successPanel.hidden = true; successPanel.classList.remove('visible', 'show'); }
    hideAlerts();
    if (dataInput) dataInput.min = todayISO();
  }

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  if (telefoneInput) {
    telefoneInput.addEventListener('input', () => {
      const v = telefoneInput.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 6) telefoneInput.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
      else if (v.length > 2) telefoneInput.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      else if (v.length > 0) telefoneInput.value = `(${v}`;
      else telefoneInput.value = '';
    });
  }

  async function carregarDatasBloqueadas() {
    try {
      const res = await fetch(`${API_BASE}/datas-bloqueadas`);
      if (!res.ok) return;
      const lista = await res.json();
      datasBloqueadas = new Set((Array.isArray(lista) ? lista : []).map((d) => String(d).slice(0, 10)));
      aplicarBloqueioDeDatas();
      if (dataHint) dataHint.textContent = datasBloqueadas.size ? `${datasBloqueadas.size} data(s) já reservada(s). Escolha outra se necessário.` : 'Datas já reservadas aparecem bloqueadas.';
    } catch (err) { console.warn('[La Casa Fest] Não foi possível carregar datas bloqueadas:', err); }
  }

  function aplicarBloqueioDeDatas() {
    if (!dataInput) return;
    dataInput.min = todayISO();
    if (dataInput.dataset.lcfBound === '1') return;
    dataInput.dataset.lcfBound = '1';
    dataInput.addEventListener('change', () => {
      if (dataInput.value && datasBloqueadas.has(dataInput.value)) { showError('Esta data já está reservada. Escolha outra data.'); dataInput.value = ''; }
      else hideAlerts();
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); hideAlerts();
    const nome = document.getElementById('nome')?.value?.trim() || '';
    const telefone = document.getElementById('telefone')?.value?.trim() || '';
    const tipoEvento = document.getElementById('tipoEvento')?.value || '';
    const dataEvento = document.getElementById('dataEvento')?.value || '';
    const quantidadeConvidados = Number(document.getElementById('quantidadeConvidados')?.value);
    const mensagem = document.getElementById('mensagem')?.value?.trim() || '';
    if (!nome || !telefone || !tipoEvento || !dataEvento || !quantidadeConvidados) { showError('Preencha todos os campos obrigatórios.'); return; }
    if (quantidadeConvidados < 1) { showError('A quantidade de convidados deve ser maior que zero.'); return; }
    if (dataEvento < todayISO()) { showError('A data do evento não pode estar no passado.'); return; }
    if (datasBloqueadas.has(dataEvento)) { showError('Esta data já está reservada. Escolha outra data.'); return; }
    if (telefone.replace(/\s/g, '').replace(/\D/g, '').length < 10) { showError('Informe um telefone válido com DDD.'); return; }
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, telefone, tipoEvento, dataEvento, quantidadeConvidados, mensagem: mensagem || null }) });
      if (res.status === 409) { let msg = 'Esta data já está reservada. Escolha outra data.'; try { const body = await res.json(); msg = body.message || body.mensagem || msg; } catch (_) {} showError(msg); carregarDatasBloqueadas(); return; }
      if (res.status === 429) { showError('Muitas solicitações. Aguarde alguns minutos e tente novamente.'); return; }
      if (res.status === 400) { let msg = 'Dados inválidos. Verifique os campos e tente novamente.'; try { const body = await res.json(); msg = body.mensagem || body.message || body.errors?.[0]?.defaultMessage || msg; } catch (_) {} showError(msg); return; }
      if (!res.ok) { showError(`Não foi possível enviar (${res.status}). Tente novamente.`); return; }
      const criado = await res.json();
      datasBloqueadas.add(dataEvento);
      showSuccessPanel(criado.linkWhatsapp || criado.link_whatsapp || null);
    } catch (err) { console.error(err); showError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'); }
    finally { setLoading(false); }
  });

  if (btnNovo) btnNovo.addEventListener('click', () => { resetForm(); carregarDatasBloqueadas(); });
  if (dataInput) dataInput.min = todayISO();
  carregarDatasBloqueadas();
})();
