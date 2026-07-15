import { useListGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useContributeToGoal, getListGoalsQueryKey, Goal } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PlusIcon, TrashIcon, EditIcon, PlusCircleIcon } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";

const GOAL_GRADIENTS = [
  ["#6366f1", "#8b5cf6"],
  ["#0ea5e9", "#6366f1"],
  ["#10b981", "#14b8a6"],
  ["#f59e0b", "#f97316"],
  ["#ec4899", "#f43f5e"],
  ["#8b5cf6", "#ec4899"],
];

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  targetAmount: z.coerce.number().min(0.01, "Target amount must be greater than 0"),
  deadline: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

const contributeSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});

export default function Goals() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [contributeGoalId, setContributeGoalId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { data: goals, isLoading } = useListGoals();

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const contributeToGoal = useContributeToGoal();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: "", description: "", targetAmount: 0, deadline: "" },
  });

  const contributeForm = useForm<{ amount: number }>({
    resolver: zodResolver(contributeSchema),
    defaultValues: { amount: 0 },
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
  };

  const onSubmit = (values: GoalFormValues) => {
    if (editingId) {
      updateGoal.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          toast.success("Goal updated");
          setIsCreateOpen(false);
          setEditingId(null);
          form.reset();
          invalidateQueries();
        },
        onError: () => toast.error("Failed to update goal")
      });
    } else {
      createGoal.mutate({ data: values }, {
        onSuccess: () => {
          toast.success("Goal created");
          setIsCreateOpen(false);
          form.reset();
          invalidateQueries();
        },
        onError: () => toast.error("Failed to create goal")
      });
    }
  };

  const onContribute = (values: { amount: number }) => {
    if (!contributeGoalId) return;
    contributeToGoal.mutate({ id: contributeGoalId, data: { amount: values.amount } }, {
      onSuccess: () => {
        toast.success("Contribution added");
        setContributeGoalId(null);
        contributeForm.reset();
        invalidateQueries();
      },
      onError: () => toast.error("Transfer failed")
    });
  };

  const handleEdit = (g: Goal) => {
    form.reset({
      name: g.name,
      description: g.description || "",
      targetAmount: g.targetAmount,
      deadline: g.deadline ? g.deadline.split('T')[0] : "",
    });
    setEditingId(g.id);
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this goal?")) {
      deleteGoal.mutate({ id }, {
        onSuccess: () => {
          toast.success("Goal deleted");
          invalidateQueries();
        },
        onError: () => toast.error("Failed to delete goal")
      });
    }
  };

  const CircleProgress = ({ percent, gradient }: { percent: number; gradient: string[] }) => {
    const r = 28;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(percent, 100) / 100) * circ;
    const id = `grad-${gradient[0].replace('#', '')}`;
    return (
      <div className="relative w-[72px] h-[72px] flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <defs>
            <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
          <circle cx="36" cy="36" r={r} stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
          <circle
            cx="36" cy="36" r={r}
            stroke={`url(#${id})`}
            strokeWidth="4"
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 4px ${gradient[0]}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold font-mono text-foreground">{percent}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>Goals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Savings targets</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) { setEditingId(null); form.reset(); }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl font-medium"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none" }}>
              <PlusIcon className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-semibold text-foreground" style={{ letterSpacing: "-0.01em" }}>
                {editingId ? "Edit Goal" : "New Goal"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Emergency Fund" {...field} className="rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="targetAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Target Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} className="font-mono rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="deadline" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Target Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} className="rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full rounded-xl font-medium"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none" }}
                  disabled={createGoal.isPending || updateGoal.isPending}>
                  {createGoal.isPending || updateGoal.isPending ? "Saving..." : "Save Goal"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Contribution dialog */}
        <Dialog open={!!contributeGoalId} onOpenChange={(open) => {
          if (!open) { setContributeGoalId(null); contributeForm.reset(); }
        }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-semibold text-foreground" style={{ letterSpacing: "-0.01em" }}>
                Add Funds
              </DialogTitle>
            </DialogHeader>
            <Form {...contributeForm}>
              <form onSubmit={contributeForm.handleSubmit(onContribute)} className="space-y-4 pt-1">
                <FormField control={contributeForm.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} className="font-mono rounded-lg" autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full rounded-xl font-medium"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none" }}
                  disabled={contributeToGoal.isPending}>
                  {contributeToGoal.isPending ? "Adding..." : "Add Funds"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="flex justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted w-1/2 rounded" />
                    <div className="h-3 bg-muted w-1/3 rounded" />
                    <div className="h-7 bg-muted w-2/3 rounded mt-3" />
                  </div>
                  <div className="w-[72px] h-[72px] bg-muted rounded-full shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals && goals.length > 0 ? (
        <motion.div
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {goals.map((goal, idx) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const isCompleted = percent >= 100;
            const gradient = GOAL_GRADIENTS[idx % GOAL_GRADIENTS.length];

            return (
              <motion.div
                key={goal.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } } }}
              >
                <Card className={`group glow-card overflow-hidden relative ${isCompleted ? 'border-indigo-500/30' : ''}`}>
                  {/* Top accent */}
                  <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]}, transparent)` }} />

                  {isCompleted && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(99,102,241,0.15)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.3)" }}>
                        ✓ Complete
                      </span>
                    </div>
                  )}

                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate" style={{ letterSpacing: "-0.01em" }}>
                          {goal.name}
                        </h3>
                        {goal.deadline && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                            Target: {formatDate(goal.deadline)}
                          </div>
                        )}
                        <div className="mt-3">
                          <div className="text-2xl font-bold font-mono" style={{ letterSpacing: "-0.02em", color: gradient[0] }}>
                            {formatCurrency(goal.currentAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            of {formatCurrency(goal.targetAmount)}
                          </div>
                        </div>
                      </div>
                      <CircleProgress percent={percent} gradient={gradient} />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-lg gap-1.5 text-xs font-medium h-8"
                        style={isCompleted
                          ? { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", border: "none" }
                          : { background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`, border: "none" }
                        }
                        disabled={isCompleted}
                        onClick={() => !isCompleted && setContributeGoalId(goal.id)}
                      >
                        <PlusCircleIcon className="h-3.5 w-3.5" />
                        Add Funds
                      </Button>
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors border border-border"
                        onClick={() => handleEdit(goal)}>
                        <EditIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-border"
                        onClick={() => handleDelete(goal.id)}>
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
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
              <PlusCircleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No goals yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Set savings targets to work toward your financial goals.
            </p>
            <Button className="mt-4 rounded-xl"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none" }}
              onClick={() => setIsCreateOpen(true)}>
              New Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
