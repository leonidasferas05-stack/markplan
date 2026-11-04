"use client";

type PlanTask = {
  stage: string;
  task: string;
  responsible: string;
  tools: string;
  duration_days: number;
  result: string;
};

export type PlanContent = {
  title: string;
  summary: string;
  kpi: string[];
  risks: string[];
  tasks: PlanTask[];
};

const STAGE_ORDER = ["Подготовка", "Запуск", "Аналитика", "Оптимизация"];

const STAGE_STYLES: Record<string, string> = {
  Подготовка: "bg-amber-100 text-amber-800",
  Запуск: "bg-blue-100 text-blue-800",
  Аналитика: "bg-indigo-100 text-indigo-800",
  Оптимизация: "bg-emerald-100 text-emerald-800",
};

type StageGroup = {
  id: string;
  stage: string;
  tasks: PlanTask[];
};

export default function PlanView({
  planId,
  content,
}: {
  planId: string;
  content: PlanContent;
}) {
  const knownStages = new Set(STAGE_ORDER);

  // Группы из известных этапов
  const knownGroups: StageGroup[] = STAGE_ORDER.map((stage, idx) => ({
    id: `known-${idx}-${stage}`,
    stage,
    tasks: content.tasks.filter((t) => t.stage === stage),
  })).filter((g) => g.tasks.length > 0);

  // Группы из «неизвестных» этапов (если модель вернула что-то своё)
  const unknownStages = Array.from(
    new Set(
      content.tasks
        .filter((t) => !knownStages.has(t.stage as string))
        .map((t) => String(t.stage ?? ""))
    )
  );

  const unknownGroups: StageGroup[] = unknownStages.map((stage, idx) => ({
    id: `unknown-${idx}-${stage}`,
    stage: stage || "Без этапа",
    tasks: content.tasks.filter((t) => String(t.stage ?? "") === stage),
  }));

  const allGroups = [...knownGroups, ...unknownGroups];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">{content.title}</h2>
            <p className="text-gray-600 mt-1">{content.summary}</p>
          </div>
          <a
            href={`/api/export/${planId}`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap"
          >
            ⬇ Скачать Excel
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500 text-xs">Задач</div>
            <div className="font-bold text-lg">{content.tasks.length}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500 text-xs">Суммарно дней</div>
            <div className="font-bold text-lg">
              {content.tasks.reduce(
                (s, t) => s + (Number(t.duration_days) || 0),
                0
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500 text-xs">KPI</div>
            <div className="font-bold text-lg">{content.kpi?.length ?? 0}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500 text-xs">Рисков</div>
            <div className="font-bold text-lg">{content.risks?.length ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-indigo-700 mb-3">KPI</h3>
          <ul className="space-y-2 text-sm">
            {content.kpi?.map((k, i) => (
              <li key={`kpi-${i}`} className="flex gap-2">
                <span className="text-indigo-500">✓</span>
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-700 mb-3">Риски</h3>
          <ul className="space-y-2 text-sm">
            {content.risks?.map((r, i) => (
              <li key={`risk-${i}`} className="flex gap-2">
                <span className="text-amber-500">⚠</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        {allGroups.map((g) => (
          <div
            key={g.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-3">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  STAGE_STYLES[g.stage] || "bg-gray-100 text-gray-700"
                }`}
              >
                {g.stage}
              </span>
              <span className="text-sm text-gray-500">{g.tasks.length} задач</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3 font-medium">Задача</th>
                    <th className="text-left p-3 font-medium">Кто</th>
                    <th className="text-left p-3 font-medium">Инструменты</th>
                    <th className="text-left p-3 font-medium">Дни</th>
                    <th className="text-left p-3 font-medium">Результат</th>
                  </tr>
                </thead>
                <tbody>
                  {g.tasks.map((t, i) => (
                    <tr
                      key={`${g.id}-task-${i}`}
                      className="border-t border-gray-100 hover:bg-gray-50 align-top"
                    >
                      <td className="p-3 font-medium">{t.task}</td>
                      <td className="p-3 text-gray-600 whitespace-nowrap">
                        {t.responsible}
                      </td>
                      <td className="p-3 text-gray-600">{t.tools}</td>
                      <td className="p-3 text-gray-600 text-center whitespace-nowrap">
                        {t.duration_days}
                      </td>
                      <td className="p-3 text-gray-600">{t.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <a
          href={`/api/export/${planId}`}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3 rounded-lg"
        >
          ⬇ Скачать план в Excel
        </a>
      </div>
    </div>
  );
}