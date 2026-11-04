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
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(idea, role, budget) },
    ],
    temperature: 0.7,
  });

  const raw = completion.choices[0].message.content || "";
  if (!raw) throw new Error("Empty response from AI");

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  // Минимальная валидация структуры
  if (!parsed.title || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
    throw new Error("AI returned unexpected structure");
  }

  return parsed as PlanContent;
}