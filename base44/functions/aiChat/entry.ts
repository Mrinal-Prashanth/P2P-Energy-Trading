import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const message = (body?.message || '').toString().trim();
    if (!message) return Response.json({ error: 'Message is required' }, { status: 400 });

    const history = Array.isArray(body?.history) ? body.history : [];

    const systemPrompt = `You are VoltShare Assistant, a friendly helper inside a peer-to-peer renewable energy marketplace app called VoltShare. Users trade surplus solar, wind, hydro, battery and biogas energy with neighbors using an in-app wallet. Key facts: government feed-in tariff is $0.08/kWh (what producers get selling to the grid), retail rate is $0.15/kWh (what consumers pay the utility); listings are priced between these two so both sides win. Help users with buying energy, creating listings, wallet top-ups/withdrawals, pricing, and how the marketplace works. Keep answers concise, friendly and practical (2-4 sentences). If asked something unrelated, gently steer back to energy trading.`;

    const conversation = history
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}\n\n${conversation}\nUser: ${message}\nAssistant:`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: fullPrompt });
    return Response.json({ reply: typeof result === 'string' ? result : JSON.stringify(result) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}