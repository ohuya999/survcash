import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Users, AlertCircle } from 'lucide-react';

export default function Fees() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>

        <h1 className="font-heading text-3xl font-bold mb-2">Fees & Conditions</h1>
        <p className="text-muted-foreground mb-8">Transparent pricing and requirements for SURVCASH.</p>

        <div className="space-y-6">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-lg">Membership Fee</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              A one-time fee of <strong className="text-foreground">KSh 200</strong> is required to activate your account.
              This is paid via M-Pesa STK Push during registration.
            </p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-lg">Withdrawal Conditions</h2>
            </div>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li>• Minimum balance: <strong className="text-foreground">KSh 1,000</strong></li>
              <li>• Minimum referrals: <strong className="text-foreground">4 active referrals</strong></li>
              <li>• Withdrawals are processed via M-Pesa B2C</li>
            </ul>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-secondary" />
              <h2 className="font-heading font-semibold text-lg">Earning Rate</h2>
            </div>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li>• <strong className="text-foreground">KSh 50</strong> per completed survey</li>
              <li>• One survey per weekday (Monday–Friday)</li>
              <li>• Maximum <strong className="text-foreground">KSh 1,000</strong> per month (~20 weekdays)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
