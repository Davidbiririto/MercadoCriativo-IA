# MarketCriativo IA v3

Versão atualizada do MVP com:

- histórico em modal separado
- seção visual tecnológica no lugar do histórico fixo na página
- organização melhor dos resultados
- 4 criativos locais com layout mais forte
- endpoint ajustado para gerar 4 imagens por IA real com prompt visual mais estratégico

## Estrutura

```bash
index.html
package.json
api/gerar-anuncio.js
api/gerar-imagem.js
```

## Variáveis no Vercel

Crie no Vercel em **Settings > Environment Variables**:

```env
OPENAI_API_KEY=sua_chave_openai
```

Opcional:

```env
OPENAI_TEXT_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

## Observação importante

O login deste MVP é demonstrativo e usa localStorage. Para produção real, o ideal é usar Supabase, Firebase ou outro backend com autenticação e banco.
