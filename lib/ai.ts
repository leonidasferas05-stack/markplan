import OpenAI from "openai";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  timeout: 45_000,
  maxRetries: 1,
});

export type PlanContent = {
  title: string;
  summary: string;
  kpi: string[];
  risks: string[];
  tasks: Array<{
    stage: string;
    task: string;
    responsible: string;
    tools: string;
    duration_days: number;
    result: string;
  }>;
};

export async function generatePlan(
  idea: string,
  role?: string,
  budget?: string
): Promise<PlanContent> {
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildUserPrompt(idea, role, budget) },
  ];

  // === Логирование запроса к Groq ===
  console.log("\n=== GROQ REQUEST ===");
  console.log("model:", "openai/gpt-oss-120b");
  console.log("temperature:", 0.7);
  console.log("response_format:", { type: "json_object" });
  console.log("messages:", JSON.stringify(messages, null, 2));
  console.log("====================\n");

  const start = Date.now();

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    response_format: { type: "json_object" },
    messages,
    temperature: 0.7,
  });

  // === Логирование ответа от Groq ===
  const duration = Date.now() - start;
  const raw = completion.choices[0].message.content || "";
  const choice = completion.choices[0];

  console.log("\n=== GROQ RESPONSE ===");
  console.log("duration:", duration, "ms");
  console.log("tokens:", completion.usage);
  console.log("finish_reason:", choice.finish_reason);
  console.log("content length:", raw.length);
  console.log("=====================\n");

  if (!raw) {
    throw new Error("Empty response from AI");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[ai] Invalid JSON. Raw response (first 500 chars):\n", raw.slice(0, 500));
    throw new Error("AI returned invalid JSON");
  }

  // Минимальная валидация структуры
  const data = parsed as Partial<PlanContent>;
  if (
    !data.title ||
    !Array.isArray(data.tasks) ||
    data.tasks.length === 0
  ) {
    console.error("[ai] Unexpected structure. Received keys:", Object.keys(data));
    throw new Error("AI returned unexpected structure");
  }

  return data as PlanContent;
}