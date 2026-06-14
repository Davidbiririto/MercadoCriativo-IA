export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const body = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        demo: true,
        ...gerarFallback(body)
      });
    }

    const prompt = montarPrompt(body);
    const content = [
      { type: "input_text", text: prompt }
    ];

    if (body.imageDataUrl && body.imageDataUrl.startsWith("data:image")) {
      content.push({ type: "input_image", image_url: body.imageDataUrl });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "marketcriativo_anuncio",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                titulo: { type: "string" },
                descricao: { type: "string" },
                bullets: { type: "array", items: { type: "string" } },
                cta: { type: "string" },
                keywords: { type: "array", items: { type: "string" } },
                imagem: { type: "string" },
                preco: { type: "string" },
                observacoesPolitica: { type: "string" }
              },
              required: ["titulo", "descricao", "bullets", "cta", "keywords", "imagem", "preco", "observacoesPolitica"]
            }
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI text error:", data);
      return res.status(200).json({ demo: true, ...gerarFallback(body), aviso: "Falha na API. Retorno demonstrativo gerado." });
    }

    const outputText = data.output_text || extrairTexto(data);
    const parsed = JSON.parse(outputText);
    return res.status(200).json(parsed);
  } catch (error) {
    console.error(error);
    return res.status(200).json({ demo: true, ...gerarFallback(req.body || {}), aviso: "Erro interno. Retorno demonstrativo gerado." });
  }
}

function montarPrompt(d) {
  return `Você é especialista em anúncios para marketplaces no Brasil.

Crie um anúncio profissional para o marketplace informado, respeitando boas práticas gerais de Shopee, Mercado Livre e Amazon: título claro, sem exageros enganosos, sem promessas proibidas, sem uso indevido de marca quando a marca não for original, descrição objetiva, bullets com benefícios reais e palavras-chave relevantes.

IMPORTANTE:
- Não invente características técnicas não fornecidas.
- Se a marca for "sem marca", "genérico" ou similar, não trate como produto original de marca famosa.
- Evite termos como "o melhor do mercado", "100% garantido" ou promessas absolutas.
- Gere saída em JSON válido.
- O título deve ser profissional e direto.
- A descrição deve ser fiel ao produto.
- Os bullets devem ajudar na conversão e reduzir dúvidas.
- A ideia de imagem deve orientar um criativo limpo e profissional.

Dados do produto:
Produto: ${d.produto || "Produto"}
Marketplace: ${d.marketplace || "Marketplace"}
Categoria: ${d.categoria || "Categoria"}
Marca: ${d.marca || "Sem marca"}
Cor: ${d.cor || "Não informado"}
Tamanho/Medida: ${d.tamanho || "Não informado"}
Quantidade: ${d.quantidade || "Não informado"}
Material: ${d.material || "Não informado"}
Público-alvo: ${d.publico || "compradores online"}
Diferenciais: ${d.extras || "Não informado"}

Retorne os campos: titulo, descricao, bullets, cta, keywords, imagem, preco, observacoesPolitica.`;
}

function extrairTexto(data) {
  try {
    return data.output
      ?.flatMap(item => item.content || [])
      ?.filter(c => c.type === "output_text" || c.text)
      ?.map(c => c.text)
      ?.join("\n") || "{}";
  } catch {
    return "{}";
  }
}

function gerarFallback(d) {
  const produto = d.produto || "Produto";
  const marketplace = d.marketplace || "Marketplace";
  const categoria = d.categoria || "Categoria";
  const marca = d.marca || "Sem marca";
  const cor = d.cor || "cor variada";
  const tamanho = d.tamanho || "tamanho padrão";
  const quantidade = d.quantidade || "1 unidade";
  const material = d.material || "material resistente";
  const publico = d.publico || "compradores online";
  const extras = d.extras || "produto de qualidade, ótimo custo-benefício e ideal para uso diário";

  return {
    titulo: `${produto} ${marca} ${quantidade} ${cor} ${tamanho} Para ${marketplace}`,
    descricao: `Anúncio otimizado para ${marketplace}.\n\nO ${produto} é ideal para ${publico} que buscam praticidade, qualidade e bom custo-benefício. Produzido em ${material}, foi estruturado para apresentar valor, clareza e confiança ao comprador.\n\nInformações principais:\n- Produto: ${produto}\n- Marca: ${marca}\n- Categoria: ${categoria}\n- Cor: ${cor}\n- Tamanho/Medida: ${tamanho}\n- Quantidade: ${quantidade}\n\nDiferenciais:\n${extras}`,
    bullets: [
      `Ideal para ${publico}`,
      "Produto com apresentação clara e foco em benefício",
      "Informações objetivas para reduzir dúvidas do comprador",
      `Estrutura otimizada para ${marketplace}`,
      "Chamada de venda profissional e direta"
    ],
    cta: `Garanta agora seu ${produto} e aproveite esta oportunidade antes que acabe.`,
    keywords: [produto, categoria, marca, cor, tamanho, quantidade, marketplace, "oferta", "envio rápido", "promoção", publico],
    imagem: `Crie uma imagem promocional com fundo limpo, produto centralizado, selo de oferta, destaque para "${quantidade}", benefício principal em texto curto e visual profissional para ${marketplace}.`,
    preco: "Sugestões: R$19,90, R$29,90, R$39,90, R$49,90 ou R$59,90. Use finais ,90 ou ,99 para reforçar percepção de oferta.",
    observacoesPolitica: "Modo demonstração. Configure OPENAI_API_KEY no Vercel para respostas reais de IA."
  };
}
