import "dotenv/config";
import OpenAI from "openai";
import { SYSTEM_PROMPT, buildUserPrompt } from "../lib/prompt";

console.log("1️⃣ Скрипт запущен");
console.log("2️⃣ KEY:", process.env.GROQ_API_KEY ? "загружен" : "НЕ ЗАГРУЖЕН");

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  timeout: 30_000, // 30 сек — если Groq не ответит, будет ошибка, а не тишина
  maxRetries: 1,
});

async function main() {
  console.log("3️⃣ main() начался");

  const idea = "Запуск онлайн-курса по фотографии для новичков";
  const start = Date.now();

  console.log("4️⃣ Отправляю запрос в Groq...");

  const completion = await openai.chat.completions.create({
    model: "openai/gpt-oss-120b",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: buildUserPrompt(idea, "маркетолог", "100 000 ₽"),
      },
    ],
    temperature: 0.7,
  });

  console.log("5️⃣ Ответ получен за", Date.now() - start, "мс");

  const raw = completion.choices[0].message.content || "{}";
  console.log("6️⃣ Длина ответа:", raw.length, "символов");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("❌ Невалидный JSON. Первые 500 символов:\n", raw.slice(0, 500));
    process.exit(1);
  }

  console.log("\n✅ План:");
  console.log("Title:", parsed.title);
  console.log("Summary:", parsed.summary);
  console.log("KPI:", parsed.kpi?.length ?? 0, "шт");
  console.log("Risks:", parsed.risks?.length ?? 0, "шт");
  console.log("Tasks:", parsed.tasks?.length ?? 0, "шт");
  console.log("\nПервые 3 задачи:");
  parsed.tasks?.slice(0, 3).forEach((t: any, i: number) => {
    console.log(
      `  ${i + 1}. [${t.stage}] ${t.task} — ${t.duration_days} дн. — ${t.responsible}`
    );
  });

  console.log("\n🎉 Скрипт завершён успешно");
}

console.log("7️⃣ Вызываю main()...");
main().catch((e) => {
  console.error("\n❌ ОШИБКА В main():");
  console.error(e);
  process.exit(1);
});