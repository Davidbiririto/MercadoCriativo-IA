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
      produto = '', marketplace = 'Shopee', categoria = '', marca = '', cor = '', tamanho = '', quantidade = '', material = '', publico = '', diferenciais = '', imageBase64 = ''
    } = body;

    const policyGuide = {
      'Shopee': 'Priorize título claro com produto, marca, atributo principal, quantidade e variação. Evite exageros, promessas falsas e termos enganosos.',
      'Mercado Livre': 'Priorize título objetivo com produto, marca, modelo e característica relevante. Evite palavras promocionais excessivas no título e informações que não sejam do produto.',
      'Amazon': 'Priorize título limpo com marca, produto, modelo, tamanho/cor/quantidade quando relevante. Evite excesso de maiúsculas, emojis e claims não comprovados.'
    }[marketplace] || 'Priorize clareza, fidelidade ao produto e foco em conversão sem informações enganosas.';

    const prompt = `Você é um especialista em copywriting para marketplaces brasileiros.
Gere um anúncio PROFISSIONAL e organizado para ${marketplace}.

Produto: ${produto}
Categoria: ${categoria}
Marca: ${marca}
Cor: ${cor}
Tamanho/medida: ${tamanho}
Quantidade: ${quantidade}
Material: ${material}
Público-alvo: ${publico}
Diferenciais: ${diferenciais}
Guia de conformidade do marketplace: ${policyGuide}

Regras:
- Seja fiel ao produto informado e à imagem, se houver.
- Não invente garantia, originalidade, certificações, avaliações ou frete grátis se não foi informado.
- Entregue textos prontos para copiar e colar.
- Gere 4 opções de títulos curtos e profissionais.
- Gere uma descrição organizada em parágrafos curtos.
- Gere bullet points separados.
- Gere CTAs sem exagero enganoso.
- Gere palavras-chave separadas por vírgula.
- Gere briefing para 4 criativos visuais diferentes.
- Retorne APENAS JSON válido.

Formato JSON obrigatório:
{
  "titulos": ["...", "...", "...", "..."],
  "descricao": "...",
  "bullets": ["...", "...", "...", "...", "..."],
  "ctas": ["...", "...", "..."],
  "palavrasChave": ["..."],
  "precosPsicologicos": ["R$ ...", "R$ ...", "R$ ..."],
  "checklistMarketplace": ["...", "...", "..."],
  "briefingsImagem": [
    {"nome":"Criativo Oferta", "headline":"...", "subheadline":"...", "layout":"..."},
    {"nome":"Criativo Benefício", "headline":"...", "subheadline":"...", "layout":"..."},
    {"nome":"Criativo Premium", "headline":"...", "subheadline":"...", "layout":"..."},
    {"nome":"Criativo Comparativo", "headline":"...", "subheadline":"...", "layout":"..."}
  ]
}`;

    const inputContent = [{ type: 'input_text', text: prompt }];
    if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
      inputContent.push({ type: 'input_image', image_url: imageBase64 });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || 'gpt-4.1-mini',
        input: [{ role: 'user', content: inputContent }],
        temperature: 0.45
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erro ao chamar OpenAI.', details: data });
    }

    const text = data.output_text || data.output?.flatMap(o => o.content || []).map(c => c.text || '').join('\n') || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let json;
    try {
      json = JSON.parse(cleaned);
    } catch (e) {
      return res.status(200).json({ raw: text, fallback: true });
    }

    return res.status(200).json(json);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno.' });
  }
}
