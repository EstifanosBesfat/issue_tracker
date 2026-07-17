// app/api/ai-triage/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { description } = await req.json();

  if (!description || typeof description !== "string") {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const prompt = `You are an expert telecom network operations analyst at Ethio Telecom.
Analyze this incident description and classify it.

Incident Description: "${description}"

Respond ONLY with a raw JSON object (no markdown, no code fences), like this:
{
  "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "category": "MOBILE_NETWORK|FIBER_BROADBAND|TELEBIRR_BILLING|CORE_INFRASTRUCTURE|OTHER",
  "reasoning": "one short sentence explaining your choice"
}

Rules:
- CRITICAL = total outage affecting many users or critical infrastructure
- HIGH = partial outage or significant degradation
- MEDIUM = intermittent issues or single-site problems  
- LOW = minor issues, cosmetic bugs, or single-user issues
- MOBILE_NETWORK = 2G/3G/4G/5G cellular issues
- FIBER_BROADBAND = fiber cable, broadband internet
- TELEBIRR_BILLING = Telebirr payments, billing, accounts
- CORE_INFRASTRUCTURE = routers, backbone, data centers, core switching
- OTHER = anything else`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[ai-triage] Gemini HTTP error:", response.status, err);
      return NextResponse.json({ error: `Gemini API error ${response.status}: ${err.slice(0, 200)}` }, { status: 502 });
    }

    const geminiData = await response.json();
    const raw: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!raw) {
      console.error("[ai-triage] Empty response from Gemini:", JSON.stringify(geminiData));
      return NextResponse.json({ error: "AI returned an empty response" }, { status: 502 });
    }

    // Extract JSON — handle markdown fences or plain text
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.error("[ai-triage] No JSON found in:", raw);
      return NextResponse.json({ error: "AI response did not contain valid JSON" }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const validPriorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    const validCategories = ["MOBILE_NETWORK", "FIBER_BROADBAND", "TELEBIRR_BILLING", "CORE_INFRASTRUCTURE", "OTHER"];

    return NextResponse.json({
      priority: validPriorities.includes(parsed.priority) ? parsed.priority : "MEDIUM",
      category: validCategories.includes(parsed.category) ? parsed.category : "OTHER",
      reasoning: parsed.reasoning ?? "",
    });
  } catch (err) {
    console.error("[ai-triage] Unexpected error:", err);
    return NextResponse.json({ error: `Unexpected error: ${String(err).slice(0, 200)}` }, { status: 500 });
  }
}
