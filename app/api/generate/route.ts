import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generatePlan } from "@/lib/ai";
import { checkGenerateLimit } from "@/lib/limits";

const bodySchema = z.object({
  idea: z.string().min(10, "Идея слишком короткая").max(2000),
  role: z.string().optional(),
  budget: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Авторизация
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Валидация тела
  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request", details: (e as Error).message },
      { status: 400 }
    );
  }

  // 3. Лимиты
  const limit = await checkGenerateLimit(session.user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "limit_reached",
        message: `Бесплатный лимит (${limit.used} планов) исчерпан. Оформите подписку.`,
        used: limit.used,
      },
      { status: 402 }
    );
  }

  // 4. Генерация
  let content;
  try {
    content = await generatePlan(body.idea, body.role, body.budget);
  } catch (e) {
    console.error("AI generation failed:", e);
    return NextResponse.json(
      { error: "generation_failed", message: (e as Error).message },
      { status: 502 }
    );
  }

  // 5. Сохранение
  const plan = await prisma.plan.create({
    data: {
      userId: session.user.id,
      idea: body.idea,
      role: body.role,
      budget: body.budget,
      content: content as any,
    },
  });

  return NextResponse.json({
    id: plan.id,
    content,
    meta: {
      isPro: limit.isPro,
      remaining: limit.remaining,
    },
  });
}