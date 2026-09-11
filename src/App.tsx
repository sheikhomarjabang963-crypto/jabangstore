import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

type Business = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

type BusinessUser = {
  id: string;
  email: string;
};

type BusinessMembership = {
  business_id: string;
  role: string;
  business: {
    id: string;
    name: string;
    status: string;
  } | null;
};

type DashboardStats = {
  products: number;
  customers: number;
  sales: number;
  lowStock: number;
  todaySales: number;
};

type RecentSale = {
  id: string;
  total: number;
  created_at: string;
};

type LowStockProduct = {
  id: string;
  name: string;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
};

type OwnerPage =
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'pos'
  | 'customers'
  | 'reports'
  | 'settings';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  const [users, setUsers] = useState<BusinessUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedBusiness, setSelectedBusiness] =
    useState<Business | null>(null);

  const [selectedOwner, setSelectedOwner] =
    useState('');

  const [assigningOwner, setAssigningOwner] =
    useState(false);

  const [ownerBusiness, setOwnerBusiness] =
    useState<BusinessMembership | null>(null);

  const [ownerPage, setOwnerPage] =
    useState<OwnerPage>('dashboard');

  const [ownerLoading, setOwnerLoading] =
    useState(false);

  const [stats, setStats] =
    useState<DashboardStats>({
      products: 0,
      customers: 0,
      sales: 0,
      lowStock: 0,
      todaySales: 0,
    });

  const [recentSales, setRecentSales] =
    useState<RecentSale[]>([]);

  const [lowStockProducts, setLowStockProducts] =
    useState<LowStockProduct[]>([]);

  useEffect(() => {
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);

        if (newSession) {
          await loadBusinesses();
          await loadUsers();
          await loadOwnerBusiness(newSession.user.id);
        } else {
          setBusinesses([]);
          setUsers([]);
          setSelectedBusiness(null);
          setOwnerBusiness(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadSession() {
    const { data, error } =
      await supabase.auth.getSession();

    if (error) {
      setError(error.message);
    }

    setSession(data.session);
    setLoading(false);

    if (data.session) {
      await loadBusinesses();
      await loadUsers();
      await loadOwnerBusiness(
        data.session.user.id
      );
    }
  }

  async function loadBusinesses() {
    setLoadingBusinesses(true);
    setError('');

    const { data, error } = await supabase
      .from('businesses')
      .select(
        'id, name, status, created_at'
      )
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      setError(error.message);
    } else {
      setBusinesses(data || []);
    }

    setLoadingBusinesses(false);
  }

  async function loadUsers() {
    setLoadingUsers(true);

    const { data, error } =
      await supabase.rpc(
        'get_business_users'
      );

    if (error) {
      setError(error.message);
    } else {
      setUsers(data || []);
    }

    setLoadingUsers(false);
  }

  async function loadOwnerBusiness(
    userId: string
  ) {
    setOwnerLoading(true);

    const { data, error } =
      await supabase
        .from('business_members')
        .select(
          `
          business_id,
          role,
          business:businesses (
            id,
            name,
            status
          )
          `
        )
        .eq('user_id', userId)
        .eq('role', 'owner')
        .limit(1)
        .maybeSingle();

    if (error) {
      console.error(
        'Owner business lookup:',
        error.message
      );
      setOwnerBusiness(null);
    } else {
      setOwnerBusiness(
        data as BusinessMembership | null
      );
    }

    setOwnerLoading(false);

    if (data?.business_id) {
      await loadOwnerDashboard(
        data.business_id
      );
    }
  }

  async function loadOwnerDashboard(
    businessId: string
  ) {
    setOwnerLoading(true);
    setError('');

    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).toISOString();

      const [
        productsResult,
        customersResult,
        salesResult,
        inventoryResult,
        todaySalesResult,
        recentSalesResult,
      ] = await Promise.all([
        supabase
          .from('products')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq(
            'business_id',
            businessId
          ),

        supabase
          .from('customers')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq(
            'business_id',
            businessId
          ),

        supabase
          .from('sales')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq(
            'business_id',
            businessId
          ),

        supabase
          .from('inventory')
          .select(
            `
            product_id,
            quantity,
            product:products (
              id,
              name,
              selling_price,
              low_stock_threshold
            )
            `
          )
          .eq(
            'business_id',
            businessId
          ),

        supabase
          .from('sales')
          .select(
            'total'
          )
          .eq(
            'business_id',
            businessId
          )
          .gte(
            'created_at',
            startOfDay
          ),

        supabase
          .from('sales')
          .select(
            'id, total, created_at'
          )
          .eq(
            'business_id',
            businessId
          )
          .order(
            'created_at',
            {
              ascending: false,
            }
          )
          .limit(5),
      ]);

      if (productsResult.error)
        throw productsResult.error;

      if (customersResult.error)
        throw customersResult.error;

      if (salesResult.error)
        throw salesResult.error;

      if (inventoryResult.error)
        throw inventoryResult.error;

      if (todaySalesResult.error)
        throw todaySalesResult.error;

      if (recentSalesResult.error)
        throw recentSalesResult.error;

      const inventoryRows =
        inventoryResult.data || [];

      const lowStockRows =
        inventoryRows.filter(
          (item: any) =>
            item.product &&
            Number(item.quantity) <=
              Number(
                item.product
                  .low_stock_threshold
              )
        );

      const todayTotal =
        (todaySalesResult.data || []).reduce(
          (
            sum: number,
            sale: any
          ) =>
            sum + Number(sale.total || 0),
          0
        );

      setStats({
        products:
          productsResult.count || 0,
        customers:
          customersResult.count || 0,
        sales:
          salesResult.count || 0,
        lowStock:
          lowStockRows.length,
        todaySales:
          todayTotal,
      });

      setRecentSales(
        recentSalesResult.data || []
      );

      setLowStockProducts(
        lowStockRows.map(
          (item: any) => ({
            id:
              item.product.id,
            name:
              item.product.name,
            selling_price:
              Number(
                item.product
                  .selling_price
              ),
            quantity:
              Number(
                item.quantity
              ),
            low_stock_threshold:
              Number(
                item.product
                  .low_stock_threshold
              ),
          })
        )
      );
    } catch (dashboardError: any) {
      setError(
        dashboardError?.message ||
          'Unable to load dashboard data.'
      );
    }

    setOwnerLoading(false);
  }

  async function createBusiness(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const name =
      businessName.trim();

    if (!name) {
      setError(
        'Please enter a business name.'
      );
      return;
    }

    setCreating(true);
    setError('');

    const { data, error } =
      await supabase.rpc(
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

      console.log(
        'Created business:',
        data
      );
    }

    setCreating(false);
  }

  async function assignOwner() {
    if (!selectedBusiness) {
      return;
    }

    if (!selectedOwner) {
      setError(
        'Please select a business owner.'
      );
      return;
    }

    setAssigningOwner(true);
    setError('');

    const { error } =
      await supabase.rpc(
        'assign_business_owner',
        {
          target_business_id:
            selectedBusiness.id,
          target_user_id:
            selectedOwner,
        }
      );

    if (error) {
      setError(error.message);
    } else {
      setError('');

      alert(
        'Business owner assigned successfully.'
      );

      setSelectedOwner('');

      if (session?.user?.id) {
        await loadOwnerBusiness(
          session.user.id
        );
      }
    }

    setAssigningOwner(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function openBusiness(
    business: Business
  ) {
    setSelectedBusiness(business);
    setSelectedOwner('');
    setError('');
  }

  function closeBusiness() {
    setSelectedBusiness(null);
    setSelectedOwner('');
    setError('');
  }

  function openOwnerPage(
    page: OwnerPage
  ) {
    setOwnerPage(page);
    setError('');

    if (
      page === 'dashboard' &&
      ownerBusiness?.business_id
    ) {
      loadOwnerDashboard(
        ownerBusiness.business_id
      );
    }
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

          <h1>
            Welcome back
          </h1>

          <p className="description">
            Sign in to your JabangStore
            account.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();

              setError('');

              const emailInput =
                e.currentTarget.elements
                  .namedItem(
                    'email'
                  ) as HTMLInputElement;

              const passwordInput =
                e.currentTarget.elements
                  .namedItem(
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
                await supabase.auth
                  .signInWithPassword({
                    email:
                      emailInput.value.trim(),
                    password:
                      passwordInput.value,
                  });

              if (error) {
                setError(
                  error.message
                );
              }
            }}
          >

            <label>
              Email address
            </label>

            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
            />

            <label>
              Password
            </label>

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
            🔒 Secure authentication
            powered by Supabase
          </div>

        </div>
      </div>
    );
  }

  /*
   * BUSINESS OWNER APPLICATION
   */

  if (
    ownerBusiness &&
    ownerBusiness.role === 'owner'
  ) {
    const business =
      ownerBusiness.business;

    if (!business) {
      return (
        <div className="dashboard-page">
          <header className="topbar">
            <div>
              <div className="brand">
                Jabang<span>Store</span>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </header>

          <main className="admin-content">
            <div className="empty-card">
              <h3>
                Business unavailable
              </h3>

              <p>
                Your owner account is
                connected, but the
                business could not be
                loaded.
              </p>
            </div>
          </main>
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

            <small>
              {business.name}
            </small>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <small>
              Business Owner
            </small>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>

        </header>

        <main className="admin-content">

          <section
            className="admin-header"
          >

            <div>
              <span className="status">
                ● {business.status}
              </span>

              <h1>
                {ownerPage ===
                'dashboard'
                  ? 'Dashboard'
                  : ownerPage
                      .charAt(0)
                      .toUpperCase() +
                    ownerPage.slice(1)}
              </h1>

              <p>
                {business.name}
              </p>
            </div>

          </section>

          <div
            className="business-grid"
            style={{
              marginBottom: '24px',
            }}
          >

            {[
              ['dashboard', '📊', 'Dashboard'],
              ['products', '📦', 'Products'],
              ['inventory', '🗃️', 'Inventory'],
              ['pos', '🛒', 'POS'],
              ['customers', '👥', 'Customers'],
              ['reports', '📈', 'Reports'],
              ['settings', '⚙️', 'Settings'],
            ].map(
              ([page, icon, label]) => (
                <button
                  key={page}
                  type="button"
                  className="business-card"
                  onClick={() =>
                    openOwnerPage(
                      page as OwnerPage
                    )
                  }
                  style={{
                    cursor: 'pointer',
                    textAlign: 'left',
                    border: '1px solid #e5e7eb',
                    background: 'white',
                  }}
                >
                  <div className="business-icon">
                    {icon}
                  </div>

                  <div className="business-info">
                    <h3>
                      {label}
                    </h3>

                    <p>
                      Open {label.toLowerCase()}
                    </p>
                  </div>
                </button>
              )
            )}

          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {ownerPage ===
            'dashboard' && (
            <>
              {ownerLoading ? (
                <div className="empty-card">
                  Loading dashboard...
                </div>
              ) : (
                <>
                  <section className="business-grid">

                    <article className="create-business-card">
                      <div className="business-icon">
                        💰
                      </div>

                      <div className="business-info">
                        <h3>
                          Today's Sales
                        </h3>

                        <p
                          style={{
                            fontSize: '24px',
                            fontWeight: 700,
                          }}
                        >
                          GMD{' '}
                          {stats.todaySales.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                      </div>
                    </article>

                    <article className="create-business-card">
                      <div className="business-icon">
                        🧾
                      </div>

                      <div className="business-info">
                        <h3>
                          Total Sales
                        </h3>

                        <p
                          style={{
                            fontSize: '24px',
                            fontWeight: 700,
                          }}
                        >
                          {stats.sales}
                        </p>
                      </div>
                    </article>

                    <article className="create-business-card">
                      <div className="business-icon">
                        📦
                      </div>

                      <div className="business-info">
                        <h3>
                          Products
                        </h3>

                        <p
                          style={{
                            fontSize: '24px',
                            fontWeight: 700,
                          }}
                        >
                          {stats.products}
                        </p>
                      </div>
                    </article>

                    <article className="create-business-card">
                      <div className="business-icon">
                        👥
                      </div>

                      <div className="business-info">
                        <h3>
                          Customers
                        </h3>

                        <p
                          style={{
                            fontSize: '24px',
                            fontWeight: 700,
                          }}
                        >
                          {stats.customers}
                        </p>
                      </div>
                    </article>

                    <article className="create-business-card">
                      <div className="business-icon">
                        ⚠️
                      </div>

                      <div className="business-info">
                        <h3>
                          Low Stock
                        </h3>

                        <p
                          style={{
                            fontSize: '24px',
                            fontWeight: 700,
                          }}
                        >
                          {stats.lowStock}
                        </p>
                      </div>
                    </article>

                  </section>

                  <section className="business-section">

                    <div className="create-business-card">

                      <h2>
                        Recent Sales
                      </h2>

                      {recentSales.length === 0 ? (
                        <div className="empty-card">
                          <h3>
                            No sales yet
                          </h3>

                          <p>
                            Sales will appear
                            here after the POS
                            is connected.
                          </p>
                        </div>
                      ) : (
                        <div>
                          {recentSales.map(
                            (sale) => (
                              <div
                                key={sale.id}
                                style={{
                                  display: 'flex',
                                  justifyContent:
                                    'space-between',
                                  padding:
                                    '14px 0',
                                  borderBottom:
                                    '1px solid #eee',
                                }}
                              >
                                <span>
                                  {new Date(
                                    sale.created_at
                                  ).toLocaleString()}
                                </span>

                                <strong>
                                  GMD{' '}
                                  {Number(
                                    sale.total
                                  ).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </strong>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    </div>

                    <div className="create-business-card">

                      <h2>
                        Low Stock Products
                      </h2>

                      {lowStockProducts.length ===
                      0 ? (
                        <div className="empty-card">
                          <h3>
                            Stock looks good
                          </h3>

                          <p>
                            No products are
                            currently below
                            their low-stock
                            threshold.
                          </p>
                        </div>
                      ) : (
                        <div>
                          {lowStockProducts.map(
                            (product) => (
                              <div
                                key={product.id}
                                style={{
                                  display: 'flex',
                                  justifyContent:
                                    'space-between',
                                  padding:
                                    '14px 0',
                                  borderBottom:
                                    '1px solid #eee',
                                }}
                              >
                                <div>
                                  <strong>
                                    {product.name}
                                  </strong>

                                  <p
                                    style={{
                                      margin:
                                        '4px 0 0',
                                    }}
                                  >
                                    Stock:{' '}
                                    {
                                      product.quantity
                                    }{' '}
                                    · Threshold:{' '}
                                    {
                                      product.low_stock_threshold
                                    }
                                  </p>
                                </div>

                                <span>
                                  GMD{' '}
                                  {product.selling_price.toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    </div>

                  </section>
                </>
              )}
            </>
          )}

          {ownerPage !==
            'dashboard' && (
            <section className="create-business-card">

              <h2>
                {ownerPage
                  .charAt(0)
                  .toUpperCase() +
                  ownerPage.slice(1)}
              </h2>

              <p>
                This module is now part of
                the real business application.
                We will connect its complete
                workflow in the next build
                stage.
              </p>

              <div className="empty-card">
                <h3>
                  Module ready
                </h3>

                <p>
                  Business:
                  {' '}
                  {business.name}
                </p>
              </div>

            </section>
          )}

        </main>

      </div>
    );
  }

  /*
   * BUSINESS MANAGEMENT
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

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <section className="business-section">

            <div className="create-business-card">

              <h2>
                Business Overview
              </h2>

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

            </div>

            <div className="create-business-card">

              <h2>
                Business Owner
              </h2>

              <p>
                Assign an existing JabangStore
                user as the owner of this
                business.
              </p>

              {loadingUsers ? (
                <p>
                  Loading users...
                </p>
              ) : users.length === 0 ? (
                <div className="empty-card">

                  <h3>
                    No users available
                  </h3>

                  <p>
                    Create a user account
                    before assigning an
                    owner.
                  </p>

                </div>
              ) : (
                <>

                  <label>
                    Select business owner
                  </label>

                  <select
                    value={selectedOwner}
                    onChange={(e) =>
                      setSelectedOwner(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select a user
                    </option>

                    {users.map((user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.email}
                      </option>
                    ))}

                  </select>

                  <div className="form-actions">

                    <button
                      className="primary-button"
                      onClick={assignOwner}
                      disabled={
                        assigningOwner ||
                        !selectedOwner
                      }
                    >
                      {assigningOwner
                        ? 'Assigning...'
                        : 'Assign Owner'}
                    </button>

                  </div>

                </>
              )}

            </div>

            <div className="create-business-card">

              <h2>
                Business Modules
              </h2>

              <p>
                The modules below are the
                foundation of the business
                application.
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
                      Business performance
                      and key information.
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
                      Products and stock
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
                      Sales and checkout.
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
                      Customer records.
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
              Manage businesses using
              JabangStore.
            </p>

          </div>

          <button
            className="primary-button"
            onClick={() => {
              setShowCreate(
                !showCreate
              );
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
              New businesses start
              completely blank.
            </p>

            <form
              onSubmit={createBusiness}
            >

              <label>
                Business name
              </label>

              <input
                type="text"
                placeholder="e.g. Jabang Supermarket"
                value={businessName}
                onChange={(e) =>
                  setBusinessName(
                    e.target.value
                  )
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
                {businesses.length}{' '}
                business
                {businesses.length === 1
                  ? ''
                  : 'es'}
              </p>

            </div>

            <button
              className="refresh-button"
              onClick={loadBusinesses}
              disabled={
                loadingBusinesses
              }
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
                Create your first business
                to get started.
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

              {businesses.map(
                (business) => (
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
                        openBusiness(
                          business
                        )
                      }
                    >
                      Manage
                    </button>

                  </article>
                )
              )}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}
