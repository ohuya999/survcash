import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '@/hooks/use-admin';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DollarSign, Users, ClipboardCheck, LogOut, TrendingUp, Shield, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function isWeekday(): boolean {
  const day = new Date().getDay();
  return day >= 1 && day <= 5;
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

export default function Dashboard() {
  const { profile, user, loading, signOut, refreshProfile } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [surveyHistory, setSurveyHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from('survey_completions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(14)
        .then(({ data }) => {
          if (data) setSurveyHistory(data);
        });
    }
  }, [user]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile.is_paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="card-elevated p-8 max-w-md text-center">
          <h2 className="font-heading text-xl font-bold mb-3">Payment Required</h2>
          <p className="text-muted-foreground mb-6">
            Your account is not yet activated. Please pay KSh 200 via M-Pesa to start earning.
          </p>
          <Button className="btn-gold rounded-xl px-6 py-5" onClick={async () => {
            toast.success('M-Pesa STK Push sent! Enter your PIN.');
            const { data: result, error } = await supabase.functions.invoke('mpesa-stk-push', {
              body: { phone: profile.phone, amount: 200, userId: user!.id },
            });
            if (!error) {
              await refreshProfile();
              toast.success('Account activated!');
            } else {
              toast.error('Payment failed. Try again.');
            }
          }}>
            Pay KSh 200 Now
          </Button>
          <Button variant="ghost" className="mt-3 text-sm text-muted-foreground" onClick={() => refreshProfile()}>
            Already paid? Refresh status
          </Button>
        </div>
      </div>
    );
  }

  const canTakeSurvey = isWeekday() && !isToday(profile.last_survey_date);
  const canWithdraw = profile.balance >= 1000 && profile.referral_count >= 4;

  const handleSurvey = () => {
    if (!canTakeSurvey) {
      toast.error(isWeekday() ? "You've already completed today's survey" : 'Surveys are only available on weekdays');
      return;
    }
    navigate('/survey');
  };

  const handleWithdraw = async () => {
    if (!canWithdraw) {
      const reasons = [];
      if (profile.balance < 1000) reasons.push('minimum balance KSh 1,000');
      if (profile.referral_count < 4) reasons.push('minimum 4 referrals');
      toast.error(`Cannot withdraw. Need: ${reasons.join(' and ')}`);
      return;
    }
    setWithdrawLoading(true);
    try {
      // Create withdrawal record first
      const { data: withdrawal, error: insertError } = await supabase.from('withdrawals').insert({
        user_id: user!.id,
        amount: profile.balance,
        phone: profile.phone,
        status: 'pending',
      }).select().single();

      if (insertError) throw insertError;

      // Call B2C edge function
      const { data: result, error } = await supabase.functions.invoke('mpesa-b2c', {
        body: {
          phone: profile.phone,
          amount: profile.balance,
          withdrawalId: withdrawal.id,
          userId: user!.id,
        },
      });

      if (error) throw error;

      await refreshProfile();
      toast.success(`Withdrawal of KSh ${profile.balance} initiated via M-Pesa!`);
    } catch {
      toast.error('Withdrawal failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Chart data
  const chartData = surveyHistory.slice().reverse().map((s) => ({
    date: new Date(s.completed_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
    amount: s.amount,
  }));


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold">SURVCASH</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                  <Shield className="w-4 h-4 mr-2" /> Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Balance</span>
            </div>
            <p className="font-heading text-3xl font-bold">KSh {profile.balance.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Users className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Referrals</span>
            </div>
            <p className="font-heading text-3xl font-bold">{profile.referral_count}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Surveys Done</span>
            </div>
            <p className="font-heading text-3xl font-bold">{surveyHistory.length}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
              <ClipboardCheck className="w-6 h-6 text-primary" />
              <h3 className="font-heading font-semibold text-lg">Daily Survey</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {canTakeSurvey
                ? 'Your survey is ready! Complete it to earn KSh 50.'
                : isWeekday()
                ? "You've completed today's survey. Come back tomorrow!"
                : 'Surveys are available Monday–Friday.'}
            </p>
            <Button
              className="w-full btn-primary rounded-xl py-5 font-semibold"
              disabled={!canTakeSurvey}
              onClick={handleSurvey}
            >
              {canTakeSurvey ? 'Start Survey' : 'Completed'}
            </Button>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-6 h-6 text-secondary" />
              <h3 className="font-heading font-semibold text-lg">Withdraw</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {canWithdraw
                ? `Withdraw KSh ${profile.balance.toLocaleString()} to your M-Pesa.`
                : `Need KSh 1,000+ balance and 4+ referrals. You have KSh ${profile.balance.toLocaleString()} and ${profile.referral_count} referrals.`}
            </p>
            <Button
              className="w-full rounded-xl py-5 font-semibold"
              variant={canWithdraw ? 'default' : 'secondary'}
              disabled={!canWithdraw || withdrawLoading}
              onClick={handleWithdraw}
            >
              {withdrawLoading ? 'Processing...' : canWithdraw ? 'Withdraw Now' : 'Not Eligible'}
            </Button>
          </div>
        </div>

        {/* Leaderboard Link */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Leaderboard</h3>
                <p className="text-muted-foreground text-sm">See top earners & most active users</p>
              </div>
            </div>
            <Link to="/leaderboard">
              <Button variant="outline" className="rounded-xl">View</Button>
            </Link>
          </div>
        </div>

        {/* Charts */}
        <div className="card-elevated p-6">
          <h3 className="font-heading font-semibold text-lg mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Earnings History
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              No survey data yet. Complete your first survey to see your earnings!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
