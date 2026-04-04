import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  phone: string;
  status: string;
  created_at: string;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setWithdrawals(data);
    setLoading(false);
  };

  useEffect(() => { fetchWithdrawals(); }, []);

  const updateStatus = async (id: string, status: string, userId: string, amount: number) => {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update withdrawal');
      return;
    }

    // If rejected, refund the balance
    if (status === 'rejected') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
      if (profile) {
        await supabase
          .from('profiles')
          .update({ balance: profile.balance + amount })
          .eq('id', userId);
      }
    }

    toast.success(`Withdrawal ${status}`);
    fetchWithdrawals();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-primary';
      case 'processing': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-destructive';
      case 'failed': return 'bg-destructive';
      default: return '';
    }
  };

  if (loading) return <p className="text-muted-foreground animate-pulse">Loading withdrawals...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Withdrawals</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {withdrawals.filter(w => w.status === 'pending').length} pending approvals
        </p>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{w.phone}</td>
                  <td className="p-4 text-right font-bold">KSh {w.amount.toLocaleString()}</td>
                  <td className="p-4">
                    <Badge variant={w.status === 'pending' ? 'secondary' : 'default'} className={statusColor(w.status)}>
                      {w.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(w.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 text-right">
                    {w.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => updateStatus(w.id, 'completed', w.user_id, w.amount)}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(w.id, 'rejected', w.user_id, w.amount)}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No withdrawals yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
