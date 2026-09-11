import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoggingIn(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
    }

    setLoggingIn(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand">Jabang<span>Store</span></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand">Jabang<span>Store</span></div>

          <p className="subtitle">
            Retail management & POS
          </p>

          <h1>Welcome back</h1>

          <p className="description">
            Sign in to your JabangStore account.
          </p>

          <form onSubmit={handleLogin}>
            <label>Email address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && (
              <div className="error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loggingIn}
            >
              {loggingIn ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="security-note">
            🔒 Secure authentication powered by Supabase
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="topbar">
        <div>
          <div className="brand">
            Jabang<span>Store</span>
          </div>

          <small>Retail management & POS</small>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </header>

      <main className="dashboard-content">
        <div className="welcome-card">
          <span className="status">● Online</span>

          <h1>Authentication connected</h1>

          <p>
            You are successfully signed in to JabangStore.
          </p>

          <div className="user-box">
            <strong>Signed-in account</strong>
            <span>{session.user.email}</span>
          </div>
        </div>

        <div className="next-card">
          <h2>JabangStore</h2>

          <p>
            Your secure foundation is being built.
            Products, inventory, customers, POS, reports,
            business management and other modules will be
            connected step-by-step.
          </p>
        </div>
      </main>
    </div>
  );
}
