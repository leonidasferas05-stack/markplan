import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PlanView, { type PlanContent } from "@/components/PlanView";

export const instant = false;

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id } = await params;
  const plan = await prisma.plan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!plan) notFound();

  const content = plan.content as unknown as PlanContent;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="flex justify-between items-center">
        <Link href="/plans" className="text-sm text-gray-600 hover:text-gray-900">
          ← Все планы
        </Link>
        <Link
          href="/"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + Новый план
        </Link>
      </div>

      <PlanView planId={plan.id} content={content} />

      <p className="text-xs text-gray-400 text-center">
        Создан: {new Date(plan.createdAt).toLocaleString("ru-RU")}
      </p>
    </div>
  );
}