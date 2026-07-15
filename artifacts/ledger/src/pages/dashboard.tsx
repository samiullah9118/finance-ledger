import { useGetDashboardSummary, useGetMonthlyTrends, useGetSpendingByCategory, useGetRecentTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from "lucide-react";
import { getCategoryColor, PIE_COLORS } from "@/lib/categoryColors";
import { useCountUp } from "@/lib/useCountUp";

/** Animated currency display — counts up from 0 to value on mount/change */
function AnimatedCurrency({
  value,
  className,
  prefix = "",
}: {
  value: number;
  className?: string;
  prefix?: string;
}) {
  const animated = useCountUp(value, 1500);
  return (
    <span className={className}>
      {prefix}{formatCurrency(animated)}
    </span>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: trends, isLoading: isLoadingTrends } = useGetMonthlyTrends();
  const { data: spending, isLoading: isLoadingSpending } = useGetSpendingByCategory();
  const { data: recent, isLoading: isLoadingRecent } = useGetRecentTransactions();

  const netPositive = (summary?.netThisMonth || 0) >= 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.09 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ letterSpacing: "-0.025em" }}>
          Overview
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your financial snapshot</p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {/* ── Hero balance card ── */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="balance-card-gradient rounded-2xl p-6 h-full min-h-[138px] flex flex-col justify-between relative overflow-hidden">
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
            />

            <div className="flex items-center justify-between relative z-10">
              <span className="text-white/65 text-sm font-medium tracking-wide">Total Balance</span>
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <TrendingUpIcon className="h-4 w-4 text-white/75" />
              </div>
            </div>

            <div className="relative z-10 mt-2">
              {isLoadingSummary ? (
                <Skeleton className="h-11 w-44 bg-white/20 rounded-lg" />
              ) : (
                <div
                  className="text-[2.6rem] font-bold text-white font-mono leading-none"
                  style={{ letterSpacing: "-0.035em" }}
                >
                  <AnimatedCurrency value={summary?.totalBalance || 0} />
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm ${
                    netPositive
                      ? "bg-emerald-400/20 text-emerald-200"
                      : "bg-red-400/20 text-red-200"
                  }`}
                >
                  {netPositive ? "+" : ""}
                  {formatCurrency(summary?.netThisMonth || 0)} this month
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Income card ── */}
        <motion.div variants={itemVariants}>
          <Card className="glow-card h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[138px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Income
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ArrowUpIcon className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              </div>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <AnimatedCurrency
                  value={summary?.monthlyIncome || 0}
                  className="text-2xl font-bold font-mono text-emerald-400"
                />
              )}
              <div className="text-[11px] text-muted-foreground mt-1">This month</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Expenses card ── */}
        <motion.div variants={itemVariants}>
          <Card className="glow-card h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[138px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Expenses
                </span>
                <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <ArrowDownIcon className="h-3.5 w-3.5 text-destructive" />
                </div>
              </div>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <AnimatedCurrency
                  value={summary?.monthlyExpenses || 0}
                  className="text-2xl font-bold font-mono text-destructive"
                />
              )}
              <div className="text-[11px] text-muted-foreground mt-1">This month</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Charts row ── */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 flex flex-col glow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 flex-1 min-h-[300px]">
            {isLoadingTrends ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-[250px] w-full mx-6" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "var(--font-mono)" }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                      borderRadius: "10px",
                      fontSize: 12,
                    }}
                    itemStyle={{ fontFamily: "var(--font-mono)" }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: "8px" }} />
                  <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 flex flex-col glow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {isLoadingSpending ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-[220px] w-[220px] rounded-full mx-auto" />
              </div>
            ) : spending && spending.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spending}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                    animationBegin={200}
                    animationDuration={900}
                  >
                    {spending.map((entry, index) => {
                      const c = getCategoryColor(entry.category);
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={c.dot || PIE_COLORS[index % PIE_COLORS.length]}
                          stroke="hsl(var(--card))"
                          strokeWidth={2}
                        />
                      );
                    })}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                      borderRadius: "10px",
                      fontSize: 12,
                    }}
                    itemStyle={{ fontFamily: "var(--font-mono)" }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No spending data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Transactions ── */}
      <Card className="glow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoadingRecent ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : recent && recent.length > 0 ? (
            <div className="space-y-0.5">
              {recent.map((tx, i) => {
                const colors = getCategoryColor(tx.category);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                      >
                        {tx.type === "income" ? (
                          <ArrowUpIcon className="h-4 w-4" style={{ color: colors.text }} />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4" style={{ color: colors.text }} />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-foreground">{tx.description}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>{formatDate(tx.date)}</span>
                          <span className="opacity-30">·</span>
                          <span
                            className="font-mono text-[10px] uppercase tracking-wider"
                            style={{ color: colors.text }}
                          >
                            {tx.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-mono text-sm font-semibold tabular-nums ${
                        tx.type === "income" ? "text-emerald-400" : "text-foreground"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "−"}
                      {formatCurrency(tx.amount)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No recent transactions.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
