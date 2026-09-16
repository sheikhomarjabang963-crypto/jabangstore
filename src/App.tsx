import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from './lib/supabase';
import BusinessApplications from './pages/BusinessApplication';

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
  image_url: string | null;
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

type StaffMember = {
  member_id: string;
  user_id: string;
  email: string;
  role: string;
  assigned_branch_id: string | null;
  branch_name: string | null;
  joined_at: string;
};

type StaffInvite = {
  id: string;
  email: string;
  role: string;
  branch_id: string | null;
  status: string;
  created_at: string;
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

type ReceiptPayment = {
  method: string;
  amount: number;
};

type ReceiptItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
};

type SaleReceipt = {
  sale_id: string;
  sale_number: string;
  created_at: string;
  branch_name: string | null;
  customer_name: string | null;
  subtotal: number;
  discount: number;
  total: number;
  amount_received: number;
  change_amount: number;
  balance_due: number;
  payment_status: string;
  status: string;
  payments: ReceiptPayment[];
  items: ReceiptItem[];
};

type SaleHistoryRow = {
  id: string;
  sale_number: string;
  total: number;
  payment_status: string;
  status: string;
  created_at: string;
  customer_id: string | null;
};

type AuditLogRow = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
  user_id: string | null;
};

type PendingSale = {
  clientReferenceId: string;
  businessId: string;
  branchId: string;
  branchName: string | null;
  customerId: string | null;
  customerName: string | null;
  discount: number;
  items: {
    product_id: string;
    quantity: number;
    discount: number;
  }[];
  receiptItems: ReceiptItem[];
  payments: ReceiptPayment[];
  queuedAt: string;
  lastError: string | null;
};

type Customer = {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
};

type PurchaseCartItem = {
  product_id: string;
  name: string;
  quantity: number;
  unitCost: number;
};

type PurchaseRecord = {
  id: string;
  purchase_number: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_status: string;
  status: string;
  created_at: string;
};

type SaleForReturn = {
  id: string;
  sale_number: string;
  total: number;
  created_at: string;
};

type ReturnableItem = {
  product_id: string;
  name: string;
  sold_quantity: number;
  already_returned: number;
  unit_price: number;
  returnQuantity: number;
};

type ReturnRecord = {
  id: string;
  return_number: string;
  total_amount: number;
  reason: string | null;
  status: string;
  created_at: string;
};

type TopProduct = {
  product_id: string;
  name: string;
  quantity_sold: number;
  revenue: number;
};

type ReportsData = {
  todaySalesCount: number;
  todayRevenue: number;
  allTimeSalesCount: number;
  allTimeRevenue: number;
  totalPurchasesValue: number;
  topProducts: TopProduct[];
};

type OwnerPage =
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'pos'
  | 'sales'
  | 'purchases'
  | 'returns'
  | 'customers'
  | 'reports'
  | 'settings'
  | 'audit-log'
  | 'staff';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [platformRole, setPlatformRole] =
    useState('user');

  const [superAdminStoreView, setSuperAdminStoreView] =
    useState(false);

  const [myBusinessRole, setMyBusinessRole] =
    useState<string | null>(null);

  const [myAssignedBranchId, setMyAssignedBranchId] =
    useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [businesses, setBusinesses] =
    useState<Business[]>([]);

  const [loadingBusinesses, setLoadingBusinesses] =
    useState(false);

  const [showApplications, setShowApplications] =
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

  const [changingBusinessStatus, setChangingBusinessStatus] =
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

  const [showBranchForm, setShowBranchForm] =
    useState(false);

  const [editingBranchId, setEditingBranchId] =
    useState<string | null>(null);

  const [branchName, setBranchName] =
    useState('');

  const [branchAddress, setBranchAddress] =
    useState('');

  const [branchPhone, setBranchPhone] =
    useState('');

  const [savingBranch, setSavingBranch] =
    useState(false);

  const [staff, setStaff] =
    useState<StaffMember[]>([]);

  const [staffInvites, setStaffInvites] =
    useState<StaffInvite[]>([]);

  const [loadingStaff, setLoadingStaff] =
    useState(false);

  const [inviteEmail, setInviteEmail] =
    useState('');

  const [inviteRole, setInviteRole] =
    useState('cashier');

  const [inviteBranchId, setInviteBranchId] =
    useState('');

  const [sendingInvite, setSendingInvite] =
    useState(false);

  const [authMode, setAuthMode] =
    useState<'signin' | 'signup'>('signin');

  const [signUpEmail, setSignUpEmail] =
    useState('');

  const [signUpPassword, setSignUpPassword] =
    useState('');

  const [signUpConfirmPassword, setSignUpConfirmPassword] =
    useState('');

  const [signingUp, setSigningUp] =
    useState(false);

  const [signUpMessage, setSignUpMessage] =
    useState('');

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

  const [editingProductId, setEditingProductId] =
    useState<string | null>(null);

  const [editingCategoryId, setEditingCategoryId] =
    useState<string | null>(null);

  const [savingProduct, setSavingProduct] =
    useState(false);

  const [savingCategory, setSavingCategory] =
    useState(false);

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

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

  const [posDiscount, setPosDiscount] =
    useState('0');

  const [posCustomerId, setPosCustomerId] =
    useState('');

  const [posPayments, setPosPayments] =
    useState<ReceiptPayment[]>([]);

  const [posPaymentMethod, setPosPaymentMethod] =
    useState('cash');

  const [posPaymentAmount, setPosPaymentAmount] =
    useState('');

  const [posPaymentReference, setPosPaymentReference] =
    useState('');

  const [posCompleting, setPosCompleting] =
    useState(false);

  const [posLoading, setPosLoading] =
    useState(false);

  const [posReceipt, setPosReceipt] =
    useState<SaleReceipt | null>(null);

  const [salesHistory, setSalesHistory] =
    useState<SaleHistoryRow[]>([]);

  const [loadingSalesHistory, setLoadingSalesHistory] =
    useState(false);

  const [voidingSaleId, setVoidingSaleId] =
    useState<string | null>(null);

  const [auditLog, setAuditLog] =
    useState<AuditLogRow[]>([]);

  const [loadingAuditLog, setLoadingAuditLog] =
    useState(false);

  const [isOnline, setIsOnline] =
    useState(
      typeof navigator === 'undefined' ? true : navigator.onLine
    );

  const [pendingSales, setPendingSales] =
    useState<PendingSale[]>([]);

  const [syncingPendingSales, setSyncingPendingSales] =
    useState(false);

  /*
   * ========================================================
   * CUSTOMERS STATE
   * ========================================================
   */

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [loadingCustomers, setLoadingCustomers] =
    useState(false);

  const [newCustomerName, setNewCustomerName] =
    useState('');

  const [newCustomerPhone, setNewCustomerPhone] =
    useState('');

  const [newCustomerEmail, setNewCustomerEmail] =
    useState('');

  const [newCustomerAddress, setNewCustomerAddress] =
    useState('');

  const [creatingCustomer, setCreatingCustomer] =
    useState(false);

  /*
   * ========================================================
   * PURCHASES STATE
   * ========================================================
   */

  const [purchases, setPurchases] =
    useState<PurchaseRecord[]>([]);

  const [loadingPurchases, setLoadingPurchases] =
    useState(false);

  const [purchaseCart, setPurchaseCart] =
    useState<PurchaseCartItem[]>([]);

  const [purchaseProductId, setPurchaseProductId] =
    useState('');

  const [purchaseQuantity, setPurchaseQuantity] =
    useState('1');

  const [purchaseUnitCost, setPurchaseUnitCost] =
    useState('0');

  const [purchaseDiscount, setPurchaseDiscount] =
    useState('0');

  const [creatingPurchase, setCreatingPurchase] =
    useState(false);

  /*
   * ========================================================
   * RETURNS STATE
   * ========================================================
   */

  const [returns, setReturns] =
    useState<ReturnRecord[]>([]);

  const [loadingReturns, setLoadingReturns] =
    useState(false);

  const [returnableSales, setReturnableSales] =
    useState<SaleForReturn[]>([]);

  const [selectedSaleForReturn, setSelectedSaleForReturn] =
    useState('');

  const [returnableItems, setReturnableItems] =
    useState<ReturnableItem[]>([]);

  const [returnReason, setReturnReason] =
    useState('');

  const [creatingReturn, setCreatingReturn] =
    useState(false);

  /*
   * ========================================================
   * REPORTS STATE
   * ========================================================
   */

  const [reportsData, setReportsData] =
    useState<ReportsData | null>(null);

  const [loadingReports, setLoadingReports] =
    useState(false);

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

  // Track online/offline state so the UI can warn the cashier and
  // automatically retry any queued sales the moment connectivity returns.
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // The moment connectivity comes back, try to send up anything that
  // was queued while offline.
  useEffect(() => {
    if (isOnline && ownerBusiness) {
      syncPendingSales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, ownerBusiness?.id]);

  // Restore any unsynced sales and in-progress cart from a previous
  // session the moment a business is loaded (e.g. after a refresh or
  // the app being closed while offline).
  useEffect(() => {
    if (!ownerBusiness) return;

    setPendingSales(loadPendingSalesFromStorage(ownerBusiness.id));

    try {
      const raw = localStorage.getItem(
        posDraftStorageKey(ownerBusiness.id)
      );

      if (raw) {
        const draft = JSON.parse(raw);
        if (Array.isArray(draft.cart) && draft.cart.length > 0) {
          setPosCart(draft.cart);
          setPosDiscount(draft.discount || '0');
          setPosCustomerId(draft.customerId || '');
          setPosPayments(draft.payments || []);
        }
      }
    } catch {
      // ignore a corrupted draft rather than blocking the page
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerBusiness?.id]);

  // Keep the in-progress cart safely persisted as it changes, so a lost
  // connection, an accidental refresh, or the app closing doesn't lose
  // a sale the cashier was in the middle of ringing up.
  useEffect(() => {
    if (!ownerBusiness) return;

    if (
      posCart.length === 0 &&
      posPayments.length === 0 &&
      !posCustomerId &&
      posDiscount === '0'
    ) {
      return;
    }

    saveDraftCartToStorage(ownerBusiness.id, {
      cart: posCart,
      discount: posDiscount,
      customerId: posCustomerId,
      payments: posPayments,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posCart, posDiscount, posCustomerId, posPayments, ownerBusiness?.id]);

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

  async function changeBusinessStatus(newStatus: 'active' | 'suspended') {
    if (!selectedBusiness) return;

    if (newStatus === 'suspended') {
      const confirmed = window.confirm(
        `Suspend "${selectedBusiness.name}"? Users at this business will not be able to log in to their store until it is reactivated.`
      );

      if (!confirmed) return;
    }

    setChangingBusinessStatus(true);
    setError('');

    const { error } = await supabase.rpc('set_business_status', {
      target_business_id: selectedBusiness.id,
      target_status: newStatus,
    });

    if (error) {
      setError(error.message);
    } else {
      setSelectedBusiness({ ...selectedBusiness, status: newStatus });
      await loadBusinesses();
    }

    setChangingBusinessStatus(false);
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
          'business_id, role, assigned_branch_id'
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
      setMyBusinessRole(null);
      setMyAssignedBranchId(null);
      setOwnerLoading(false);
      return;
    }

    setMyBusinessRole(data.role);
    setMyAssignedBranchId(data.assigned_branch_id);

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

      if (business?.status === 'suspended') {
        setOwnerLoading(false);
        return;
      }

      await loadOwnerDashboard(
        data.business_id
      );
    }

    setOwnerLoading(false);
  }

  async function openStoreAsSuperAdmin() {
    if (!session?.user?.id) return;

    setOwnerLoading(true);
    setSuperAdminStoreView(true);
    setOwnerPage('dashboard');

    await loadOwnerBusiness(session.user.id);
  }

  function backToAdminPanel() {
    setSuperAdminStoreView(false);
    setOwnerPage('dashboard');
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
        )
        .neq('status', 'voided'),

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
        .neq('status', 'voided')
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
          'id, business_id, category_id, name, sku, barcode, description, selling_price, cost_price, low_stock_threshold, is_active, product_images(image_url, is_primary)'
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
      const mapped = (data || []).map((row: any) => {
        const images = row.product_images || [];
        const primary =
          images.find((img: any) => img.is_primary) || images[0];

        return {
          ...row,
          image_url: primary?.image_url || null,
        };
      });

      setProducts(mapped as Product[]);
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

  function startEditBranch(branch: Branch) {
    setEditingBranchId(branch.id);
    setBranchName(branch.name);
    setBranchAddress(branch.address || '');
    setBranchPhone(branch.phone || '');
    setShowBranchForm(true);
    setError('');
  }

  function resetBranchForm() {
    setEditingBranchId(null);
    setBranchName('');
    setBranchAddress('');
    setBranchPhone('');
    setShowBranchForm(false);
    setError('');
  }

  async function submitBranchForm(e: FormEvent) {
    e.preventDefault();

    if (!ownerBusiness) return;

    const name = branchName.trim();

    if (!name) {
      setError('Please enter a branch name.');
      return;
    }

    setSavingBranch(true);
    setError('');

    if (editingBranchId) {
      const { error } = await supabase
        .from('branches')
        .update({
          name,
          address: branchAddress.trim() || null,
          phone: branchPhone.trim() || null,
        })
        .eq('id', editingBranchId)
        .eq('business_id', ownerBusiness.id);

      if (error) {
        setError(error.message);
      } else {
        resetBranchForm();
        await loadBranches(ownerBusiness.id);
      }
    } else {
      const { error } = await supabase.from('branches').insert({
        business_id: ownerBusiness.id,
        name,
        address: branchAddress.trim() || null,
        phone: branchPhone.trim() || null,
        is_active: true,
      });

      if (error) {
        setError(error.message);
      } else {
        resetBranchForm();
        await loadBranches(ownerBusiness.id);
      }
    }

    setSavingBranch(false);
  }

  /*
   * ========================================================
   * STAFF MANAGEMENT
   * ========================================================
   */

  async function loadStaff(businessId: string) {
    setLoadingStaff(true);
    setError('');

    const [staffResult, invitesResult] = await Promise.all([
      supabase.rpc('get_business_staff', {
        target_business_id: businessId,
      }),
      supabase
        .from('staff_invites')
        .select('id, email, role, branch_id, status, created_at')
        .eq('business_id', businessId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);

    if (staffResult.error) {
      setError(staffResult.error.message);
    } else {
      setStaff((staffResult.data || []) as StaffMember[]);
    }

    if (invitesResult.error) {
      setError(invitesResult.error.message);
    } else {
      setStaffInvites((invitesResult.data || []) as StaffInvite[]);
    }

    setLoadingStaff(false);
  }

  async function sendStaffInvite(e: FormEvent) {
    e.preventDefault();

    if (!ownerBusiness) return;

    const email = inviteEmail.trim().toLowerCase();

    if (!email) {
      setError('Please enter an email address.');
      return;
    }

    setSendingInvite(true);
    setError('');

    const { error } = await supabase.from('staff_invites').insert({
      business_id: ownerBusiness.id,
      email,
      role: inviteRole,
      branch_id: inviteBranchId || null,
      invited_by: session?.user?.id || null,
    });

    if (error) {
      if (error.code === '23505') {
        setError(
          `${email} already has a pending invite to this business.`
        );
      } else {
        setError(error.message);
      }
    } else {
      setInviteEmail('');
      setInviteRole('cashier');
      setInviteBranchId('');
      await loadStaff(ownerBusiness.id);
    }

    setSendingInvite(false);
  }

  async function cancelStaffInvite(inviteId: string) {
    if (!ownerBusiness) return;

    const confirmed = window.confirm('Cancel this invite?');
    if (!confirmed) return;

    setError('');

    const { error } = await supabase
      .from('staff_invites')
      .delete()
      .eq('id', inviteId)
      .eq('business_id', ownerBusiness.id);

    if (error) {
      setError(error.message);
    } else {
      await loadStaff(ownerBusiness.id);
    }
  }

  async function removeStaffMember(memberId: string, email: string) {
    if (!ownerBusiness) return;

    const confirmed = window.confirm(
      `Remove ${email} from this business? They will immediately lose access.`
    );
    if (!confirmed) return;

    setError('');

    const { error } = await supabase
      .from('business_members')
      .delete()
      .eq('id', memberId)
      .eq('business_id', ownerBusiness.id);

    if (error) {
      setError(error.message);
    } else {
      await logAudit('remove_staff', 'business_member', memberId, { email });
      await loadStaff(ownerBusiness.id);
    }
  }

  async function updateStaffRole(memberId: string, newRole: string) {
    if (!ownerBusiness) return;

    setError('');

    const { error } = await supabase
      .from('business_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .eq('business_id', ownerBusiness.id);

    if (error) {
      setError(error.message);
    } else {
      await logAudit('update_staff_role', 'business_member', memberId, { new_role: newRole });
      await loadStaff(ownerBusiness.id);
    }
  }

  async function updateStaffBranch(memberId: string, branchId: string) {
    if (!ownerBusiness) return;

    setError('');

    const { error } = await supabase
      .from('business_members')
      .update({ assigned_branch_id: branchId || null })
      .eq('id', memberId)
      .eq('business_id', ownerBusiness.id);

    if (error) {
      setError(error.message);
    } else {
      await loadStaff(ownerBusiness.id);
    }
  }

  const CASHIER_TIER_PAGES: OwnerPage[] = [
    'dashboard',
    'pos',
    'sales',
    'customers',
  ];

  function isBusinessAdminTier() {
    return myBusinessRole === 'owner' || myBusinessRole === 'manager';
  }

  function roleBadgeLabel() {
    if (superAdminStoreView) return 'Super Admin (Operating Store)';

    switch (myBusinessRole) {
      case 'owner':
        return 'Owner';
      case 'manager':
        return 'Manager';
      case 'cashier':
        return 'Cashier';
      case 'inventory_staff':
        return 'Inventory Staff';
      default:
        return 'Staff';
    }
  }

  function RoleBadge() {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          marginTop: '4px',
          color: isBusinessAdminTier() ? 'var(--green)' : 'var(--gold-dark)',
          background: isBusinessAdminTier() ? 'var(--green-light)' : '#fff6e0',
          border: `1px solid ${isBusinessAdminTier() ? 'var(--green)' : 'var(--gold)'}`,
        }}
      >
        {roleBadgeLabel()}
      </span>
    );
  }

  function Sidebar() {
    const items: { key: OwnerPage; label: string; icon: string; adminOnly?: boolean }[] = [
      { key: 'dashboard', label: 'Dashboard', icon: '📊' },
      { key: 'pos', label: 'POS', icon: '🛒' },
      { key: 'sales', label: 'Sales History', icon: '🧾' },
      { key: 'customers', label: 'Customers', icon: '🧍' },
      { key: 'products', label: 'Products', icon: '📦', adminOnly: true },
      { key: 'inventory', label: 'Inventory', icon: '📋', adminOnly: true },
      { key: 'purchases', label: 'Purchases', icon: '🚚', adminOnly: true },
      { key: 'returns', label: 'Returns & Refunds', icon: '↩️', adminOnly: true },
      { key: 'reports', label: 'Reports', icon: '📈', adminOnly: true },
      { key: 'staff', label: 'Staff', icon: '👥', adminOnly: true },
      { key: 'settings', label: 'Settings', icon: '⚙️', adminOnly: true },
    ];

    const visibleItems = items.filter(
      (item) => !item.adminOnly || isBusinessAdminTier()
    );

    return (
      <>
        {sidebarOpen && (
          <div
            className="sidebar-scrim"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="app-sidebar-brand">
            <div className="brand">
              Jabang<span>Store</span>
            </div>
            <small>{ownerBusiness?.name}</small>
            <div style={{ marginTop: '8px' }}>
              <RoleBadge />
            </div>
          </div>

          <nav className="app-sidebar-nav">
            {visibleItems.map((item) => (
              <button
                key={item.key}
                className={`app-sidebar-link ${ownerPage === item.key ? 'active' : ''}`}
                onClick={() => {
                  openOwnerPage(item.key);
                  setSidebarOpen(false);
                }}
              >
                <span className="app-sidebar-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="app-sidebar-footer">
            {superAdminStoreView && (
              <button
                className="secondary-button"
                onClick={backToAdminPanel}
                style={{ width: '100%', marginBottom: '10px' }}
              >
                ← Back to Admin Panel
              </button>
            )}
            <button
              className="logout-button"
              onClick={handleLogout}
              style={{ width: '100%' }}
            >
              Sign out
            </button>
          </div>
        </aside>
      </>
    );
  }

  function MobileTopBar() {
    return (
      <header className="mobile-topbar">
        <button
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="brand" style={{ fontSize: '20px' }}>
          Jabang<span>Store</span>
        </div>
        <div style={{ width: '40px' }} />
      </header>
    );
  }

  async function openOwnerPage(
    page: OwnerPage
  ) {
    if (
      !isBusinessAdminTier() &&
      !CASHIER_TIER_PAGES.includes(page)
    ) {
      setError(
        `Your role (${roleBadgeLabel()}) doesn't have access to that section.`
      );
      return;
    }

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
      await Promise.all([
        loadPOSData(ownerBusiness.id),
        loadCustomers(ownerBusiness.id),
      ]);
    }

    if (page === 'sales') {
      await loadSalesHistory(ownerBusiness.id);
    }

    if (page === 'purchases') {
      await Promise.all([
        loadProducts(ownerBusiness.id),
        loadBranches(ownerBusiness.id),
        loadPurchases(ownerBusiness.id),
      ]);
    }

    if (page === 'returns') {
      await Promise.all([
        loadReturnableSales(ownerBusiness.id),
        loadReturnsList(ownerBusiness.id),
      ]);
    }

    if (page === 'customers') {
      await loadCustomers(ownerBusiness.id);
    }

    if (page === 'reports') {
      await loadReportsData(ownerBusiness.id);
    }

    if (page === 'settings') {
      await loadBranches(ownerBusiness.id);
    }

    if (page === 'audit-log') {
      await loadAuditLog(ownerBusiness.id);
    }

    if (page === 'staff') {
      await Promise.all([
        loadStaff(ownerBusiness.id),
        loadBranches(ownerBusiness.id),
      ]);
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

  function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductSku(product.sku || '');
    setProductBarcode(product.barcode || '');
    setProductDescription(product.description || '');
    setProductCategory(product.category_id || '');
    setProductSellingPrice(String(product.selling_price));
    setProductCostPrice(String(product.cost_price));
    setProductLowStock(String(product.low_stock_threshold));
    setShowProductForm(true);
    setError('');
  }

  async function uploadProductPhoto(productId: string, file: File) {
    if (!ownerBusiness) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be smaller than 5MB.');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    // Remove any existing photo for this product first (one photo per product)
    const { data: existing } = await supabase
      .from('product_images')
      .select('id, image_url')
      .eq('product_id', productId);

    if (existing && existing.length > 0) {
      for (const img of existing) {
        const path = img.image_url.split('/product-images/')[1];
        if (path) {
          await supabase.storage.from('product-images').remove([path]);
        }
      }

      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${ownerBusiness.id}/${productId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploadingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(path);

    const { error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url: urlData.publicUrl,
        is_primary: true,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      await loadProducts(ownerBusiness.id);
    }

    setUploadingPhoto(false);
  }

  async function removeProductPhoto(productId: string, imageUrl: string) {
    if (!ownerBusiness) return;

    const confirmed = window.confirm('Remove this product photo?');
    if (!confirmed) return;

    setError('');

    const path = imageUrl.split('/product-images/')[1];
    if (path) {
      await supabase.storage.from('product-images').remove([path]);
    }

    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    if (error) {
      setError(error.message);
    } else {
      await loadProducts(ownerBusiness.id);
    }
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProductName('');
    setProductSku('');
    setProductBarcode('');
    setProductDescription('');
    setProductCategory('');
    setProductSellingPrice('');
    setProductCostPrice('');
    setProductLowStock('5');
    setShowProductForm(false);
    setError('');
  }

  async function logAudit(
    action: string,
    entityType: string,
    entityId: string | null,
    details: Record<string, any> = {}
  ) {
    if (!ownerBusiness) return;

    // Best-effort logging: never block or surface errors from this to the user.
    await supabase.from('audit_logs').insert({
      business_id: ownerBusiness.id,
      user_id: session?.user?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });
  }

  async function loadAuditLog(businessId: string) {
    setLoadingAuditLog(true);
    setError('');

    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, details, created_at, user_id')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      setError(error.message);
    } else {
      setAuditLog((data || []) as AuditLogRow[]);
    }

    setLoadingAuditLog(false);
  }

  async function updateProduct(e: FormEvent) {
    e.preventDefault();

    if (!ownerBusiness || !editingProductId) return;

    const name = productName.trim();

    if (!name) {
      setError('Please enter a product name.');
      return;
    }

    const selling = Number(productSellingPrice);
    const cost = Number(productCostPrice);
    const threshold = Number(productLowStock);

    if (Number.isNaN(selling) || selling < 0) {
      setError('Please enter a valid selling price.');
      return;
    }

    if (Number.isNaN(cost) || cost < 0) {
      setError('Please enter a valid cost price.');
      return;
    }

    if (Number.isNaN(threshold) || threshold < 0) {
      setError('Please enter a valid low-stock threshold.');
      return;
    }

    setSavingProduct(true);
    setError('');

    const { error } = await supabase
      .from('products')
      .update({
        name,
        sku: productSku.trim() || null,
        barcode: productBarcode.trim() || null,
        description: productDescription.trim() || null,
        category_id: productCategory || null,
        selling_price: selling,
        cost_price: cost,
        low_stock_threshold: threshold,
      })
      .eq('id', editingProductId)
      .eq('business_id', ownerBusiness.id);

    if (error) {
      setError(error.message);
    } else {
      await logAudit('update_product', 'product', editingProductId, { name });
      resetProductForm();
      await loadProducts(ownerBusiness.id);
      await loadOwnerDashboard(ownerBusiness.id);
    }

    setSavingProduct(false);
  }

  async function submitProductForm(e: FormEvent) {
    if (editingProductId) {
      await updateProduct(e);
    } else {
      await createProduct(e);
    }
  }

  async function deleteProduct(productId: string, productName: string) {
    if (!ownerBusiness) return;

    const confirmed = window.confirm(
      `Delete "${productName}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError('');

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('business_id', ownerBusiness.id);

    if (error) {
      if (error.code === '23503') {
        const deactivateInstead = window.confirm(
          `"${productName}" already has sales, purchase, or return history, so it can't be permanently deleted. Deactivate it instead? Deactivated products stay in your records but no longer show up in POS or search.`
        );

        if (deactivateInstead) {
          await deactivateProduct(productId);
        }
      } else {
        setError(error.message);
      }
    } else {
      await logAudit('delete_product', 'product', productId, { name: productName });
      await loadProducts(ownerBusiness.id);
      await loadOwnerDashboard(ownerBusiness.id);
    }
  }

  async function deactivateProduct(productId: string) {
    if (!ownerBusiness) return;

    setError('');

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)
      .eq('business_id', ownerBusiness.id);

    if (error) {
      setError(error.message);
    } else {
      await logAudit('deactivate_product', 'product', productId, {});
      await loadProducts(ownerBusiness.id);
      await loadOwnerDashboard(ownerBusiness.id);
    }
  }

  function startEditCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setShowCategoryForm(true);
    setError('');
  }

  function resetCategoryForm() {
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryDescription('');
    setShowCategoryForm(false);
    setError('');
  }

  async function updateCategory(e: FormEvent) {
    e.preventDefault();

    if (!ownerBusiness || !editingCategoryId) return;

    const name = categoryName.trim();

    if (!name) {
      setError('Please enter a category name.');
      return;
    }

    setSavingCategory(true);
    setError('');

    const { error } = await supabase
      .from('categories')
      .update({
        name,
        description: categoryDescription.trim() || null,
      })
      .eq('id', editingCategoryId)
      .eq('business_id', ownerBusiness.id);

    if (error) {
      setError(error.message);
    } else {
      await logAudit('update_category', 'category', editingCategoryId, { name });
      resetCategoryForm();
      await loadCategories(ownerBusiness.id);
    }

    setSavingCategory(false);
  }

  async function submitCategoryForm(e: FormEvent) {
    if (editingCategoryId) {
      await updateCategory(e);
    } else {
      await createCategory(e);
    }
  }

  async function deleteCategory(categoryId: string, categoryName: string) {
    if (!ownerBusiness) return;

    const confirmed = window.confirm(
      `Delete the category "${categoryName}"? Products in this category will become uncategorized, not deleted.`
    );

    if (!confirmed) return;

    setError('');

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('business_id', ownerBusiness.id);

    if (error) {
      setError(error.message);
    } else {
      await logAudit('delete_category', 'category', categoryId, { name: categoryName });
      await loadCategories(ownerBusiness.id);
      await loadProducts(ownerBusiness.id);
    }
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

  /*
   * ========================================================
   * OFFLINE RESILIENCE (POS)
   * ========================================================
   */

  function pendingSalesStorageKey(businessId: string) {
    return `jabangstore_pending_sales_${businessId}`;
  }

  function posDraftStorageKey(businessId: string) {
    return `jabangstore_pos_draft_${businessId}`;
  }

  function loadPendingSalesFromStorage(businessId: string): PendingSale[] {
    try {
      const raw = localStorage.getItem(pendingSalesStorageKey(businessId));
      return raw ? (JSON.parse(raw) as PendingSale[]) : [];
    } catch {
      return [];
    }
  }

  function savePendingSalesToStorage(businessId: string, sales: PendingSale[]) {
    try {
      localStorage.setItem(
        pendingSalesStorageKey(businessId),
        JSON.stringify(sales)
      );
    } catch {
      // localStorage may be unavailable (private browsing, storage full).
      // The in-memory queue still holds the data for this session, and a
      // manual "Retry Sync" click will still work as long as the tab stays open.
    }
  }

  function saveDraftCartToStorage(
    businessId: string,
    draft: {
      cart: POSCartItem[];
      discount: string;
      customerId: string;
      payments: ReceiptPayment[];
    }
  ) {
    try {
      localStorage.setItem(
        posDraftStorageKey(businessId),
        JSON.stringify(draft)
      );
    } catch {
      // ignore -- draft persistence is a convenience, not critical data
    }
  }

  function clearDraftCartFromStorage(businessId: string) {
    try {
      localStorage.removeItem(posDraftStorageKey(businessId));
    } catch {
      // ignore
    }
  }

  function isNetworkError(err: any) {
    if (!isOnline) return true;

    // A real error from our own database functions always carries a
    // proper Postgres error code (e.g. 'P0001' for a validation failure,
    // '23503' for a foreign key violation, etc). A request that never
    // reached the server at all -- a dropped connection, DNS failure,
    // timeout -- comes back from supabase-js with no code at all. That
    // is a much more reliable signal than trying to match browser-specific
    // wording like "Failed to fetch" vs "NetworkError" vs "Load failed".
    if (!err?.code) return true;

    const message = String(err?.message || '').toLowerCase();

    return (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('load failed') ||
      message.includes('timed out') ||
      message.includes('timeout') ||
      message.includes('connection')
    );
  }

  async function syncPendingSales() {
    if (!ownerBusiness) return;
    if (syncingPendingSales) return;

    const currentQueue = loadPendingSalesFromStorage(ownerBusiness.id);

    if (currentQueue.length === 0) {
      setPendingSales([]);
      return;
    }

    setSyncingPendingSales(true);

    const stillPending: PendingSale[] = [];
    let anySucceeded = false;

    for (const pending of currentQueue) {
      const { error } = await supabase.rpc('create_pos_sale', {
        target_business_id: pending.businessId,
        target_branch_id: pending.branchId,
        target_customer_id: pending.customerId,
        target_discount: pending.discount,
        target_items: pending.items,
        target_payments: pending.payments,
        target_client_reference_id: pending.clientReferenceId,
      });

      if (error) {
        stillPending.push({ ...pending, lastError: error.message });
      } else {
        anySucceeded = true;
      }
    }

    setPendingSales(stillPending);
    savePendingSalesToStorage(ownerBusiness.id, stillPending);

    if (anySucceeded) {
      await Promise.all([
        loadOwnerDashboard(ownerBusiness.id),
        loadInventory(ownerBusiness.id),
      ]);
    }

    setSyncingPendingSales(false);
  }

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
      myAssignedBranchId &&
      branchData.some((branch) => branch.id === myAssignedBranchId)
        ? myAssignedBranchId
        : selectedBranch && branchData.some((branch) => branch.id === selectedBranch)
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
    setPosPayments([]);
    setPosPaymentAmount('');
    setPosCustomerId('');
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

  const posReceived = posPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const posChange = Math.max(
    0,
    posReceived - posTotal
  );

  const posBalanceDue = Math.max(
    0,
    posTotal - posReceived
  );

  function addPosPayment() {
    setError('');

    const amount = Number(posPaymentAmount || 0);

    if (amount <= 0) {
      setError('Enter a payment amount greater than zero.');
      return;
    }

    setPosPayments((prev) => [
      ...prev,
      {
        method: posPaymentMethod,
        amount,
      },
    ]);

    setPosPaymentAmount('');
  }

  function removePosPayment(index: number) {
    setPosPayments((prev) => prev.filter((_, i) => i !== index));
  }

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

    if (posBalanceDue > 0 && !posCustomerId) {
      setError(
        `Payment is short by GMD ${formatGMD(
          posBalanceDue
        )}. Select a customer to complete this as a credit sale, or add more payment.`
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

    const payments = posPayments.map((payment) => ({
      method: payment.method,
      amount: payment.amount,
    }));

    const branchName =
      branches.find((b) => b.id === selectedBranch)?.name || null;

    const customerName = posCustomerId
      ? customers.find((c) => c.id === posCustomerId)?.name || null
      : null;

    const receiptItems: ReceiptItem[] = posCart.map((item) => ({
      product_name: item.name,
      quantity: item.quantity,
      unit_price: Number(item.selling_price || 0),
      discount: Number(item.itemDiscount || 0),
      line_total:
        Number(item.selling_price || 0) * item.quantity -
        Number(item.itemDiscount || 0),
    }));

    // Generated up front so a retry (automatic or manual) after a dropped
    // connection reuses the exact same key -- the database will recognize
    // it and return the original sale instead of creating a duplicate.
    const clientReferenceId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const { data, error } = await supabase.rpc(
      'create_pos_sale',
      {
        target_business_id: ownerBusiness.id,
        target_branch_id: selectedBranch,
        target_customer_id: posCustomerId || null,
        target_discount: posSaleDiscount,
        target_items: items,
        target_payments: payments,
        target_client_reference_id: clientReferenceId,
      }
    );

    if (error) {
      if (isNetworkError(error)) {
        // No connection right now. The sale is not lost: queue it locally,
        // clear the till for the next customer, and it will be sent
        // automatically the moment connectivity returns (or via "Retry
        // Sync Now"). Stock and totals are only applied once the server
        // actually confirms it.
        const queued: PendingSale = {
          clientReferenceId,
          businessId: ownerBusiness.id,
          branchId: selectedBranch,
          branchName,
          customerId: posCustomerId || null,
          customerName,
          discount: posSaleDiscount,
          items,
          receiptItems,
          payments,
          queuedAt: new Date().toISOString(),
          lastError: null,
        };

        const updatedQueue = [
          ...loadPendingSalesFromStorage(ownerBusiness.id),
          queued,
        ];

        setPendingSales(updatedQueue);
        savePendingSalesToStorage(ownerBusiness.id, updatedQueue);

        const queuedReceipt: SaleReceipt = {
          sale_id: clientReferenceId,
          sale_number: 'Pending sync (offline)',
          created_at: queued.queuedAt,
          branch_name: branchName,
          customer_name: customerName,
          subtotal: posSubtotal,
          discount: posSaleDiscount,
          total: posTotal,
          amount_received: posReceived,
          change_amount: posChange,
          balance_due: posBalanceDue,
          payment_status: posBalanceDue > 0 ? 'partial' : 'paid',
          status: 'queued',
          payments,
          items: receiptItems,
        };

        setPosReceipt(queuedReceipt);
        setPosCart([]);
        setPosDiscount('0');
        setPosPayments([]);
        setPosPaymentAmount('');
        setPosCustomerId('');
        clearDraftCartFromStorage(ownerBusiness.id);
        setPosCompleting(false);
        return;
      }

      // A real error from the server (out of stock, permission, etc.) --
      // not a connectivity problem, so retrying won't help. Show it and
      // leave the cart exactly as the cashier had it.
      setError(error.message);
      setPosCompleting(false);
      await loadPOSStock(ownerBusiness.id, selectedBranch);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      setError('Sale completed but no receipt data was returned.');
      setPosCompleting(false);
      return;
    }

    const normalizedReceipt: SaleReceipt = {
      sale_id: result.sale_id,
      sale_number: result.sale_number,
      created_at: new Date().toISOString(),
      branch_name: branchName,
      customer_name: customerName,
      subtotal: Number(result.subtotal || 0),
      discount: Number(result.discount || 0),
      total: Number(result.total || 0),
      amount_received: Number(result.amount_received || 0),
      change_amount: Number(result.change_amount || 0),
      balance_due: Math.max(
        0,
        Number(result.total || 0) - Number(result.amount_received || 0)
      ),
      payment_status: result.payment_status || 'paid',
      status: 'completed',
      payments,
      items: receiptItems,
    };

    setPosReceipt(normalizedReceipt);
    setPosCart([]);
    setPosDiscount('0');
    setPosPayments([]);
    setPosPaymentAmount('');
    setPosCustomerId('');
    clearDraftCartFromStorage(ownerBusiness.id);

    await Promise.all([
      loadPOSStock(ownerBusiness.id, selectedBranch),
      loadOwnerDashboard(ownerBusiness.id),
      loadCustomers(ownerBusiness.id),
    ]);

    setPosCompleting(false);
  }

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function printReceipt(receipt: SaleReceipt) {
    if (!ownerBusiness) return;

    const receiptWindow = window.open('', '_blank', 'width=420,height=700');

    if (!receiptWindow) {
      setError('Please allow pop-ups in your browser to print the receipt.');
      return;
    }

    const itemRows = receipt.items
      .map(
        (item) => `
          <div class="row">
            <span>${escapeHtml(item.product_name)} x${item.quantity}</span>
            <span>GMD ${formatGMD(item.line_total)}</span>
          </div>
        `
      )
      .join('');

    const paymentRows = receipt.payments
      .map(
        (payment) => `
          <div class="row">
            <span>Paid (${escapeHtml(payment.method)})</span>
            <span>GMD ${formatGMD(payment.amount)}</span>
          </div>
        `
      )
      .join('');

    receiptWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(receipt.sale_number)}</title>
          <style>
            body { font-family: Arial, sans-serif; width: 300px; margin: 20px auto; color: #111; }
            h2, p { text-align: center; margin: 6px 0; }
            hr { border: 0; border-top: 1px dashed #999; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 13px; }
            .total { font-size: 18px; font-weight: 700; margin-top: 12px; }
            .due { color: #c0392b; font-weight: 700; }
          </style>
        </head>
        <body>
          <h2>JabangStore</h2>
          <p>${escapeHtml(ownerBusiness.name)}</p>
          ${receipt.branch_name ? `<p>${escapeHtml(receipt.branch_name)}</p>` : ''}
          <hr />
          <p><strong>${escapeHtml(receipt.sale_number)}</strong></p>
          <p>${new Date(receipt.created_at).toLocaleString()}</p>
          ${receipt.customer_name ? `<p>Customer: ${escapeHtml(receipt.customer_name)}</p>` : ''}
          ${receipt.status === 'voided' ? '<p><strong>*** VOIDED ***</strong></p>' : ''}
          ${receipt.status === 'queued' ? '<p><strong>*** PENDING SYNC (recorded offline) ***</strong></p>' : ''}
          <hr />
          ${itemRows}
          <hr />
          <div class="row"><span>Subtotal</span><span>GMD ${formatGMD(receipt.subtotal)}</span></div>
          <div class="row"><span>Discount</span><span>GMD ${formatGMD(receipt.discount)}</span></div>
          <div class="row total"><span>Total</span><span>GMD ${formatGMD(receipt.total)}</span></div>
          <hr />
          ${paymentRows}
          <div class="row"><span>Change</span><span>GMD ${formatGMD(receipt.change_amount)}</span></div>
          ${
            receipt.balance_due > 0
              ? `<div class="row due"><span>Balance Due</span><span>GMD ${formatGMD(receipt.balance_due)}</span></div>`
              : ''
          }
          <hr />
          <p>Thank you for your business.</p>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  }

  async function loadSalesHistory(businessId: string) {
    setLoadingSalesHistory(true);
    setError('');

    const { data, error } = await supabase
      .from('sales')
      .select(
        'id, sale_number, total, payment_status, status, created_at, customer_id'
      )
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      setError(error.message);
    } else {
      setSalesHistory((data || []) as SaleHistoryRow[]);
    }

    setLoadingSalesHistory(false);
  }

  async function reprintSale(sale: SaleHistoryRow) {
    setError('');

    const [saleResult, itemsResult, paymentsResult] = await Promise.all([
      supabase
        .from('sales')
        .select('id, sale_number, subtotal, discount, total, payment_status, status, created_at, branch_id, customer_id')
        .eq('id', sale.id)
        .maybeSingle(),
      supabase
        .from('sale_items')
        .select('quantity, unit_price, discount, line_total, products(name)')
        .eq('sale_id', sale.id),
      supabase
        .from('payments')
        .select('payment_method, amount')
        .eq('sale_id', sale.id),
    ]);

    if (saleResult.error || !saleResult.data) {
      setError(saleResult.error?.message || 'Could not load this sale.');
      return;
    }

    if (itemsResult.error) {
      setError(itemsResult.error.message);
      return;
    }

    const saleData: any = saleResult.data;

    const branchName =
      branches.find((b) => b.id === saleData.branch_id)?.name || null;

    const customerName = saleData.customer_id
      ? customers.find((c) => c.id === saleData.customer_id)?.name || null
      : null;

    const amountReceived = (paymentsResult.data || []).reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0
    );

    const receipt: SaleReceipt = {
      sale_id: saleData.id,
      sale_number: saleData.sale_number,
      created_at: saleData.created_at,
      branch_name: branchName,
      customer_name: customerName,
      subtotal: Number(saleData.subtotal || 0),
      discount: Number(saleData.discount || 0),
      total: Number(saleData.total || 0),
      amount_received: amountReceived,
      change_amount: Math.max(0, amountReceived - Number(saleData.total || 0)),
      balance_due: Math.max(0, Number(saleData.total || 0) - amountReceived),
      payment_status: saleData.payment_status,
      status: saleData.status,
      payments: (paymentsResult.data || []).map((p: any) => ({
        method: p.payment_method,
        amount: Number(p.amount || 0),
      })),
      items: (itemsResult.data || []).map((item: any) => ({
        product_name: item.products?.name || 'Unknown product',
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        discount: Number(item.discount || 0),
        line_total: Number(item.line_total || 0),
      })),
    };

    printReceipt(receipt);
  }

  async function voidSale(saleId: string) {
    if (!ownerBusiness) return;

    const reason = window.prompt(
      'Reason for voiding this sale (optional):'
    );

    if (reason === null) return; // user cancelled the prompt

    const confirmed = window.confirm(
      'Void this sale? This restores the stock and cannot be undone.'
    );

    if (!confirmed) return;

    setVoidingSaleId(saleId);
    setError('');

    const { error } = await supabase.rpc('void_sale', {
      target_business_id: ownerBusiness.id,
      target_sale_id: saleId,
      target_reason: reason.trim() || null,
    });

    if (error) {
      setError(error.message);
    } else {
      await Promise.all([
        loadSalesHistory(ownerBusiness.id),
        loadOwnerDashboard(ownerBusiness.id),
        loadInventory(ownerBusiness.id),
      ]);
    }

    setVoidingSaleId(null);
  }

  /*
   * ========================================================
   * CUSTOMERS
   * ========================================================
   */

  async function loadCustomers(businessId: string) {
    setLoadingCustomers(true);
    setError('');

    const { data, error } = await supabase
      .from('customers')
      .select(
        'id, business_id, name, phone, email, address, credit_limit, current_balance, is_active, created_at'
      )
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setCustomers((data || []) as Customer[]);
    }

    setLoadingCustomers(false);
  }

  async function createCustomer(e: FormEvent) {
    e.preventDefault();

    if (!ownerBusiness) return;

    const name = newCustomerName.trim();

    if (!name) {
      setError('Please enter a customer name.');
      return;
    }

    setCreatingCustomer(true);
    setError('');

    const { error } = await supabase.from('customers').insert({
      business_id: ownerBusiness.id,
      name,
      phone: newCustomerPhone.trim() || null,
      email: newCustomerEmail.trim() || null,
      address: newCustomerAddress.trim() || null,
    });

    if (error) {
      setError(error.message);
    } else {
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setNewCustomerAddress('');
      await loadCustomers(ownerBusiness.id);
    }

    setCreatingCustomer(false);
  }

  /*
   * ========================================================
   * PURCHASES (no supplier field \u2014 by design)
   * ========================================================
   */

  async function loadPurchases(businessId: string) {
    setLoadingPurchases(true);
    setError('');

    const { data, error } = await supabase
      .from('purchases')
      .select(
        'id, purchase_number, subtotal, discount, total, payment_status, status, created_at'
      )
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
    } else {
      setPurchases((data || []) as PurchaseRecord[]);
    }

    setLoadingPurchases(false);
  }

  function addPurchaseCartItem() {
    setError('');

    if (!purchaseProductId) {
      setError('Please select a product.');
      return;
    }

    const quantity = Number(purchaseQuantity || 0);
    const unitCost = Number(purchaseUnitCost || 0);

    if (quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (unitCost < 0) {
      setError('Unit cost cannot be negative.');
      return;
    }

    const product = products.find((p) => p.id === purchaseProductId);

    if (!product) return;

    setPurchaseCart((prev) => [
      ...prev,
      {
        product_id: product.id,
        name: product.name,
        quantity,
        unitCost,
      },
    ]);

    setPurchaseProductId('');
    setPurchaseQuantity('1');
    setPurchaseUnitCost('0');
  }

  function removePurchaseCartItem(productId: string) {
    setPurchaseCart((prev) =>
      prev.filter((item) => item.product_id !== productId)
    );
  }

  const purchaseSubtotal = useMemo(
    () =>
      purchaseCart.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0
      ),
    [purchaseCart]
  );

  async function submitPurchase() {
    if (!ownerBusiness) return;

    if (!selectedBranch) {
      setError('Please select a branch before recording the purchase.');
      return;
    }

    if (purchaseCart.length === 0) {
      setError('Add at least one item to the purchase.');
      return;
    }

    setCreatingPurchase(true);
    setError('');

    const items = purchaseCart.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unitCost,
      discount: 0,
    }));

    const { error } = await supabase.rpc('create_purchase', {
      target_business_id: ownerBusiness.id,
      target_branch_id: selectedBranch,
      target_discount: Number(purchaseDiscount || 0),
      target_items: items,
    });

    if (error) {
      setError(error.message);
    } else {
      setPurchaseCart([]);
      setPurchaseDiscount('0');
      await Promise.all([
        loadPurchases(ownerBusiness.id),
        loadInventory(ownerBusiness.id),
      ]);
    }

    setCreatingPurchase(false);
  }

  /*
   * ========================================================
   * RETURNS / REFUNDS
   * ========================================================
   */

  async function loadReturnableSales(businessId: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('id, sale_number, total, created_at')
      .eq('business_id', businessId)
      .neq('status', 'voided')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
    } else {
      setReturnableSales((data || []) as SaleForReturn[]);
    }
  }

  async function loadReturnsList(businessId: string) {
    setLoadingReturns(true);
    setError('');

    const { data, error } = await supabase
      .from('returns')
      .select(
        'id, return_number, total_amount, reason, status, created_at'
      )
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
    } else {
      setReturns((data || []) as ReturnRecord[]);
    }

    setLoadingReturns(false);
  }

  async function selectSaleForReturn(saleId: string) {
    setSelectedSaleForReturn(saleId);
    setReturnableItems([]);
    setError('');

    if (!saleId) return;

    const [itemsResult, returnedResult] = await Promise.all([
      supabase
        .from('sale_items')
        .select('product_id, quantity, unit_price, products(name)')
        .eq('sale_id', saleId),
      supabase
        .from('return_items')
        .select('product_id, quantity, returns!inner(sale_id)')
        .eq('returns.sale_id', saleId),
    ]);

    if (itemsResult.error) {
      setError(itemsResult.error.message);
      return;
    }

    const returnedByProduct: Record<string, number> = {};

    (returnedResult.data || []).forEach((row: any) => {
      returnedByProduct[row.product_id] =
        (returnedByProduct[row.product_id] || 0) +
        Number(row.quantity || 0);
    });

    const items: ReturnableItem[] = (itemsResult.data || []).map(
      (row: any) => {
        const alreadyReturned =
          returnedByProduct[row.product_id] || 0;

        return {
          product_id: row.product_id,
          name: row.products?.name || 'Unknown product',
          sold_quantity: Number(row.quantity || 0),
          already_returned: alreadyReturned,
          unit_price: Number(row.unit_price || 0),
          returnQuantity: 0,
        };
      }
    );

    setReturnableItems(items);
  }

  function updateReturnQuantity(productId: string, quantity: number) {
    setReturnableItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, returnQuantity: quantity }
          : item
      )
    );
  }

  async function submitReturn() {
    if (!ownerBusiness) return;

    if (!selectedSaleForReturn) {
      setError('Please select the original sale first.');
      return;
    }

    const itemsToReturn = returnableItems.filter(
      (item) => item.returnQuantity > 0
    );

    if (itemsToReturn.length === 0) {
      setError('Enter a quantity for at least one item to return.');
      return;
    }

    setCreatingReturn(true);
    setError('');

    const items = itemsToReturn.map((item) => ({
      product_id: item.product_id,
      quantity: item.returnQuantity,
    }));

    const { error } = await supabase.rpc('create_return', {
      target_business_id: ownerBusiness.id,
      target_sale_id: selectedSaleForReturn,
      target_customer_id: null,
      target_reason: returnReason.trim() || null,
      target_items: items,
    });

    if (error) {
      setError(error.message);
    } else {
      setSelectedSaleForReturn('');
      setReturnableItems([]);
      setReturnReason('');
      await Promise.all([
        loadReturnsList(ownerBusiness.id),
        loadInventory(ownerBusiness.id),
      ]);
    }

    setCreatingReturn(false);
  }

  /*
   * ========================================================
   * REPORTS
   * ========================================================
   */

  async function loadReportsData(businessId: string) {
    setLoadingReports(true);
    setError('');

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      allSalesResult,
      todaySalesResult,
      purchasesResult,
      saleItemsResult,
    ] = await Promise.all([
      supabase
        .from('sales')
        .select('total', { count: 'exact' })
        .eq('business_id', businessId)
        .neq('status', 'voided'),
      supabase
        .from('sales')
        .select('total', { count: 'exact' })
        .eq('business_id', businessId)
        .neq('status', 'voided')
        .gte('created_at', startOfToday.toISOString()),
      supabase
        .from('purchases')
        .select('total')
        .eq('business_id', businessId),
      supabase
        .from('sale_items')
        .select('product_id, quantity, line_total, products(name), sales!inner(status)')
        .neq('sales.status', 'voided'),
    ]);

    if (allSalesResult.error) {
      setError(allSalesResult.error.message);
      setLoadingReports(false);
      return;
    }

    const allTimeRevenue = (allSalesResult.data || []).reduce(
      (sum: number, row: any) => sum + Number(row.total || 0),
      0
    );

    const todayRevenue = (todaySalesResult.data || []).reduce(
      (sum: number, row: any) => sum + Number(row.total || 0),
      0
    );

    const totalPurchasesValue = (purchasesResult.data || []).reduce(
      (sum: number, row: any) => sum + Number(row.total || 0),
      0
    );

    const productTotals: Record<string, TopProduct> = {};

    (saleItemsResult.data || []).forEach((row: any) => {
      const id = row.product_id;

      if (!productTotals[id]) {
        productTotals[id] = {
          product_id: id,
          name: row.products?.name || 'Unknown product',
          quantity_sold: 0,
          revenue: 0,
        };
      }

      productTotals[id].quantity_sold += Number(row.quantity || 0);
      productTotals[id].revenue += Number(row.line_total || 0);
    });

    const topProducts = Object.values(productTotals)
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, 5);

    setReportsData({
      todaySalesCount: todaySalesResult.count || 0,
      todayRevenue,
      allTimeSalesCount: allSalesResult.count || 0,
      allTimeRevenue,
      totalPurchasesValue,
      topProducts,
    });

    setLoadingReports(false);
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

  // get_inventory_summary aggregates quantity across ALL branches into
  // one row per product, so it can't be filtered by branch. When a
  // specific branch is selected, compute real per-branch stock instead
  // from the raw inventory + products data (already loaded), so the
  // branch dropdown actually does something once there's more than
  // one branch.
  const branchFilteredInventory =
    useMemo(() => {
      if (!selectedBranch) {
        return filteredInventory;
      }

      const search =
        inventorySearch
          .toLowerCase()
          .trim();

      const rows: InventorySummary[] = inventory
        .filter(
          (row) => row.branch_id === selectedBranch
        )
        .map((row) => {
          const product = products.find(
            (p) => p.id === row.product_id
          );

          if (!product) return null;

          const quantity = Number(row.quantity || 0);
          const threshold = Number(
            product.low_stock_threshold || 0
          );

          const status: InventorySummary['status'] =
            quantity <= 0
              ? 'out_of_stock'
              : quantity <= threshold
              ? 'low_stock'
              : 'in_stock';

          return {
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            selling_price: product.selling_price,
            cost_price: product.cost_price,
            low_stock_threshold: threshold,
            quantity,
            inventory_value:
              quantity * Number(product.cost_price || 0),
            status,
          };
        })
        .filter(
          (item): item is InventorySummary => item !== null
        );

      if (!search) return rows;

      return rows.filter(
        (item) =>
          item.product_name.toLowerCase().includes(search) ||
          (item.sku || '').toLowerCase().includes(search)
      );
    }, [
      selectedBranch,
      inventory,
      products,
      inventorySearch,
      filteredInventory,
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

          {signUpMessage && (
            <div className="error" style={{ background: '#eef9ef', color: '#1a6b2f', borderColor: '#bfe8c6' }}>
              {signUpMessage}
            </div>
          )}

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

          <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '14px' }}>
            New here?{' '}
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setError('');
                setSignUpMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--green)',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Create an account
            </button>
          </p>

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
   * SIGN UP
   * ========================================================
   */

  if (authMode === 'signup' && !session) {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <div className="brand">
            Jabang<span>Store</span>
          </div>

          <p>Create your account</p>

          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
            If a business owner already invited this email address, you'll
            be taken straight to your team's store after signing up.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              setSignUpMessage('');

              const email = signUpEmail.trim();

              if (!email || !signUpPassword) {
                setError('Please enter your email and a password.');
                return;
              }

              if (signUpPassword.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
              }

              if (signUpPassword !== signUpConfirmPassword) {
                setError('Passwords do not match.');
                return;
              }

              setSigningUp(true);

              const { data, error } = await supabase.auth.signUp({
                email,
                password: signUpPassword,
              });

              if (error) {
                setError(error.message);
                setSigningUp(false);
                return;
              }

              if (!data.session) {
                setSignUpMessage(
                  'Account created! Check your email to confirm it, then sign in.'
                );
                setAuthMode('signin');
              } else {
                // Signed up and already have a session (email confirmation
                // is off for this project) -- head straight into the app.
                setAuthMode('signin');
              }

              setSignUpEmail('');
              setSignUpPassword('');
              setSignUpConfirmPassword('');
              setSigningUp(false);
            }}
          >
            <label>Email address</label>
            <input
              type="email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />

            <label>Password</label>
            <input
              type="password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />

            <label>Confirm password</label>
            <input
              type="password"
              value={signUpConfirmPassword}
              onChange={(e) => setSignUpConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />

            {error && <div className="error">{error}</div>}

            <button
              type="submit"
              className="login-button"
              disabled={signingUp}
            >
              {signingUp ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '14px' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--green)',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Sign in
            </button>
          </p>

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
    'super_admin' &&
    !superAdminStoreView
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

                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    {selectedBusiness.status === 'suspended' ? (
                      <button
                        className="primary-button"
                        onClick={() => changeBusinessStatus('active')}
                        disabled={changingBusinessStatus}
                      >
                        {changingBusinessStatus ? 'Reactivating...' : 'Reactivate Business'}
                      </button>
                    ) : (
                      <button
                        className="secondary-button"
                        onClick={() => changeBusinessStatus('suspended')}
                        disabled={changingBusinessStatus}
                      >
                        {changingBusinessStatus ? 'Suspending...' : 'Suspend Business'}
                      </button>
                    )}
                  </div>

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

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="secondary-button"
              onClick={openStoreAsSuperAdmin}
            >
              Operate Store
            </button>

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

  /*
   * ========================================================
   * BUSINESS SUSPENDED
   * ========================================================
   */

  if (ownerBusiness && ownerBusiness.status === 'suspended') {
    return (
      <div className="auth-page">

        <div className="auth-card">

          <div className="brand">
            Jabang<span>Store</span>
          </div>

          <h2>Account Suspended</h2>

          <p>
            {ownerBusiness.name} has been suspended and is not currently
            accessible. Please contact the platform administrator for help.
          </p>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {superAdminStoreView && (
            <button
              className="login-button"
              onClick={backToAdminPanel}
              style={{ marginBottom: '10px' }}
            >
              ← Back to Admin Panel
            </button>
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

          {superAdminStoreView && (
            <button
              className="login-button"
              onClick={backToAdminPanel}
              style={{ marginBottom: '10px' }}
            >
              ← Back to Admin Panel
            </button>
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
      <div className="dashboard-page has-sidebar">
        <Sidebar />
        <MobileTopBar />

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
            <div><RoleBadge /></div>
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
                ● {roleBadgeLabel()}
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
                  if (showProductForm) {
                    resetProductForm();
                  } else {
                    setEditingProductId(null);
                    setShowProductForm(true);
                    setError('');
                  }
                }}
              >
                {showProductForm ? 'Cancel' : '+ Add Product'}
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
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h2>

              <p>
                {editingProductId
                  ? 'Update the details for this product.'
                  : 'Enter the basic information for this product.'}
              </p>

              {editingProductId && (
                <div style={{ marginBottom: '18px' }}>
                  <label>Product Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
                    {(() => {
                      const currentProduct = products.find(
                        (p) => p.id === editingProductId
                      );

                      return currentProduct?.image_url ? (
                        <>
                          <img
                            src={currentProduct.image_url}
                            alt={currentProduct.name}
                            style={{
                              width: '64px',
                              height: '64px',
                              objectFit: 'cover',
                              borderRadius: '10px',
                              border: '1px solid var(--border)',
                            }}
                          />
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              removeProductPhoto(
                                editingProductId,
                                currentProduct.image_url!
                              )
                            }
                          >
                            Remove Photo
                          </button>
                        </>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                          No photo yet
                        </span>
                      );
                    })()}

                    <label className="secondary-button" style={{ cursor: 'pointer', margin: 0 }}>
                      {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        style={{ display: 'none' }}
                        disabled={uploadingPhoto}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && editingProductId) {
                            uploadProductPhoto(editingProductId, file);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              <form
                onSubmit={
                  submitProductForm
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
                    onClick={resetProductForm}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      creatingProduct || savingProduct
                    }
                  >
                    {editingProductId
                      ? savingProduct
                        ? 'Saving...'
                        : 'Save Changes'
                      : creatingProduct
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
                        Photo
                      </th>

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
                        Stock
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

                    {filteredProducts.map(
                      (product) => (
                        <tr
                          key={
                            product.id
                          }
                        >

                          <td>
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border)',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '8px',
                                  background: 'var(--background)',
                                  border: '1px solid var(--border)',
                                }}
                              />
                            )}
                          </td>

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
                            {(() => {
                              const stock = getProductStock(product.id);
                              const isLow =
                                stock <=
                                Number(product.low_stock_threshold);

                              return (
                                <span
                                  style={
                                    isLow
                                      ? { color: 'var(--danger)', fontWeight: 600 }
                                      : undefined
                                  }
                                >
                                  {stock}
                                </span>
                              );
                            })()}
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

                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="secondary-button"
                                onClick={() => startEditProduct(product)}
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                className="secondary-button"
                                onClick={() =>
                                  deleteProduct(product.id, product.name)
                                }
                                type="button"
                              >
                                Delete
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
                  Categories
                </h2>

                <p>
                  Organize your products.
                </p>

              </div>

              <button
                className="primary-button"
                onClick={() => {
                  if (showCategoryForm) {
                    resetCategoryForm();
                  } else {
                    setEditingCategoryId(null);
                    setShowCategoryForm(true);
                    setError('');
                  }
                }}
              >
                {showCategoryForm ? 'Cancel' : '+ Add Category'}
              </button>

            </div>

            {showCategoryForm && (
              <div className="create-business-card">

                <h2>
                  {editingCategoryId ? 'Edit Category' : 'Create Category'}
                </h2>

                <form
                  onSubmit={
                    submitCategoryForm
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
                      onClick={resetCategoryForm}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={
                        creatingCategory || savingCategory
                      }
                    >
                      {editingCategoryId
                        ? savingCategory
                          ? 'Saving...'
                          : 'Save Changes'
                        : creatingCategory
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

                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button
                            className="secondary-button"
                            onClick={() => startEditCategory(category)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="secondary-button"
                            onClick={() =>
                              deleteCategory(category.id, category.name)
                            }
                            type="button"
                          >
                            Delete
                          </button>
                        </div>

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
      <div className="dashboard-page has-sidebar">
        <Sidebar />
        <MobileTopBar />

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
            <div><RoleBadge /></div>
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
            ) : branchFilteredInventory.length ===
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

                    {branchFilteredInventory.map(
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
                        Branch
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
                              branches.find(
                                (b) => b.id === movement.branch_id
                              )?.name || '—'
                            }
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
      <div className="dashboard-page has-sidebar">
        <Sidebar />
        <MobileTopBar />
        <header className="topbar">
          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>
            <small>{ownerBusiness.name}</small>
            <div><RoleBadge /></div>
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

          {!isOnline && (
            <div
              className="error"
              style={{ background: '#fff8e1', color: '#8a6d00', borderColor: '#f0d98a' }}
            >
              You're offline. Sales will keep working — each one is saved
              on this device and will send automatically the moment your
              connection returns.
            </div>
          )}

          {pendingSales.length > 0 && (
            <div
              className="error"
              style={{ background: '#eef5ff', color: '#0b3d6e', borderColor: '#bcdcff' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <span>
                  {pendingSales.length} sale{pendingSales.length > 1 ? 's' : ''}{' '}
                  waiting to sync
                  {pendingSales.some((p) => p.lastError) &&
                    ' — one or more had an error, see below'}
                  .
                </span>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={syncPendingSales}
                  disabled={syncingPendingSales || !isOnline}
                >
                  {syncingPendingSales ? 'Syncing...' : 'Retry Sync Now'}
                </button>
              </div>

              {pendingSales.some((p) => p.lastError) && (
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  {pendingSales
                    .filter((p) => p.lastError)
                    .map((p) => (
                      <div key={p.clientReferenceId}>
                        Queued {new Date(p.queuedAt).toLocaleString()} —{' '}
                        {p.lastError}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

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

                  {myAssignedBranchId ? (
                    <div style={{ fontWeight: 700 }}>
                      {branches.find((b) => b.id === myAssignedBranchId)?.name ||
                        'Assigned branch'}{' '}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          textTransform: 'uppercase',
                          marginLeft: '6px',
                        }}
                      >
                        (locked to your branch)
                      </span>
                    </div>
                  ) : (
                    <select
                      value={selectedBranch}
                      onChange={async (e) => {
                        const branchId = e.target.value;
                        setSelectedBranch(branchId);
                        setPosCart([]);
                        setPosReceipt(null);
                        setPosPayments([]);
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
                  )}
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

                          <label>Customer (required for credit sales)</label>
                          <select
                            value={posCustomerId}
                            onChange={(e) => setPosCustomerId(e.target.value)}
                            disabled={posCompleting}
                            style={{ width: '100%', marginBottom: '14px' }}
                          >
                            <option value="">Walk-in customer</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name}
                              </option>
                            ))}
                          </select>

                          <label>Add payment</label>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <select
                              value={posPaymentMethod}
                              onChange={(e) => setPosPaymentMethod(e.target.value)}
                              disabled={posCompleting}
                              style={{ flex: 1 }}
                            >
                              <option value="cash">Cash</option>
                              <option value="mobile_money">Mobile Money</option>
                              <option value="card">Card</option>
                              <option value="bank_transfer">Bank Transfer</option>
                            </select>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Amount"
                              value={posPaymentAmount}
                              onChange={(e) => setPosPaymentAmount(e.target.value)}
                              disabled={posCompleting}
                              style={{ flex: 1 }}
                            />

                            <button
                              className="secondary-button"
                              type="button"
                              onClick={addPosPayment}
                              disabled={posCompleting}
                            >
                              + Add
                            </button>
                          </div>

                          {posPayments.length > 0 && (
                            <div style={{ marginBottom: '14px' }}>
                              {posPayments.map((payment, index) => (
                                <div
                                  key={index}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '6px 0',
                                    borderBottom: '1px solid var(--border)',
                                  }}
                                >
                                  <span>{payment.method}</span>
                                  <span>
                                    GMD {formatGMD(payment.amount)}{' '}
                                    <button
                                      className="secondary-button"
                                      type="button"
                                      onClick={() => removePosPayment(index)}
                                      disabled={posCompleting}
                                    >
                                      ×
                                    </button>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                            <span>Total Received</span>
                            <strong>GMD {formatGMD(posReceived)}</strong>
                          </div>

                          {posChange > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                              <span>Change</span>
                              <strong>GMD {formatGMD(posChange)}</strong>
                            </div>
                          )}

                          {posBalanceDue > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '6px',
                                color: 'var(--danger)',
                              }}
                            >
                              <span>
                                Balance Due{' '}
                                {!posCustomerId && '(select a customer to allow credit)'}
                              </span>
                              <strong>GMD {formatGMD(posBalanceDue)}</strong>
                            </div>
                          )}

                          <button
                            className="primary-button"
                            onClick={completePOSSale}
                            disabled={
                              posCompleting ||
                              posCart.length === 0 ||
                              (posBalanceDue > 0 && !posCustomerId)
                            }
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
                        <span className="status">
                          {posReceipt.status === 'queued'
                            ? '● Saved — Waiting to Sync'
                            : '● Sale Completed'}
                        </span>
                        <h2>Receipt</h2>
                        <p>{posReceipt.sale_number}</p>
                        {posReceipt.status === 'queued' && (
                          <p style={{ color: 'var(--danger)', fontSize: '13px' }}>
                            No connection right now — this sale is saved on
                            this device and will sync automatically once
                            you're back online.
                          </p>
                        )}
                      </div>
                      <div className="form-actions">
                        <button className="primary-button" onClick={() => posReceipt && printReceipt(posReceipt)}>Print Receipt</button>
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
                      {posReceipt.balance_due > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)', fontWeight: 600 }}>
                          <span>Balance Due (Credit Sale{posReceipt.customer_name ? ` — ${posReceipt.customer_name}` : ''})</span>
                          <span>GMD {formatGMD(posReceipt.balance_due)}</span>
                        </div>
                      )}
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
    ownerPage === 'settings'
  ) {
    return (
      <div className="dashboard-page has-sidebar">
        <Sidebar />
        <MobileTopBar />
        <header className="topbar">
          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>
            <small>{ownerBusiness.name}</small>
            <div><RoleBadge /></div>
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

          <div className="page-header">
            <div>
              <h1>Settings</h1>
              <p>Business information and branches.</p>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Business Information</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <tbody>
                  <tr>
                    <th>Business Name</th>
                    <td>{ownerBusiness.name}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>{ownerBusiness.status}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <h3 style={{ margin: 0 }}>Branches</h3>
              <button
                className="primary-button"
                onClick={() => {
                  if (showBranchForm) {
                    resetBranchForm();
                  } else {
                    setEditingBranchId(null);
                    setShowBranchForm(true);
                    setError('');
                  }
                }}
              >
                {showBranchForm ? 'Cancel' : '+ Add Branch'}
              </button>
            </div>

            {showBranchForm && (
              <form
                onSubmit={submitBranchForm}
                style={{ marginBottom: '18px' }}
              >
                <label>Branch name *</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Serrekunda Branch"
                  style={{ width: '100%', marginBottom: '10px' }}
                  required
                />

                <label>Address</label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="Optional"
                  style={{ width: '100%', marginBottom: '10px' }}
                />

                <label>Phone</label>
                <input
                  type="text"
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  placeholder="Optional"
                  style={{ width: '100%', marginBottom: '10px' }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetBranchForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={savingBranch}
                  >
                    {savingBranch
                      ? 'Saving...'
                      : editingBranchId
                      ? 'Save Changes'
                      : 'Add Branch'}
                  </button>
                </div>
              </form>
            )}

            {branches.length === 0 ? (
              <p>No branches yet. Add your first branch above to start assigning inventory and staff to a location.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((branch) => (
                      <tr key={branch.id}>
                        <td>{branch.name}</td>
                        <td>{branch.address || '—'}</td>
                        <td>{branch.phone || '—'}</td>
                        <td>
                          <button
                            className="secondary-button"
                            onClick={() => startEditBranch(branch)}
                            type="button"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Activity Log</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
                  A record of key actions like edits, deletions, and voided sales.
                </p>
              </div>
              <button
                className="secondary-button"
                onClick={() => openOwnerPage('audit-log')}
              >
                View Activity Log
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ========================================================
   * AUDIT LOG PAGE
   * ========================================================
   */

  if (ownerPage === 'audit-log') {
    const actionLabels: Record<string, string> = {
      update_product: 'Updated a product',
      delete_product: 'Deleted a product',
      deactivate_product: 'Deactivated a product',
      update_category: 'Updated a category',
      delete_category: 'Deleted a category',
      void_sale: 'Voided a sale',
      set_business_status: 'Changed business status',
      approve_business_application: 'Approved a business application',
      reject_business_application: 'Rejected a business application',
    };

    return (
      <div className="dashboard-page has-sidebar">
        <Sidebar />
        <MobileTopBar />
        <header className="topbar">
          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>
            <small>{ownerBusiness.name}</small>
            <div><RoleBadge /></div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Sign out
          </button>
        </header>

        <main className="admin-content">
          <button
            className="secondary-button"
            onClick={() => openOwnerPage('settings')}
          >
            ← Settings
          </button>

          <div className="page-header">
            <div>
              <h1>Activity Log</h1>
              <p>The last 100 recorded actions for this business.</p>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="card">
            {loadingAuditLog ? (
              <p>Loading activity...</p>
            ) : auditLog.length === 0 ? (
              <p>No activity recorded yet. Actions like edits, deletions, voided sales, and approvals will appear here as they happen.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Action</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                        <td>{actionLabels[log.action] || log.action}</td>
                        <td style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {log.details && Object.keys(log.details).length > 0
                            ? Object.entries(log.details)
                                .filter(([, v]) => v !== null && v !== '')
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(', ')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /*
   * ========================================================
   * STAFF PAGE
   * ========================================================
   */

  if (ownerPage === 'staff') {
    return (
      <div className="dashboard-page has-sidebar">
        <Sidebar />
        <MobileTopBar />
        <header className="topbar">
          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>
            <small>{ownerBusiness.name}</small>
            <div><RoleBadge /></div>
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

          <div className="page-header">
            <div>
              <h1>Staff</h1>
              <p>
                Invite managers, cashiers, and inventory staff, and
                optionally lock a cashier to one branch.
              </p>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Invite a staff member</h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 0 }}>
              They'll get access automatically the moment they create an
              account with this exact email address on the sign-in page.
            </p>

            <form onSubmit={sendStaffInvite}>
              <label>Email address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@example.com"
                style={{ width: '100%', marginBottom: '10px' }}
                required
              />

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label>Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="inventory_staff">Inventory Staff</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label>Lock to branch (optional)</label>
                  <select
                    value={inviteBranchId}
                    onChange={(e) => setInviteBranchId(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">Any branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="primary-button"
                type="submit"
                disabled={sendingInvite}
              >
                {sendingInvite ? 'Sending Invite...' : 'Send Invite'}
              </button>
            </form>
          </div>

          {staffInvites.length > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Pending invites</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Branch</th>
                      <th>Invited</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffInvites.map((invite) => (
                      <tr key={invite.id}>
                        <td>{invite.email}</td>
                        <td style={{ textTransform: 'capitalize' }}>
                          {invite.role.replace('_', ' ')}
                        </td>
                        <td>
                          {branches.find((b) => b.id === invite.branch_id)?.name ||
                            'Any branch'}
                        </td>
                        <td>{new Date(invite.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => cancelStaffInvite(invite.id)}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Current team</h3>
            {loadingStaff ? (
              <p>Loading team...</p>
            ) : staff.length === 0 ? (
              <p>No team members yet. Invite your first one above.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Branch</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member) => (
                      <tr key={member.member_id}>
                        <td>{member.email}</td>
                        <td>
                          {member.role === 'owner' ? (
                            <span style={{ textTransform: 'capitalize' }}>
                              {member.role}
                            </span>
                          ) : (
                            <select
                              value={member.role}
                              onChange={(e) =>
                                updateStaffRole(member.member_id, e.target.value)
                              }
                            >
                              <option value="manager">Manager</option>
                              <option value="cashier">Cashier</option>
                              <option value="inventory_staff">
                                Inventory Staff
                              </option>
                            </select>
                          )}
                        </td>
                        <td>
                          {member.role === 'owner' ? (
                            'All branches'
                          ) : (
                            <select
                              value={member.assigned_branch_id || ''}
                              onChange={(e) =>
                                updateStaffBranch(member.member_id, e.target.value)
                              }
                            >
                              <option value="">Any branch</option>
                              {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                  {branch.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>{new Date(member.joined_at).toLocaleDateString()}</td>
                        <td>
                          {member.role !== 'owner' && (
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() =>
                                removeStaffMember(member.member_id, member.email)
                              }
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /*
   * ========================================================
   * CUSTOMERS PAGE
   * ========================================================
   */

  if (ownerPage === 'customers') {
    return (
      <div className="dashboard-page has-sidebar">
        <Sidebar />
        <MobileTopBar />
        <header className="topbar">
          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>
            <small>{ownerBusiness.name}</small>
            <div><RoleBadge /></div>
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

          <div className="page-header">
            <div>
              <h1>Customers</h1>
              <p>Keep track of who buys from you.</p>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Add a customer</h3>
            <form onSubmit={createCustomer}>
              <input
                type="text"
                placeholder="Full name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                style={{ marginBottom: '10px', width: '100%' }}
                required
              />
              <input
                type="text"
                placeholder="Phone (optional)"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                style={{ marginBottom: '10px', width: '100%' }}
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                style={{ marginBottom: '10px', width: '100%' }}
              />
              <input
                type="text"
                placeholder="Address (optional)"
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
                style={{ marginBottom: '10px', width: '100%' }}
              />
              <button
                className="primary-button"
                type="submit"
                disabled={creatingCustomer}
              >
                {creatingCustomer ? 'Adding...' : 'Add Customer'}
              </button>
            </form>
          </div>

          <div className="card">
            {loadingCustomers ? (
              <p>Loading customers...</p>
            ) : customers.length === 0 ? (
              <p>No customers yet. Add your first customer above — you'll need one on file to offer a credit sale in POS.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.name}</td>
                        <td>{customer.phone || '—'}</td>
                        <td>{customer.email || '—'}</td>
                        <td>GMD {formatGMD(customer.current_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /*
   * ========================================================
   * SALES HISTORY PAGE
   * ========================================================
   */

  if (ownerPage === 'sales') {
    const canVoid = myBusinessRole === 'owner' || myBusinessRole === 'manager';

    return (
      <div className="dashboard-page has-sidebar">
        <Sidebar />
        <MobileTopBar />
        <header className="topbar">
          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>
            <small>{ownerBusiness.name}</small>
            <div><RoleBadge /></div>
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

          <div className="page-header">
            <div>
              <h1>Sales History</h1>
              <p>
                {canVoid
                  ? 'View past sales, reprint receipts, or void a sale.'
                  : 'View past sales and reprint receipts.'}
              </p>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="card">
            {loadingSalesHistory ? (
              <p>Loading sales...</p>
            ) : salesHistory.length === 0 ? (
              <p>No sales recorded yet. Completed sales from POS will appear here, where you can reprint receipts or void a sale.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sale #</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory.map((sale) => {
                      const customerName = sale.customer_id
                        ? customers.find((c) => c.id === sale.customer_id)?.name ||
                          'Customer'
                        : 'Walk-in';

                      return (
                        <tr key={sale.id}>
                          <td>{sale.sale_number}</td>
                          <td>
                            {new Date(sale.created_at).toLocaleString()}
                          </td>
                          <td>{customerName}</td>
                          <td>GMD {formatGMD(sale.total)}</td>
                          <td style={{ textTransform: 'capitalize' }}>
                            {sale.payment_status}
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>
                            {sale.status === 'voided' ? (
                              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                                Voided
                              </span>
                            ) : (
                              sale.status
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="secondary-button"
                                type="button"
                                onClick={() => reprintSale(sale)}
                              >
                                Reprint
                              </button>

                              {canVoid && sale.status === 'completed' && (
                                <button
                                  className="secondary-button"
                                  type="button"
                                  onClick={() => voidSale(sale.id)}
                                  disabled={voidingSaleId === sale.id}
                                >
                                  {voidingSaleId === sale.id
                                    ? 'Voiding...'
                                    : 'Void'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /*
   * ========================================================
   * PURCHASES PAGE (no supplier field, by design)
   * ========================================================
   */

  if (ownerPage === 'purchases') {
    return (
      <div className="dashboard-page has-sidebar">
        <Sidebar />
        <MobileTopBar />
        <header className="topbar">
          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>
            <small>{ownerBusiness.name}</small>
            <div><RoleBadge /></div>
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

          <div className="page-header">
            <div>
              <h1>Purchases</h1>
              <p>Record goods bought in for the shop.</p>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Record a new purchase</h3>

            <label>Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              style={{ width: '100%', marginBottom: '14px' }}
            >
              <option value="">Select branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                marginBottom: '10px',
              }}
            >
              <select
                value={purchaseProductId}
                onChange={(e) => setPurchaseProductId(e.target.value)}
                style={{ flex: 2 }}
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={purchaseQuantity}
                onChange={(e) => setPurchaseQuantity(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                min="0"
                placeholder="Unit cost"
                value={purchaseUnitCost}
                onChange={(e) => setPurchaseUnitCost(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                className="secondary-button"
                onClick={addPurchaseCartItem}
                type="button"
              >
                + Add Item
              </button>
            </div>

            {purchaseCart.length > 0 && (
              <div className="table-wrapper" style={{ marginBottom: '14px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Cost</th>
                      <th>Line Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseCart.map((item) => (
                      <tr key={item.product_id}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>GMD {formatGMD(item.unitCost)}</td>
                        <td>GMD {formatGMD(item.quantity * item.unitCost)}</td>
                        <td>
                          <button
                            className="secondary-button"
                            onClick={() => removePurchaseCartItem(item.product_id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <label>Overall discount (GMD)</label>
            <input
              type="number"
              min="0"
              value={purchaseDiscount}
              onChange={(e) => setPurchaseDiscount(e.target.value)}
              style={{ width: '100%', marginBottom: '14px' }}
            />

            <p>
              <strong>Subtotal: GMD {formatGMD(purchaseSubtotal)}</strong>
            </p>

            <button
              className="primary-button"
              onClick={submitPurchase}
              disabled={creatingPurchase || purchaseCart.length === 0}
            >
              {creatingPurchase ? 'Recording...' : 'Record Purchase'}
            </button>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Recent purchases</h3>
            {loadingPurchases ? (
              <p>Loading...</p>
            ) : purchases.length === 0 ? (
              <p>No purchases recorded yet. Record your first stock purchase above to add inventory to a branch.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Purchase #</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td>{purchase.purchase_number}</td>
                        <td>
                          {new Date(purchase.created_at).toLocaleDateString()}
                        </td>
                        <td>GMD {formatGMD(purchase.total)}</td>
                        <td>{purchase.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /*
   * ========================================================
   * RETURNS / REFUNDS PAGE
   * ========================================================
   */

  if (ownerPage === 'returns') {
    return (
      <div className="dashboard-page has-sidebar">
        <Sidebar />
        <MobileTopBar />
        <header className="topbar">
          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>
            <small>{ownerBusiness.name}</small>
            <div><RoleBadge /></div>
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

          <div className="page-header">
            <div>
              <h1>Returns &amp; Refunds</h1>
              <p>Process a return against a past sale.</p>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Process a return</h3>

            <label>Original sale</label>
            <select
              value={selectedSaleForReturn}
              onChange={(e) => selectSaleForReturn(e.target.value)}
              style={{ width: '100%', marginBottom: '14px' }}
            >
              <option value="">Select a sale</option>
              {returnableSales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.sale_number} — GMD {formatGMD(sale.total)} —{' '}
                  {new Date(sale.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>

            {returnableItems.length > 0 && (
              <div className="table-wrapper" style={{ marginBottom: '14px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Sold</th>
                      <th>Already Returned</th>
                      <th>Return Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnableItems.map((item) => (
                      <tr key={item.product_id}>
                        <td>{item.name}</td>
                        <td>{item.sold_quantity}</td>
                        <td>{item.already_returned}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={item.sold_quantity - item.already_returned}
                            value={item.returnQuantity}
                            onChange={(e) =>
                              updateReturnQuantity(
                                item.product_id,
                                Number(e.target.value || 0)
                              )
                            }
                            style={{ width: '80px' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedSaleForReturn && (
              <>
                <label>Reason (optional)</label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  style={{ width: '100%', marginBottom: '14px' }}
                  rows={2}
                />

                <button
                  className="primary-button"
                  onClick={submitReturn}
                  disabled={creatingReturn}
                >
                  {creatingReturn ? 'Processing...' : 'Process Return'}
                </button>
              </>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Recent returns</h3>
            {loadingReturns ? (
              <p>Loading...</p>
            ) : returns.length === 0 ? (
              <p>No returns recorded yet. Process a return above by selecting the original sale and the items to send back.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Return #</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((ret) => (
                      <tr key={ret.id}>
                        <td>{ret.return_number}</td>
                        <td>{new Date(ret.created_at).toLocaleDateString()}</td>
                        <td>GMD {formatGMD(ret.total_amount)}</td>
                        <td>{ret.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /*
   * ========================================================
   * REPORTS PAGE
   * ========================================================
   */

  if (ownerPage === 'reports') {
    return (
      <div className="dashboard-page has-sidebar">
        <Sidebar />
        <MobileTopBar />
        <header className="topbar">
          <div>
            <div className="brand">
              Jabang<span>Store</span>
            </div>
            <small>{ownerBusiness.name}</small>
            <div><RoleBadge /></div>
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

          <div className="page-header">
            <div>
              <h1>Reports</h1>
              <p>A snapshot of how the business is doing.</p>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          {loadingReports || !reportsData ? (
            <p>Loading report...</p>
          ) : (
            <>
              <div className="business-grid" style={{ marginBottom: '20px' }}>
                <article className="business-card">
                  <div className="business-icon">💰</div>
                  <div className="business-info">
                    <h3>Today's Sales</h3>
                    <p>
                      GMD {formatGMD(reportsData.todayRevenue)} (
                      {reportsData.todaySalesCount} sales)
                    </p>
                  </div>
                </article>

                <article className="business-card">
                  <div className="business-icon">🧾</div>
                  <div className="business-info">
                    <h3>All-Time Sales</h3>
                    <p>
                      GMD {formatGMD(reportsData.allTimeRevenue)} (
                      {reportsData.allTimeSalesCount} sales)
                    </p>
                  </div>
                </article>

                <article className="business-card">
                  <div className="business-icon">🚚</div>
                  <div className="business-info">
                    <h3>Total Purchases</h3>
                    <p>GMD {formatGMD(reportsData.totalPurchasesValue)}</p>
                  </div>
                </article>
              </div>

              <div className="card">
                <h3 style={{ marginTop: 0 }}>Top selling products</h3>
                {reportsData.topProducts.length === 0 ? (
                  <p>No sales yet. Once you make sales in POS, your best-selling products will appear here.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Units Sold</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportsData.topProducts.map((product) => (
                          <tr key={product.product_id}>
                            <td>{product.name}</td>
                            <td>{product.quantity_sold}</td>
                            <td>GMD {formatGMD(product.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
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
    <div className="dashboard-page has-sidebar">
      <Sidebar />
      <MobileTopBar />

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

          <div><RoleBadge /></div>

        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {superAdminStoreView && (
            <button
              className="secondary-button"
              onClick={backToAdminPanel}
            >
              ← Back to Admin Panel
            </button>
          )}

          <button
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            Sign out
          </button>
        </div>

      </header>

      <main className="admin-content">

        <section className="admin-header">

          <div>

            <span className="status">
              ● {roleBadgeLabel()}
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

        {!isBusinessAdminTier() && (
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 16px' }}>
            You're signed in as {roleBadgeLabel()}, so you see POS, Sales
            History, and Customers here. Product, Inventory, Purchases,
            Returns, Reports, and Settings are managed by the business
            Owner or a Manager.
          </p>
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

          {isBusinessAdminTier() && (
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
          )}

          {isBusinessAdminTier() && (
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
          )}

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
                'sales'
              )
            }
          >

            <div className="business-icon">
              🧾
            </div>

            <div className="business-info">

              <h3>
                Sales History
              </h3>

              <p>
                Receipts, reprints, and voids.
              </p>

            </div>

          </button>

          {isBusinessAdminTier() && (
          <button
            className="business-card"
            onClick={() =>
              openOwnerPage(
                'purchases'
              )
            }
          >

            <div className="business-icon">
              🚚
            </div>

            <div className="business-info">

              <h3>
                Purchases
              </h3>

              <p>
                Record goods bought in.
              </p>

            </div>

          </button>
          )}

          {isBusinessAdminTier() && (
          <button
            className="business-card"
            onClick={() =>
              openOwnerPage(
                'returns'
              )
            }
          >

            <div className="business-icon">
              ↩️
            </div>

            <div className="business-info">

              <h3>
                Returns &amp; Refunds
              </h3>

              <p>
                Process a customer return.
              </p>

            </div>

          </button>
          )}

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

          {isBusinessAdminTier() && (
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
          )}

          {isBusinessAdminTier() && (
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
          )}

          {isBusinessAdminTier() && (
          <button
            className="business-card"
            onClick={() =>
              openOwnerPage(
                'staff'
              )
            }
          >

            <div className="business-icon">
              👥
            </div>

            <div className="business-info">

              <h3>
                Staff
              </h3>

              <p>
                Invite and manage your team.
              </p>

            </div>

          </button>
          )}

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
