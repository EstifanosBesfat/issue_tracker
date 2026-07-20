// app/api/ai-triage/route.ts — powered by Groq (llama-3.3-70b-versatile)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const VALID_PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const VALID_CATEGORIES = [
  'MOBILE_NETWORK',
  'FIBER_BROADBAND',
  'TELEBIRR_BILLING',
  'CORE_INFRASTRUCTURE',
  'OTHER',
];

const SYSTEM_PROMPT = `You are an expert telecom network operations analyst at Ethio Telecom.
When given an incident description, classify it by priority and category, and generate a concise title.

Priority rules:
- CRITICAL = total outage affecting many users or critical infrastructure
- HIGH = partial outage or significant degradation  
- MEDIUM = intermittent issues or single-site problems
- LOW = minor issues, cosmetic bugs, or single-user issues

Category rules:
- MOBILE_NETWORK = 2G/3G/4G/5G cellular issues
- FIBER_BROADBAND = fiber cable, broadband internet
- TELEBIRR_BILLING = Telebirr payments, billing, accounts
- CORE_INFRASTRUCTURE = routers, backbone, data centers, core switching
- OTHER = anything else

Title rules:
- Maximum 60 characters
- Should be a concise, professional summary of the incident
- Format: "[Issue Type] — [Location/System]" e.g. "4G Outage — Bole Subcity" or "Telebirr API Timeout — Merchant Gateway"

Respond ONLY with a raw JSON object (no markdown, no code fences):
{"priority":"CRITICAL|HIGH|MEDIUM|LOW","category":"MOBILE_NETWORK|FIBER_BROADBAND|TELEBIRR_BILLING|CORE_INFRASTRUCTURE|OTHER","title":"concise incident title max 60 chars","reasoning":"one short sentence"}`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { description } = body as { description?: string };

  if (!description || typeof description !== 'string' || description.trim().length < 5) {
    return NextResponse.json({ error: 'description is required (min 5 chars)' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Incident description: "${description.trim()}"` },
        ],
        temperature: 0.1,
        max_tokens: 256,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[ai-triage] Groq HTTP error:', response.status, err);
      return NextResponse.json(
        { error: `Groq API error ${response.status}: ${err.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? '';

    if (!raw) {
      console.error('[ai-triage] Empty response from Groq:', JSON.stringify(data));
      return NextResponse.json({ error: 'AI returned an empty response' }, { status: 502 });
    }

    // Extract JSON — handle any surrounding text or markdown fences
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.error('[ai-triage] No JSON found in Groq response:', raw);
      return NextResponse.json({ error: 'AI response did not contain valid JSON' }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      priority:  VALID_PRIORITIES.includes(parsed.priority)  ? parsed.priority  : 'MEDIUM',
      category:  VALID_CATEGORIES.includes(parsed.category)  ? parsed.category  : 'OTHER',
      title:     typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim().slice(0, 255) : '',
      reasoning: parsed.reasoning ?? '',
    });
  } catch (err) {
    console.error('[ai-triage] Unexpected error:', err);
    return NextResponse.json(
      { error: `Unexpected error: ${String(err).slice(0, 200)}` },
      { status: 500 }
    );
  }
}
