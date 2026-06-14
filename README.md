# MarketCriativo IA - versão final

Versão com correção completa da geração de imagem.

## Principais ajustes

- A imagem enviada agora é tratada como referência visual do produto.
- O prompt da API pede para não colar a foto original em um fundo.
- A IA deve recriar o produto em novas cenas profissionais.
- Geração real por IA virou o botão principal.
- Rascunho local virou fallback secundário.
- Histórico fica em modal separado.
- A seção inferior da página foi mantida com visual tecnológico.
- Resultados são organizados em blocos: imagens, títulos, descrição, bullets, CTAs, palavras-chave e checklist.

## Estrutura

```
index.html
package.json
README.md
.gitignore
api/gerar-anuncio.js
api/gerar-imagem.js
```

## Vercel

Configure em Settings > Environment Variables:

```
OPENAI_API_KEY=sua_chave_openai
```

Opcional:

```
OPENAI_TEXT_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

Depois faça Redeploy.

## Observação

Login e planos ainda são MVP demonstrativo via localStorage. Para produção real, use Supabase/Firebase/Auth.js e banco de dados.
