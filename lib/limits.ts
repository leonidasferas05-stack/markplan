import { prisma } from "./prisma";

export const FREE_PLAN_LIMIT = 3;

export type LimitCheck =
  | { allowed: true; isPro: boolean; remaining: number | null }
  | { allowed: false; reason: "no_subscription"; used: number };

export async function checkGenerateLimit(userId: string): Promise<LimitCheck> {
  const [user, plansCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    }),
    prisma.plan.count({ where: { userId } }),
  ]);

  const isPro = user?.subscription?.status === "active";

  if (isPro) {
    return { allowed: true, isPro: true, remaining: null };
  }

  if (plansCount >= FREE_PLAN_LIMIT) {
    return { allowed: false, reason: "no_subscription", used: plansCount };
  }

  return {
    allowed: true,
    isPro: false,
    remaining: FREE_PLAN_LIMIT - plansCount,
  };
}