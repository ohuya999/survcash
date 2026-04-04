import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, ClipboardCheck, Shield } from 'lucide-react';

const features = [
  {
    icon: ClipboardCheck,
    title: 'Daily Surveys',
    description: 'Complete one simple survey per weekday and earn KSh 50 daily.',
  },
  {
    icon: DollarSign,
    title: 'Easy Withdrawals',
    description: 'Withdraw your earnings via M-Pesa once you reach KSh 1,000.',
  },
  {
    icon: Users,
    title: 'Referral Bonus',
    description: 'Invite friends and unlock withdrawal access with 4 referrals.',
  },
  {
    icon: Shield,
    title: 'Secure & Trusted',
    description: 'Your data and earnings are protected with bank-level security.',
  },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 py-20 md:py-32 text-center">
          <h1 className="font-heading text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Earn Money with <span className="text-secondary">SURVCASH</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 opacity-90">
            Complete daily surveys and earn KSh 50 every weekday. Simple, fast, and reliable income — right from your phone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="btn-gold text-lg px-8 py-6 rounded-xl font-bold">
                Get Started — KSh 200
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Join thousands of Kenyans earning daily income through simple surveys.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card-elevated p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-7 h-7 text-accent-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">
            Start Earning Today
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Register with just your phone number, pay a one-time KSh 200 membership fee via M-Pesa, and start earning.
          </p>
          <Link to="/register">
            <Button size="lg" className="btn-primary text-lg px-8 py-6 rounded-xl font-semibold">
              Join SURVCASH Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} SURVCASH. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
