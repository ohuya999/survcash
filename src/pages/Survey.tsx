import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Question {
  id: string;
  question: string;
  options: string[];
  category: string;
}

const QUESTIONS_PER_SURVEY = 5;

export default function Survey() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    // Fetch random questions
    supabase
      .from('survey_questions')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Shuffle and pick N questions
          const shuffled = data.sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_SURVEY);
          setQuestions(shuffled.map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          })));
        }
        setLoading(false);
      });
  }, [user, navigate]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const isLast = currentIndex === questions.length - 1;

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
  };

  const handleNext = () => {
    if (!selectedOption || !currentQuestion) return;

    const newAnswers = { ...answers, [currentQuestion.id]: selectedOption };
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (isLast) {
      handleSubmit(newAnswers);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = async (finalAnswers: Record<string, string>) => {
    if (!user || !profile) return;
    setSubmitting(true);

    try {
      const now = new Date().toISOString();
      const answersArray = Object.entries(finalAnswers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer,
      }));

      await supabase.from('survey_completions').insert({
        user_id: user.id,
        completed_at: now,
        amount: 50,
        answers: answersArray,
      });

      await supabase
        .from('profiles')
        .update({
          balance: profile.balance + 50,
          last_survey_date: now,
        })
        .eq('id', user.id);

      await refreshProfile();
      setCompleted(true);
      toast.success('Survey completed! KSh 50 added to your balance.');
    } catch {
      toast.error('Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading survey...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="card-elevated p-8 max-w-md text-center">
          <h2 className="font-heading text-xl font-bold mb-3">No Surveys Available</h2>
          <p className="text-muted-foreground mb-6">Check back later for new surveys.</p>
          <Button onClick={() => navigate('/dashboard')} className="btn-primary rounded-xl">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="card-elevated p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">Survey Complete!</h2>
          <p className="text-muted-foreground mb-2">
            You answered {questions.length} questions.
          </p>
          <p className="text-lg font-bold text-primary mb-6">KSh 50 added to your balance</p>
          <Button onClick={() => navigate('/dashboard')} className="btn-primary rounded-xl px-8 py-5 font-semibold">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Exit
            </Button>
            <span className="text-sm font-medium opacity-80">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-primary-foreground/20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Category badge */}
        <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium capitalize mb-4">
          {currentQuestion.category}
        </span>

        {/* Question */}
        <h2 className="font-heading text-xl md:text-2xl font-bold mb-8">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleSelectOption(option)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                selectedOption === option
                  ? 'border-primary bg-accent text-accent-foreground shadow-sm'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  selectedOption === option
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Next button */}
        <Button
          className="w-full btn-primary rounded-xl py-5 text-base font-semibold"
          disabled={!selectedOption || submitting}
          onClick={handleNext}
        >
          {submitting ? 'Submitting...' : isLast ? 'Submit Survey' : 'Next Question'}
          {!isLast && !submitting && <ChevronRight className="w-5 h-5 ml-1" />}
        </Button>

        {/* Reward reminder */}
        <p className="text-center text-muted-foreground text-xs mt-4">
          Complete all {questions.length} questions to earn <strong className="text-primary">KSh 50</strong>
        </p>
      </main>
    </div>
  );
}
