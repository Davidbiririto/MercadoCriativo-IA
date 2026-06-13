# MarketCriativo IA

MicroSaaS MVP para gerar anúncios profissionais para Shopee, Mercado Livre e Amazon com IA.

## Estrutura

```txt
marketcriativo-ia/
├── index.html
├── package.json
└── api/
    ├── gerar-anuncio.js
    └── gerar-imagem.js
```

## Como publicar pelo GitHub + Vercel

1. Crie um repositório no GitHub.
2. Envie todos os arquivos deste projeto para a raiz do repositório.
3. Conecte o repositório na Vercel.
4. Na Vercel, abra Settings > Environment Variables.
5. Crie a variável `OPENAI_API_KEY` com sua chave da OpenAI.
6. Opcionalmente crie:
   - `OPENAI_TEXT_MODEL` com `gpt-4.1-mini`
   - `OPENAI_IMAGE_MODEL` com `gpt-image-1`
7. Faça redeploy do projeto.

## Observação

Sem `OPENAI_API_KEY`, o sistema funciona em modo demonstração local.
