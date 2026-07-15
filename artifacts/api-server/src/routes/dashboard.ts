import { Router } from "express";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";
import { db, accountsTable, transactionsTable } from "@workspace/db";

const router = Router();

function thisMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return {
    start: new Date(year, month, 1).toISOString().slice(0, 10),
    end: new Date(year, month + 1, 0).toISOString().slice(0, 10),
  };
}

router.get("/dashboard/summary", async (_req, res) => {
  const { start, end } = thisMonthRange();

  const [balanceRow] = await db
    .select({ total: sql<string>`coalesce(sum(balance), 0)` })
    .from(accountsTable);

  const [incomeRow] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.type, "income"), gte(transactionsTable.date, start), lte(transactionsTable.date, end)));

  const [expenseRow] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.type, "expense"), gte(transactionsTable.date, start), lte(transactionsTable.date, end)));

  const [countRow] = await db.select({ count: sql<string>`count(*)` }).from(accountsTable);
  const [txCountRow] = await db.select({ count: sql<string>`count(*)` }).from(transactionsTable);

  const monthlyIncome = parseFloat(incomeRow.total);
  const monthlyExpenses = parseFloat(expenseRow.total);

  res.json({
    totalBalance: parseFloat(balanceRow.total),
    monthlyIncome,
    monthlyExpenses,
    netThisMonth: monthlyIncome - monthlyExpenses,
    accountCount: parseInt(countRow.count),
    transactionCount: parseInt(txCountRow.count),
  });
});

router.get("/dashboard/spending-by-category", async (_req, res) => {
  const { start, end } = thisMonthRange();
  const rows = await db
    .select({
      category: transactionsTable.category,
      amount: sql<string>`sum(amount)`,
      count: sql<string>`count(*)`,
    })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.type, "expense"), gte(transactionsTable.date, start), lte(transactionsTable.date, end)))
    .groupBy(transactionsTable.category)
    .orderBy(sql`sum(amount) desc`);

  res.json(rows.map((r) => ({ category: r.category, amount: parseFloat(r.amount), count: parseInt(r.count) })));
});

router.get("/dashboard/monthly-trends", async (_req, res) => {
  const now = new Date();
  const trends = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const start = new Date(year, month, 1).toISOString().slice(0, 10);
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });

    const [incomeRow] = await db
      .select({ total: sql<string>`coalesce(sum(amount), 0)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.type, "income"), gte(transactionsTable.date, start), lte(transactionsTable.date, end)));

    const [expenseRow] = await db
      .select({ total: sql<string>`coalesce(sum(amount), 0)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.type, "expense"), gte(transactionsTable.date, start), lte(transactionsTable.date, end)));

    trends.push({ month: label, income: parseFloat(incomeRow.total), expenses: parseFloat(expenseRow.total) });
  }

  res.json(trends);
});

router.get("/dashboard/recent-transactions", async (_req, res) => {
  const rows = await db
    .select({
      id: transactionsTable.id,
      accountId: transactionsTable.accountId,
      accountName: accountsTable.name,
      amount: transactionsTable.amount,
      type: transactionsTable.type,
      category: transactionsTable.category,
      description: transactionsTable.description,
      date: transactionsTable.date,
      createdAt: transactionsTable.createdAt,
    })
    .from(transactionsTable)
    .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
    .limit(10);

  res.json(
    rows.map((t) => ({
      ...t,
      amount: parseFloat(t.amount),
      createdAt: t.createdAt.toISOString(),
      accountName: t.accountName ?? null,
    }))
  );
});

export default router;
