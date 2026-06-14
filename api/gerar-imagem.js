export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const body = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || !body.imageDataUrl) {
      return res.status(200).json({ demo: true, images: body.imageDataUrl ? [body.imageDataUrl] : [] });
    }

    const { blob, filename } = dataUrlToBlob(body.imageDataUrl);

    const prompt = `Transforme a imagem enviada em um criativo profissional para anúncio de marketplace.
Produto: ${body.produto || "Produto"}
Marketplace: ${body.marketplace || "Marketplace"}
Categoria: ${body.categoria || "Categoria"}
Marca: ${body.marca || "Sem marca"}
Quantidade: ${body.quantidade || "1 unidade"}
Diferenciais: ${body.extras || "produto de qualidade"}

Regras visuais:
- manter o produto como protagonista;
- usar fundo limpo, moderno e profissional;
- criar aparência de anúncio para marketplace;
- incluir espaço visual para selo de oferta, benefício principal e destaque de quantidade;
- não inventar logotipos de marcas oficiais;
- não adicionar informações falsas;
- entregar visual comercial, limpo e confiável.`;

    const form = new FormData();
    form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
    form.append("image", blob, filename);
    form.append("prompt", prompt);
    form.append("size", "1024x1024");
    form.append("n", "1");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: form
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI image error:", data);
      return res.status(200).json({ demo: true, images: [body.imageDataUrl], aviso: "Falha na API de imagem. Retorno demonstrativo." });
    }

    const images = (data.data || []).map(item => {
      if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
      if (item.url) return item.url;
      return null;
    }).filter(Boolean);

    return res.status(200).json({ images });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ demo: true, images: req.body?.imageDataUrl ? [req.body.imageDataUrl] : [], aviso: "Erro interno. Retorno demonstrativo." });
  }
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const binary = Buffer.from(base64, "base64");
  const blob = new Blob([binary], { type: mime });
  const ext = mime.includes("jpeg") ? "jpg" : mime.split("/")[1] || "png";
  return { blob, filename: `produto.${ext}` };
}
