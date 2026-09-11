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
};

type Category = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
};

type Product = {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  selling_price: number;
  cost_price: number;
  low_stock_threshold: number;
  is_active: boolean;
};

type InventoryRow = {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
};

type Branch = {
  id: string;
  business_id: string;
  name: string;
  address: string | null;
  phone: string | null;
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

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [platformRole, setPlatformRole] = useState('user');

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

  const [selectedOwner, setSelectedOwner] = useState('');
  const [assigningOwner, setAssigningOwner] = useState(false);

  const [ownerBusiness, setOwnerBusiness] =
    useState<Business | null>(null);

  const [ownerLoading, setOwnerLoading] = useState(false);

  const [ownerPage, setOwnerPage] =
    useState<'dashboard' | 'products' | 'inventory' | 'pos' | 'customers' | 'reports' | 'settings'>(
      'dashboard'
    );

  const [dashboardStats, setDashboardStats] =
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
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [inventory, setInventory] =
    useState<InventoryRow[]>([]);

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [loadingProducts, setLoadingProducts] =
    useState(false);

  const [loadingCategories, setLoadingCategories] =
    useState(false);

  const [productSearch, setProductSearch] =
    useState('');

  const [showCategoryForm, setShowCategoryForm] =
    useState(false);

  const [categoryName, setCategoryName] =
    useState('');

  const [categoryDescription, setCategoryDescription] =
    useState('');

  const [creatingCategory, setCreatingCategory] =
    useState(false);

  const [showProductForm, setShowProductForm] =
    useState(false);

  const [creatingProduct, setCreatingProduct] =
    useState(false);

  const [productName, setProductName] =
    useState('');

  const [productSku, setProductSku] =
    useState('');

  const [productBarcode, setProductBarcode] =
    useState('');

  const [productDescription, setProductDescription] =
    useState('');

  const [productCategory, setProductCategory] =
    useState('');

  const [productSellingPrice, setProductSellingPrice] =
    useState('');

  const [productCostPrice, setProductCostPrice] =
    useState('');

  const [productLowStock, setProductLowStock] =
    useState('5');

  useEffect(() => {
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);

        if (!newSession) {
          setBusinesses([]);
          setUsers([]);
          setSelectedBusiness(null);
          setOwnerBusiness(null);
          setPlatformRole('user');
          return;
        }

        await loadUserProfile(newSession.user.id);
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

    if (data.session) {
      setSession(data.session);
      await loadUserProfile(data.session.user.id);
    }

    setLoading(false);
  }

  async function loadUserProfile(userId: string) {
    setError('');

    const { data, error } =
      await supabase
        .from('profiles')
        .select('platform_role')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
      setError(error.message);
      return;
    }

    const role = data?.platform_role || 'user';

    setPlatformRole(role);

    if (role === 'super_admin') {
      await loadBusinesses();
      await loadUsers();
      return;
    }

    await loadOwnerBusiness(userId);
  }

  async function loadBusinesses() {
    setLoadingBusinesses(true);

    const { data, error } =
      await supabase
        .from('businesses')
        .select('id, name, status, created_at')
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
      await supabase.rpc('get_business_users');

    if (error) {
      setError(error.message);
    } else {
      setUsers(data || []);
    }

    setLoadingUsers(false);
  }

  async function createBusiness(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const name = businessName.trim();

    if (!name) {
      setError('Please enter a business name.');
      return;
    }

    setCreating(true);
    setError('');

    const { error } =
      await supabase.rpc('create_business', {
        business: name,
      });

    if (error) {
      setError(error.message);
    } else {
      setBusinessName('');
      setShowCreate(false);
      await loadBusinesses();
    }

    setCreating(false);
  }

  async function assignOwner() {
    if (!selectedBusiness || !selectedOwner) {
      setError('Please select a business owner.');
      return;
    }

    setAssigningOwner(true);
    setError('');

    const { error } =
      await supabase.rpc('assign_business_owner', {
        target_business_id:
          selectedBusiness.id,
        target_user_id:
          selectedOwner,
      });

    if (error) {
      setError(error.message);
    } else {
      alert(
        'Business owner assigned successfully.'
      );
      setSelectedOwner('');
    }

    setAssigningOwner(false);
  }

  async function loadOwnerBusiness(
    userId: string
  ) {
    setOwnerLoading(true);
    setError('');

    const { data, error } =
      await supabase
        .from('business_members')
        .select(
          'business_id, role'
        )
        .eq('user_id', userId)
        .eq('role', 'owner')
        .maybeSingle();

    if (error) {
      setError(error.message);
      setOwnerLoading(false);
      return;
    }

    if (!data) {
      setOwnerBusiness(null);
      setOwnerLoading(false);
      return;
    }

    const { data: business, error: businessError } =
      await supabase
        .from('businesses')
        .select(
          'id, name, status, created_at'
        )
        .eq('id', data.business_id)
        .maybeSingle();

    if (businessError) {
      setError(businessError.message);
    } else {
      setOwnerBusiness(business);
      await loadOwnerDashboard(
        data.business_id
      );
    }

    setOwnerLoading(false);
  }

  async function loadOwnerDashboard(
    businessId: string
  ) {
    setError('');

    const [
      productsResult,
      customersResult,
      salesResult,
      inventoryResult,
      recentSalesResult,
    ] = await Promise.all([
      supabase
        .from('products')
        .select('id, business_id, category_id, name, sku, barcode, description, selling_price, cost_price, low_stock_threshold, is_active')
        .eq('business_id', businessId),

      supabase
        .from('customers')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('business_id', businessId),

      supabase
        .from('sales')
        .select('id, total, created_at')
        .eq('business_id', businessId),

      supabase
        .from('inventory')
        .select(
          'id, product_id, branch_id, quantity'
        )
        .eq('business_id', businessId),

      supabase
        .from('sales')
        .select(
          'id, total, created_at'
        )
        .eq('business_id', businessId)
        .order('created_at', {
          ascending: false,
        })
        .limit(5),
    ]);

    if (productsResult.error) {
      setError(productsResult.error.message);
      return;
    }

    if (customersResult.error) {
      setError(customersResult.error.message);
      return;
    }

    if (salesResult.error) {
      setError(salesResult.error.message);
      return;
    }

    if (inventoryResult.error) {
      setError(inventoryResult.error.message);
      return;
    }

    if (recentSalesResult.error) {
      setError(recentSalesResult.error.message);
      return;
    }

    const productData =
      (productsResult.data || []) as Product[];

    const inventoryData =
      (inventoryResult.data || []) as InventoryRow[];

    const salesData =
      (salesResult.data || []) as RecentSale[];

    const startOfDay =
      new Date();

    startOfDay.setHours(
      0,
      0,
      0,
      0
    );

    const todaySales = salesData
      .filter(
        (sale) =>
          new Date(sale.created_at) >=
          startOfDay
      )
      .reduce(
        (sum, sale) =>
          sum + Number(sale.total || 0),
        0
      );

    const lowStock =
      productData.filter((product) => {
        const stock = inventoryData
          .filter(
            (item) =>
              item.product_id ===
              product.id
          )
          .reduce(
            (sum, item) =>
              sum +
              Number(item.quantity || 0),
            0
          );

        return (
          stock <=
          Number(
            product.low_stock_threshold
          )
        );
      });

    setProducts(productData);
    setInventory(inventoryData);
    setRecentSales(
      (recentSalesResult.data ||
        []) as RecentSale[]
    );
    setLowStockProducts(lowStock);

    setDashboardStats({
      products: productData.length,
      customers:
        customersResult.count || 0,
      sales: salesData.length,
      lowStock: lowStock.length,
      todaySales,
    });
  }

  async function loadProducts(
    businessId: string
  ) {
    setLoadingProducts(true);

    const { data, error } =
      await supabase
        .from('products')
        .select(
          'id, business_id, category_id, name, sku, barcode, description, selling_price, cost_price, low_stock_threshold, is_active'
        )
        .eq('business_id', businessId)
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      setError(error.message);
    } else {
      setProducts(
        (data || []) as Product[]
      );
    }

    setLoadingProducts(false);
  }

  async function loadCategories(
    businessId: string
  ) {
    setLoadingCategories(true);

    const { data, error } =
      await supabase
        .from('categories')
        .select(
          'id, business_id, name, description'
        )
        .eq('business_id', businessId)
        .order('name');

    if (error) {
      setError(error.message);
    } else {
      setCategories(
        (data || []) as Category[]
      );
    }

    setLoadingCategories(false);
  }

  async function loadBranches(
    businessId: string
  ) {
    const { data, error } =
      await supabase
        .from('branches')
        .select(
          'id, business_id, name, address, phone'
        )
        .eq('business_id', businessId)
        .order('name');

    if (error) {
      setError(error.message);
    } else {
      setBranches(
        (data || []) as Branch[]
      );
    }
  }

  async function openOwnerPage(
    page:
      | 'dashboard'
      | 'products'
      | 'inventory'
      | 'pos'
      | 'customers'
      | 'reports'
      | 'settings'
  ) {
    setOwnerPage(page);
    setError('');

    if (!ownerBusiness) {
      return;
    }

    if (
      page === 'products' ||
      page === 'inventory'
    ) {
      await Promise.all([
        loadProducts(ownerBusiness.id),
        loadCategories(ownerBusiness.id),
        loadBranches(ownerBusiness.id),
      ]);
    }
  }

  async function createCategory(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!ownerBusiness) {
      return;
    }

    const name =
      categoryName.trim();

    if (!name) {
      setError(
        'Please enter a category name.'
      );
      return;
    }

    setCreatingCategory(true);
    setError('');

    const { error } =
      await supabase.rpc(
        'create_category',
        {
          target_business_id:
            ownerBusiness.id,
          category_name: name,
          category_description:
            categoryDescription.trim() ||
            null,
        }
      );

    if (error) {
      setError(error.message);
    } else {
      setCategoryName('');
      setCategoryDescription('');
      setShowCategoryForm(false);

      await loadCategories(
        ownerBusiness.id
      );
    }

    setCreatingCategory(false);
  }

  async function createProduct(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!ownerBusiness) {
      return;
    }

    const name =
      productName.trim();

    if (!name) {
      setError(
        'Please enter a product name.'
      );
      return;
    }

    const selling =
      Number(productSellingPrice);

    const cost =
      Number(productCostPrice);

    const threshold =
      Number(productLowStock);

    if (
      Number.isNaN(selling) ||
      selling < 0
    ) {
      setError(
        'Please enter a valid selling price.'
      );
      return;
    }

    if (
      Number.isNaN(cost) ||
      cost < 0
    ) {
      setError(
        'Please enter a valid cost price.'
      );
      return;
    }

    if (
      Number.isNaN(threshold) ||
      threshold < 0
    ) {
      setError(
        'Please enter a valid low-stock threshold.'
      );
      return;
    }

    setCreatingProduct(true);
    setError('');

    const { error } =
      await supabase.rpc(
        'create_product',
        {
          target_business_id:
            ownerBusiness.id,
          product_name: name,
          product_sku:
            productSku.trim() || null,
          product_barcode:
            productBarcode.trim() || null,
          product_description:
            productDescription.trim() ||
            null,
          product_category_id:
            productCategory || null,
          product_selling_price:
            selling,
          product_cost_price:
            cost,
          product_low_stock_threshold:
            threshold,
        }
      );

    if (error) {
      setError(error.message);
    } else {
      setProductName('');
      setProductSku('');
      setProductBarcode('');
      setProductDescription('');
      setProductCategory('');
      setProductSellingPrice('');
      setProductCostPrice('');
      setProductLowStock('5');
      setShowProductForm(false);

      await loadProducts(
        ownerBusiness.id
      );

      await loadOwnerDashboard(
        ownerBusiness.id
      );
    }

    setCreatingProduct(false);
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

  const filteredProducts =
    products.filter((product) => {
      const search =
        productSearch
          .toLowerCase()
          .trim();

      if (!search) {
        return true;
      }

      return (
        product.name
          .toLowerCase()
          .includes(search) ||
        (product.sku || '')
          .toLowerCase()
          .includes(search) ||
        (product.barcode || '')
          .toLowerCase()
          .includes(search)
      );
    });

  function getCategoryName(
    categoryId: string | null
  ) {
    if (!categoryId) {
      return 'Uncategorized';
    }

    return (
      categories.find(
        (category) =>
          category.id === categoryId
      )?.name ||
      'Uncategorized'
    );
  }

  function getProductStock(
    productId: string
  ) {
    return inventory
      .filter(
        (item) =>
          item.product_id === productId
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0),
        0
      );
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
   * SUPER ADMIN HAS PRIORITY
   */

  if (
    platformRole === 'super_admin'
  ) {

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

                      {users.map(
                        (user) => (
                          <option
                            key={user.id}
                            value={user.id}
                          >
                            {user.email}
                          </option>
                        )
                      )}

                    </select>

                    <div className="form-actions">

                      <button
                        className="primary-button"
                        onClick={
                          assignOwner
                        }
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

            </section>

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
                onSubmit={
                  createBusiness
                }
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
                onClick={
                  loadBusinesses
                }
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

  /*
   * OWNER APPLICATION
   */

  if (ownerLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand">
            Jabang<span>Store</span>
          </div>
          <p>
            Loading your business...
          </p>
        </div>
      </div>
    );
  }

  if (!ownerBusiness) {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <div className="brand">
            Jabang<span>Store</span>
          </div>

          <h1>
            No business assigned
          </h1>

          <p className="description">
            Your account does not currently
            have an owner business assigned.
          </p>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            className="login-button"
            onClick={handleLogout}
          >
            Sign out
          </button>

        </div>
      </div>
    );
  }

  /*
   * PRODUCTS PAGE
   */

  if (ownerPage === 'products') {
    return (
      <div className="dashboard-page">

        <header className="topbar">

          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>

            <small>
              {ownerBusiness.name}
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
                ● Business Owner
              </span>

              <h1>
                Products
              </h1>

              <p>
                Manage your products and
                categories.
              </p>

            </div>

            <div className="form-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  openOwnerPage(
                    'dashboard'
                  )
                }
              >
                ← Dashboard
              </button>

              <button
                className="primary-button"
                onClick={() => {
                  setShowProductForm(
                    !showProductForm
                  );
                  setError('');
                }}
              >
                + Add Product
              </button>

            </div>

          </section>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {showProductForm && (
            <section className="create-business-card">

              <h2>
                Add New Product
              </h2>

              <p>
                Enter the basic information
                for this product.
              </p>

              <form
                onSubmit={
                  createProduct
                }
              >

                <label>
                  Product name *
                </label>

                <input
                  value={productName}
                  onChange={(e) =>
                    setProductName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Coca Cola 500ml"
                />

                <label>
                  SKU
                </label>

                <input
                  value={productSku}
                  onChange={(e) =>
                    setProductSku(
                      e.target.value
                    )
                  }
                  placeholder="e.g. COKE-500"
                />

                <label>
                  Barcode
                </label>

                <input
                  value={productBarcode}
                  onChange={(e) =>
                    setProductBarcode(
                      e.target.value
                    )
                  }
                  placeholder="Product barcode"
                />

                <label>
                  Category
                </label>

                <select
                  value={productCategory}
                  onChange={(e) =>
                    setProductCategory(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    No category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}

                </select>

                <label>
                  Selling price (GMD) *
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    productSellingPrice
                  }
                  onChange={(e) =>
                    setProductSellingPrice(
                      e.target.value
                    )
                  }
                  placeholder="0.00"
                />

                <label>
                  Cost price (GMD)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    productCostPrice
                  }
                  onChange={(e) =>
                    setProductCostPrice(
                      e.target.value
                    )
                  }
                  placeholder="0.00"
                />

                <label>
                  Low-stock threshold
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    productLowStock
                  }
                  onChange={(e) =>
                    setProductLowStock(
                      e.target.value
                    )
                  }
                />

                <label>
                  Description
                </label>

                <textarea
                  value={
                    productDescription
                  }
                  onChange={(e) =>
                    setProductDescription(
                      e.target.value
                    )
                  }
                  placeholder="Optional product description"
                  rows={4}
                />

                <div className="form-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowProductForm(
                        false
                      );
                      setError('');
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      creatingProduct
                    }
                  >
                    {creatingProduct
                      ? 'Creating...'
                      : 'Create Product'}
                  </button>

                </div>

              </form>

            </section>
          )}

          <section className="business-section">

            <div className="section-title">

              <div>
                <h2>
                  Product Catalog
                </h2>

                <p>
                  {products.length}{' '}
                  product
                  {products.length === 1
                    ? ''
                    : 's'}
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={() =>
                  loadProducts(
                    ownerBusiness.id
                  )
                }
              >
                Refresh
              </button>

            </div>

            <input
              className="product-search"
              placeholder="Search by product name, SKU or barcode..."
              value={productSearch}
              onChange={(e) =>
                setProductSearch(
                  e.target.value
                )
              }
            />

            {loadingProducts ? (
              <div className="empty-card">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-card">

                <div className="empty-icon">
                  📦
                </div>

                <h3>
                  No products found
                </h3>

                <p>
                  Add your first product to
                  start building your catalog.
                </p>

              </div>
            ) : (
              <div className="table-wrapper">

                <table className="data-table">

                  <thead>
                    <tr>
                      <th>
                        Product
                      </th>

                      <th>
                        Category
                      </th>

                      <th>
                        SKU
                      </th>

                      <th>
                        Selling Price
                      </th>

                      <th>
                        Cost
                      </th>

                      <th>
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredProducts.map(
                      (product) => (
                        <tr
                          key={
                            product.id
                          }
                        >

                          <td>
                            <strong>
                              {product.name}
                            </strong>

                            {product.barcode && (
                              <small
                                style={{
                                  display:
                                    'block',
                                }}
                              >
                                {product.barcode}
                              </small>
                            )}
                          </td>

                          <td>
                            {
                              getCategoryName(
                                product.category_id
                              )
                            }
                          </td>

                          <td>
                            {product.sku ||
                              '—'}
                          </td>

                          <td>
                            GMD{' '}
                            {Number(
                              product.selling_price
                            ).toFixed(2)}
                          </td>

                          <td>
                            GMD{' '}
                            {Number(
                              product.cost_price
                            ).toFixed(2)}
                          </td>

                          <td>
                            <span className="business-status">
                              {product.is_active
                                ? 'Active'
                                : 'Inactive'}
                            </span>
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>

          <section className="business-section">

            <div className="section-title">

              <div>
                <h2>
                  Categories
                </h2>

                <p>
                  Organize your products.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => {
                  setShowCategoryForm(
                    !showCategoryForm
                  );
                  setError('');
                }}
              >
                + Add Category
              </button>

            </div>

            {showCategoryForm && (
              <div className="create-business-card">

                <h2>
                  Create Category
                </h2>

                <form
                  onSubmit={
                    createCategory
                  }
                >

                  <label>
                    Category name *
                  </label>

                  <input
                    value={categoryName}
                    onChange={(e) =>
                      setCategoryName(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Beverages"
                  />

                  <label>
                    Description
                  </label>

                  <textarea
                    value={
                      categoryDescription
                    }
                    onChange={(e) =>
                      setCategoryDescription(
                        e.target.value
                      )
                    }
                    placeholder="Optional description"
                    rows={3}
                  />

                  <div className="form-actions">

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setShowCategoryForm(
                          false
                        )
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={
                        creatingCategory
                      }
                    >
                      {creatingCategory
                        ? 'Creating...'
                        : 'Create Category'}
                    </button>

                  </div>

                </form>

              </div>
            )}

            {loadingCategories ? (
              <div className="empty-card">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="empty-card">
                <h3>
                  No categories yet
                </h3>

                <p>
                  Create categories such as
                  Beverages, Food, Electronics,
                  Clothing, etc.
                </p>
              </div>
            ) : (
              <div className="business-grid">

                {categories.map(
                  (category) => (
                    <article
                      className="business-card"
                      key={category.id}
                    >

                      <div className="business-icon">
                        🗂️
                      </div>

                      <div className="business-info">

                        <h3>
                          {category.name}
                        </h3>

                        <p>
                          {category.description ||
                            'No description'}
                        </p>

                      </div>

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

  /*
   * INVENTORY PAGE
   */

  if (ownerPage === 'inventory') {
    return (
      <div className="dashboard-page">

        <header className="topbar">

          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>

            <small>
              {ownerBusiness.name}
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
                ● Inventory
              </span>

              <h1>
                Inventory
              </h1>

              <p>
                Monitor stock levels across
                your products.
              </p>

            </div>

            <button
              className="secondary-button"
              onClick={() =>
                openOwnerPage(
                  'dashboard'
                )
              }
            >
              ← Dashboard
            </button>

          </section>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <section className="business-section">

            <div className="section-title">

              <div>
                <h2>
                  Stock Overview
                </h2>

                <p>
                  {branches.length}{' '}
                  branch
                  {branches.length === 1
                    ? ''
                    : 'es'}{' '}
                  connected
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={() =>
                  loadOwnerDashboard(
                    ownerBusiness.id
                  )
                }
              >
                Refresh
              </button>

            </div>

            {products.length === 0 ? (
              <div className="empty-card">

                <div className="empty-icon">
                  📦
                </div>

                <h3>
                  No products yet
                </h3>

                <p>
                  Create products before
                  managing inventory.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    openOwnerPage(
                      'products'
                    )
                  }
                >
                  Go to Products
                </button>

              </div>
            ) : (
              <div className="table-wrapper">

                <table className="data-table">

                  <thead>

                    <tr>
                      <th>
                        Product
                      </th>

                      <th>
                        Category
                      </th>

                      <th>
                        Current Stock
                      </th>

                      <th>
                        Low Stock At
                      </th>

                      <th>
                        Status
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {products.map(
                      (product) => {

                        const stock =
                          getProductStock(
                            product.id
                          );

                        const low =
                          stock <=
                          Number(
                            product.low_stock_threshold
                          );

                        return (
                          <tr
                            key={
                              product.id
                            }
                          >

                            <td>
                              <strong>
                                {product.name}
                              </strong>
                            </td>

                            <td>
                              {
                                getCategoryName(
                                  product.category_id
                                )
                              }
                            </td>

                            <td>
                              <strong>
                                {stock}
                              </strong>
                            </td>

                            <td>
                              {
                                product.low_stock_threshold
                              }
                            </td>

                            <td>
                              <span
                                className="business-status"
                                style={
                                  low
                                    ? {
                                        borderColor:
                                          '#c0392b',
                                      }
                                    : undefined
                                }
                              >
                                {low
                                  ? 'Low Stock'
                                  : 'In Stock'}
                              </span>
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>

        </main>

      </div>
    );
  }

  /*
   * OTHER OWNER MODULES
   */

  if (
    ownerPage === 'pos' ||
    ownerPage === 'customers' ||
    ownerPage === 'reports' ||
    ownerPage === 'settings'
  ) {
    const moduleNames = {
      pos: 'POS',
      customers: 'Customers',
      reports: 'Reports',
      settings: 'Settings',
    };

    return (
      <div className="dashboard-page">

        <header className="topbar">

          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>

            <small>
              {ownerBusiness.name}
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
            onClick={() =>
              openOwnerPage(
                'dashboard'
              )
            }
          >
            ← Dashboard
          </button>

          <section className="empty-card">

            <div className="empty-icon">
              🚧
            </div>

            <h1>
              {moduleNames[ownerPage]}
            </h1>

            <p>
              This module is part of the
              JabangStore build and will be
              connected to the real database in
              its dedicated implementation stage.
            </p>

          </section>

        </main>

      </div>
    );
  }

  /*
   * OWNER DASHBOARD
   */

  return (
    <div className="dashboard-page">

      <header className="topbar">

        <div>
          <div className="brand">
            Jabang<span>Store</span>
          </div>

          <small>
            {ownerBusiness.name}
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
              ● Business Owner
            </span>

            <h1>
              Dashboard
            </h1>

            <p>
              Manage and monitor{' '}
              {ownerBusiness.name}.
            </p>

          </div>

        </section>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <section className="business-grid">

          <button
            className="business-card"
            onClick={() =>
              openOwnerPage(
                'dashboard'
              )
            }
          >
            <div className="business-icon">
              📊
            </div>

            <div className="business-info">
              <h3>
                Dashboard
              </h3>

              <p>
                Business performance.
              </p>
            </div>
          </button>

          <button
            className="business-card"
            onClick={() =>
              openOwnerPage(
                'products'
              )
            }
          >
            <div className="business-icon">
              📦
            </div>

            <div className="business-info">
              <h3>
                Products
              </h3>

              <p>
                Products and categories.
              </p>
            </div>
          </button>

          <button
            className="business-card"
            onClick={() =>
              openOwnerPage(
                'inventory'
              )
            }
          >
            <div className="business-icon">
              📋
            </div>

            <div className="business-info">
              <h3>
                Inventory
              </h3>

              <p>
                Stock management.
              </p>
            </div>
          </button>

          <button
            className="business-card"
            onClick={() =>
              openOwnerPage(
                'pos'
              )
            }
          >
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
          </button>

          <button
            className="business-card"
            onClick={() =>
              openOwnerPage(
                'customers'
              )
            }
          >
            <div className="business-icon">
              👥
            </div>

            <div className="business-info">
              <h3>
                Customers
              </h3>

              <p>
                Customer management.
              </p>
            </div>
          </button>

          <button
            className="business-card"
            onClick={() =>
              openOwnerPage(
                'reports'
              )
            }
          >
            <div className="business-icon">
              📈
            </div>

            <div className="business-info">
              <h3>
                Reports
              </h3>

              <p>
                Business reports.
              </p>
            </div>
          </button>

          <button
            className="business-card"
            onClick={() =>
              openOwnerPage(
                'settings'
              )
            }
          >
            <div className="business-icon">
              ⚙️
            </div>

            <div className="business-info">
              <h3>
                Settings
              </h3>

              <p>
                Business settings.
              </p>
            </div>
          </button>

        </section>

        <section className="business-section">

          <div className="section-title">
            <div>
              <h2>
                Business Overview
              </h2>

              <p>
                Live information from
                Supabase.
              </p>
            </div>
          </div>

          <div className="business-grid">

            <article className="business-card">
              <div className="business-icon">
                💰
              </div>

              <div className="business-info">
                <h3>
                  Today's Sales
                </h3>

                <p>
                  GMD{' '}
                  {dashboardStats.todaySales.toFixed(
                    2
                  )}
                </p>
              </div>
            </article>

            <article className="business-card">
              <div className="business-icon">
                🧾
              </div>

              <div className="business-info">
                <h3>
                  Total Sales
                </h3>

                <p>
                  {dashboardStats.sales}
                </p>
              </div>
            </article>

            <article className="business-card">
              <div className="business-icon">
                📦
              </div>

              <div className="business-info">
                <h3>
                  Products
                </h3>

                <p>
                  {dashboardStats.products}
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
                  {dashboardStats.customers}
                </p>
              </div>
            </article>

            <article className="business-card">
              <div className="business-icon">
                ⚠️
              </div>

              <div className="business-info">
                <h3>
                  Low Stock
                </h3>

                <p>
                  {dashboardStats.lowStock}
                </p>
              </div>
            </article>

          </div>

        </section>

        <section className="business-section">

          <div className="section-title">
            <div>
              <h2>
                Recent Sales
              </h2>

              <p>
                Latest transactions.
              </p>
            </div>
          </div>

          {recentSales.length === 0 ? (
            <div className="empty-card">
              <h3>
                No sales yet
              </h3>

              <p>
                Sales will appear here after
                the POS module is connected.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">

              <table className="data-table">

                <thead>
                  <tr>
                    <th>
                      Sale
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {recentSales.map(
                    (sale) => (
                      <tr
                        key={sale.id}
                      >

                        <td>
                          #{sale.id.slice(
                            0,
                            8
                          )}
                        </td>

                        <td>
                          GMD{' '}
                          {Number(
                            sale.total
                          ).toFixed(2)}
                        </td>

                        <td>
                          {new Date(
                            sale.created_at
                          ).toLocaleString()}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        <section className="business-section">

          <div className="section-title">
            <div>
              <h2>
                Low Stock Products
              </h2>

              <p>
                Products that need attention.
              </p>
            </div>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="empty-card">

              <div className="empty-icon">
                ✅
              </div>

              <h3>
                Stock levels look good
              </h3>

              <p>
                No products are currently
                below their low-stock threshold.
              </p>

            </div>
          ) : (
            <div className="business-grid">

              {lowStockProducts.map(
                (product) => (
                  <article
                    className="business-card"
                    key={product.id}
                  >

                    <div className="business-icon">
                      ⚠️
                    </div>

                    <div className="business-info">

                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        Stock:{' '}
                        {getProductStock(
                          product.id
                        )}
                      </p>

                      <p>
                        Alert at:{' '}
                        {
                          product.low_stock_threshold
                        }
                      </p>

                    </div>

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
