/* INTEGRAÇÃO COM A API (POST /api/orcamentos — sem token) */
      
      (function () {
        "use strict";

        // API pública de produção no Render.
        const API_BASE = "https://backend-olfs.onrender.com/api/orcamentos";

        const form = document.getElementById("orcamentoForm");
        const formError = document.getElementById("formError");
        const formSuccess = document.getElementById("formSuccess");
        const successPanel = document.getElementById("successPanel");
        const btnEnviar = document.getElementById("btnEnviar");
        const btnWhatsapp = document.getElementById("btnWhatsapp");
        const btnNovo = document.getElementById("btnNovo");
        const dataInput = document.getElementById("dataEvento");
        const dataHint = document.getElementById("dataHint");
        const telefoneInput = document.getElementById("telefone");

        if (!form) return;

        let datasBloqueadas = new Set();

        function todayISO() {
          const d = new Date();
          return (
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(d.getDate()).padStart(2, "0")
          );
        }

        function showError(msg) {
          if (!formError) return;
          formError.textContent = msg;
          formError.hidden = false;
          formError.style.display = "block";
          if (formSuccess) {
            formSuccess.hidden = true;
            formSuccess.style.display = "none";
          }
        }

        function hideAlerts() {
          if (formError) {
            formError.textContent = "";
            formError.hidden = true;
            formError.style.display = "none";
          }
          if (formSuccess) {
            formSuccess.hidden = true;
            formSuccess.style.display = "none";
          }
        }

        function setLoading(loading) {
          if (!btnEnviar) return;
          btnEnviar.disabled = loading;
          btnEnviar.textContent = loading
            ? "Enviando..."
            : "Enviar solicitação";
        }

        function showSuccessPanel(linkWhatsapp) {
          form.style.display = "none";
          if (successPanel) {
            successPanel.hidden = false;
            successPanel.style.display = "block";
          }
          if (btnWhatsapp) {
            btnWhatsapp.href = linkWhatsapp || "https://wa.me/5511977941642";
          }
          hideAlerts();
        }

        function resetForm() {
          form.reset();
          form.style.display = "";
          if (successPanel) {
            successPanel.hidden = true;
            successPanel.style.display = "none";
          }
          hideAlerts();
          if (dataInput) dataInput.min = todayISO();
        }

        // Máscara de telefone
        if (telefoneInput) {
          telefoneInput.addEventListener("input", function () {
            var v = telefoneInput.value.replace(/\D/g, "").slice(0, 11);
            if (v.length > 6) {
              telefoneInput.value =
                "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
            } else if (v.length > 2) {
              telefoneInput.value = "(" + v.slice(0, 2) + ") " + v.slice(2);
            } else if (v.length > 0) {
              telefoneInput.value = "(" + v;
            } else {
              telefoneInput.value = "";
            }
          });
        }

        // Datas bloqueadas (público, sem token)
        async function carregarDatasBloqueadas() {
          try {
            var res = await fetch(API_BASE + "/datas-bloqueadas");
            if (!res.ok) return;
            var lista = await res.json();
            datasBloqueadas = new Set(
              (Array.isArray(lista) ? lista : []).map(function (d) {
                return String(d).slice(0, 10);
              }),
            );
            if (dataHint) {
              dataHint.textContent = datasBloqueadas.size
                ? datasBloqueadas.size +
                  " data(s) já reservada(s). Escolha outra se necessário."
                : "Datas já reservadas aparecem bloqueadas.";
            }
          } catch (err) {
            console.warn("[La Casa Fest] Datas bloqueadas:", err);
          }
        }

        if (dataInput) {
          dataInput.min = todayISO();
          dataInput.addEventListener("change", function () {
            if (dataInput.value && datasBloqueadas.has(dataInput.value)) {
              showError("Esta data já está reservada. Escolha outra data.");
              dataInput.value = "";
            } else {
              hideAlerts();
            }
          });
        }

        // POST /api/orcamentos (sem token)
        form.addEventListener("submit", async function (e) {
          e.preventDefault();
          hideAlerts();

          var nome = (document.getElementById("nome").value || "").trim();
          var telefone = (
            document.getElementById("telefone").value || ""
          ).trim();
          var tipoEvento = document.getElementById("tipoEvento").value || "";
          var dataEvento = document.getElementById("dataEvento").value || "";
          var quantidadeConvidados = Number(
            document.getElementById("quantidadeConvidados").value,
          );
          var mensagem = (
            document.getElementById("mensagem").value || ""
          ).trim();

          if (
            !nome ||
            !telefone ||
            !tipoEvento ||
            !dataEvento ||
            !quantidadeConvidados
          ) {
            showError("Preencha todos os campos obrigatórios.");
            return;
          }
          if (quantidadeConvidados < 1) {
            showError("A quantidade de convidados deve ser maior que zero.");
            return;
          }
          if (dataEvento < todayISO()) {
            showError("A data do evento não pode estar no passado.");
            return;
          }
          if (datasBloqueadas.has(dataEvento)) {
            showError("Esta data já está reservada. Escolha outra data.");
            return;
          }
          if (telefone.replace(/\D/g, "").length < 10) {
            showError("Informe um telefone válido com DDD.");
            return;
          }

          var payload = {
            nome: nome,
            telefone: telefone,
            tipoEvento: tipoEvento,
            dataEvento: dataEvento,
            quantidadeConvidados: quantidadeConvidados,
            mensagem: mensagem || null,
          };

          setLoading(true);

          try {
            var res = await fetch(API_BASE, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (res.status === 409) {
              var msg409 = "Esta data já está reservada. Escolha outra data.";
              try {
                var b409 = await res.json();
                if (b409.message || b409.mensagem)
                  msg409 = b409.message || b409.mensagem;
              } catch (_) {}
              showError(msg409);
              carregarDatasBloqueadas();
              return;
            }

            if (res.status === 429) {
              showError(
                "Muitas solicitações. Aguarde alguns minutos e tente novamente.",
              );
              return;
            }

            if (res.status === 400) {
              var msg400 =
                "Dados inválidos. Verifique os campos e tente novamente.";
              try {
                var b400 = await res.json();
                if (b400.mensagem) msg400 = b400.mensagem;
                else if (b400.message) msg400 = b400.message;
              } catch (_) {}
              showError(msg400);
              return;
            }

            if (!res.ok) {
              showError(
                "Não foi possível enviar (" +
                  res.status +
                  "). Tente novamente.",
              );
              return;
            }

            var criado = await res.json();
            var link = criado.linkWhatsapp || criado.link_whatsapp || null;
            if (dataEvento) datasBloqueadas.add(dataEvento);
            showSuccessPanel(link);
          } catch (err) {
            console.error(err);
            showError(
              "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
            );
          } finally {
            setLoading(false);
          }
        });

        if (btnNovo) {
          btnNovo.addEventListener("click", function () {
            resetForm();
            carregarDatasBloqueadas();
          });
        }

        carregarDatasBloqueadas();
      })();
