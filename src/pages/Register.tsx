import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Register() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const referralCode = searchParams.get('ref') || '';

  const validatePhone = (p: string) => /^2547\d{8}$/.test(p);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(phone)) {
      toast.error('Enter a valid phone number (2547XXXXXXXX)');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Use phone as email for Supabase auth
      const email = `${phone}@survcash.app`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { phone, referral_code_used: referralCode },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success('M-Pesa STK Push sent to ' + phone, {
          description: 'Enter your M-Pesa PIN to pay KSh 200',
        });

        // Call STK Push edge function
        const { data: stkResult, error: stkError } = await supabase.functions.invoke('mpesa-stk-push', {
          body: { phone, amount: 200, userId: data.user.id },
        });

        if (stkError) throw stkError;

        // Handle referral
        if (referralCode) {
          await supabase.rpc('increment_referral', { ref_code: referralCode });
        }

        if (stkResult?.simulated) {
          toast.success('Payment confirmed! Account activated.');
        } else {
          toast.success('Check your phone and enter your M-Pesa PIN to complete payment.');
        }
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <div className="card-elevated p-8">
          <div className="text-center mb-8">
            <h1 className="font-heading text-2xl font-bold text-foreground">Join SURVCASH</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Pay KSh 200 via M-Pesa to activate your account
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phone"
                placeholder="2547XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5"
                maxLength={12}
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>
            {referralCode && (
              <p className="text-sm text-primary font-medium">
                Referral code: {referralCode}
              </p>
            )}
            <Button type="submit" className="w-full btn-primary py-5 text-base font-semibold rounded-xl" disabled={loading}>
              {loading ? 'Processing...' : 'Register & Pay KSh 200'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
