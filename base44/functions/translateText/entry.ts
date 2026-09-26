import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const targetLang = (body?.targetLang || 'English').toString().trim();

    // Batch mode: translate an array of strings (used for whole-page translation).
    if (Array.isArray(body?.texts)) {
      const texts = body.texts.map((t) => (t == null ? '' : String(t))).filter((t) => t.trim().length);
      if (!texts.length) return Response.json({ translations: [] });
      const prompt = `Translate each of the following strings into ${targetLang}. Return a JSON object { "translations": [ ... ] } containing the translated strings in the SAME ORDER as the input. Preserve numbers, currency symbols, units (kWh, etc.), and placeholders. Do not add any explanation.\n\nInput: ${JSON.stringify(texts)}`;
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: { translations: { type: 'array', items: { type: 'string' } } },
          required: ['translations'],
        },
      });
      const translations = Array.isArray(result?.translations) ? result.translations : [];
      return Response.json({ translations });
    }

    // Single-text mode.
    const text = (body?.text || '').toString().trim();
    if (!text) return Response.json({ error: 'Text is required' }, { status: 400 });
    const prompt = `Translate the following text into ${targetLang}. Return ONLY the translated text, no explanations, no quotes.\n\nText: """${text}"""`;
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const translation = typeof result === 'string' ? result : (result?.text || JSON.stringify(result));
    return Response.json({ translation: translation.trim() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}