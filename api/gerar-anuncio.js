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
      'Shopee': 'Título claro com produto, marca, atributo principal, quantidade e variação. Evite promessas falsas, exageros e termos enganosos.',
      'Mercado Livre': 'Título objetivo com produto, marca, modelo e característica relevante. Evite palavras promocionais excessivas no título e informações não relacionadas ao produto.',
      'Amazon': 'Título limpo com marca, produto, modelo, tamanho/cor/quantidade quando relevante. Evite excesso de maiúsculas, emojis e claims não comprovados.'
    }[marketplace] || 'Priorize clareza, fidelidade ao produto e foco em conversão sem informações enganosas.';

    const prompt = `Você é um especialista em copywriting e criativos para marketplaces brasileiros.
Gere um anúncio PROFISSIONAL, muito bem organizado, pronto para copiar e colar, para ${marketplace}.

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

Objetivo:
- Entregar copy clara, forte e comercial.
- Priorizar organização e praticidade para o usuário final.
- Criar também briefings visuais mais estratégicos, com gancho de marketing, apelo visual, mockup/cenário/lifestyle quando fizer sentido.

Regras:
- Seja fiel ao produto informado e à imagem, se houver.
- Não invente garantia, originalidade, certificações, avaliações ou frete grátis se não foi informado.
- Entregue textos prontos para copiar e colar.
- Gere 4 opções de títulos curtos e profissionais.
- Gere uma descrição organizada em parágrafos curtos.
- Gere 5 bullet points separados.
- Gere 3 CTAs sem exagero enganoso.
- Gere palavras-chave separadas por item.
- Gere 4 sugestões de preço psicológico.
- Gere checklist de conformidade do marketplace.
- Gere briefing para 4 criativos visuais DIFERENTES e mais profissionais.
- Cada briefing visual deve indicar claramente o conceito: oferta, benefício, premium, lifestyle/mockup/uso real.
- Retorne APENAS JSON válido.

Formato JSON obrigatório:
{
  "titulos": ["...", "...", "...", "..."],
  "descricao": "...",
  "bullets": ["...", "...", "...", "...", "..."],
  "ctas": ["...", "...", "..."],
  "palavrasChave": ["..."],
  "precosPsicologicos": ["R$ ...", "R$ ...", "R$ ...", "R$ ..."],
  "checklistMarketplace": ["...", "...", "...", "..."],
  "briefingsImagem": [
    {"nome":"Oferta de impacto", "headline":"...", "subheadline":"...", "layout":"..."},
    {"nome":"Benefícios", "headline":"...", "subheadline":"...", "layout":"..."},
    {"nome":"Premium", "headline":"...", "subheadline":"...", "layout":"..."},
    {"nome":"Lifestyle / uso", "headline":"...", "subheadline":"...", "layout":"..."}
  ]
}`;

    const content = [{ type: 'input_text', text: prompt }];
    if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
      content.push({ type: 'input_image', image_url: imageBase64 });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || 'gpt-4.1-mini',
        input: [{ role: 'user', content }],
        temperature: 0.45
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erro ao chamar OpenAI.', details: data });
    }

    const text = data.output_text || data.output?.flatMap(o => o.content || []).map(c => c.text || '').join('\n') || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const json = JSON.parse(cleaned);
      return res.status(200).json(json);
    } catch {
      return res.status(200).json({ raw: text, fallback: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno.' });
  }
}
