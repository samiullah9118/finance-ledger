import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, accountsTable } from "@workspace/db";
import {
  CreateAccountBody,
  UpdateAccountParams,
  UpdateAccountBody,
  DeleteAccountParams,
  GetAccountParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/accounts", async (req, res) => {
  const accounts = await db.select().from(accountsTable).orderBy(accountsTable.createdAt);
  res.json(
    accounts.map((a) => ({
      ...a,
      balance: parseFloat(a.balance),
      createdAt: a.createdAt.toISOString(),
    }))
  );
});

router.post("/accounts", async (req, res) => {
  const body = CreateAccountBody.parse(req.body);
  const [account] = await db
    .insert(accountsTable)
    .values({ ...body, balance: String(body.balance) })
    .returning();
  res.status(201).json({ ...account, balance: parseFloat(account.balance), createdAt: account.createdAt.toISOString() });
});

router.get("/accounts/:id", async (req, res): Promise<void> => {
  const { id } = GetAccountParams.parse(req.params);
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, id));
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }
  res.json({ ...account, balance: parseFloat(account.balance), createdAt: account.createdAt.toISOString() });
});

router.patch("/accounts/:id", async (req, res): Promise<void> => {
  const { id } = UpdateAccountParams.parse(req.params);
  const body = UpdateAccountBody.parse(req.body);
  const updates: Record<string, unknown> = { ...body };
  if (body.balance !== undefined) updates.balance = String(body.balance);
  const [account] = await db.update(accountsTable).set(updates).where(eq(accountsTable.id, id)).returning();
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }
  res.json({ ...account, balance: parseFloat(account.balance), createdAt: account.createdAt.toISOString() });
});

router.delete("/accounts/:id", async (req, res) => {
  const { id } = DeleteAccountParams.parse(req.params);
  await db.delete(accountsTable).where(eq(accountsTable.id, id));
  res.status(204).send();
});

export default router;
