import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

type Business = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedBusiness, setSelectedBusiness] =
    useState<Business | null>(null);

  useEffect(() => {
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);

        if (newSession) {
          await loadBusinesses();
        } else {
          setBusinesses([]);
          setSelectedBusiness(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      setError(error.message);
    }

    setSession(data.session);
    setLoading(false);

    if (data.session) {
      await loadBusinesses();
    }
  }

  async function loadBusinesses() {
    setLoadingBusinesses(true);
    setError('');

    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setBusinesses(data || []);
    }

    setLoadingBusinesses(false);
  }

  async function createBusiness(e: React.FormEvent) {
    e.preventDefault();

    const name = businessName.trim();

    if (!name) {
      setError('Please enter a business name.');
      return;
    }

    setCreating(true);
    setError('');

    const { data, error } = await supabase.rpc(
      'create_business',
      {
        business: name,
      }
    );

    if (error) {
      setError(error.message);
    } else {
      setBusinessName('');
      setShowCreate(false);

      await loadBusinesses();

      console.log('Created business:', data);
    }

    setCreating(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function openBusiness(business: Business) {
    setSelectedBusiness(business);
    setError('');
  }

  function closeBusiness() {
    setSelectedBusiness(null);
    setError('');
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand">
            Jabang<span>Store</span>
          </div>

          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand">
            Jabang<span>Store</span>
          </div>

          <p className="subtitle">
            Retail management & POS
          </p>

          <h1>Welcome back</h1>

          <p className="description">
            Sign in to your JabangStore account.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();

              setError('');

              const emailInput = e.currentTarget.elements.namedItem(
                'email'
              ) as HTMLInputElement;

              const passwordInput =
                e.currentTarget.elements.namedItem(
                  'password'
                ) as HTMLInputElement;

              if (
                !emailInput.value ||
                !passwordInput.value
              ) {
                setError(
                  'Please enter your email and password.'
                );
                return;
              }

              const { error } =
                await supabase.auth.signInWithPassword({
                  email: emailInput.value.trim(),
                  password: passwordInput.value,
                });

              if (error) {
                setError(error.message);
              }
            }}
          >
            <label>Email address</label>

            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
            />

            <label>Password</label>

            <input
              name="password"
              type="password"
              placeholder="Enter your password"
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
            >
              Sign in
            </button>
          </form>

          <div className="security-note">
            🔒 Secure authentication powered by Supabase
          </div>
        </div>
      </div>
    );
  }

  /*
   * BUSINESS MANAGEMENT SCREEN
   */
  if (selectedBusiness) {
    return (
      <div className="dashboard-page">

        <header className="topbar">
          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>

            <small>
              Super Admin Console
            </small>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </header>

        <main className="admin-content">

          <button
            className="secondary-button"
            onClick={closeBusiness}
          >
            ← Back to Businesses
          </button>

          <section className="admin-header">
            <div>
              <span className="status">
                ● {selectedBusiness.status}
              </span>

              <h1>
                {selectedBusiness.name}
              </h1>

              <p>
                Business management
              </p>
            </div>
          </section>

          <section className="business-section">

            <div className="create-business-card">

              <h2>
                Business Overview
              </h2>

              <p>
                Manage this business from the
                JabangStore platform.
              </p>

              <div className="business-info">

                <h3>
                  {selectedBusiness.name}
                </h3>

                <span className="business-status">
                  {selectedBusiness.status}
                </span>

                <p>
                  Created{' '}
                  {new Date(
                    selectedBusiness.created_at
                  ).toLocaleDateString()}
                </p>

              </div>

              <div className="form-actions">

                <button
                  className="secondary-button"
                  onClick={closeBusiness}
                >
                  Back
                </button>

              </div>

            </div>

            <div className="create-business-card">

              <h2>
                Business Modules
              </h2>

              <p>
                These modules will be connected to
                this business as we complete the
                JabangStore platform.
              </p>

              <div className="business-grid">

                <article className="business-card">
                  <div className="business-icon">
                    📊
                  </div>

                  <div className="business-info">
                    <h3>
                      Dashboard
                    </h3>

                    <p>
                      Business performance and
                      key information.
                    </p>
                  </div>
                </article>

                <article className="business-card">
                  <div className="business-icon">
                    📦
                  </div>

                  <div className="business-info">
                    <h3>
                      Products & Inventory
                    </h3>

                    <p>
                      Products, stock and inventory
                      management.
                    </p>
                  </div>
                </article>

                <article className="business-card">
                  <div className="business-icon">
                    🛒
                  </div>

                  <div className="business-info">
                    <h3>
                      POS
                    </h3>

                    <p>
                      Sales and checkout management.
                    </p>
                  </div>
                </article>

                <article className="business-card">
                  <div className="business-icon">
                    👥
                  </div>

                  <div className="business-info">
                    <h3>
                      Customers
                    </h3>

                    <p>
                      Customer records and activity.
                    </p>
                  </div>
                </article>

              </div>

            </div>

          </section>

        </main>

      </div>
    );
  }

  /*
   * SUPER ADMIN DASHBOARD
   */
  return (
    <div className="dashboard-page">

      <header className="topbar">

        <div>
          <div className="brand">
            Jabang<span>Store</span>
          </div>

          <small>
            Super Admin Console
          </small>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Sign out
        </button>

      </header>

      <main className="admin-content">

        <section className="admin-header">

          <div>

            <span className="status">
              ● Super Admin
            </span>

            <h1>
              Business Management
            </h1>

            <p>
              Manage businesses using JabangStore.
            </p>

          </div>

          <button
            className="primary-button"
            onClick={() => {
              setShowCreate(!showCreate);
              setError('');
            }}
          >
            + Create Business
          </button>

        </section>

        {showCreate && (
          <section className="create-business-card">

            <h2>
              Create a new business
            </h2>

            <p>
              New businesses start completely blank.
            </p>

            <form onSubmit={createBusiness}>

              <label>
                Business name
              </label>

              <input
                type="text"
                placeholder="e.g. Jabang Supermarket"
                value={businessName}
                onChange={(e) =>
                  setBusinessName(e.target.value)
                }
              />

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowCreate(false);
                    setBusinessName('');
                    setError('');
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={creating}
                >
                  {creating
                    ? 'Creating...'
                    : 'Create Business'}
                </button>

              </div>

            </form>

          </section>
        )}

        <section className="business-section">

          <div className="section-title">

            <div>

              <h2>
                Businesses
              </h2>

              <p>
                {businesses.length} business
                {businesses.length === 1
                  ? ''
                  : 'es'}
              </p>

            </div>

            <button
              className="refresh-button"
              onClick={loadBusinesses}
              disabled={loadingBusinesses}
            >
              {loadingBusinesses
                ? 'Refreshing...'
                : 'Refresh'}
            </button>

          </div>

          {error && !showCreate && (
            <div className="error">
              {error}
            </div>
          )}

          {loadingBusinesses ? (
            <div className="empty-card">
              Loading businesses...
            </div>
          ) : businesses.length === 0 ? (
            <div className="empty-card">

              <div className="empty-icon">
                🏢
              </div>

              <h3>
                No businesses yet
              </h3>

              <p>
                Create your first business to
                get started.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setShowCreate(true)
                }
              >
                + Create Business
              </button>

            </div>
          ) : (
            <div className="business-grid">

              {businesses.map((business) => (
                <article
                  className="business-card"
                  key={business.id}
                >

                  <div className="business-icon">
                    🏢
                  </div>

                  <div className="business-info">

                    <h3>
                      {business.name}
                    </h3>

                    <span className="business-status">
                      {business.status}
                    </span>

                    <p>
                      Created{' '}
                      {new Date(
                        business.created_at
                      ).toLocaleDateString()}
                    </p>

                  </div>

                  <button
                    className="view-button"
                    onClick={() =>
                      openBusiness(business)
                    }
                  >
                    Manage
                  </button>

                </article>
              ))}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}
