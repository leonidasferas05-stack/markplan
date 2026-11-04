import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";


type PlanTask = {
  stage: string;
  task: string;
  responsible: string;
  tools: string;
  duration_days: number;
  result: string;
};

type PlanContent = {
  title: string;
  summary: string;
  kpi: string[];
  risks: string[];
  tasks: PlanTask[];
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const plan = await prisma.plan.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!plan) {
      return new NextResponse("Not found", { status: 404 });
    }

    const data = plan.content as unknown as PlanContent;

    const wb = new ExcelJS.Workbook();
    wb.creator = "MarkPlan";
    wb.created = new Date();

    // === Лист 1: План работ ===
    const ws = wb.addWorksheet("План работ", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    ws.columns = [
      { header: "Этап", key: "stage", width: 18 },
      { header: "Задача", key: "task", width: 50 },
      { header: "Ответственный", key: "responsible", width: 20 },
      { header: "Инструменты", key: "tools", width: 28 },
      { header: "Срок (дн.)", key: "duration_days", width: 12 },
      { header: "Результат", key: "result", width: 45 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F46E5" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    const stageColors: Record<string, string> = {
      Подготовка: "FFFEF3C7",
      Запуск: "FFDBEAFE",
      Аналитика: "FFE0E7FF",
      Оптимизация: "FFD1FAE5",
    };

    data.tasks?.forEach((t) => {
      const row = ws.addRow(t);
      row.alignment = { wrapText: true, vertical: "top" };
      const bg = stageColors[t.stage] || "FFF3F4F6";
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bg },
        };
      });
      row.getCell("duration_days").alignment = {
        horizontal: "center",
        vertical: "top",
      };
    });

    ws.autoFilter = { from: "A1", to: "F1" };

    // === Лист 2: Сводка ===
    const summary = wb.addWorksheet("Сводка");
    summary.columns = [{ width: 22 }, { width: 70 }];

    const addSection = (label: string) => {
      const row = summary.addRow([label]);
      row.font = { bold: true, size: 13, color: { argb: "FF4F46E5" } };
      return row;
    };

    summary.addRow(["Проект", data.title || ""]).getCell(1).font = { bold: true };
    summary.addRow(["Суть", data.summary || ""]);
    summary.addRow(["Создан", new Date(plan.createdAt).toLocaleString("ru-RU")]);
    summary.addRow([]);

    addSection("KPI");
    (data.kpi || []).forEach((k) => summary.addRow(["", k]));
    summary.addRow([]);

    addSection("Риски");
    (data.risks || []).forEach((r) => summary.addRow(["", r]));
    summary.addRow([]);

    const totalDays = (data.tasks || []).reduce(
      (s, t) => s + (Number(t.duration_days) || 0),
      0
    );
    addSection("Итого");
    summary.addRow(["Всего задач", (data.tasks || []).length]);
    summary.addRow(["Суммарно дней", totalDays]);

    summary.eachRow((row, i) => {
      if (i > 1) row.alignment = { wrapText: true, vertical: "top" };
    });

    // === Генерация файла ===
    const buffer = await wb.xlsx.writeBuffer();
    // ✅ ВАЖНО: NextResponse принимает Uint8Array / ArrayBuffer, но через
    //    new Uint8Array(buffer) мы получаем гарантированно корректный бинарник
    const uint8 = new Uint8Array(buffer);

    // ✅ ВАЖНО: только ASCII в filename= (никакой кириллицы!)
    const asciiName = `plan-${plan.id.slice(0, 8)}.xlsx`;
    // ✅ Кириллическое имя передаётся через RFC 5987 (filename*=UTF-8'')
    const utf8Name = encodeURIComponent(`${data.title || "План"}.xlsx`);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
        "Content-Length": String(uint8.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export] failed:", e);
    return new NextResponse(
      `Export failed: ${(e as Error).message}`,
      { status: 500 }
    );
  }
}