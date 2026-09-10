# La Casa Fest — Site público

Site institucional estático da La Casa Fest, espaço para eventos em Ferraz de Vasconcelos. O projeto apresenta a programação, locações, galeria e formulário de solicitação de orçamento.

## Estrutura

O código publicado está em `SiteLaCasaFest-main/`.

- `index.html`: página inicial.
- `programacao.html`: programação e eventos.
- `locacoes.html`: informações sobre locações.
- `formulario.html`: solicitação de orçamento.
- `style.css`: estilos globais.
- `script/`: carrossel, animações, programação e integração com a API.
- `imagens/` e `midia/`: imagens, vídeos e demais assets.

## Como executar localmente

Entre na pasta do site e inicie um servidor HTTP simples:

```bash
cd SiteLaCasaFest-main
python3 -m http.server 4173
```

Depois acesse `http://localhost:4173`. Não abra os HTML diretamente via `file://`, pois o navegador pode bloquear requisições do formulário.

## Hospedagem

O site não precisa de build nem de Node.js. Publique a pasta `SiteLaCasaFest-main/` como raiz de um site estático em GitHub Pages, Netlify, Vercel, Cloudflare Pages ou hospedagem compartilhada. O arquivo `index.html` deve ficar na raiz pública do deploy.

Antes de publicar, confirme que o backend está online e que aceita CORS do domínio do site. A integração do formulário usa por padrão:

```text
https://backend-olfs.onrender.com/api/orcamentos
```

Para homologação, defina `window.LCF_API_BASE` antes de `script/orcamento-api.js`. O formulário envia `POST /api/orcamentos` e consulta `GET /api/orcamentos/datas-bloqueadas`.

## Checklist de publicação

- [ ] Publicar somente `SiteLaCasaFest-main/` como raiz do site.
- [ ] Validar links entre as quatro páginas.
- [ ] Confirmar CORS e disponibilidade do backend.
- [ ] Testar consulta de datas bloqueadas.
- [ ] Enviar uma solicitação de teste com dados não sensíveis.
- [ ] Conferir o retorno/link do WhatsApp.
- [ ] Configurar domínio e HTTPS na plataforma escolhida.

## Observações

Não coloque tokens administrativos, senhas ou chaves privadas neste repositório. O painel administrativo fica no repositório separado `lacasafest-admin-v3-final`.
