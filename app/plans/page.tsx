import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

type PlanContent = {
  title?: string;
  summary?: string;
  tasks?: unknown[];
};

export default async function PlansPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const plans = await prisma.plan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      idea: true,
      role: true,
      budget: true,
      createdAt: true,
      content: true,
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Мои планы</h1>
        <Link
          href="/"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + Новый план
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-600 mb-4">Здесь пока пусто.</p>
          <Link href="/" className="text-indigo-600 hover:underline">
            Создать первый план →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => {
            const content = (p.content || {}) as PlanContent;
            return (
              <Link
                key={p.id}
                href={`/plans/${p.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-sm transition"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg truncate">
                      {content.title || p.idea.slice(0, 60)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {content.summary || p.idea}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">
                        {content.tasks?.length ?? 0} задач
                      </span>
                      {p.role && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {p.role}
                        </span>
                      )}
                      {p.budget && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {p.budget}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}