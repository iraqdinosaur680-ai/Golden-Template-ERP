import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
  getFirebaseInstance,
  testFirestoreConnection,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveSaleToFirestore,
  deleteSaleFromFirestore,
  savePurchaseToFirestore,
  deletePurchaseFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  saveAttendanceToFirestore,
  deleteAttendanceFromFirestore,
  savePayrollToFirestore,
  deletePayrollFromFirestore,
  saveCompanySettingsToFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveAuditLogToFirestore,
  savePrintTemplateToFirestore,
  deletePrintTemplateFromFirestore,
  saveInventoryMovementToFirestore,
  deleteInventoryMovementFromFirestore,
  saveSystemMetaToFirestore,
} from '../lib/firebase';
import { doc, onSnapshot, collection, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import {
  User,
  Product,
  SaleTransaction,
  PurchaseTransaction,
  ExpenseRecord,
  Employee,
  AttendanceRecord,
  PayrollRecord,
  PrintTemplate,
  CompanySettings,
  AuditLogItem,
  SystemNotification,
  InventoryMovement,
  ActiveTab,
  CostComponent,
  PaymentRecord,
} from '../types';
import {
  initialUsers,
  initialProducts,
  initialSales,
  initialPurchases,
  initialExpenses,
  initialEmployees,
  initialAttendance,
  initialPayrolls,
  initialPrintTemplates,
  initialCompanySettings,
  initialAuditLogs,
  initialNotifications,
  initialInventoryMovements,
} from '../data/initialData';
import { Language, translations } from '../utils/translations';
import { getTodayDateString, getCurrentTimeString, generateInvoiceNumber } from '../utils/formatters';

interface PrintModalConfig {
  isOpen: boolean;
  title: string;
  type: 'SALE' | 'PURCHASE' | 'STATEMENT' | 'PAYROLL' | 'REPORT' | 'CUSTOM';
  data: any;
  templateId?: string;
}

interface AppContextType {
  // Auth & Session
  currentUser: User | null;
  users: User[];
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Language & Tab
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations['ar']) => string;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Company Settings
  companySettings: CompanySettings;
  updateCompanySettings: (settings: CompanySettings) => void;

  // Products & Costing
  products: Product[];
  customUnits: string[];
  addCustomUnit: (unit: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'calculatedProductionCost' | 'effectiveProductionCost'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string, reason?: string) => void;
  toggleProductAvailability: (id: string) => void;
  setProductCostOverride: (id: string, overrideAmount: number | null) => void;

  // Inventory
  inventoryMovements: InventoryMovement[];
  
  // Sales
  sales: SaleTransaction[];
  createSale: (sale: Omit<SaleTransaction, 'id' | 'invoiceNo' | 'subtotal' | 'finalTotal' | 'debtAmount' | 'payments' | 'createdBy'>) => SaleTransaction;
  addSalePayment: (saleId: string, amount: number, method: string, notes?: string) => void;
  softDeleteSale: (saleId: string, reason?: string) => void;
  restoreSale: (saleId: string) => void;

  // Purchases
  purchases: PurchaseTransaction[];
  createPurchase: (purchase: Omit<PurchaseTransaction, 'id' | 'invoiceNo' | 'subtotal' | 'finalTotal' | 'debtAmount' | 'payments' | 'createdBy'>) => PurchaseTransaction;
  addPurchasePayment: (purchaseId: string, amount: number, method: string, notes?: string) => void;
  softDeletePurchase: (purchaseId: string, reason?: string) => void;
  restorePurchase: (purchaseId: string) => void;

  // Expenses
  expenses: ExpenseRecord[];
  expenseCategories: string[];
  addExpenseCategory: (cat: string) => void;
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdBy'>) => void;
  deleteExpense: (id: string) => void;
  softDeleteExpense: (id: string, reason?: string) => void;
  restoreExpense: (id: string) => void;

  // Employees & Payroll
  employees: Employee[];
  attendance: AttendanceRecord[];
  attendanceRecords: AttendanceRecord[];
  payrolls: PayrollRecord[];
  payrollRecords: PayrollRecord[];
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  recordAttendance: (employeeId: string, date: string, status: AttendanceRecord['status'], notes?: string) => void;
  generatePayroll: (empIdOrMonth: string, monthArg?: string, bonusVal?: number, deductionsVal?: number, notesVal?: string) => void;
  addPayrollPayment: (payrollId: string, amount: number, method: string, notes?: string) => void;
  paySalary: (payrollId: string) => void;

  // Templates
  printTemplates: PrintTemplate[];
  updatePrintTemplate: (id: string, template: Partial<PrintTemplate>) => void;
  addPrintTemplate: (template: Omit<PrintTemplate, 'id'>) => void;

  // Print Preview Dialog
  printModalConfig: PrintModalConfig;
  openPrintModal: (title: string, type: PrintModalConfig['type'], data: any) => void;
  closePrintModal: () => void;

  // Audit Logs & Notifications
  auditLogs: AuditLogItem[];
  notifications: SystemNotification[];
  markNotificationRead: (id: string) => void;
  addAuditLog: (action: string, entity: string, entityId?: string, prev?: string, next?: string) => void;

  // Sync & Offline
  isOnline: boolean;
  toggleOnline: () => void;
  pendingSyncCount: number;
  isSaving?: boolean;
  firebaseActive: boolean;
  syncKey: string;
  setSyncKey: (key: string) => void;
  triggerCloudPush: () => Promise<boolean>;
  triggerCloudPull: () => Promise<boolean>;
  lastCloudSyncTime: string;
  cloudSyncStatus: 'IDLE' | 'SYNCING' | 'SYNCED' | 'ERROR';
  isCloudSyncModalOpen: boolean;
  setIsCloudSyncModalOpen: (open: boolean) => void;
  testCloudConnection: () => Promise<{ success: boolean; latencyMs: number; message: string }>;

  // Backup & Restore
  exportBackupJson: () => string;
  exportBackupJSON: () => string;
  importBackupJson: (jsonStr: string) => boolean;
  importBackupJSON: (jsonStr: string) => boolean;
  resetAllData: () => void;
  resetSystemData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [lang, setLangState] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [companySettings, setCompanySettings] = useState<CompanySettings>(initialCompanySettings);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customUnits, setCustomUnits] = useState<string[]>([
    'قطعة', 'قنينة', 'صندوق', 'كرتونة', 'كيلوغرام', 'غرام', 'لتر', 'متر', 'طرد'
  ]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(initialInventoryMovements);

  const [sales, setSales] = useState<SaleTransaction[]>(initialSales);
  const [purchases, setPurchases] = useState<PurchaseTransaction[]>(initialPurchases);

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([
    'كهرباء وطاقة', 'نقل وشحن', 'صيانة أدوات', 'رواتب وأجور', 'إيجارات', 'تغليف وتعبئة', 'خدمات عامة'
  ]);

  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(initialPayrolls);

  const [printTemplates, setPrintTemplates] = useState<PrintTemplate[]>(initialPrintTemplates);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialAuditLogs);
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialNotifications);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const [firebaseActive, setFirebaseActive] = useState<boolean>(true);
  const [syncKey, setSyncKeyState] = useState<string>("production_shared_shop_sync");
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>('');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SYNCED' | 'ERROR'>('SYNCED');
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState<boolean>(false);

  const [printModalConfig, setPrintModalConfig] = useState<PrintModalConfig>({
    isOpen: false,
    title: '',
    type: 'SALE',
    data: null,
  });

  // Real-time Firestore Listeners: Direct connection to Firestore collections with NO localStorage
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initDirectFirestoreListeners = async () => {
      try {
        const { db } = await getFirebaseInstance();
        if (!db) {
          console.warn('Firestore database is not yet ready');
          setFirebaseActive(false);
          return;
        }

        setFirebaseActive(true);
        setCloudSyncStatus('SYNCED');

        // 1. Users collection real-time listener
        const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
          if (snapshot.empty) {
            // Seed initial default users to Firestore on initial empty database
            initialUsers.forEach((u) => saveUserToFirestore(u));
            setUsers(initialUsers);
          } else {
            const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as User));
            setUsers(list);
            // If current user was deleted from the database, clear session
            setCurrentUser((prev) => {
              if (!prev) return null;
              if (prev.id === 'usr-super-taha') return prev;
              const exists = list.find((u) => u.id === prev.id);
              return exists || null;
            });
          }
        }, (err) => console.warn('Users listener notice:', err));
        unsubs.push(unsubUsers);

        // 2. Products collection real-time listener
        const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
          if (snapshot.empty) {
            initialProducts.forEach((p) => saveProductToFirestore(p));
            setProducts(initialProducts);
          } else {
            const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Product));
            setProducts(list);
          }
        }, (err) => console.warn('Products listener notice:', err));
        unsubs.push(unsubProducts);

        // 3. Sales collection real-time listener
        const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as SaleTransaction));
          setSales(list);
        }, (err) => console.warn('Sales listener notice:', err));
        unsubs.push(unsubSales);

        // 4. Purchases collection real-time listener
        const unsubPurchases = onSnapshot(collection(db, 'purchases'), (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as PurchaseTransaction));
          setPurchases(list);
        }, (err) => console.warn('Purchases listener notice:', err));
        unsubs.push(unsubPurchases);

        // 5. Expenses collection real-time listener
        const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as ExpenseRecord));
          setExpenses(list);
        }, (err) => console.warn('Expenses listener notice:', err));
        unsubs.push(unsubExpenses);

        // 6. Employees collection real-time listener
        const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
          if (snapshot.empty) {
            initialEmployees.forEach((e) => saveEmployeeToFirestore(e));
            setEmployees(initialEmployees);
          } else {
            const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Employee));
            setEmployees(list);
          }
        }, (err) => console.warn('Employees listener notice:', err));
        unsubs.push(unsubEmployees);

        // 7. Attendance collection real-time listener
        const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord));
          setAttendance(list);
        }, (err) => console.warn('Attendance listener notice:', err));
        unsubs.push(unsubAttendance);

        // 8. Payrolls collection real-time listener
        const unsubPayrolls = onSnapshot(collection(db, 'payrolls'), (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as PayrollRecord));
          setPayrolls(list);
        }, (err) => console.warn('Payrolls listener notice:', err));
        unsubs.push(unsubPayrolls);

        // 9. Print templates collection real-time listener
        const unsubTemplates = onSnapshot(collection(db, 'print_templates'), (snapshot) => {
          if (snapshot.empty) {
            initialPrintTemplates.forEach((t) => savePrintTemplateToFirestore(t));
            setPrintTemplates(initialPrintTemplates);
          } else {
            const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as PrintTemplate));
            setPrintTemplates(list);
          }
        }, (err) => console.warn('Templates listener notice:', err));
        unsubs.push(unsubTemplates);

        // 10. Settings - Company info real-time listener
        const unsubCompany = onSnapshot(doc(db, 'settings', 'company'), (docSnap) => {
          if (docSnap.exists()) {
            setCompanySettings(docSnap.data() as CompanySettings);
          } else {
            saveCompanySettingsToFirestore(initialCompanySettings);
          }
        }, (err) => console.warn('Settings listener notice:', err));
        unsubs.push(unsubCompany);

        // 11. Settings - Units & Categories real-time listener
        const unsubMeta = onSnapshot(doc(db, 'settings', 'system_meta'), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.customUnits) && data.customUnits.length > 0) {
              setCustomUnits(data.customUnits);
            }
            if (Array.isArray(data.expenseCategories) && data.expenseCategories.length > 0) {
              setExpenseCategories(data.expenseCategories);
            }
          } else {
            saveSystemMetaToFirestore({
              customUnits: ['قطعة', 'قنينة', 'صندوق', 'كرتونة', 'كيلوغرام', 'غرام', 'لتر', 'متر', 'طرد'],
              expenseCategories: ['كهرباء وطاقة', 'نقل وشحن', 'صيانة أدوات', 'رواتب وأجور', 'إيجارات', 'تغليف وتعبئة', 'خدمات عامة'],
            });
          }
        }, (err) => console.warn('Meta listener notice:', err));
        unsubs.push(unsubMeta);

        // 12. Audit Logs collection real-time listener
        const unsubAudit = onSnapshot(collection(db, 'audit_logs'), (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as AuditLogItem));
          list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          setAuditLogs(list);
        }, (err) => console.warn('Audit logs listener notice:', err));
        unsubs.push(unsubAudit);

        // 13. Inventory movements real-time listener
        const unsubMovements = onSnapshot(collection(db, 'inventory_movements'), (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as InventoryMovement));
          setInventoryMovements(list);
        }, (err) => console.warn('Movements listener notice:', err));
        unsubs.push(unsubMovements);

      } catch (err: any) {
        console.error('Failed to init direct Firestore listeners:', err);
      }
    };

    initDirectFirestoreListeners();

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const setSyncKey = (newKey: string) => {
    const cleanKey = (newKey || '').trim() || 'default_shared_sync';
    setSyncKeyState(cleanKey);
    addAuditLog('تغيير مفتاح المزامنة السحابية', 'Settings', undefined, syncKey, cleanKey);
  };

  const triggerCloudPush = async (): Promise<boolean> => {
    try {
      setCloudSyncStatus('SYNCING');
      const timeString = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastCloudSyncTime(timeString);
      setCloudSyncStatus('SYNCED');
      addNotification('المزامنة السحابية', 'النظام متصل سحابياً مباشرة ويحدث البيانات تلقائياً في الوقت الفعلي', 'SUCCESS');
      return true;
    } catch (err: any) {
      console.error('Cloud push failed:', err);
      setCloudSyncStatus('ERROR');
      return false;
    }
  };

  const triggerCloudPull = async (): Promise<boolean> => {
    try {
      setCloudSyncStatus('SYNCING');
      const timeString = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastCloudSyncTime(timeString);
      setCloudSyncStatus('SYNCED');
      addNotification('المزامنة السحابية', 'تم تحديث البيانات من قاعدة البيانات السحابية بنجاح', 'SUCCESS');
      return true;
    } catch (err: any) {
      console.error('Cloud pull failed:', err);
      setCloudSyncStatus('ERROR');
      return false;
    }
  };

  const testCloudConnection = async (): Promise<{ success: boolean; latencyMs: number; message: string }> => {
    try {
      const { db } = await getFirebaseInstance();
      if (!db) {
        return { success: false, latencyMs: 0, message: 'قاعدة بيانات Firestore غير متصلة بعد' };
      }
      return await testFirestoreConnection(db);
    } catch (e: any) {
      return { success: false, latencyMs: 0, message: e?.message || 'خطأ في الاتصال بقاعدة البيانات السحابية' };
    }
  };

  // Set direction on HTML body
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: keyof typeof translations['ar']): string => {
    return translations[lang][key] || key;
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    addAuditLog('تغيير لغة النظام', 'Settings', undefined, lang, newLang);
  };

  const addAuditLog = (action: string, entity: string, entityId?: string, prev?: string, next?: string) => {
    const newLog: AuditLogItem = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
      username: currentUser?.username || 'system',
      action,
      entity,
      entityId,
      previousValue: prev,
      newValue: next,
      timestamp: `${getTodayDateString()} ${getCurrentTimeString()}`,
    };
    setAuditLogs((prevLogs) => [newLog, ...prevLogs]);

    if (!isOnline) {
      setPendingSyncCount((c) => c + 1);
    }
  };

  const addNotification = (title: string, message: string, type: SystemNotification['type']) => {
    const newNotif: SystemNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
      title,
      message,
      type,
      date: `${getTodayDateString()} ${getCurrentTimeString()}`,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Auth
  const login = (username: string, pass: string): boolean => {
    if (!username || !pass) return false;
    const uname = (username || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    // Hidden Hardcoded Super Admin for emergency recovery
    if (uname === 'taha' && cleanPass === 'taha') {
      const superAdmin: User = {
        id: 'usr-super-taha',
        username: 'taha',
        password: 'taha',
        fullName: 'طه (المدير العام الأعلى)',
        role: 'ADMIN',
        isActive: true,
        createdAt: '2026-01-01',
        permissions: {
          manageProducts: true,
          manageSales: true,
          managePurchases: true,
          manageExpenses: true,
          manageEmployees: true,
          manageDebts: true,
          viewFinancialReports: true,
          viewAuditLogs: true,
          modifyRecords: true,
          deleteRecords: true,
          restoreDeleted: true,
          manageBackups: true,
          manageTemplates: true,
          manageUsers: true,
        },
      };
      setCurrentUser(superAdmin);
      addAuditLog('تسجيل دخول المدير العام الأعلى (طه)', 'User', superAdmin.id, undefined, superAdmin.username);
      return true;
    }

    const found = users.find((u) => {
      const matchName = (u.username || '').trim().toLowerCase() === uname;
      const userPass = (u.password !== undefined && u.password !== null && u.password !== '')
        ? u.password
        : (u.username === 'admin' ? 'adminpassword' : u.username === 'cashier' ? 'cashierpassword' : u.username === 'accountant' ? 'accountantpassword' : '123456');
      return matchName && userPass === cleanPass && u.isActive;
    });

    if (found) {
      setCurrentUser(found);
      addAuditLog('تسجيل دخول ناجح', 'User', found.id, undefined, found.username);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('تسجيل خروج', 'User', currentUser.id, currentUser.username);
    }
    setCurrentUser(null);
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: 'usr-' + Date.now(),
      createdAt: getTodayDateString(),
    };
    setUsers((prev) => [...prev, newUser]);
    saveUserToFirestore(newUser);
    addAuditLog('إضافة مستخدم جديد', 'User', newUser.id, undefined, newUser.username);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser && currentUser.id === id) {
            setCurrentUser(updated);
          }
          saveUserToFirestore(updated);
          return updated;
        }
        return u;
      })
    );
    addAuditLog('تحديث بيانات مستخدم', 'User', id);
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    deleteUserFromFirestore(id);
    addAuditLog('حذف مستخدم', 'User', id);
  };

  // Products logic
  const addCustomUnit = (unit: string) => {
    if (unit && !customUnits.includes(unit)) {
      setCustomUnits((prev) => [...prev, unit]);
    }
  };

  const recalculateProductCosts = (p: Partial<Product>): Product => {
    const components = p.productionCostComponents || [];
    const calculatedCost = components.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const manualOverride = p.manualProductionCostOverride;
    const effectiveProductionCost = manualOverride !== null && manualOverride !== undefined
      ? Number(manualOverride)
      : calculatedCost;

    return {
      ...(p as Product),
      calculatedProductionCost: calculatedCost,
      effectiveProductionCost,
    };
  };

  const addProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'calculatedProductionCost' | 'effectiveProductionCost'>
  ) => {
    const id = 'prod-' + Date.now();
    const rawProd = {
      ...productData,
      id,
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString(),
    };
    const finalProduct = recalculateProductCosts(rawProd);
    setProducts((prev) => [finalProduct, ...prev]);

    // Save directly to Firestore collection products
    saveProductToFirestore(finalProduct);

    // Auto-register cost component names into services/expenses categories
    if (finalProduct.productionCostComponents && finalProduct.productionCostComponents.length > 0) {
      finalProduct.productionCostComponents.forEach((comp) => {
        if (comp.name) {
          addExpenseCategory(comp.name);
        }
      });
    }

    addAuditLog('إضافة منتج جديد', 'Product', finalProduct.id, undefined, finalProduct.name);
    addCustomUnit(finalProduct.unit);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const merged = { ...p, ...updates, updatedAt: getTodayDateString() };
          const updated = recalculateProductCosts(merged);

          if (updated.productionCostComponents && updated.productionCostComponents.length > 0) {
            updated.productionCostComponents.forEach((comp) => {
              if (comp.name) {
                addExpenseCategory(comp.name);
              }
            });
          }

          saveProductToFirestore(updated);
          addAuditLog('تعديل منتج', 'Product', id, p.name, updated.name);
          return updated;
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string, reason?: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    deleteProductFromFirestore(id);
    addAuditLog('حذف منتج', 'Product', id, target.name, reason || 'حذف نهائي');
  };

  const toggleProductAvailability = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const nextAvail = !target.isAvailable;
    updateProduct(id, { isAvailable: nextAvail });
  };

  const setProductCostOverride = (id: string, overrideAmount: number | null) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    updateProduct(id, { manualProductionCostOverride: overrideAmount });
  };

  // Sales Creation & Movements
  const createSale = (
    saleData: Omit<SaleTransaction, 'id' | 'invoiceNo' | 'subtotal' | 'finalTotal' | 'debtAmount' | 'payments' | 'createdBy'>
  ): SaleTransaction => {
    const subtotal = saleData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const finalTotal = subtotal - (saleData.discount || 0);
    const debtAmount = Math.max(0, finalTotal - saleData.paidAmount);

    const saleId = 'sale-' + Date.now();
    const invoiceNo = generateInvoiceNumber('SALE');

    const initialPayments: PaymentRecord[] = saleData.paidAmount > 0 ? [
      {
        id: 'pay-' + Date.now(),
        transactionId: saleId,
        transactionType: 'SALE',
        amount: saleData.paidAmount,
        date: saleData.date,
        time: saleData.time,
        recordedBy: currentUser?.username || 'admin',
        method: 'نقداً',
        notes: 'دفعة عند إنشاء الفاتورة',
      }
    ] : [];

    const newSale: SaleTransaction = {
      ...saleData,
      id: saleId,
      invoiceNo,
      subtotal,
      finalTotal,
      debtAmount,
      payments: initialPayments,
      createdBy: currentUser?.username || 'cashier',
    };

    setSales((prev) => [newSale, ...prev]);
    saveSaleToFirestore(newSale);

    // Update Product Quantities & Record Inventory Movements
    saleData.items.forEach((item) => {
      setProducts((prevProds) =>
        prevProds.map((prod) => {
          if (prod.id === item.productId) {
            const newQty = prod.quantity - item.quantity;
            
            // Notification if low stock
            if (newQty <= prod.minStock) {
              addNotification(
                'تنبيه كمية منخفضة',
                `المنتج (${prod.name}) وصل إلى حد الأدنى: ${newQty} ${prod.unit}`,
                'WARNING'
              );
            }

            const updatedProd = { ...prod, quantity: newQty };
            saveProductToFirestore(updatedProd);
            return updatedProd;
          }
          return prod;
        })
      );

      // Inventory movement log
      const movement: InventoryMovement = {
        id: 'mov-' + Date.now() + Math.random(),
        productId: item.productId,
        productName: item.productName,
        type: 'SALE',
        quantity: item.quantity,
        unit: item.unit,
        date: saleData.date,
        username: currentUser?.username || 'cashier',
        referenceNo: invoiceNo,
        remainingQuantity: (products.find((p) => p.id === item.productId)?.quantity || 0) - item.quantity,
        notes: `بيع للزبون (${saleData.customerName})`,
      };
      setInventoryMovements((prev) => [movement, ...prev]);

      // Auto-calculate service & operational cost components (e.g. electricity, labor) for each sold item
      const prod = products.find((p) => p.id === item.productId);
      if (prod && prod.productionCostComponents && prod.productionCostComponents.length > 0) {
        prod.productionCostComponents.forEach((comp) => {
          const compAmount = Number(comp.amount) || 0;
          const compTotal = compAmount * item.quantity;
          if (compTotal > 0) {
            const compName = comp.name.trim();
            addExpenseCategory(compName);

            const autoExp: ExpenseRecord = {
              id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
              title: compName,
              description: compName,
              amount: compTotal,
              category: compName,
              date: saleData.date || getTodayDateString(),
              paymentMethod: 'تلقائي من المبيعات',
              recipient: 'مصاريف تشغيل المبيعات',
              notes: `احتساب تلقائي عند بيع ${item.quantity} ${prod.unit} - معدل المكون: ${compAmount} د.ع/وحدة (فاتورة ${invoiceNo})`,
              createdBy: currentUser?.username || 'system',
            };
            setExpenses((prevExps) => [autoExp, ...prevExps]);
            saveExpenseToFirestore(autoExp);
          }
        });
      }
    });

    addAuditLog('إنشاء فاتورة مبيعات', 'Sale', saleId, undefined, `${invoiceNo} - ${finalTotal} IQD`);

    return newSale;
  };

  const addSalePayment = (saleId: string, amount: number, method: string, notes?: string) => {
    setSales((prevSales) =>
      prevSales.map((s) => {
        if (s.id === saleId) {
          const newPaid = s.paidAmount + amount;
          const newDebt = Math.max(0, s.finalTotal - newPaid);
          const payment: PaymentRecord = {
            id: 'pay-' + Date.now(),
            transactionId: saleId,
            transactionType: 'SALE',
            amount,
            date: getTodayDateString(),
            time: getCurrentTimeString(),
            recordedBy: currentUser?.username || 'cashier',
            method,
            notes,
          };
          addAuditLog('تسديد دفعة دين مبيعات', 'Sale', saleId, `${s.paidAmount}`, `${newPaid}`);
          addNotification('تسديد دين زبون', `تم تسجيل دفعة بقيمة ${amount} د.ع للزبون ${s.customerName}`, 'SUCCESS');
          const updatedSale = {
            ...s,
            paidAmount: newPaid,
            debtAmount: newDebt,
            payments: [payment, ...s.payments],
          };
          saveSaleToFirestore(updatedSale);
          return updatedSale;
        }
        return s;
      })
    );
  };

  const softDeleteSale = (saleId: string, reason?: string) => {
    setSales((prev) =>
      prev.map((s) => {
        if (s.id === saleId) {
          // Restore inventory stock upon soft delete
          s.items.forEach((item) => {
            setProducts((pList) =>
              pList.map((p) => {
                if (p.id === item.productId) {
                  const restoredProd = { ...p, quantity: p.quantity + item.quantity };
                  saveProductToFirestore(restoredProd);
                  return restoredProd;
                }
                return p;
              })
            );
          });
          addAuditLog('حذف فاتورة مبيعات (أرشيف)', 'Sale', saleId, s.invoiceNo, reason);
          const updated = {
            ...s,
            isDeleted: true,
            deletedAt: `${getTodayDateString()} ${getCurrentTimeString()}`,
            deletedBy: currentUser?.username || 'admin',
            deleteReason: reason || 'حذف مؤقت',
          };
          saveSaleToFirestore(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const restoreSale = (saleId: string) => {
    setSales((prev) =>
      prev.map((s) => {
        if (s.id === saleId) {
          s.items.forEach((item) => {
            setProducts((pList) =>
              pList.map((p) => {
                if (p.id === item.productId) {
                  const reducedProd = { ...p, quantity: Math.max(0, p.quantity - item.quantity) };
                  saveProductToFirestore(reducedProd);
                  return reducedProd;
                }
                return p;
              })
            );
          });
          addAuditLog('استعادة فاتورة مبيعات من الأرشيف', 'Sale', saleId, s.invoiceNo);
          const updated = {
            ...s,
            isDeleted: false,
            deletedAt: undefined,
            deletedBy: undefined,
          };
          saveSaleToFirestore(updated);
          return updated;
        }
        return s;
      })
    );
  };

  // Purchases logic
  const createPurchase = (
    purchaseData: Omit<PurchaseTransaction, 'id' | 'invoiceNo' | 'subtotal' | 'finalTotal' | 'debtAmount' | 'payments' | 'createdBy'>
  ): PurchaseTransaction => {
    const subtotal = purchaseData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const finalTotal = subtotal;
    const debtAmount = Math.max(0, finalTotal - purchaseData.paidAmount);

    const purId = 'pur-' + Date.now();
    const invoiceNo = generateInvoiceNumber('PUR');

    const initialPayments: PaymentRecord[] = purchaseData.paidAmount > 0 ? [
      {
        id: 'pay-' + Date.now(),
        transactionId: purId,
        transactionType: 'PURCHASE',
        amount: purchaseData.paidAmount,
        date: purchaseData.date,
        time: purchaseData.time,
        recordedBy: currentUser?.username || 'accountant',
        method: 'نقداً',
        notes: 'دفعة للشراء عند الفاتورة',
      }
    ] : [];

    const newPurchase: PurchaseTransaction = {
      ...purchaseData,
      id: purId,
      invoiceNo,
      subtotal,
      finalTotal,
      debtAmount,
      payments: initialPayments,
      createdBy: currentUser?.username || 'accountant',
    };

    setPurchases((prev) => [newPurchase, ...prev]);
    savePurchaseToFirestore(newPurchase);

    // Increase Product Stock & Record Inventory Movement
    purchaseData.items.forEach((item) => {
      setProducts((prevProds) =>
        prevProds.map((prod) => {
          if (prod.id === item.productId) {
            const updatedProd = {
              ...prod,
              quantity: prod.quantity + item.quantity,
              purchasePrice: item.unitPrice > 0 ? item.unitPrice : prod.purchasePrice,
            };
            saveProductToFirestore(updatedProd);
            return updatedProd;
          }
          return prod;
        })
      );

      const movement: InventoryMovement = {
        id: 'mov-' + Date.now() + Math.random(),
        productId: item.productId,
        productName: item.productName,
        type: 'PURCHASE',
        quantity: item.quantity,
        unit: item.unit,
        date: purchaseData.date,
        username: currentUser?.username || 'accountant',
        referenceNo: invoiceNo,
        remainingQuantity: (products.find((p) => p.id === item.productId)?.quantity || 0) + item.quantity,
        notes: `توريد شراء من المورد (${purchaseData.supplierName})`,
      };
      setInventoryMovements((prev) => [movement, ...prev]);
    });

    addAuditLog('إنشاء فاتورة مشتريات', 'Purchase', purId, undefined, `${invoiceNo} - ${finalTotal} IQD`);

    return newPurchase;
  };

  const addPurchasePayment = (purchaseId: string, amount: number, methodOrNotes?: string, notesArg?: string) => {
    let method = 'نقداً';
    let notes = notesArg;
    if (methodOrNotes) {
      if (notesArg !== undefined) {
        method = methodOrNotes;
      } else {
        notes = methodOrNotes;
      }
    }
    setPurchases((prev) =>
      prev.map((p) => {
        if (p.id === purchaseId) {
          const newPaid = p.paidAmount + amount;
          const newDebt = Math.max(0, p.finalTotal - newPaid);
          const payment: PaymentRecord = {
            id: 'pay-' + Date.now(),
            transactionId: purchaseId,
            transactionType: 'PURCHASE',
            amount,
            date: getTodayDateString(),
            time: getCurrentTimeString(),
            recordedBy: currentUser?.username || 'accountant',
            method,
            notes,
          };
          addAuditLog('تسديد مستحق فاتورة مشتريات', 'Purchase', purchaseId, `${p.paidAmount}`, `${newPaid}`);
          const updated = {
            ...p,
            paidAmount: newPaid,
            debtAmount: newDebt,
            payments: [payment, ...p.payments],
          };
          savePurchaseToFirestore(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const softDeletePurchase = (purchaseId: string, reason?: string) => {
    setPurchases((prev) =>
      prev.map((p) => {
        if (p.id === purchaseId) {
          p.items.forEach((item) => {
            setProducts((pList) =>
              pList.map((prod) => {
                if (prod.id === item.productId) {
                  const updatedProd = { ...prod, quantity: Math.max(0, prod.quantity - item.quantity) };
                  saveProductToFirestore(updatedProd);
                  return updatedProd;
                }
                return prod;
              })
            );
          });
          addAuditLog('حذف فاتورة مشتريات (أرشيف)', 'Purchase', purchaseId, p.invoiceNo, reason);
          const updated = {
            ...p,
            isDeleted: true,
            deletedAt: `${getTodayDateString()} ${getCurrentTimeString()}`,
            deletedBy: currentUser?.username || 'admin',
            deleteReason: reason || 'حذف مؤقت',
          };
          savePurchaseToFirestore(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const restorePurchase = (purchaseId: string) => {
    setPurchases((prev) =>
      prev.map((p) => {
        if (p.id === purchaseId) {
          p.items.forEach((item) => {
            setProducts((pList) =>
              pList.map((prod) => {
                if (prod.id === item.productId) {
                  const updatedProd = { ...prod, quantity: prod.quantity + item.quantity };
                  saveProductToFirestore(updatedProd);
                  return updatedProd;
                }
                return prod;
              })
            );
          });
          addAuditLog('استعادة فاتورة مشتريات من الأرشيف', 'Purchase', purchaseId, p.invoiceNo);
          const updated = {
            ...p,
            isDeleted: false,
            deletedAt: undefined,
            deletedBy: undefined,
          };
          savePurchaseToFirestore(updated);
          return updated;
        }
        return p;
      })
    );
  };

  // Expense logic
  const addExpenseCategory = (cat: string) => {
    if (!cat) return;
    const trimmed = cat.trim();
    if (!trimmed) return;
    setExpenseCategories((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  };

  const addExpense = (expenseData: Omit<ExpenseRecord, 'id' | 'createdBy'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: 'exp-' + Date.now(),
      createdBy: currentUser?.username || 'accountant',
    };
    setExpenses((prev) => [newExpense, ...prev]);
    saveExpenseToFirestore(newExpense);
    addExpenseCategory(newExpense.category);
    addAuditLog('تسجيل مصروف جديد', 'Expense', newExpense.id, undefined, `${newExpense.category} - ${newExpense.amount} IQD`);
  };

  const deleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    deleteExpenseFromFirestore(id);
    addAuditLog('حذف مصروف نهائياً', 'Expense', id, target?.description || '');
  };

  const softDeleteExpense = (id: string, reason?: string) => {
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, isDeleted: true, deleteReason: reason };
          saveExpenseToFirestore(updated);
          return updated;
        }
        return e;
      })
    );
    addAuditLog('حذف مصروف', 'Expense', id, reason);
  };

  const restoreExpense = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, isDeleted: false };
          saveExpenseToFirestore(updated);
          return updated;
        }
        return e;
      })
    );
    addAuditLog('استعادة مصروف', 'Expense', id);
  };

  // Employees & Payroll
  const addEmployee = (empData: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmp: Employee = {
      ...empData,
      id: 'emp-' + Date.now(),
      createdAt: getTodayDateString(),
    };
    setEmployees((prev) => [...prev, newEmp]);
    saveEmployeeToFirestore(newEmp);
    addAuditLog('إضافة موظف جديد', 'Employee', newEmp.id, undefined, newEmp.fullName);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, ...updates };
          saveEmployeeToFirestore(updated);
          addAuditLog('تعديل بيانات موظف', 'Employee', id, e.fullName, updated.fullName);
          return updated;
        }
        return e;
      })
    );
  };

  const deleteEmployee = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    deleteEmployeeFromFirestore(id);
    if (emp) {
      addAuditLog('حذف موظف الكادر', 'Employee', id, emp.fullName, undefined);
    }
  };

  const recordAttendance = (employeeId: string, date: string, status: AttendanceRecord['status'], notes?: string) => {
    setAttendance((prev) => {
      const existing = prev.find((a) => a.employeeId === employeeId && a.date === date);
      if (existing) {
        const updatedRec = { ...existing, status, notes };
        saveAttendanceToFirestore(updatedRec);
        return prev.map((a) => a.id === existing.id ? updatedRec : a);
      }
      const newRec = { id: 'att-' + Date.now(), employeeId, date, status, notes };
      saveAttendanceToFirestore(newRec);
      return [...prev, newRec];
    });
    addAuditLog('تسجيل حضور موظف', 'Attendance', employeeId, date, status);
  };

  const generatePayroll = (empIdOrMonth: string, monthArg?: string, bonusVal?: number, deductionsVal?: number, notesVal?: string) => {
    let targetMonth = empIdOrMonth;
    let targetEmpId: string | null = null;

    if (monthArg) {
      targetEmpId = empIdOrMonth;
      targetMonth = monthArg;
    }

    const empsToProcess = targetEmpId ? employees.filter((e) => e.id === targetEmpId) : employees;

    empsToProcess.forEach((emp) => {
      const monthAtt = (attendance || []).filter((a) => a.employeeId === emp.id && a.date.startsWith(targetMonth));
      const presentDays = monthAtt.filter((a) => a.status === 'PRESENT').length;
      const absentDays = monthAtt.filter((a) => a.status === 'ABSENT').length;
      const leaveDays = monthAtt.filter((a) => a.status === 'LEAVE').length;
      const workingDays = 26;

      const finalBonus = bonusVal !== undefined ? bonusVal : (emp.bonus || 0);
      const finalDeductions = deductionsVal !== undefined ? deductionsVal : (emp.deductions || 0);
      const grossSalary = emp.baseSalary + finalBonus - finalDeductions;

      setPayrolls((prev) => {
        const existing = (prev || []).find((p) => p.employeeId === emp.id && p.month === targetMonth);
        if (existing) {
          const updatedPayroll = {
            ...existing,
            presentDays,
            absentDays,
            leaveDays,
            baseSalary: emp.baseSalary,
            bonus: finalBonus,
            deductions: finalDeductions,
            grossSalary,
            finalSalary: grossSalary,
            remainingSalary: grossSalary - (existing.paidSalary || 0),
            notes: notesVal || existing.notes,
          };
          savePayrollToFirestore(updatedPayroll);
          return prev.map((p) => p.id === existing.id ? updatedPayroll : p);
        }
        const newPayroll = {
          id: 'payr-' + Date.now() + Math.random().toString(36).substring(2, 6),
          employeeId: emp.id,
          employeeName: emp.fullName,
          month: targetMonth,
          baseSalary: emp.baseSalary,
          workingDays,
          presentDays,
          absentDays,
          leaveDays,
          bonus: finalBonus,
          deductions: finalDeductions,
          grossSalary,
          finalSalary: grossSalary,
          paidSalary: 0,
          remainingSalary: grossSalary,
          isPaid: false,
          notes: notesVal,
          paymentHistory: [],
        };
        savePayrollToFirestore(newPayroll);
        return [...prev, newPayroll];
      });
    });
    addAuditLog('توليد مسير راتب شهري', 'Payroll', targetMonth);
  };

  const addPayrollPayment = (payrollId: string, amount: number, method: string, notes?: string) => {
    setPayrolls((prev) =>
      prev.map((p) => {
        if (p.id === payrollId) {
          const newPaid = p.paidSalary + amount;
          const newRemaining = Math.max(0, p.grossSalary - newPaid);
          const payment: PaymentRecord = {
            id: 'pay-' + Date.now(),
            transactionId: payrollId,
            transactionType: 'DEBT_PAYMENT',
            amount,
            date: getTodayDateString(),
            time: getCurrentTimeString(),
            recordedBy: currentUser?.username || 'accountant',
            method,
            notes,
          };
          addAuditLog('تسديد راتب موظف', 'Payroll', payrollId, `${p.paidSalary}`, `${newPaid}`);
          const updated = {
            ...p,
            paidSalary: newPaid,
            remainingSalary: newRemaining,
            isPaid: newRemaining === 0,
            paymentHistory: [payment, ...(p.paymentHistory || [])],
          };
          savePayrollToFirestore(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const paySalary = (payrollId: string) => {
    const rec = (payrolls || []).find((p) => p.id === payrollId);
    if (!rec) return;
    const amountToPay = rec.remainingSalary || rec.grossSalary || rec.baseSalary || 0;
    addPayrollPayment(payrollId, amountToPay, 'نقداً', 'تسليم الراتب الكامل');
  };

  // Print Modal
  const openPrintModal = (title: string, type: PrintModalConfig['type'], data: any) => {
    setPrintModalConfig({
      isOpen: true,
      title,
      type,
      data,
    });
  };

  const closePrintModal = () => {
    setPrintModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const updatePrintTemplate = (id: string, updates: Partial<PrintTemplate>) => {
    setPrintTemplates((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          savePrintTemplateToFirestore(updated);
          return updated;
        }
        return t;
      })
    );
    addAuditLog('تحديث قالب الطباعة', 'PrintTemplate', id);
  };

  const addPrintTemplate = (templateData: Omit<PrintTemplate, 'id'>) => {
    const newTemplate: PrintTemplate = {
      ...templateData,
      id: 'tmpl-' + Date.now(),
    };
    setPrintTemplates((prev) => [...prev, newTemplate]);
    savePrintTemplateToFirestore(newTemplate);
    addAuditLog('إضافة قالب طباعة جديد', 'PrintTemplate', newTemplate.id, undefined, newTemplate.name);
  };

  // Settings
  const updateCompanySettings = (settings: CompanySettings) => {
    setCompanySettings(settings);
    saveCompanySettingsToFirestore(settings);
    addAuditLog('تعديل معلومات الشركة', 'CompanySettings');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const toggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (nextState) {
      // simulate syncing
      setPendingSyncCount(0);
      addNotification('تمت المزامنة بنجاح', 'تم مزامنة كافة العمليات المحفوظة محلية مع السحابة', 'SUCCESS');
    }
  };

  // Backup & Restore
  const exportBackupJson = (): string => {
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      companySettings,
      products,
      sales,
      purchases,
      expenses,
      employees,
      attendance,
      payrolls,
      printTemplates,
      auditLogs,
      inventoryMovements,
      customUnits,
      expenseCategories,
      users,
    };
    return JSON.stringify(backupObj, null, 2);
  };

  const importBackupJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.sales) setSales(parsed.sales);
      if (parsed.purchases) setPurchases(parsed.purchases);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.employees) setEmployees(parsed.employees);
      if (parsed.attendance) setAttendance(parsed.attendance);
      if (parsed.payrolls) setPayrolls(parsed.payrolls);
      if (parsed.companySettings) setCompanySettings(parsed.companySettings);
      if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
      if (parsed.printTemplates) setPrintTemplates(parsed.printTemplates);
      if (parsed.customUnits) setCustomUnits(parsed.customUnits);
      if (parsed.expenseCategories) setExpenseCategories(parsed.expenseCategories);
      if (parsed.inventoryMovements) setInventoryMovements(parsed.inventoryMovements);
      if (parsed.users) setUsers(parsed.users);

      addAuditLog('استعادة قاعدة البيانات من ملف JSON', 'Backup');
      addNotification('تم استعادة البيانات', 'تم استعادة قاعدة البيانات بنجاح من النسخة الاحتياطية', 'SUCCESS');
      return true;
    } catch (e) {
      console.error('Import backup failed', e);
      return false;
    }
  };

  const resetAllData = () => {
    setProducts([]);
    setSales([]);
    setPurchases([]);
    setExpenses([]);
    setEmployees([]);
    setAttendance([]);
    setPayrolls([]);
    setExpenseCategories([]);
    setCustomUnits([]);
    setInventoryMovements([]);
    setAuditLogs([]);
    setNotifications([]);

    addNotification('إعادة ضبط المصنع', 'تم حذف كافة البيانات وتفريغ النظام بالكامل بنجاح', 'SUCCESS');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        lang,
        setLang,
        t,
        activeTab,
        setActiveTab,
        companySettings,
        updateCompanySettings,
        products,
        customUnits,
        addCustomUnit,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        setProductCostOverride,
        inventoryMovements,
        sales,
        createSale,
        addSalePayment,
        softDeleteSale,
        restoreSale,
        purchases,
        createPurchase,
        addPurchasePayment,
        softDeletePurchase,
        restorePurchase,
        expenses,
        expenseCategories,
        addExpenseCategory,
        addExpense,
        deleteExpense,
        softDeleteExpense,
        restoreExpense,
        employees,
        attendance,
        attendanceRecords: attendance || [],
        payrolls,
        payrollRecords: payrolls || [],
        addEmployee,
        updateEmployee,
        deleteEmployee,
        recordAttendance,
        generatePayroll,
        addPayrollPayment,
        paySalary,
        printTemplates,
        updatePrintTemplate,
        addPrintTemplate,
        printModalConfig,
        openPrintModal,
        closePrintModal,
        auditLogs,
        notifications,
        markNotificationRead,
        addAuditLog,
        isOnline,
        toggleOnline,
        pendingSyncCount,
        isSaving: false,
        firebaseActive,
        syncKey,
        setSyncKey,
        triggerCloudPush,
        triggerCloudPull,
        lastCloudSyncTime,
        cloudSyncStatus,
        isCloudSyncModalOpen,
        setIsCloudSyncModalOpen,
        testCloudConnection,
        exportBackupJson,
        exportBackupJSON: exportBackupJson,
        importBackupJson,
        importBackupJSON: importBackupJson,
        resetAllData,
        resetSystemData: resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
