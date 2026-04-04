import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SurveyRecord {
  id: string;
  user_id: string;
  completed_at: string;
  amount: number;
  phone?: string;
}

export default function AdminSurveys() {
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: surveyData } = await supabase
        .from('survey_completions')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(100);

      if (surveyData) {
        // Fetch user phones
        const userIds = [...new Set(surveyData.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, phone')
          .in('id', userIds);

        const phoneMap: Record<string, string> = {};
        profiles?.forEach(p => { phoneMap[p.id] = p.phone; });

        setSurveys(surveyData.map(s => ({ ...s, phone: phoneMap[s.user_id] || '—' })));
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const totalEarnings = surveys.reduce((sum, s) => sum + s.amount, 0);

  if (loading) return <p className="text-muted-foreground animate-pulse">Loading surveys...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Survey Completions</h2>
          <p className="text-muted-foreground text-sm mt-1">{surveys.length} completions shown</p>
        </div>
        <div className="stat-card px-6 py-3">
          <p className="text-xs text-muted-foreground">Total Paid Out</p>
          <p className="font-heading text-xl font-bold">KSh {totalEarnings.toLocaleString()}</p>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">User Phone</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Completed At</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{s.phone}</td>
                  <td className="p-4 text-right font-bold">KSh {s.amount}</td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(s.completed_at).toLocaleDateString('en-KE', {
                      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
              {surveys.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">No surveys completed yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
