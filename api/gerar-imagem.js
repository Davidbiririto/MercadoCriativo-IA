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
    const {
      imageBase64 = '',
      produto = '', marketplace = '', categoria = '', marca = '', quantidade = '', cor = '', tamanho = '', material = '', publico = '', diferenciais = '',
      briefings = []
    } = body;

    if (!imageBase64 || !String(imageBase64).startsWith('data:image')) {
      return res.status(400).json({ error: 'Envie uma imagem válida em base64/data URL.' });
    }

    const prompt = `Crie 4 imagens criativas PROFISSIONAIS para anúncio de marketplace usando a imagem enviada como referência principal do produto.

Dados do produto:
- Produto: ${produto}
- Marketplace: ${marketplace}
- Categoria: ${categoria}
- Marca: ${marca}
- Quantidade: ${quantidade}
- Cor/Variação: ${cor}
- Tamanho/medida: ${tamanho}
- Material: ${material}
- Público-alvo: ${publico}
- Diferenciais: ${diferenciais}
- Briefings visuais sugeridos: ${JSON.stringify(briefings)}

Objetivo visual:
- Não apenas repetir a foto enviada.
- Usar o produto da imagem como base fiel, mas criar NOVAS composições e cenários.
- Gerar peças muito mais atrativas para marketing e venda.
- Dar aparência de criativo profissional de marketplace e e-commerce.

Diretrizes obrigatórias:
1. Preserve a identidade visual principal do produto e evite alterar demais embalagem, formato e cor.
2. Gere 4 variações quadradas, cada uma com um conceito diferente:
   - Variação 1: oferta / destaque comercial
   - Variação 2: benefícios / atributos
   - Variação 3: premium / percepção de valor
   - Variação 4: lifestyle, mockup ou cenário de uso quando fizer sentido
3. Use fundos mais elaborados, iluminação profissional, profundidade, composição moderna e aparência limpa.
4. As peças podem conter poucos textos curtos e legíveis, com headlines profissionais, mas sem poluição visual.
5. Use ganchos de marketing honestos e visuais, como destaque de benefícios, selo visual elegante, percepção de qualidade e CTA curto.
6. Não invente certificações, avaliações, frete grátis, descontos específicos ou promessas não informadas.
7. Evite logos de terceiros e informações enganosas.
8. A estética deve parecer material profissional de anúncio, não algo amador ou apenas a foto colada.
9. Deixe o produto como protagonista.
10. Gere imagens prontas para uso como criativo de venda.
`;

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
        n: 4,
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
