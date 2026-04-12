import { useState } from 'react';
import { useGame } from '@/context/GameContext';

const WelcomeScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const { setPlayerInfo } = useGame();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canStart = name.trim().length >= 2 && isEmailValid;

  const handleStart = () => {
    if (canStart) {
      setPlayerInfo(name.trim(), email.trim(), contact.trim());
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl animate-fade-in text-center">
        {/* Logo / Title */}
        <div className="mb-8">
          <div className="mb-4 text-6xl">🇮🇳</div>
          <h1 className="font-display text-4xl font-bold text-primary text-glow-gold md:text-5xl">
            BHARAT QUIZ
          </h1>
          <p className="mt-2 font-heading text-xl text-muted-foreground">
            The Ultimate Indian Knowledge Challenge
          </p>
        </div>

        {/* Decorative divider */}
        <div className="mx-auto mb-8 flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary" />
          <span className="text-primary">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary" />
        </div>

        {/* Input card */}
        <div className="rounded-xl border border-border bg-card p-8 border-glow-gold animate-scale-in">
          <p className="mb-6 font-heading text-lg text-foreground">
            Enter your details to begin the challenge
          </p>
          <input
            type="text"
            placeholder="Full Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border bg-secondary px-4 py-2 text-center font-heading text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="email"
            placeholder="Email Address *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border bg-secondary px-4 py-2 text-center font-heading text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full rounded-lg bg-primary px-8 py-3 font-heading text-lg font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed animate-pulse-gold"
          >
            🎯 Start Challenge
          </button>
          {email && !isEmailValid && (
            <p className="mt-2 text-sm text-destructive font-heading">Please enter a valid email address</p>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Test your knowledge across History, Culture, Science, Sports & Entertainment
          </p>
          <a href="/leaderboard" className="text-sm text-primary font-heading hover:underline">
            🏆 View Worldwide Rankings
          </a>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
