# MarketCriativo IA v2

MicroSaaS MVP para gerar anúncios profissionais e criativos visuais para Shopee, Mercado Livre e Amazon.

## Estrutura

```
index.html
package.json
api/gerar-anuncio.js
api/gerar-imagem.js
```

## Variáveis no Vercel

Crie no Vercel em Settings > Environment Variables:

```
OPENAI_API_KEY=sua_chave_openai
```

Opcional:

```
OPENAI_TEXT_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

## Observação importante

O login deste MVP é demonstrativo e usa localStorage. Para produção real, use Supabase/Firebase/Auth.js e banco de dados.
