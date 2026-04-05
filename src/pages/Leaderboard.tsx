import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, TrendingUp, Users, Medal } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  phone: string;
  total_earned: number;
  surveys_completed: number;
  referral_count: number;
}

const RANK_STYLES = [
  { bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-400', icon: '🥇', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-gray-100 dark:bg-gray-800/40', border: 'border-gray-400', icon: '🥈', text: 'text-gray-600 dark:text-gray-300' },
  { bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-400', icon: '🥉', text: 'text-orange-700 dark:text-orange-300' },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'earners' | 'active'>('earners');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    supabase.rpc('get_leaderboard').then(({ data }) => {
      if (data) setEntries(data as LeaderboardEntry[]);
      setLoading(false);
    });
  }, [user, navigate]);

  const sorted = tab === 'earners'
    ? [...entries].sort((a, b) => b.total_earned - a.total_earned)
    : [...entries].sort((a, b) => b.surveys_completed - a.surveys_completed);

  const isCurrentUser = (id: string) => id === user?.id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-400" />
            <h1 className="font-heading text-2xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-primary-foreground/70 text-sm mt-1">
            Top performers on SURVCASH
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('earners')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              tab === 'earners'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Top Earners
          </button>
          <button
            onClick={() => setTab('active')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              tab === 'active'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Users className="w-4 h-4" /> Most Active
          </button>
        </div>

        {/* Leaderboard List */}
        {sorted.length === 0 ? (
          <div className="card-elevated p-8 text-center">
            <Medal className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No data yet. Be the first to earn!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((entry, i) => {
              const rankStyle = i < 3 ? RANK_STYLES[i] : null;
              const highlight = isCurrentUser(entry.user_id);

              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    highlight
                      ? 'border-primary bg-accent shadow-sm'
                      : rankStyle
                      ? `${rankStyle.bg} ${rankStyle.border} border`
                      : 'border-border bg-card'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    rankStyle
                      ? rankStyle.text
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {rankStyle ? (
                      <span className="text-lg">{rankStyle.icon}</span>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${highlight ? 'text-primary' : 'text-foreground'}`}>
                      {highlight ? 'You' : entry.phone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.surveys_completed} surveys · {entry.referral_count} referrals
                    </p>
                  </div>

                  {/* Stat */}
                  <div className="text-right shrink-0">
                    <p className="font-heading font-bold text-sm">
                      {tab === 'earners'
                        ? `KSh ${entry.total_earned.toLocaleString()}`
                        : `${entry.surveys_completed} surveys`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
