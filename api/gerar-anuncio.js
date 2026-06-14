export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no Vercel.' });

    const b = req.body || {};
    const {
      produto = '', marketplace = 'Shopee', categoria = '', marca = '', cor = '',
      tamanho = '', quantidade = '', material = '', publico = '', objetivo = '',
      estilo = '', diferenciais = '', imageBase64 = ''
    } = b;

    const policyGuide = {
      Shopee: 'Título claro com produto, marca, atributo principal, quantidade e variação. Evite promessa falsa, excesso de emojis e termos enganosos.',
      'Mercado Livre': 'Título objetivo com produto, marca/modelo e característica relevante. Evite exageros promocionais no título e informações que não sejam do produto.',
      Amazon: 'Título limpo com marca, produto, modelo, tamanho/cor/quantidade quando relevante. Evite excesso de maiúsculas, emojis e claims não comprovados.'
    }[marketplace] || 'Priorize clareza, fidelidade ao produto e foco em conversão sem informações enganosas.';

    const prompt = `Você é estrategista de marketplace, diretor de arte e copywriter.
Gere um pacote profissional para um anúncio de ${marketplace}.

DADOS DO PRODUTO:
Produto: ${produto}
Categoria: ${categoria}
Marca: ${marca}
Cor/variação: ${cor}
Tamanho/medida: ${tamanho}
Quantidade: ${quantidade}
Material/composição: ${material}
Público-alvo: ${publico}
Objetivo do criativo: ${objetivo}
Estilo visual desejado: ${estilo}
Diferenciais e restrições: ${diferenciais}
Guia de conformidade: ${policyGuide}

REGRAS:
- Seja fiel ao produto e à imagem enviada.
- Não invente frete grátis, desconto, avaliação, originalidade, garantia ou certificação se não foi informado.
- Deixe tudo organizado para copiar e colar.
- Títulos sem poluição e adequados ao marketplace.
- Descrição em parágrafos curtos.
- Briefings visuais precisam orientar imagens profissionais, não templates com a foto colada.
- Os briefings devem pedir recriação visual do produto em cenários novos.
- Cada briefing deve ter gancho de marketing, composição, cenário/fundo e direção de arte.
- Retorne APENAS JSON válido.

JSON:
{
  "titulos": ["...", "...", "...", "..."],
  "descricao": "...",
  "bullets": ["...", "...", "...", "...", "..."],
  "ctas": ["...", "...", "..."],
  "palavrasChave": ["..."],
  "precosPsicologicos": ["R$ ...", "R$ ...", "R$ ..."],
  "checklistMarketplace": ["...", "...", "..."],
  "briefingsImagem": [
    {"nome":"Studio clean", "headline":"...", "subheadline":"...", "layout":"..."},
    {"nome":"Lifestyle premium", "headline":"...", "subheadline":"...", "layout":"..."},
    {"nome":"Vitrine elegante", "headline":"...", "subheadline":"...", "layout":"..."},
    {"nome":"Oferta sofisticada", "headline":"...", "subheadline":"...", "layout":"..."}
  ]
}`;

    const content = [{ type: 'input_text', text: prompt }];
    if (imageBase64 && String(imageBase64).startsWith('data:image')) {
      content.push({ type: 'input_image', image_url: imageBase64 });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || 'gpt-4.1-mini',
        input: [{ role: 'user', content }],
        temperature: 0.35
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Erro ao chamar OpenAI.', details: data });

    const text = data.output_text || data.output?.flatMap(o => o.content || []).map(c => c.text || '').join('\n') || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      return res.status(200).json(JSON.parse(cleaned));
    } catch {
      return res.status(200).json({ raw: text, fallback: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno.' });
  }
}