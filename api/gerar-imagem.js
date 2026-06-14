function dataURLToBlob(dataURL) {
  const [meta, b64] = dataURL.split(',');
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'image/png';
  const bytes = Buffer.from(b64, 'base64');
  return new Blob([bytes], { type: mime });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no Vercel.' });

    const b = req.body || {};
    const {
      imageBase64 = '', produto = '', marketplace = '', categoria = '', marca = '', cor = '',
      tamanho = '', quantidade = '', publico = '', objetivo = '', estilo = '',
      diferenciais = '', briefings = []
    } = b;

    if (!imageBase64 || !String(imageBase64).startsWith('data:image')) {
      return res.status(400).json({ error: 'Envie uma imagem válida do produto.' });
    }

    const baseContext = `
Produto: ${produto}
Categoria: ${categoria}
Marca: ${marca}
Cor/variação: ${cor}
Tamanho/medida: ${tamanho}
Quantidade: ${quantidade}
Marketplace: ${marketplace}
Público-alvo: ${publico}
Objetivo do criativo: ${objetivo}
Estilo desejado: ${estilo}
Diferenciais e restrições: ${diferenciais}
`;

    const defaultBriefs = [
      { nome: 'Studio clean', headline: 'Produto em estúdio clean', subheadline: 'Superfície branca, luz suave, fotografia premium', layout: 'estúdio minimalista, fundo neutro, produto recriado em novo ângulo, sem texto' },
      { nome: 'Lifestyle premium', headline: 'Produto em ambiente sofisticado', subheadline: 'Cenário aspiracional conectado ao público-alvo', layout: 'ambiente lifestyle, decoração elegante, profundidade de campo, sem texto' },
      { nome: 'Vitrine elegante', headline: 'Produto em vitrine ou balcão', subheadline: 'Composição de catálogo de e-commerce', layout: 'balcão branco, mármore, vidro ou estante, iluminação profissional, sem texto' },
      { nome: 'Oferta sofisticada', headline: 'Criativo comercial limpo', subheadline: 'Visual de anúncio sem poluição', layout: 'elementos gráficos discretos, produto valorizado, sem blocos grandes, sem texto ou com no máximo 2 palavras' }
    ];

    const finalBriefs = (Array.isArray(briefings) && briefings.length ? briefings : defaultBriefs).slice(0, 4);

    const prompts = finalBriefs.map((br, i) => `Use a imagem enviada APENAS como referência visual para entender o produto, embalagem, formato, cores, estilo e identidade.
NÃO cole a foto enviada em um novo fundo. NÃO mantenha a foto original como um retângulo ou recorte colado.
Recrie uma NOVA imagem profissional do produto, preservando sua identidade principal, aparência, tipo de embalagem, proporções, cores dominantes e elementos visuais reconhecíveis.
A imagem final deve parecer fotografia publicitária ou render profissional de produto para marketplace, com nova cena, nova iluminação, nova composição e melhor direção de arte.

${baseContext}

Variação ${i + 1}: ${br.nome}
Gancho/direção: ${br.headline}
Subdireção: ${br.subheadline || ''}
Layout desejado: ${br.layout}

Diretrizes obrigatórias:
- Produto deve aparecer grande, valorizado e com aparência premium.
- Use cenário profissional: estúdio clean, balcão branco, vitrine, mármore, vidro, estante, ambiente lifestyle ou mockup elegante.
- Crie profundidade, sombras naturais, reflexos sutis e iluminação comercial.
- Evite aparência de panfleto amador, template pronto, blocos de texto, fundos coloridos genéricos ou colagem.
- Prefira imagem sem texto. Se usar texto, use no máximo 2 ou 3 palavras, bem legíveis, sem distorção.
- Não inclua logos oficiais de Shopee, Mercado Livre ou Amazon.
- Não invente frete grátis, porcentagem de desconto, avaliações, certificações, garantia ou selo de originalidade se não estiver nos dados.
- Não altere a categoria do produto.
- Não crie pessoas segurando o produto a menos que faça sentido para o nicho.
- Resultado quadrado 1024x1024, alta qualidade, pronto para anúncio.`);

    const blob = dataURLToBlob(imageBase64);
    const results = [];

    for (const prompt of prompts) {
      const form = new FormData();
      form.append('model', process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1');
      form.append('image', blob, 'referencia-produto.png');
      form.append('prompt', prompt);
      form.append('size', '1024x1024');
      form.append('n', '1');

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || 'Erro ao gerar imagem.', details: data });
      }

      const item = data.data?.[0];
      if (item?.b64_json) results.push(`data:image/png;base64,${item.b64_json}`);
      else if (item?.url) results.push(item.url);
    }

    return res.status(200).json({ images: results });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno.' });
  }
}