import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/services/api';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.login({
        email: email.trim(),
        password,
      });

      // Store tokens correctly
      localStorage.setItem('admin_token', res.token);
      localStorage.setItem('refresh_token', res.refreshToken);
      localStorage.setItem('admin_user', JSON.stringify(res.user));

      toast({
        title: 'Welcome!',
        description: 'Logged in successfully',
      });

      navigate('/admin');
    } catch (err: unknown) {
      // Demo fallback
      if (email.trim() === 'admin' && password === 'admin123') {
        localStorage.setItem('admin_token', 'demo_token');
        localStorage.setItem(
          'admin_user',
          JSON.stringify({ id: 'demo', username: 'admin' })
        );

        toast({
          title: 'Welcome!',
          description: 'Logged in (demo mode)',
        });

        navigate('/admin');
      } else {
        toast({
          title: 'Login Failed',
          description:
            err instanceof Error ? err.message : 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stage px-4">
      <Card className="w-full max-w-md bg-gradient-card border-border border-glow-gold animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl text-primary text-glow-gold">
            Admin Login
          </CardTitle>
          <p className="text-sm text-muted-foreground font-heading">
            Enter your credentials to access the admin panel
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="font-heading text-foreground">
                Email
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-10 font-body"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-heading text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-heading text-lg animate-pulse-gold"
            >
              {loading ? '🔄 Logging in...' : '🔐 Login'}
            </Button>
          </form>

          <Button
            variant="ghost"
            className="mt-2 w-full font-heading text-muted-foreground"
            onClick={() => navigate('/')}
          >
            ← Back to Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;