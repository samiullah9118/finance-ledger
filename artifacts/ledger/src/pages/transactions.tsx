import { useListTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction, useListAccounts, getListTransactionsQueryKey, getGetDashboardSummaryQueryKey, getGetMonthlyTrendsQueryKey, getGetSpendingByCategoryQueryKey, getGetRecentTransactionsQueryKey, Transaction } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PlusIcon, TrashIcon, EditIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryColor } from "@/lib/categoryColors";

const transactionSchema = z.object({
  accountId: z.coerce.number().min(1, "Account is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function Transactions() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { data: transactions, isLoading } = useListTransactions();
  const { data: accounts } = useListAccounts();

  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      description: "",
      category: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMonthlyTrendsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSpendingByCategoryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentTransactionsQueryKey() });
  };

  const onSubmit = (values: TransactionFormValues) => {
    if (editingId) {
      updateTx.mutate(
        { id: editingId, data: values },
        {
          onSuccess: () => {
            toast.success("Transaction updated");
            setIsCreateOpen(false);
            setEditingId(null);
            form.reset();
            invalidateQueries();
          },
          onError: () => toast.error("Failed to update transaction")
        }
      );
    } else {
      createTx.mutate(
        { data: values },
        {
          onSuccess: () => {
            toast.success("Transaction created");
            setIsCreateOpen(false);
            form.reset();
            invalidateQueries();
          },
          onError: () => toast.error("Failed to create transaction")
        }
      );
    }
  };

  const handleEdit = (tx: Transaction) => {
    form.reset({
      accountId: tx.accountId,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      description: tx.description,
      date: tx.date.split('T')[0],
    });
    setEditingId(tx.id);
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this transaction?")) {
      deleteTx.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success("Transaction deleted");
            invalidateQueries();
          },
          onError: () => toast.error("Failed to delete transaction")
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>Transactions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your complete transaction history</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingId(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl font-medium"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none" }}>
              <PlusIcon className="h-4 w-4" />
              New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-semibold text-foreground" style={{ letterSpacing: "-0.01em" }}>
                {editingId ? "Edit Transaction" : "New Transaction"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Account</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg">
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts?.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id.toString()}>
                                {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} className="font-mono rounded-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="rounded-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Groceries" {...field} className="rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Whole Foods Market" {...field} className="rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full rounded-xl font-medium"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none" }}
                  disabled={createTx.isPending || updateTx.isPending}>
                  {createTx.isPending || updateTx.isPending ? "Saving..." : "Save Transaction"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[120px_1fr_160px_140px_120px_80px] gap-3 px-4 py-2.5 border-b border-border bg-muted/30">
          {["Date", "Description", "Category", "Account", "Amount", ""].map((h) => (
            <div key={h} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{h}</div>
          ))}
        </div>

        {isLoading ? (
          <div className="divide-y divide-border/50">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : transactions && transactions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="divide-y divide-border/40"
          >
            {transactions.map((tx, idx) => {
              const colors = getCategoryColor(tx.category);
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.015, duration: 0.2 }}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors"
                  style={{ borderLeft: `3px solid ${colors.dot}33` }}
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                    {tx.type === 'income'
                      ? <ArrowUpIcon className="h-4 w-4" style={{ color: colors.text }} />
                      : <ArrowDownIcon className="h-4 w-4" style={{ color: colors.text }} />}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0 md:grid md:grid-cols-[1fr_160px_140px_120px_80px] md:gap-3 md:items-center">
                    {/* Mobile: stacked */}
                    <div className="md:hidden">
                      <div className="font-medium text-sm text-foreground truncate">{tx.description}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono">{formatDate(tx.date)}</span>
                        <span className="text-border text-xs">·</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                          style={{ background: colors.bg, color: colors.text }}>
                          {tx.category}
                        </span>
                      </div>
                    </div>

                    {/* Desktop: columns */}
                    <div className="hidden md:block font-medium text-sm text-foreground truncate">{tx.description}</div>
                    <div className="hidden md:flex">
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg"
                        style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                        {tx.category}
                      </span>
                    </div>
                    <div className="hidden md:block text-sm text-muted-foreground truncate">{tx.accountName}</div>
                    <div className={`hidden md:block font-mono text-sm font-semibold tabular-nums ${tx.type === 'income' ? 'text-emerald-400' : 'text-foreground'}`}>
                      {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                    </div>
                    <div className="hidden md:flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                        onClick={() => handleEdit(tx)}>
                        <EditIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDelete(tx.id)}>
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile amount + actions */}
                  <div className="md:hidden flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-sm font-semibold tabular-nums ${tx.type === 'income' ? 'text-emerald-400' : 'text-foreground'}`}>
                      {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                        onClick={() => handleEdit(tx)}>
                        <EditIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDelete(tx.id)}>
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-muted-foreground text-sm">No transactions yet.</div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
