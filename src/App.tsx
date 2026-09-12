import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

type InventorySummary = {
  product_id: string;
  product_name: string;
  sku: string | null;
  selling_price: number;
  cost_price: number;
  low_stock_threshold: number;
  quantity: number;
  inventory_value: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
};

type InventoryMovement = {
  id: string;
  product_id: string;
  product_name: string;
  branch_id: string;
  movement_type: string;
  quantity: number;
  reference_type: string | null;
  created_at: string;
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

type POSCartItem = Product & {
  quantity: number;
  itemDiscount: number;
};

type POSReceipt = {
  sale_id: string;
  sale_number: string;
  subtotal: number;
  discount: number;
  total: number;
  amount_received: number;
  change_amount: number;
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

  const [platformRole, setPlatformRole] =
    useState('user');

  const [businesses, setBusinesses] =
    useState<Business[]>([]);

  const [loadingBusinesses, setLoadingBusinesses] =
    useState(false);

  const [users, setUsers] =
    useState<BusinessUser[]>([]);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [error, setError] = useState('');

  const [showCreate, setShowCreate] =
    useState(false);

  const [businessName, setBusinessName] =
    useState('');

  const [creating, setCreating] =
    useState(false);

  const [selectedBusiness, setSelectedBusiness] =
    useState<Business | null>(null);

  const [selectedOwner, setSelectedOwner] =
    useState('');

  const [assigningOwner, setAssigningOwner] =
    useState(false);

  const [ownerBusiness, setOwnerBusiness] =
    useState<Business | null>(null);

  const [ownerLoading, setOwnerLoading] =
    useState(false);

  const [ownerPage, setOwnerPage] =
    useState<OwnerPage>('dashboard');

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

  /*
   * ========================================================
   * INVENTORY STATE
   * ========================================================
   */

  const [inventorySummary, setInventorySummary] =
    useState<InventorySummary[]>([]);

  const [inventoryMovements, setInventoryMovements] =
    useState<InventoryMovement[]>([]);

  const [loadingInventory, setLoadingInventory] =
    useState(false);

  const [loadingMovements, setLoadingMovements] =
    useState(false);

  const [inventorySearch, setInventorySearch] =
    useState('');

  const [selectedBranch, setSelectedBranch] =
    useState('');

  const [showRestockForm, setShowRestockForm] =
    useState(false);

  const [restockProductId, setRestockProductId] =
    useState('');

  const [restockQuantity, setRestockQuantity] =
    useState('');

  const [restockUnitCost, setRestockUnitCost] =
    useState('');

  const [restocking, setRestocking] =
    useState(false);

  const [showAdjustmentForm, setShowAdjustmentForm] =
    useState(false);

  const [adjustmentProductId, setAdjustmentProductId] =
    useState('');

  const [adjustmentQuantity, setAdjustmentQuantity] =
    useState('');

  const [adjustmentReason, setAdjustmentReason] =
    useState('');

  const [adjusting, setAdjusting] =
    useState(false);

  /*
   * ========================================================
   * POS STATE
   * ========================================================
   */

  const [posProducts, setPosProducts] =
    useState<Product[]>([]);

  const [posStock, setPosStock] =
    useState<Record<string, number>>({});

  const [posSearch, setPosSearch] =
    useState('');

  const [posCart, setPosCart] =
    useState<POSCartItem[]>([]);

  const [posPaymentMethod, setPosPaymentMethod] =
    useState('cash');

  const [posAmountReceived, setPosAmountReceived] =
    useState('');

  const [posDiscount, setPosDiscount] =
    useState('0');

  const [posCompleting, setPosCompleting] =
    useState(false);

  const [posLoading, setPosLoading] =
    useState(false);

  const [posReceipt, setPosReceipt] =
    useState<POSReceipt | null>(null);

  /*
   * ========================================================
   * AUTH
   * ========================================================
   */

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

        await loadUserProfile(
          newSession.user.id
        );
      }
    );

    return () =>
      subscription.unsubscribe();
  }, []);

  async function loadSession() {
    const { data, error } =
      await supabase.auth.getSession();

    if (error) {
      setError(error.message);
    }

    if (data.session) {
      setSession(data.session);

      await loadUserProfile(
        data.session.user.id
      );
    }

    setLoading(false);
  }

  async function loadUserProfile(
    userId: string
  ) {
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

    const role =
      data?.platform_role || 'user';

    setPlatformRole(role);

    if (role === 'super_admin') {
      await loadBusinesses();
      await loadUsers();
      return;
    }

    await loadOwnerBusiness(userId);
  }

  /*
   * ========================================================
   * SUPER ADMIN
   * ========================================================
   */

  async function loadBusinesses() {
    setLoadingBusinesses(true);

    const { data, error } =
      await supabase
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

  async function createBusiness(
    e: FormEvent
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

    const { error } =
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
    }

    setCreating(false);
  }

  async function assignOwner() {
    if (
      !selectedBusiness ||
      !selectedOwner
    ) {
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
      alert(
        'Business owner assigned successfully.'
      );

      setSelectedOwner('');
    }

    setAssigningOwner(false);
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

  /*
   * ========================================================
   * OWNER BUSINESS
   * ========================================================
   */

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
        .in('role', ['owner', 'manager', 'cashier', 'inventory_staff'])
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

    const {
      data: business,
      error: businessError,
    } = await supabase
      .from('businesses')
      .select(
        'id, name, status, created_at'
      )
      .eq('id', data.business_id)
      .maybeSingle();

    if (businessError) {
      setError(
        businessError.message
      );
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
        .select(
          'id, business_id, category_id, name, sku, barcode, description, selling_price, cost_price, low_stock_threshold, is_active'
        )
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
        .select(
          'id, total, created_at'
        )
        .eq(
          'business_id',
          businessId
        ),

      supabase
        .from('inventory')
        .select(
          'id, product_id, branch_id, quantity'
        )
        .eq(
          'business_id',
          businessId
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
        .order('created_at', {
          ascending: false,
        })
        .limit(5),
    ]);

    if (productsResult.error) {
      setError(
        productsResult.error.message
      );
      return;
    }

    if (customersResult.error) {
      setError(
        customersResult.error.message
      );
      return;
    }

    if (salesResult.error) {
      setError(
        salesResult.error.message
      );
      return;
    }

    if (inventoryResult.error) {
      setError(
        inventoryResult.error.message
      );
      return;
    }

    if (recentSalesResult.error) {
      setError(
        recentSalesResult.error.message
      );
      return;
    }

    const productData =
      (productsResult.data ||
        []) as Product[];

    const inventoryData =
      (inventoryResult.data ||
        []) as InventoryRow[];

    const salesData =
      (salesResult.data ||
        []) as RecentSale[];

    const startOfDay =
      new Date();

    startOfDay.setHours(
      0,
      0,
      0,
      0
    );

    const todaySales =
      salesData
        .filter(
          (sale) =>
            new Date(
              sale.created_at
            ) >= startOfDay
        )
        .reduce(
          (sum, sale) =>
            sum +
            Number(
              sale.total || 0
            ),
          0
        );

    const lowStock =
      productData.filter(
        (product) => {
          const stock =
            inventoryData
              .filter(
                (item) =>
                  item.product_id ===
                  product.id
              )
              .reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.quantity || 0
                  ),
                0
              );

          return (
            stock <=
            Number(
              product.low_stock_threshold
            )
          );
        }
      );

    setProducts(productData);
    setInventory(inventoryData);

    setRecentSales(
      (recentSalesResult.data ||
        []) as RecentSale[]
    );

    setLowStockProducts(
      lowStock
    );

    setDashboardStats({
      products:
        productData.length,

      customers:
        customersResult.count || 0,

      sales:
        salesData.length,

      lowStock:
        lowStock.length,

      todaySales,
    });
  }

  /*
   * ========================================================
   * PRODUCTS
   * ========================================================
   */

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
        .eq(
          'business_id',
          businessId
        )
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
        .eq(
          'business_id',
          businessId
        )
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
        .eq(
          'business_id',
          businessId
        )
        .order('name');

    if (error) {
      setError(error.message);
    } else {
      const branchData =
        (data || []) as Branch[];

      setBranches(branchData);

      if (
        !selectedBranch &&
        branchData.length > 0
      ) {
        setSelectedBranch(
          branchData[0].id
        );
      }
    }
  }

  async function openOwnerPage(
    page: OwnerPage
  ) {
    setOwnerPage(page);
    setError('');

    if (!ownerBusiness) {
      return;
    }

    if (
      page === 'products'
    ) {
      await Promise.all([
        loadProducts(
          ownerBusiness.id
        ),
        loadCategories(
          ownerBusiness.id
        ),
        loadBranches(
          ownerBusiness.id
        ),
      ]);
    }

    if (
      page === 'inventory'
    ) {
      await Promise.all([
        loadProducts(
          ownerBusiness.id
        ),
        loadCategories(
          ownerBusiness.id
        ),
        loadBranches(
          ownerBusiness.id
        ),
        loadInventory(
          ownerBusiness.id
        ),
        loadInventoryMovements(
          ownerBusiness.id
        ),
      ]);
    }

    if (page === 'pos') {
      await loadPOSData(ownerBusiness.id);
    }
  }

  async function createCategory(
    e: FormEvent
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

          category_name:
            name,

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
    e: FormEvent
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

          product_name:
            name,

          product_sku:
            productSku.trim() ||
            null,

          product_barcode:
            productBarcode.trim() ||
            null,

          product_description:
            productDescription.trim() ||
            null,

          product_category_id:
            productCategory ||
            null,

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

  /*
   * ========================================================
   * INVENTORY
   * ========================================================
   */

  async function loadInventory(
    businessId: string
  ) {
    setLoadingInventory(true);

    const { data, error } =
      await supabase.rpc(
        'get_inventory_summary',
        {
          target_business_id:
            businessId,
        }
      );

    if (error) {
      setError(error.message);
    } else {
      setInventorySummary(
        (data || []) as InventorySummary[]
      );
    }

    setLoadingInventory(false);
  }

  async function loadInventoryMovements(
    businessId: string
  ) {
    setLoadingMovements(true);

    const { data, error } =
      await supabase.rpc(
        'get_inventory_movements',
        {
          target_business_id:
            businessId,
        }
      );

    if (error) {
      setError(error.message);
    } else {
      setInventoryMovements(
        (data || []) as InventoryMovement[]
      );
    }

    setLoadingMovements(false);
  }

  async function refreshInventory() {
    if (!ownerBusiness) {
      return;
    }

    setError('');

    await Promise.all([
      loadInventory(
        ownerBusiness.id
      ),

      loadInventoryMovements(
        ownerBusiness.id
      ),

      loadOwnerDashboard(
        ownerBusiness.id
      ),
    ]);
  }

  function openRestock(
    productId = ''
  ) {
    setError('');
    setRestockProductId(
      productId
    );
    setRestockQuantity('');
    setRestockUnitCost('');
    setShowAdjustmentForm(false);
    setShowRestockForm(true);
  }

  function closeRestock() {
    setShowRestockForm(false);
    setRestockProductId('');
    setRestockQuantity('');
    setRestockUnitCost('');
  }

  async function restockProduct(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!ownerBusiness) {
      return;
    }

    if (!selectedBranch) {
      setError(
        'Please select a branch.'
      );
      return;
    }

    if (!restockProductId) {
      setError(
        'Please select a product.'
      );
      return;
    }

    const quantity =
      Number(restockQuantity);

    const unitCost =
      Number(
        restockUnitCost || 0
      );

    if (
      Number.isNaN(quantity) ||
      quantity <= 0
    ) {
      setError(
        'Restock quantity must be greater than zero.'
      );
      return;
    }

    if (
      Number.isNaN(unitCost) ||
      unitCost < 0
    ) {
      setError(
        'Please enter a valid unit cost.'
      );
      return;
    }

    setRestocking(true);
    setError('');

    const { error } =
      await supabase.rpc(
        'restock_product',
        {
          target_business_id:
            ownerBusiness.id,

          target_product_id:
            restockProductId,

          target_branch_id:
            selectedBranch,

          restock_quantity:
            quantity,

          unit_cost:
            unitCost,
        }
      );

    if (error) {
      setError(error.message);
    } else {
      closeRestock();

      await refreshInventory();

      alert(
        'Stock restocked successfully.'
      );
    }

    setRestocking(false);
  }

  function openAdjustment(
    productId = ''
  ) {
    setError('');
    setAdjustmentProductId(
      productId
    );
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setShowRestockForm(false);
    setShowAdjustmentForm(true);
  }

  function closeAdjustment() {
    setShowAdjustmentForm(false);
    setAdjustmentProductId('');
    setAdjustmentQuantity('');
    setAdjustmentReason('');
  }

  async function adjustInventory(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!ownerBusiness) {
      return;
    }

    if (!selectedBranch) {
      setError(
        'Please select a branch.'
      );
      return;
    }

    if (!adjustmentProductId) {
      setError(
        'Please select a product.'
      );
      return;
    }

    const quantity =
      Number(adjustmentQuantity);

    if (
      Number.isNaN(quantity) ||
      quantity === 0
    ) {
      setError(
        'Adjustment quantity cannot be zero.'
      );
      return;
    }

    const reason =
      adjustmentReason.trim();

    if (!reason) {
      setError(
        'Please provide a reason for the adjustment.'
      );
      return;
    }

    setAdjusting(true);
    setError('');

    const { error } =
      await supabase.rpc(
        'adjust_inventory',
        {
          target_business_id:
            ownerBusiness.id,

          target_product_id:
            adjustmentProductId,

          target_branch_id:
            selectedBranch,

          adjustment_quantity:
            quantity,

          adjustment_reason:
            reason,
        }
      );

    if (error) {
      setError(error.message);
    } else {
      closeAdjustment();

      await refreshInventory();

      alert(
        'Inventory adjusted successfully.'
      );
    }

    setAdjusting(false);
  }

  /*
   * ========================================================
   * POS
   * ========================================================
   */

  async function loadPOSData(businessId: string) {
    setPosLoading(true);
    setError('');

    const [productsResult, branchesResult] = await Promise.all([
      supabase
        .from('products')
        .select(
          'id, business_id, category_id, name, sku, barcode, description, selling_price, cost_price, low_stock_threshold, is_active'
        )
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('branches')
        .select('id, business_id, name, address, phone')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name'),
    ]);

    if (productsResult.error) {
      setError(productsResult.error.message);
      setPosLoading(false);
      return;
    }

    if (branchesResult.error) {
      setError(branchesResult.error.message);
      setPosLoading(false);
      return;
    }

    const productData = (productsResult.data || []) as Product[];
    const branchData = (branchesResult.data || []) as Branch[];

    setPosProducts(productData);
    setBranches(branchData);

    const branchId =
      selectedBranch && branchData.some((branch) => branch.id === selectedBranch)
        ? selectedBranch
        : branchData[0]?.id || '';

    setSelectedBranch(branchId);

    if (!branchId) {
      setPosStock({});
      setPosLoading(false);
      return;
    }

    const { data: stockData, error: stockError } = await supabase
      .from('inventory')
      .select('product_id, quantity')
      .eq('business_id', businessId)
      .eq('branch_id', branchId);

    if (stockError) {
      setError(stockError.message);
      setPosLoading(false);
      return;
    }

    const stockMap: Record<string, number> = {};
    (stockData || []).forEach((row: { product_id: string; quantity: number }) => {
      stockMap[row.product_id] = Number(row.quantity || 0);
    });

    setPosStock(stockMap);
    setPosLoading(false);
  }

  async function loadPOSStock(businessId: string, branchId: string) {
    if (!branchId) {
      setPosStock({});
      return;
    }

    const { data, error } = await supabase
      .from('inventory')
      .select('product_id, quantity')
      .eq('business_id', businessId)
      .eq('branch_id', branchId);

    if (error) {
      setError(error.message);
      return;
    }

    const stockMap: Record<string, number> = {};
    (data || []).forEach((row: { product_id: string; quantity: number }) => {
      stockMap[row.product_id] = Number(row.quantity || 0);
    });

    setPosStock(stockMap);
  }

  function addToPOSCart(product: Product) {
    const available = Number(posStock[product.id] || 0);
    const existing = posCart.find((item) => item.id === product.id);

    if (available <= 0) {
      setError(`${product.name} is out of stock.`);
      return;
    }

    if (existing && existing.quantity >= available) {
      setError(`Only ${available} unit(s) of ${product.name} are available.`);
      return;
    }

    setError('');

    if (existing) {
      setPosCart((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      return;
    }

    setPosCart((current) => [
      ...current,
      { ...product, quantity: 1, itemDiscount: 0 },
    ]);
  }

  function changePOSQuantity(productId: string, nextQuantity: number) {
    const available = Number(posStock[productId] || 0);

    if (nextQuantity <= 0) {
      setPosCart((current) =>
        current.filter((item) => item.id !== productId)
      );
      return;
    }

    if (nextQuantity > available) {
      const product = posProducts.find((item) => item.id === productId);
      setError(
        `${product?.name || 'Product'} has only ${available} unit(s) available.`
      );
      return;
    }

    setError('');
    setPosCart((current) =>
      current.map((item) =>
        item.id === productId
          ? { ...item, quantity: nextQuantity }
          : item
      )
    );
  }

  function removeFromPOSCart(productId: string) {
    setPosCart((current) =>
      current.filter((item) => item.id !== productId)
    );
  }

  function clearPOSCart() {
    setPosCart([]);
    setPosDiscount('0');
    setPosAmountReceived('');
    setPosReceipt(null);
    setError('');
  }

  const posSubtotal = posCart.reduce(
    (sum, item) =>
      sum +
      Number(item.selling_price || 0) * item.quantity -
      Number(item.itemDiscount || 0),
    0
  );

  const posSaleDiscount = Math.max(
    0,
    Number(posDiscount || 0)
  );

  const posTotal = Math.max(
    0,
    posSubtotal - posSaleDiscount
  );

  const posReceived =
    posPaymentMethod === 'cash'
      ? Number(posAmountReceived || 0)
      : posTotal;

  const posChange = Math.max(
    0,
    posReceived - posTotal
  );

  const filteredPOSProducts = posProducts.filter((product) => {
    const search = posSearch.toLowerCase().trim();
    if (!search) return true;

    return (
      product.name.toLowerCase().includes(search) ||
      (product.sku || '').toLowerCase().includes(search) ||
      (product.barcode || '').toLowerCase().includes(search)
    );
  });

  async function completePOSSale() {
    if (!ownerBusiness) return;

    if (!selectedBranch) {
      setError('Please select a branch before completing the sale.');
      return;
    }

    if (posCart.length === 0) {
      setError('Cart is empty. Add a product first.');
      return;
    }

    if (posSaleDiscount > posSubtotal) {
      setError('Sale discount cannot exceed the subtotal.');
      return;
    }

    if (posPaymentMethod === 'cash' && posReceived < posTotal) {
      setError(
        `Insufficient payment. Required GMD ${formatGMD(posTotal)}.`
      );
      return;
    }

    setPosCompleting(true);
    setError('');

    const items = posCart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      discount: Number(item.itemDiscount || 0),
    }));

    const { data, error } = await supabase.rpc(
      'create_pos_sale',
      {
        target_business_id: ownerBusiness.id,
        target_branch_id: selectedBranch,
        target_customer_id: null,
        target_payment_method: posPaymentMethod,
        target_amount_received: posReceived,
        target_discount: posSaleDiscount,
        target_items: items,
      }
    );

    if (error) {
      setError(error.message);
      setPosCompleting(false);
      await loadPOSStock(ownerBusiness.id, selectedBranch);
      return;
    }

    const receipt = Array.isArray(data) ? data[0] : data;

    if (!receipt) {
      setError('Sale completed but no receipt data was returned.');
      setPosCompleting(false);
      return;
    }

    const normalizedReceipt: POSReceipt = {
      sale_id: receipt.sale_id,
      sale_number: receipt.sale_number,
      subtotal: Number(receipt.subtotal || 0),
      discount: Number(receipt.discount || 0),
      total: Number(receipt.total || 0),
      amount_received: Number(receipt.amount_received || 0),
      change_amount: Number(receipt.change_amount || 0),
    };

    setPosReceipt(normalizedReceipt);
    setPosCart([]);
    setPosDiscount('0');
    setPosAmountReceived('');

    await Promise.all([
      loadPOSStock(ownerBusiness.id, selectedBranch),
      loadOwnerDashboard(ownerBusiness.id),
    ]);

    setPosCompleting(false);
  }

  function printPOSReceipt() {
    if (!posReceipt || !ownerBusiness) return;

    const receiptWindow = window.open('', '_blank', 'width=420,height=700');

    if (!receiptWindow) {
      setError('Please allow pop-ups in your browser to print the receipt.');
      return;
    }

    receiptWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${posReceipt.sale_number}</title>
          <style>
            body { font-family: Arial, sans-serif; width: 300px; margin: 20px auto; color: #111; }
            h2, p { text-align: center; margin: 6px 0; }
            hr { border: 0; border-top: 1px dashed #999; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; }
            .total { font-size: 18px; font-weight: 700; margin-top: 12px; }
          </style>
        </head>
        <body>
          <h2>JabangStore</h2>
          <p>${ownerBusiness.name}</p>
          <hr />
          <p><strong>${posReceipt.sale_number}</strong></p>
          <p>${new Date().toLocaleString()}</p>
          <hr />
          <div class="row"><span>Subtotal</span><span>GMD ${formatGMD(posReceipt.subtotal)}</span></div>
          <div class="row"><span>Discount</span><span>GMD ${formatGMD(posReceipt.discount)}</span></div>
          <div class="row total"><span>Total</span><span>GMD ${formatGMD(posReceipt.total)}</span></div>
          <div class="row"><span>Paid</span><span>GMD ${formatGMD(posReceipt.amount_received)}</span></div>
          <div class="row"><span>Change</span><span>GMD ${formatGMD(posReceipt.change_amount)}</span></div>
          <hr />
          <p>Thank you for your business.</p>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  }

  /*
   * ========================================================
   * HELPERS
   * ========================================================
   */

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const filteredProducts =
    products.filter(
      (product) => {
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
      }
    );

  const filteredInventory =
    useMemo(() => {
      const search =
        inventorySearch
          .toLowerCase()
          .trim();

      if (!search) {
        return inventorySummary;
      }

      return inventorySummary.filter(
        (item) =>
          item.product_name
            .toLowerCase()
            .includes(search) ||

          (item.sku || '')
            .toLowerCase()
            .includes(search)
      );
    }, [
      inventorySummary,
      inventorySearch,
    ]);

  const inventoryStats =
    useMemo(() => {
      const totalUnits =
        inventorySummary.reduce(
          (sum, item) =>
            sum +
            Number(
              item.quantity || 0
            ),
          0
        );

      const inventoryValue =
        inventorySummary.reduce(
          (sum, item) =>
            sum +
            Number(
              item.inventory_value ||
                0
            ),
          0
        );

      const lowStock =
        inventorySummary.filter(
          (item) =>
            item.status ===
            'low_stock'
        ).length;

      const outOfStock =
        inventorySummary.filter(
          (item) =>
            item.status ===
            'out_of_stock'
        ).length;

      return {
        totalUnits,
        inventoryValue,
        lowStock,
        outOfStock,
      };
    }, [
      inventorySummary,
    ]);

  function getCategoryName(
    categoryId: string | null
  ) {
    if (!categoryId) {
      return 'Uncategorized';
    }

    return (
      categories.find(
        (category) =>
          category.id ===
          categoryId
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
          item.product_id ===
          productId
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantity || 0
          ),
        0
      );
  }

  function formatGMD(
    amount: number
  ) {
    return Number(
      amount || 0
    ).toLocaleString(
      'en-GM',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function statusLabel(
    status: string
  ) {
    if (
      status ===
      'out_of_stock'
    ) {
      return 'Out of Stock';
    }

    if (
      status ===
      'low_stock'
    ) {
      return 'Low Stock';
    }

    return 'In Stock';
  }

  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <div className="brand">
            Jabang<span>Store</span>
          </div>

          <p>
            Loading...
          </p>

        </div>
      </div>
    );
  }

  /*
   * ========================================================
   * LOGIN
   * ========================================================
   */

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
                e.currentTarget
                  .elements.namedItem(
                    'email'
                  ) as HTMLInputElement;

              const passwordInput =
                e.currentTarget
                  .elements.namedItem(
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
   * ========================================================
   * SUPER ADMIN
   * ========================================================
   */

   if (
    platformRole ===
    'super_admin'
  ) {

    if (showApplications) {
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
              onClick={() => setShowApplications(false)}
            >
              ← Back to Businesses
            </button>

            <BusinessApplications />
          </main>

        </div>
      );
    }

    if (selectedBusiness) {{
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="secondary-button"
              onClick={() => setShowApplications(true)}
            >
              Business Applications
            </button>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>

        </header>

          <main className="admin-content">

            <button
              className="secondary-button"
              onClick={
                closeBusiness
              }
            >
              ← Back to Businesses
            </button>

            <section className="admin-header">

              <div>

                <span className="status">
                  ●{' '}
                  {
                    selectedBusiness.status
                  }
                </span>

                <h1>
                  {
                    selectedBusiness.name
                  }
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
                    {
                      selectedBusiness.name
                    }
                  </h3>

                  <span className="business-status">
                    {
                      selectedBusiness.status
                    }
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
                  Assign an existing
                  JabangStore user as the
                  owner of this business.
                </p>

                {loadingUsers ? (
                  <p>
                    Loading users...
                  </p>
                ) : users.length ===
                  0 ? (
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
                      value={
                        selectedOwner
                      }
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
                            key={
                              user.id
                            }
                            value={
                              user.id
                            }
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
                  value={
                    businessName
                  }
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
                      setShowCreate(
                        false
                      );

                      setBusinessName(
                        ''
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
                      creating
                    }
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
                  {
                    businesses.length
                  }{' '}
                  business
                  {businesses.length ===
                  1
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

            {error &&
              !showCreate && (
                <div className="error">
                  {error}
                </div>
              )}

            {loadingBusinesses ? (
              <div className="empty-card">
                Loading businesses...
              </div>
            ) : businesses.length ===
              0 ? (
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
                    setShowCreate(
                      true
                    )
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
                      key={
                        business.id
                      }
                    >

                      <div className="business-icon">
                        🏢
                      </div>

                      <div className="business-info">

                        <h3>
                          {
                            business.name
                          }
                        </h3>

                        <span className="business-status">
                          {
                            business.status
                          }
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
   * ========================================================
   * OWNER LOADING
   * ========================================================
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
   * ========================================================
   * PRODUCTS PAGE
   * ========================================================
   */

  if (
    ownerPage ===
    'products'
  ) {
    return (
      <div className="dashboard-page">

        <header className="topbar">

          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>

            <small>
              {
                ownerBusiness.name
              }
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
                  value={
                    productName
                  }
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
                  value={
                    productSku
                  }
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
                  value={
                    productBarcode
                  }
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
                  value={
                    productCategory
                  }
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
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
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
                  {
                    products.length
                  }{' '}
                  product
                  {products.length ===
                  1
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
              value={
                productSearch
              }
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
            ) : filteredProducts.length ===
              0 ? (
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
                              {
                                product.name
                              }
                            </strong>

                            {product.barcode && (
                              <small
                                style={{
                                  display:
                                    'block',
                                }}
                              >
                                {
                                  product.barcode
                                }
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
                            {
                              product.sku ||
                              '—'
                            }
                          </td>

                          <td>
                            GMD{' '}
                            {formatGMD(
                              Number(
                                product.selling_price
                              )
                            )}
                          </td>

                          <td>
                            GMD{' '}
                            {formatGMD(
                              Number(
                                product.cost_price
                              )
                            )}
                          </td>

                          <td>

                            <span className="business-status">
                              {
                                product.is_active
                                  ? 'Active'
                                  : 'Inactive'
                              }
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
                    value={
                      categoryName
                    }
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
            ) : categories.length ===
              0 ? (
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
                      key={
                        category.id
                      }
                    >

                      <div className="business-icon">
                        🗂️
                      </div>

                      <div className="business-info">

                        <h3>
                          {
                            category.name
                          }
                        </h3>

                        <p>
                          {
                            category.description ||
                            'No description'
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

  /*
   * ========================================================
   * REAL INVENTORY PAGE
   * ========================================================
   */

  if (
    ownerPage ===
    'inventory'
  ) {
    return (
      <div className="dashboard-page">

        <header className="topbar">

          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>

            <small>
              {
                ownerBusiness.name
              }
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
                ● Inventory Management
              </span>

              <h1>
                Inventory
              </h1>

              <p>
                Monitor, restock and adjust
                your business stock.
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
                onClick={() =>
                  openRestock()
                }
                disabled={
                  branches.length ===
                  0 ||
                  inventorySummary.length ===
                  0
                }
              >
                + Restock
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  openAdjustment()
                }
                disabled={
                  branches.length ===
                  0 ||
                  inventorySummary.length ===
                  0
                }
              >
                Adjust Stock
              </button>

            </div>

          </section>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {branches.length ===
            0 && (
            <div className="error">
              No active branch is available.
              Create a branch before adding
              inventory.
            </div>
          )}

          {showRestockForm && (
            <section className="create-business-card">

              <h2>
                Restock Inventory
              </h2>

              <p>
                Add stock to the selected
                branch.
              </p>

              <form
                onSubmit={
                  restockProduct
                }
              >

                <label>
                  Branch *
                </label>

                <select
                  value={
                    selectedBranch
                  }
                  onChange={(e) =>
                    setSelectedBranch(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select branch
                  </option>

                  {branches.map(
                    (branch) => (
                      <option
                        key={
                          branch.id
                        }
                        value={
                          branch.id
                        }
                      >
                        {
                          branch.name
                        }
                      </option>
                    )
                  )}

                </select>

                <label>
                  Product *
                </label>

                <select
                  value={
                    restockProductId
                  }
                  onChange={(e) =>
                    setRestockProductId(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select product
                  </option>

                  {inventorySummary.map(
                    (item) => (
                      <option
                        key={
                          item.product_id
                        }
                        value={
                          item.product_id
                        }
                      >
                        {
                          item.product_name
                        }
                        {' — '}
                        Stock:{' '}
                        {
                          item.quantity
                        }
                      </option>
                    )
                  )}

                </select>

                <label>
                  Quantity to add *
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={
                    restockQuantity
                  }
                  onChange={(e) =>
                    setRestockQuantity(
                      e.target.value
                    )
                  }
                  placeholder="e.g. 20"
                />

                <label>
                  Unit cost (GMD)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    restockUnitCost
                  }
                  onChange={(e) =>
                    setRestockUnitCost(
                      e.target.value
                    )
                  }
                  placeholder="Optional"
                />

                <div className="form-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      closeRestock
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      restocking
                    }
                  >
                    {restocking
                      ? 'Restocking...'
                      : 'Confirm Restock'}
                  </button>

                </div>

              </form>

            </section>
          )}

          {showAdjustmentForm && (
            <section className="create-business-card">

              <h2>
                Adjust Stock
              </h2>

              <p>
                Use a positive number to add
                stock or a negative number to
                remove stock.
              </p>

              <form
                onSubmit={
                  adjustInventory
                }
              >

                <label>
                  Branch *
                </label>

                <select
                  value={
                    selectedBranch
                  }
                  onChange={(e) =>
                    setSelectedBranch(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select branch
                  </option>

                  {branches.map(
                    (branch) => (
                      <option
                        key={
                          branch.id
                        }
                        value={
                          branch.id
                        }
                      >
                        {
                          branch.name
                        }
                      </option>
                    )
                  )}

                </select>

                <label>
                  Product *
                </label>

                <select
                  value={
                    adjustmentProductId
                  }
                  onChange={(e) =>
                    setAdjustmentProductId(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select product
                  </option>

                  {inventorySummary.map(
                    (item) => (
                      <option
                        key={
                          item.product_id
                        }
                        value={
                          item.product_id
                        }
                      >
                        {
                          item.product_name
                        }
                        {' — '}
                        Stock:{' '}
                        {
                          item.quantity
                        }
                      </option>
                    )
                  )}

                </select>

                <label>
                  Adjustment quantity *
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={
                    adjustmentQuantity
                  }
                  onChange={(e) =>
                    setAdjustmentQuantity(
                      e.target.value
                    )
                  }
                  placeholder="e.g. 5 or -2"
                />

                <label>
                  Reason *
                </label>

                <textarea
                  value={
                    adjustmentReason
                  }
                  onChange={(e) =>
                    setAdjustmentReason(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Physical stock count correction"
                  rows={4}
                />

                <div className="form-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      closeAdjustment
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      adjusting
                    }
                  >
                    {adjusting
                      ? 'Adjusting...'
                      : 'Confirm Adjustment'}
                  </button>

                </div>

              </form>

            </section>
          )}

          <section className="business-section">

            <div className="section-title">

              <div>

                <h2>
                  Inventory Overview
                </h2>

                <p>
                  Live stock information from
                  Supabase.
                </p>

              </div>

              <button
                className="refresh-button"
                onClick={
                  refreshInventory
                }
                disabled={
                  loadingInventory
                }
              >
                {loadingInventory
                  ? 'Refreshing...'
                  : 'Refresh'}
              </button>

            </div>

            <div className="business-grid">

              <article className="business-card">

                <div className="business-icon">
                  📦
                </div>

                <div className="business-info">

                  <h3>
                    Products
                  </h3>

                  <p>
                    {
                      inventorySummary.length
                    }
                  </p>

                </div>

              </article>

              <article className="business-card">

                <div className="business-icon">
                  🔢
                </div>

                <div className="business-info">

                  <h3>
                    Total Units
                  </h3>

                  <p>
                    {
                      inventoryStats.totalUnits
                    }
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
                    {
                      inventoryStats.lowStock
                    }
                  </p>

                </div>

              </article>

              <article className="business-card">

                <div className="business-icon">
                  🚫
                </div>

                <div className="business-info">

                  <h3>
                    Out of Stock
                  </h3>

                  <p>
                    {
                      inventoryStats.outOfStock
                    }
                  </p>

                </div>

              </article>

              <article className="business-card">

                <div className="business-icon">
                  💰
                </div>

                <div className="business-info">

                  <h3>
                    Inventory Value
                  </h3>

                  <p>
                    GMD{' '}
                    {
                      formatGMD(
                        inventoryStats.inventoryValue
                      )
                    }
                  </p>

                </div>

              </article>

            </div>

          </section>

          <section className="business-section">

            <div className="section-title">

              <div>

                <h2>
                  Stock Levels
                </h2>

                <p>
                  Search and manage your
                  inventory.
                </p>

              </div>

            </div>

            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  'minmax(0, 1fr) minmax(180px, 260px)',
                gap: '12px',
                marginBottom:
                  '20px',
              }}
            >

              <input
                className="product-search"
                placeholder="Search product or SKU..."
                value={
                  inventorySearch
                }
                onChange={(e) =>
                  setInventorySearch(
                    e.target.value
                  )
                }
              />

              <select
                value={
                  selectedBranch
                }
                onChange={(e) =>
                  setSelectedBranch(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All / Select Branch
                </option>

                {branches.map(
                  (branch) => (
                    <option
                      key={
                        branch.id
                      }
                      value={
                        branch.id
                      }
                    >
                      {
                        branch.name
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            {loadingInventory ? (
              <div className="empty-card">
                Loading inventory...
              </div>
            ) : filteredInventory.length ===
              0 ? (
              <div className="empty-card">

                <div className="empty-icon">
                  📦
                </div>

                <h3>
                  No inventory records
                </h3>

                <p>
                  Create products and use
                  Restock to add your first
                  stock.
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
                        SKU
                      </th>

                      <th>
                        Stock
                      </th>

                      <th>
                        Alert At
                      </th>

                      <th>
                        Inventory Value
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredInventory.map(
                      (item) => (
                        <tr
                          key={
                            item.product_id
                          }
                        >

                          <td>
                            <strong>
                              {
                                item.product_name
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              item.sku ||
                              '—'
                            }
                          </td>

                          <td>
                            <strong>
                              {
                                item.quantity
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              item.low_stock_threshold
                            }
                          </td>

                          <td>
                            GMD{' '}
                            {
                              formatGMD(
                                Number(
                                  item.inventory_value
                                )
                              )
                            }
                          </td>

                          <td>

                            <span
                              className="business-status"
                              style={{
                                borderColor:
                                  item.status ===
                                  'out_of_stock'
                                    ? '#c0392b'
                                    : item.status ===
                                      'low_stock'
                                    ? '#d4af37'
                                    : undefined,
                              }}
                            >
                              {
                                statusLabel(
                                  item.status
                                )
                              }
                            </span>

                          </td>

                          <td>

                            <div
                              style={{
                                display:
                                  'flex',
                                gap:
                                  '8px',
                                flexWrap:
                                  'wrap',
                              }}
                            >

                              <button
                                className="primary-button"
                                onClick={() =>
                                  openRestock(
                                    item.product_id
                                  )
                                }
                              >
                                Restock
                              </button>

                              <button
                                className="secondary-button"
                                onClick={() =>
                                  openAdjustment(
                                    item.product_id
                                  )
                                }
                              >
                                Adjust
                              </button>

                            </div>

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
                  Inventory Movement History
                </h2>

                <p>
                  Every manual stock movement
                  recorded by JabangStore.
                </p>

              </div>

            </div>

            {loadingMovements ? (
              <div className="empty-card">
                Loading movement history...
              </div>
            ) : inventoryMovements.length ===
              0 ? (
              <div className="empty-card">

                <div className="empty-icon">
                  📋
                </div>

                <h3>
                  No movements yet
                </h3>

                <p>
                  Restocking or adjusting
                  inventory will create a
                  movement record here.
                </p>

              </div>
            ) : (
              <div className="table-wrapper">

                <table className="data-table">

                  <thead>

                    <tr>

                      <th>
                        Date
                      </th>

                      <th>
                        Product
                      </th>

                      <th>
                        Movement
                      </th>

                      <th>
                        Quantity
                      </th>

                      <th>
                        Reference
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {inventoryMovements.map(
                      (movement) => (
                        <tr
                          key={
                            movement.id
                          }
                        >

                          <td>
                            {new Date(
                              movement.created_at
                            ).toLocaleString()}
                          </td>

                          <td>
                            <strong>
                              {
                                movement.product_name
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              movement.movement_type
                            }
                          </td>

                          <td>
                            <strong>
                              {movement.quantity >
                              0
                                ? '+'
                                : ''}
                              {
                                movement.quantity
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              movement.reference_type ||
                              '—'
                            }
                          </td>

                        </tr>
                      )
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
   * ========================================================
   * POS
   * ========================================================
   */

  if (ownerPage === 'pos') {
    return (
      <div className="dashboard-page">
        <header className="topbar">
          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>
            <small>{ownerBusiness.name}</small>
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
              <span className="status">● POS Checkout</span>
              <h1>Point of Sale</h1>
              <p>Fast, secure checkout for {ownerBusiness.name}.</p>
            </div>

            <div className="form-actions">
              <button
                className="secondary-button"
                onClick={() => openOwnerPage('dashboard')}
              >
                ← Dashboard
              </button>

              <button
                className="secondary-button"
                onClick={() => loadPOSData(ownerBusiness.id)}
                disabled={posLoading || posCompleting}
              >
                {posLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </section>

          {error && <div className="error">{error}</div>}

          {branches.length === 0 ? (
            <section className="empty-card">
              <div className="empty-icon">🏪</div>
              <h3>No active branch available</h3>
              <p>Create an active branch before using the POS.</p>
            </section>
          ) : (
            <>
              <section className="business-section">
                <div className="section-title">
                  <div>
                    <h2>Checkout</h2>
                    <p>Select a branch, add products and complete the sale.</p>
                  </div>

                  <select
                    value={selectedBranch}
                    onChange={async (e) => {
                      const branchId = e.target.value;
                      setSelectedBranch(branchId);
                      setPosCart([]);
                      setPosReceipt(null);
                      setPosAmountReceived('');
                      await loadPOSStock(ownerBusiness.id, branchId);
                    }}
                    disabled={posCompleting}
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.5fr) minmax(340px, 0.8fr)',
                    gap: '20px',
                    alignItems: 'start',
                  }}
                >
                  <div>
                    <input
                      className="product-search"
                      placeholder="Search product, SKU or barcode..."
                      value={posSearch}
                      onChange={(e) => setPosSearch(e.target.value)}
                      autoFocus
                    />

                    {posLoading ? (
                      <div className="empty-card">Loading POS products...</div>
                    ) : filteredPOSProducts.length === 0 ? (
                      <div className="empty-card">
                        <div className="empty-icon">📦</div>
                        <h3>No products found</h3>
                        <p>Add active products or change your search.</p>
                      </div>
                    ) : (
                      <div
                        className="business-grid"
                        style={{ marginTop: '16px' }}
                      >
                        {filteredPOSProducts.map((product) => {
                          const stock = Number(posStock[product.id] || 0);
                          const inCart =
                            posCart.find((item) => item.id === product.id)?.quantity || 0;

                          return (
                            <button
                              key={product.id}
                              className="business-card"
                              onClick={() => addToPOSCart(product)}
                              disabled={stock <= inCart || posCompleting}
                              style={{ textAlign: 'left', cursor: stock > inCart ? 'pointer' : 'not-allowed' }}
                            >
                              <div className="business-icon">🛒</div>
                              <div className="business-info">
                                <h3>{product.name}</h3>
                                <p>GMD {formatGMD(Number(product.selling_price))}</p>
                                <p>
                                  Stock: {stock}
                                  {inCart > 0 ? ` · Cart: ${inCart}` : ''}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <aside
                    className="create-business-card"
                    style={{ position: 'sticky', top: '16px' }}
                  >
                    <div className="section-title">
                      <div>
                        <h2>Cart</h2>
                        <p>{posCart.length} product{posCart.length === 1 ? '' : 's'}</p>
                      </div>
                      {posCart.length > 0 && (
                        <button
                          className="secondary-button"
                          onClick={clearPOSCart}
                          disabled={posCompleting}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {posCart.length === 0 ? (
                      <div className="empty-card">
                        <div className="empty-icon">🛒</div>
                        <h3>Your cart is empty</h3>
                        <p>Click a product to add it to the sale.</p>
                      </div>
                    ) : (
                      <>
                        <div className="table-wrapper">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Total</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {posCart.map((item) => (
                                <tr key={item.id}>
                                  <td>
                                    <strong>{item.name}</strong>
                                    <small style={{ display: 'block' }}>
                                      GMD {formatGMD(Number(item.selling_price))}
                                    </small>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                      <button
                                        className="secondary-button"
                                        onClick={() => changePOSQuantity(item.id, item.quantity - 1)}
                                        disabled={posCompleting}
                                      >−</button>
                                      <strong>{item.quantity}</strong>
                                      <button
                                        className="secondary-button"
                                        onClick={() => changePOSQuantity(item.id, item.quantity + 1)}
                                        disabled={posCompleting || item.quantity >= Number(posStock[item.id] || 0)}
                                      >+</button>
                                    </div>
                                  </td>
                                  <td>
                                    GMD {formatGMD(Number(item.selling_price) * item.quantity - Number(item.itemDiscount || 0))}
                                  </td>
                                  <td>
                                    <button
                                      className="secondary-button"
                                      onClick={() => removeFromPOSCart(item.id)}
                                      disabled={posCompleting}
                                    >
                                      ×
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Subtotal</span>
                            <strong>GMD {formatGMD(posSubtotal)}</strong>
                          </div>

                          <label>Sale discount (GMD)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={posDiscount}
                            onChange={(e) => setPosDiscount(e.target.value)}
                            disabled={posCompleting}
                          />

                          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0', fontSize: '20px' }}>
                            <strong>Total</strong>
                            <strong>GMD {formatGMD(posTotal)}</strong>
                          </div>

                          <label>Payment method</label>
                          <select
                            value={posPaymentMethod}
                            onChange={(e) => {
                              setPosPaymentMethod(e.target.value);
                              if (e.target.value !== 'cash') setPosAmountReceived('');
                            }}
                            disabled={posCompleting}
                          >
                            <option value="cash">Cash</option>
                            <option value="mobile_money">Mobile Money</option>
                            <option value="card">Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                          </select>

                          {posPaymentMethod === 'cash' && (
                            <>
                              <label>Amount received (GMD)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={posAmountReceived}
                                onChange={(e) => setPosAmountReceived(e.target.value)}
                                placeholder={formatGMD(posTotal)}
                                disabled={posCompleting}
                              />

                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                <span>Change</span>
                                <strong>GMD {formatGMD(posChange)}</strong>
                              </div>
                            </>
                          )}

                          <button
                            className="primary-button"
                            onClick={completePOSSale}
                            disabled={posCompleting || posCart.length === 0}
                            style={{ width: '100%', marginTop: '20px' }}
                          >
                            {posCompleting ? 'Completing Sale...' : 'Complete Sale'}
                          </button>
                        </div>
                      </>
                    )}
                  </aside>
                </div>
              </section>

              {posReceipt && (
                <section className="business-section" id="pos-receipt">
                  <div className="create-business-card">
                    <div className="section-title">
                      <div>
                        <span className="status">● Sale Completed</span>
                        <h2>Receipt</h2>
                        <p>{posReceipt.sale_number}</p>
                      </div>
                      <div className="form-actions">
                        <button className="primary-button" onClick={printPOSReceipt}>Print Receipt</button>
                        <button className="secondary-button" onClick={() => setPosReceipt(null)}>Close</button>
                      </div>
                    </div>

                    <div style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'center' }}>
                      <h2>JabangStore</h2>
                      <p>{ownerBusiness.name}</p>
                      <hr />
                      <p><strong>Sale:</strong> {posReceipt.sale_number}</p>
                      <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
                      <hr />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal</span>
                        <span>GMD {formatGMD(posReceipt.subtotal)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Discount</span>
                        <span>GMD {formatGMD(posReceipt.discount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', marginTop: '10px' }}>
                        <strong>Total</strong>
                        <strong>GMD {formatGMD(posReceipt.total)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <span>Paid</span>
                        <span>GMD {formatGMD(posReceipt.amount_received)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Change</span>
                        <span>GMD {formatGMD(posReceipt.change_amount)}</span>
                      </div>
                      <hr />
                      <p>Thank you for your business.</p>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  /*
   * ========================================================
   * OTHER OWNER MODULES
   * ========================================================
   */

  if (
    ownerPage === 'customers' ||
    ownerPage === 'reports' ||
    ownerPage === 'settings'
  ) {
    const moduleNames = {
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
            <small>{ownerBusiness.name}</small>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Sign out
          </button>
        </header>

        <main className="admin-content">
          <button
            className="secondary-button"
            onClick={() => openOwnerPage('dashboard')}
          >
            ← Dashboard
          </button>

          <section className="empty-card">
            <div className="empty-icon">🚧</div>
            <h1>{moduleNames[ownerPage]}</h1>
            <p>This module will be connected in its dedicated implementation stage.</p>
          </section>
        </main>
      </div>
    );
  }

  /*
   * ========================================================
   * OWNER DASHBOARD
   * ========================================================
   */

  return (
    <div className="dashboard-page">

      <header className="topbar">

        <div>

          <div className="brand">
            Jabang<span>Store</span>
          </div>

          <small>
            {
              ownerBusiness.name
            }
          </small>

        </div>

        <button
          className="logout-button"
          onClick={
            handleLogout
          }
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
              {
                ownerBusiness.name
              }.
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
                  {
                    formatGMD(
                      dashboardStats.todaySales
                    )
                  }
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
                  {
                    dashboardStats.sales
                  }
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
                  {
                    dashboardStats.products
                  }
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
                  {
                    dashboardStats.customers
                  }
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
                  {
                    dashboardStats.lowStock
                  }
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

          {recentSales.length ===
          0 ? (
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
                        key={
                          sale.id
                        }
                      >

                        <td>
                          #
                          {
                            sale.id.slice(
                              0,
                              8
                            )
                          }
                        </td>

                        <td>
                          GMD{' '}
                          {
                            formatGMD(
                              Number(
                                sale.total
                              )
                            )
                          }
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

          {lowStockProducts.length ===
          0 ? (
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
                    key={
                      product.id
                    }
                  >

                    <div className="business-icon">
                      ⚠️
                    </div>

                    <div className="business-info">

                      <h3>
                        {
                          product.name
                        }
                      </h3>

                      <p>
                        Stock:{' '}
                        {
                          getProductStock(
                            product.id
                          )
                        }
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
