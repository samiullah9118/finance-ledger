import { Router } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, budgetsTable, transactionsTable } from "@workspace/db";
import {
  CreateBudgetBody,
  UpdateBudgetParams,
  UpdateBudgetBody,
  DeleteBudgetParams,
} from "@workspace/api-zod";

const router = Router();

function getCurrentPeriodRange(period: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === "monthly") {
    const start = new Date(year, month, 1).toISOString().slice(0, 10);
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    return { start, end };
  } else if (period === "weekly") {
    const day = now.getDay();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - day);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return { start: startDate.toISOString().slice(0, 10), end: endDate.toISOString().slice(0, 10) };
  } else {
    // yearly
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
}

async function getBudgetsWithSpending() {
  const budgets = await db.select().from(budgetsTable).orderBy(budgetsTable.createdAt);
  return Promise.all(
    budgets.map(async (budget) => {
      const { start, end } = getCurrentPeriodRange(budget.period);
      const [{ total }] = await db
        .select({ total: sql<string>`coalesce(sum(amount), 0)` })
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.category, budget.category),
            eq(transactionsTable.type, "expense"),
            gte(transactionsTable.date, start),
            lte(transactionsTable.date, end)
          )
        );
      return {
        ...budget,
        amount: parseFloat(budget.amount),
        spent: parseFloat(total),
        createdAt: budget.createdAt.toISOString(),
      };
    })
  );
}

router.get("/budgets", async (_req, res) => {
  const budgets = await getBudgetsWithSpending();
  res.json(budgets);
});

router.post("/budgets", async (req, res) => {
  const body = CreateBudgetBody.parse(req.body);
  const [budget] = await db
    .insert(budgetsTable)
    .values({ ...body, amount: String(body.amount) })
    .returning();
  res.status(201).json({ ...budget, amount: parseFloat(budget.amount), spent: 0, createdAt: budget.createdAt.toISOString() });
});

router.patch("/budgets/:id", async (req, res): Promise<void> => {
  const { id } = UpdateBudgetParams.parse(req.params);
  const body = UpdateBudgetBody.parse(req.body);
  const updates: Record<string, unknown> = { ...body };
  if (body.amount !== undefined) updates.amount = String(body.amount);
  const [budget] = await db.update(budgetsTable).set(updates).where(eq(budgetsTable.id, id)).returning();
  if (!budget) { res.status(404).json({ error: "Budget not found" }); return; }

  const { start, end } = getCurrentPeriodRange(budget.period);
  const [{ total }] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.category, budget.category),
        eq(transactionsTable.type, "expense"),
        gte(transactionsTable.date, start),
        lte(transactionsTable.date, end)
      )
    );
  res.json({ ...budget, amount: parseFloat(budget.amount), spent: parseFloat(total), createdAt: budget.createdAt.toISOString() });
});

router.delete("/budgets/:id", async (req, res) => {
  const { id } = DeleteBudgetParams.parse(req.params);
  await db.delete(budgetsTable).where(eq(budgetsTable.id, id));
  res.status(204).send();
});

export default router;
