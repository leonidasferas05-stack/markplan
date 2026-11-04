"use client";

import { useState } from "react";
import PlanView, { type PlanContent } from "./PlanView";

type GenerateResponse = {
  id: string;
  content: PlanContent;
  meta: { isPro: boolean; remaining: number | null };
};

const ROLES = [
  "маркетолог",
  "product manager",
  "владелец бизнеса",
  "SMM-менеджер",
  "таргетолог",
  "event-менеджер",
];

const EXAMPLES = [
  "Запуск онлайн-курса по фотографии для новичков",
  "Продвижение локального кафе в Instagram",
  "B2B-вебинар по кибербезопасности",
  "Чёрная пятница для магазина косметики",
];

export default function PlanGenerator() {
  const [idea, setIdea] = useState("");
  const [role, setRole] = useState("маркетолог");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null | undefined>(
    undefined
  );

  async function generate() {
    if (idea.trim().length < 10) {
      setError("Опиши идею подробнее (минимум 10 символов)");
      return;
    }

    setLoading(true);
    setError(null);
    setLimitMessage(null);
    setPlan(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim(),
          role,
          budget: budget.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setLimitMessage(
            data.message || "Лимит бесплатных генераций исчерпан"
          );
        } else {
          setError(data.message || data.error || "Ошибка генерации");
        }
        return;
      }

      setPlan(data);
      setRemaining(data.meta?.remaining);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPlan(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* === ФОРМА === */}
      {!plan && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Идея</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Опиши идею: например, «Запуск онлайн-курса по фотографии для новичков с бюджетом 100 000 ₽»"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              disabled={loading}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-gray-500">Примеры:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setIdea(ex)}
                  disabled={loading}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 disabled:opacity-50"
                >
                  {ex.length > 40 ? ex.slice(0, 40) + "…" : ex}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Роль</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Бюджет{" "}
                <span className="text-gray-400 font-normal">(опционально)</span>
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="например, 100 000 ₽"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || idea.trim().length < 10}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Генерирую план… (5–15 сек)" : "Сгенерировать план"}
          </button>

          {remaining !== undefined && remaining !== null && !error && (
            <p className="text-xs text-gray-500 text-center">
              Осталось генераций:{" "}
              <span className="font-medium">{remaining}</span>
            </p>
          )}
        </div>
      )}

      {/* === ОШИБКИ === */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Ошибка</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {limitMessage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4">
          <p className="font-medium">Лимит исчерпан</p>
          <p className="text-sm mb-3">{limitMessage}</p>
          <button className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded-lg">
            Оформить подписку — ₽990/мес
          </button>
        </div>
      )}

      {/* === ПЛАН === */}
      {plan && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={reset}
              className="border border-gray-300 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg"
            >
              ← Новый план
            </button>
          </div>

          <PlanView planId={plan.id} content={plan.content} />

          {remaining !== undefined && remaining !== null && (
            <p className="text-xs text-gray-500 text-center">
              Осталось генераций:{" "}
              <span className="font-medium">{remaining}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}