import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accountsRouter from "./accounts";
import transactionsRouter from "./transactions";
import budgetsRouter from "./budgets";
import goalsRouter from "./goals";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountsRouter);
router.use(transactionsRouter);
router.use(budgetsRouter);
router.use(goalsRouter);
router.use(dashboardRouter);

export default router;
