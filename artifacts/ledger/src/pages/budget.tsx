import { useListBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget, getListBudgetsQueryKey, Budget } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PlusIcon, TrashIcon, EditIcon, AlertTriangleIcon } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getCategoryColor } from "@/lib/categoryColors";
import { useCountUp } from "@/lib/useCountUp";

const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  period: z.enum(["monthly", "weekly", "yearly"]),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

/* ─────────────────────────────────────────────────────────────
   Animated SVG ring — counts progress from 0 → percent
───────────────────────────────────────────────────────────── */
function BudgetRing({
  percent,
  color,
  isDanger,
  isWarning,
  size = 84,
}: {
  percent: number;
  color: string;
  isDanger: boolean;
  isWarning: boolean;
  size?: number;
}) {
  const strokeWidth = 5;
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  // Pick arc color
  const arcColor = isDanger ? "#f43f5e" : isWarning ? "#eab308" : color;
  const arcGlow = isDanger ? "#f43f5e66" : isWarning ? "#eab30866" : `${color}55`;

  // Animate the count up for the label
  const animatedPct = useCountUp(Math.min(percent, 100), 1200);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        style={{ overflow: "visible" }}
      >
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          stroke={arcColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (Math.min(percent, 100) / 100) * circ }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          style={{ filter: `drop-shadow(0 0 5px ${arcGlow})` }}
        />
      </svg>
      {/* Centered label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-sm font-bold font-mono leading-none ${isDanger ? "text-destructive" : "text-foreground"}`}>
          {Math.round(animatedPct)}%
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function BudgetPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { data: budgets, isLoading } = useListBudgets();

  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { category: "", amount: 0, period: "monthly" },
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
  };

  const onSubmit = (values: BudgetFormValues) => {
    if (editingId) {
      updateBudget.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          toast.success("Budget updated");
          setIsCreateOpen(false);
          setEditingId(null);
          form.reset();
          invalidateQueries();
        },
        onError: () => toast.error("Failed to update budget"),
      });
    } else {
      createBudget.mutate({ data: values }, {
        onSuccess: () => {
          toast.success("Budget created");
          setIsCreateOpen(false);
          form.reset();
          invalidateQueries();
        },
        onError: () => toast.error("Failed to create budget"),
      });
    }
  };

  const handleEdit = (b: Budget) => {
    form.reset({ category: b.category, amount: b.amount, period: b.period });
    setEditingId(b.id);
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this budget?")) {
      deleteBudget.mutate({ id }, {
        onSuccess: () => {
          toast.success("Budget deleted");
          invalidateQueries();
        },
        onError: () => toast.error("Failed to delete budget"),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ letterSpacing: "-0.025em" }}>
            Budget
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Monthly spending limits</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) { setEditingId(null); form.reset(); }
        }}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 rounded-xl font-medium"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none" }}
            >
              <PlusIcon className="h-4 w-4" />
              New Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-semibold text-foreground" style={{ letterSpacing: "-0.01em" }}>
                {editingId ? "Edit Budget" : "New Budget"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Dining" {...field} className="rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Limit</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="font-mono rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="period" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Period</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-xl font-medium"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none" }}
                  disabled={createBudget.isPending || updateBudget.isPending}
                >
                  {createBudget.isPending || updateBudget.isPending ? "Saving…" : "Save Budget"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 flex gap-4 items-center">
                <div className="w-[84px] h-[84px] rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted w-1/3 rounded" />
                  <div className="h-6 bg-muted w-2/3 rounded" />
                  <div className="h-3 bg-muted w-1/2 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgets && budgets.length > 0 ? (
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.07 } },
          }}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {budgets.map((budget) => {
            const percent = Math.min(100, Math.round((budget.spent / budget.amount) * 100));
            const isWarning = percent >= 80 && percent < 100;
            const isDanger = percent >= 100;
            const colors = getCategoryColor(budget.category);

            return (
              <motion.div
                key={budget.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.96 },
                  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
                }}
              >
                <Card className="group glow-card overflow-hidden">
                  {/* Category accent strip */}
                  <div
                    className="h-[2px] w-full"
                    style={{ background: `linear-gradient(90deg, ${colors.dot}, transparent 70%)` }}
                  />

                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      {/* Animated ring */}
                      <div className="shrink-0">
                        <BudgetRing
                          percent={percent}
                          color={colors.dot}
                          isDanger={isDanger}
                          isWarning={isWarning}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                              style={{ background: colors.bg, color: colors.text }}
                            >
                              {budget.category}
                            </span>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                              {budget.period}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                              onClick={() => handleEdit(budget)}
                            >
                              <EditIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={() => handleDelete(budget.id)}
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-baseline gap-1 font-mono">
                            <span
                              className={`text-xl font-bold leading-none ${isDanger ? "text-destructive" : "text-foreground"}`}
                              style={{ letterSpacing: "-0.02em" }}
                            >
                              {formatCurrency(budget.spent)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              / {formatCurrency(budget.amount)}
                            </span>
                          </div>

                          <div className="mt-1.5 text-[11px] font-mono">
                            {isDanger ? (
                              <span className="text-destructive flex items-center gap-1 font-semibold">
                                <AlertTriangleIcon className="h-3 w-3" />
                                Over by {formatCurrency(budget.spent - budget.amount)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                {formatCurrency(budget.amount - budget.spent)} remaining
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
              <AlertTriangleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No budgets yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Set spending limits to keep your finances on track.
            </p>
            <Button
              className="mt-4 rounded-xl"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none" }}
              onClick={() => setIsCreateOpen(true)}
            >
              New Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
