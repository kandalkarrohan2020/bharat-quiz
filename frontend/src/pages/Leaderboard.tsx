import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/data/quizData';
import { gameApi, LeaderboardEntry } from '@/services/api';
import { Trophy, ArrowLeft, Medal, Mail, RefreshCw, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const rankEmoji = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

const difficultyBadgeClass = (d: string) => {
  if (d === 'easy')   return 'bg-correct/20 text-correct border-correct/30';
  if (d === 'medium') return 'bg-timer-warning/20 text-timer-warning border-timer-warning/30';
  return 'bg-destructive/20 text-destructive border-destructive/30';
};

const DEMO_DATA: LeaderboardEntry[] = [
  { rank: 1, playerName: 'Arjun Sharma',  score: 10, totalQuestions: 10, percentage: 100, difficulty: 'hard',   title: 'Maharishi', completedAt: new Date().toISOString() },
  { rank: 2, playerName: 'Priya Patel',   score: 9,  totalQuestions: 10, percentage: 90,  difficulty: 'hard',   title: 'Pandit',    completedAt: new Date().toISOString() },
  { rank: 3, playerName: 'Rahul Verma',   score: 8,  totalQuestions: 10, percentage: 80,  difficulty: 'medium', title: 'Vidwan',    completedAt: new Date().toISOString() },
  { rank: 4, playerName: 'Sneha Gupta',   score: 7,  totalQuestions: 10, percentage: 70,  difficulty: 'medium', title: 'Scholar',   completedAt: new Date().toISOString() },
  { rank: 5, playerName: 'Amit Kumar',    score: 6,  totalQuestions: 10, percentage: 60,  difficulty: 'easy',   title: 'Learner',   completedAt: new Date().toISOString() },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const Leaderboard = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────
  const [categoryFilter,   setCategoryFilter]   = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [entries,          setEntries]          = useState<LeaderboardEntry[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [isAdmin,          setIsAdmin]          = useState(false);

  // Check admin status once on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    setIsAdmin(!!token);
  }, []);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const cat  = categoryFilter   !== 'all' ? categoryFilter   : undefined;
      const diff = difficultyFilter !== 'all' ? difficultyFilter : undefined;

      // If admin token present use admin endpoint (returns email)
      const data = isAdmin
        ? await gameApi.getLeaderboardAdmin(cat, diff)
        : await gameApi.getLeaderboard(cat, diff);

      setEntries(data.length > 0 ? data : DEMO_DATA);
    } catch {
      // Fallback to demo data when API is not reachable
      setEntries(DEMO_DATA);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, difficultyFilter, isAdmin]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  const top3 = entries.slice(0, 3);

  return (
    <div className="min-h-screen bg-stage">

      {/* ── Header ── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground">Worldwide Rankings</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Badge variant="outline" className="font-heading text-xs text-primary border-primary/40 gap-1">
                <Mail className="h-3 w-3" /> Admin View
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchLeaderboard}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground"
              title="Refresh"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 font-heading">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌐 All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-40 font-heading">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">🟢 Easy</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="hard">🔴 Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Top 3 Podium ── */}
        {!loading && top3.length >= 3 && (
          <div className="grid grid-cols-3 gap-4">
            {/* Podium order: 2nd | 1st | 3rd */}
            {[top3[1], top3[0], top3[2]].map((entry, idx) => {
              const podiumRank = [2, 1, 3][idx];
              const isFirst    = podiumRank === 1;
              return (
                <Card
                  key={podiumRank}
                  className={`bg-gradient-card border-border text-center ${isFirst ? 'pt-0 border-glow-gold' : 'pt-6'}`}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="text-3xl mb-1">{rankEmoji(podiumRank)}</div>
                    <p className="font-heading font-bold text-foreground truncate">{entry.playerName}</p>
                    {isAdmin && entry.playerEmail && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.playerEmail}</p>
                    )}
                    <p className="text-2xl font-display font-bold text-primary">{entry.percentage}%</p>
                    <p className="text-xs text-muted-foreground font-heading">
                      {entry.score}/{entry.totalQuestions} • {entry.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-1 text-xs font-heading capitalize ${difficultyBadgeClass(entry.difficulty)}`}
                    >
                      {entry.difficulty}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Full Rankings Table ── */}
        <Card className="bg-gradient-card border-border overflow-hidden">
          <CardHeader>
            <CardTitle className="font-display text-foreground flex items-center gap-2">
              <Medal className="h-5 w-5 text-primary" /> Rankings
              {isAdmin && (
                <span className="ml-auto text-xs font-heading font-normal text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email visible (admin only)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground font-heading">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading rankings…
              </div>
            ) : entries.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground font-heading">
                No rankings yet. Be the first to play!
              </div>
            ) : (
              <div className="divide-y divide-border">
                {entries.map((entry, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-6 py-3 transition-colors hover:bg-primary/5 ${i < 3 ? 'bg-primary/5' : ''}`}
                  >
                    {/* Rank */}
                    <div className="w-10 text-center font-display font-bold text-lg text-primary shrink-0">
                      {rankEmoji(entry.rank)}
                    </div>

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-foreground truncate">
                        {entry.playerName}
                      </p>
                      {/* Email — admin only */}
                      {isAdmin && entry.playerEmail && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 shrink-0" />
                          {entry.playerEmail}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-heading">{entry.title}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs font-heading capitalize py-0 px-1.5 ${difficultyBadgeClass(entry.difficulty)}`}
                        >
                          {entry.difficulty}
                        </Badge>
                        {entry.categoryName && (
                          <span className="text-xs text-muted-foreground font-heading hidden sm:inline">
                            • {entry.categoryName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <p className="font-display font-bold text-primary">{entry.percentage}%</p>
                      <p className="text-xs text-muted-foreground">{entry.score}/{entry.totalQuestions}</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        {new Date(entry.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default Leaderboard;