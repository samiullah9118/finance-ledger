import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, goalsTable } from "@workspace/db";
import {
  CreateGoalBody,
  UpdateGoalParams,
  UpdateGoalBody,
  DeleteGoalParams,
  ContributeToGoalParams,
  ContributeToGoalBody,
} from "@workspace/api-zod";

const router = Router();

function formatGoal(g: typeof goalsTable.$inferSelect) {
  return {
    ...g,
    targetAmount: parseFloat(g.targetAmount),
    currentAmount: parseFloat(g.currentAmount),
    createdAt: g.createdAt.toISOString(),
  };
}

router.get("/goals", async (_req, res) => {
  const goals = await db.select().from(goalsTable).orderBy(goalsTable.createdAt);
  res.json(goals.map(formatGoal));
});

router.post("/goals", async (req, res) => {
  const body = CreateGoalBody.parse(req.body);
  const [goal] = await db
    .insert(goalsTable)
    .values({
      ...body,
      targetAmount: String(body.targetAmount),
      currentAmount: String(body.currentAmount ?? 0),
    })
    .returning();
  res.status(201).json(formatGoal(goal));
});

router.patch("/goals/:id", async (req, res): Promise<void> => {
  const { id } = UpdateGoalParams.parse(req.params);
  const body = UpdateGoalBody.parse(req.body);
  const updates: Record<string, unknown> = { ...body };
  if (body.targetAmount !== undefined) updates.targetAmount = String(body.targetAmount);
  if (body.currentAmount !== undefined) updates.currentAmount = String(body.currentAmount);
  const [goal] = await db.update(goalsTable).set(updates).where(eq(goalsTable.id, id)).returning();
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return; }
  res.json(formatGoal(goal));
});

router.delete("/goals/:id", async (req, res) => {
  const { id } = DeleteGoalParams.parse(req.params);
  await db.delete(goalsTable).where(eq(goalsTable.id, id));
  res.status(204).send();
});

router.post("/goals/:id/contribute", async (req, res): Promise<void> => {
  const { id } = ContributeToGoalParams.parse(req.params);
  const { amount } = ContributeToGoalBody.parse(req.body);
  const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, id));
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return; }
  const newAmount = parseFloat(goal.currentAmount) + amount;
  const [updated] = await db
    .update(goalsTable)
    .set({ currentAmount: String(newAmount) })
    .where(eq(goalsTable.id, id))
    .returning();
  res.json(formatGoal(updated));
});

export default router;
