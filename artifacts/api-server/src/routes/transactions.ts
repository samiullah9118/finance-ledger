import { Router } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, transactionsTable, accountsTable } from "@workspace/db";
import {
  ListTransactionsQueryParams,
  CreateTransactionBody,
  UpdateTransactionParams,
  UpdateTransactionBody,
  DeleteTransactionParams,
  GetTransactionParams,
} from "@workspace/api-zod";

const router = Router();

function formatTx(t: typeof transactionsTable.$inferSelect & { accountName?: string | null }) {
  return {
    ...t,
    amount: parseFloat(t.amount),
    createdAt: t.createdAt.toISOString(),
    accountName: t.accountName ?? null,
  };
}

router.get("/transactions", async (req, res) => {
  const params = ListTransactionsQueryParams.parse(req.query);
  const conditions = [];

  if (params.accountId != null) conditions.push(eq(transactionsTable.accountId, params.accountId));
  if (params.category != null) conditions.push(eq(transactionsTable.category, params.category));
  if (params.type != null) conditions.push(eq(transactionsTable.type, params.type));
  if (params.startDate != null) conditions.push(gte(transactionsTable.date, params.startDate));
  if (params.endDate != null) conditions.push(lte(transactionsTable.date, params.endDate));

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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
    .limit(params.limit ?? 500);

  res.json(rows.map(formatTx));
});

router.post("/transactions", async (req, res) => {
  const body = CreateTransactionBody.parse(req.body);
  const [tx] = await db
    .insert(transactionsTable)
    .values({ ...body, amount: String(body.amount) })
    .returning();

  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, tx.accountId));

  // Update account balance
  const delta = body.type === "income" ? body.amount : -body.amount;
  await db
    .update(accountsTable)
    .set({ balance: String(parseFloat(account.balance) + delta) })
    .where(eq(accountsTable.id, body.accountId));

  res.status(201).json(formatTx({ ...tx, accountName: account?.name ?? null }));
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const { id } = GetTransactionParams.parse(req.params);
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
    .where(eq(transactionsTable.id, id));
  if (!rows[0]) { res.status(404).json({ error: "Transaction not found" }); return; }
  res.json(formatTx(rows[0]));
});

router.patch("/transactions/:id", async (req, res): Promise<void> => {
  const { id } = UpdateTransactionParams.parse(req.params);
  const body = UpdateTransactionBody.parse(req.body);
  const updates: Record<string, unknown> = { ...body };
  if (body.amount !== undefined) updates.amount = String(body.amount);

  const [tx] = await db.update(transactionsTable).set(updates).where(eq(transactionsTable.id, id)).returning();
  if (!tx) { res.status(404).json({ error: "Transaction not found" }); return; }
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, tx.accountId));
  res.json(formatTx({ ...tx, accountName: account?.name ?? null }));
});

router.delete("/transactions/:id", async (req, res) => {
  const { id } = DeleteTransactionParams.parse(req.params);
  await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
  res.status(204).send();
});

export default router;
