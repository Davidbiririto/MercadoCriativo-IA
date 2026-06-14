export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no Vercel.' });
    }

    const body = req.body || {};
    const { imageBase64 = '', produto = '', marketplace = '', briefings = [] } = body;

    if (!imageBase64 || !String(imageBase64).startsWith('data:image')) {
      return res.status(400).json({ error: 'Envie uma imagem válida em base64/data URL.' });
    }

    const prompt = `Crie 3 criativos profissionais para anúncio de marketplace usando a imagem enviada como referência principal do produto.
Produto: ${produto}
Marketplace: ${marketplace}
Briefings: ${JSON.stringify(briefings)}

Diretrizes:
- Preserve o produto o mais fiel possível.
- Crie imagens quadradas, limpas e comerciais.
- Fundo moderno, boa iluminação, composição para e-commerce.
- Evite logos de marcas que não estejam na imagem.
- Não invente certificações, avaliações, frete grátis ou descontos específicos se não estiverem no briefing.
- Inclua poucos textos curtos, legíveis e profissionais.
- Gere variações com estética de oferta, benefício e premium.`;

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        images: [{ image_url: imageBase64 }],
        prompt,
        n: 3,
        size: '1024x1024',
        output_format: 'png'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erro ao gerar imagem.', details: data });
    }

    const images = (data.data || []).map((item) => {
      if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
      if (item.url) return item.url;
      return null;
    }).filter(Boolean);

    return res.status(200).json({ images });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno.' });
  }
}
