import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface Profile {
  id: string;
  phone: string;
  balance: number;
  referral_count: number;
  referral_code: string;
  is_paid: boolean;
  last_survey_date: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setUsers(data);
        setLoading(false);
      });
  }, []);

  const filtered = users.filter(u =>
    u.phone.includes(search) || u.referral_code.includes(search)
  );

  if (loading) return <p className="text-muted-foreground animate-pulse">Loading users...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Users</h2>
        <p className="text-muted-foreground text-sm mt-1">{users.length} registered users</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by phone or referral code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Balance</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Referrals</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Ref Code</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Last Survey</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{u.phone || '—'}</td>
                  <td className="p-4">
                    <Badge variant={u.is_paid ? 'default' : 'secondary'} className={u.is_paid ? 'bg-primary' : ''}>
                      {u.is_paid ? 'Active' : 'Unpaid'}
                    </Badge>
                  </td>
                  <td className="p-4 text-right font-medium">KSh {u.balance.toLocaleString()}</td>
                  <td className="p-4 text-right">{u.referral_count}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{u.referral_code}</td>
                  <td className="p-4 text-muted-foreground">
                    {u.last_survey_date
                      ? new Date(u.last_survey_date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
                      : '—'}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
