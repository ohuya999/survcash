import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, DollarSign, ClipboardCheck, CreditCard, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  totalUsers: number;
  paidUsers: number;
  totalSurveys: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalBalance: number;
  totalEarnings: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, paidUsers: 0, totalSurveys: 0,
    totalWithdrawals: 0, pendingWithdrawals: 0, totalBalance: 0, totalEarnings: 0,
  });
  const [recentSurveys, setRecentSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [profiles, surveys, withdrawals] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('survey_completions').select('*'),
        supabase.from('withdrawals').select('*'),
      ]);

      const users = profiles.data || [];
      const surveyData = surveys.data || [];
      const withdrawalData = withdrawals.data || [];

      setStats({
        totalUsers: users.length,
        paidUsers: users.filter(u => u.is_paid).length,
        totalSurveys: surveyData.length,
        totalWithdrawals: withdrawalData.length,
        pendingWithdrawals: withdrawalData.filter(w => w.status === 'pending').length,
        totalBalance: users.reduce((sum, u) => sum + u.balance, 0),
        totalEarnings: surveyData.reduce((sum, s) => sum + s.amount, 0),
      });

      // Group surveys by date for chart
      const dailyCounts: Record<string, number> = {};
      surveyData.forEach(s => {
        const date = new Date(s.completed_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });
      setRecentSurveys(Object.entries(dailyCounts).slice(-14).map(([date, count]) => ({ date, count })));
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <p className="text-muted-foreground animate-pulse">Loading stats...</p>;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Paid Users', value: stats.paidUsers, icon: Users, color: 'text-success' },
    { label: 'Total Surveys', value: stats.totalSurveys, icon: ClipboardCheck, color: 'text-primary' },
    { label: 'Total Earnings', value: `KSh ${stats.totalEarnings.toLocaleString()}`, icon: TrendingUp, color: 'text-warning' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: CreditCard, color: 'text-destructive' },
    { label: 'Outstanding Balance', value: `KSh ${stats.totalBalance.toLocaleString()}`, icon: DollarSign, color: 'text-primary' },
  ];

  const pieData = [
    { name: 'Paid', value: stats.paidUsers },
    { name: 'Unpaid', value: stats.totalUsers - stats.paidUsers },
  ];
  const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-bold">Dashboard Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">SURVCASH platform analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="font-heading text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-elevated p-6 lg:col-span-2">
          <h3 className="font-heading font-semibold mb-4">Daily Survey Activity</h3>
          {recentSurveys.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={recentSurveys}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">No survey data yet</p>
          )}
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-heading font-semibold mb-4">User Status</h3>
          {stats.totalUsers > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">No users yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
