import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';
import rawConfig from '../../firebase-applet-config.json';
import {
  Product,
  SaleTransaction,
  PurchaseTransaction,
  ExpenseItem,
  Employee,
  AttendanceRecord,
  PayrollRecord,
  CompanySettings,
  User,
  AuditLogItem,
  PrintTemplate
} from '../types';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;

// Standard config from blueprint/applet config or environment variables
const defaultConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || (rawConfig.projectId ? `${rawConfig.projectId}.firebaseapp.com` : ''),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || (rawConfig.projectId ? `${rawConfig.projectId}.firebasestorage.app` : ''),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || rawConfig.firestoreDatabaseId || '(default)',
};

function createFirestoreInstance(app: FirebaseApp, databaseId?: string): Firestore {
  const settings = {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  };
  try {
    if (databaseId) {
      return initializeFirestore(app, settings, databaseId);
    }
    return initializeFirestore(app, settings);
  } catch {
    if (databaseId) {
      return getFirestore(app, databaseId);
    }
    return getFirestore(app);
  }
}

// Initialize immediately so db and auth are ready synchronously on module load
try {
  if (defaultConfig.apiKey && defaultConfig.projectId) {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(defaultConfig);
    } else {
      firebaseApp = getApp();
    }
    
    firestoreDb = createFirestoreInstance(firebaseApp, defaultConfig.firestoreDatabaseId);
    firebaseAuth = getAuth(firebaseApp);
    signInAnonymously(firebaseAuth).catch((e) => {
      console.info('Anonymous auth status:', e?.message || 'anonymous session active');
    });
    console.log('Firebase Firestore initialized with database:', defaultConfig.firestoreDatabaseId || '(default)');

    // Validate connection to Firestore on initial boot with non-blocking error handling
    getDocFromServer(doc(firestoreDb, 'test', 'connection')).catch((error) => {
      console.info('Firestore initial connection status:', error?.message || 'ready');
    });
  }
} catch (err) {
  console.warn('Initial Firebase boot notice:', err);
}

export { firebaseApp, firestoreDb, firebaseAuth };

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth?.currentUser?.uid || null,
      email: firebaseAuth?.currentUser?.email || null,
      emailVerified: firebaseAuth?.currentUser?.emailVerified || null,
      isAnonymous: firebaseAuth?.currentUser?.isAnonymous || null,
      tenantId: firebaseAuth?.currentUser?.tenantId || null,
      providerInfo: firebaseAuth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Dynamic configuration loader
export async function getFirebaseInstance(): Promise<{
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
}> {
  if (firebaseApp && firestoreDb) {
    return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth };
  }

  const config: FirebaseConfig = defaultConfig;
  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    firestoreDb = createFirestoreInstance(firebaseApp, config.firestoreDatabaseId);
    firebaseAuth = getAuth(firebaseApp);
  } catch (err) {
    console.warn('Notice initializing Firebase App:', err);
  }

  return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth };
}

// Direct Firestore persistence functions for entities
export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, { ...product, syncedAt: new Date().toISOString() });
    console.log('Product persisted to Firestore:', product.id, product.name);
  } catch (err) {
    console.error('Failed to save product to Firestore:', err);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
    console.log('Product deleted from Firestore:', productId);
  } catch (err) {
    console.error('Failed to delete product from Firestore:', err);
  }
}

export async function saveSaleToFirestore(sale: SaleTransaction): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'sales', sale.id);
    await setDoc(docRef, { ...sale, syncedAt: new Date().toISOString() });
    console.log('Sale persisted to Firestore:', sale.id, sale.invoiceNo);
  } catch (err) {
    console.error('Failed to save sale to Firestore:', err);
  }
}

export async function deleteSaleFromFirestore(saleId: string): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'sales', saleId);
    await deleteDoc(docRef);
    console.log('Sale deleted from Firestore:', saleId);
  } catch (err) {
    console.error('Failed to delete sale from Firestore:', err);
  }
}

export async function savePurchaseToFirestore(purchase: PurchaseTransaction): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'purchases', purchase.id);
    await setDoc(docRef, { ...purchase, syncedAt: new Date().toISOString() });
    console.log('Purchase persisted to Firestore:', purchase.id, purchase.invoiceNo);
  } catch (err) {
    console.error('Failed to save purchase to Firestore:', err);
  }
}

export async function deletePurchaseFromFirestore(purchaseId: string): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'purchases', purchaseId);
    await deleteDoc(docRef);
    console.log('Purchase deleted from Firestore:', purchaseId);
  } catch (err) {
    console.error('Failed to delete purchase from Firestore:', err);
  }
}

export async function saveExpenseToFirestore(expense: ExpenseItem): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'expenses', expense.id);
    await setDoc(docRef, { ...expense, syncedAt: new Date().toISOString() });
    console.log('Expense persisted to Firestore:', expense.id);
  } catch (err) {
    console.error('Failed to save expense to Firestore:', err);
  }
}

export async function deleteExpenseFromFirestore(expenseId: string): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'expenses', expenseId);
    await deleteDoc(docRef);
    console.log('Expense deleted from Firestore:', expenseId);
  } catch (err) {
    console.error('Failed to delete expense from Firestore:', err);
  }
}

export async function saveEmployeeToFirestore(employee: Employee): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'employees', employee.id);
    await setDoc(docRef, { ...employee, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to save employee to Firestore:', err);
  }
}

export async function deleteEmployeeFromFirestore(employeeId: string): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'employees', employeeId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete employee from Firestore:', err);
  }
}

export async function saveAttendanceToFirestore(attendance: AttendanceRecord): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'attendance', attendance.id);
    await setDoc(docRef, { ...attendance, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to save attendance to Firestore:', err);
  }
}

export async function savePayrollToFirestore(payroll: PayrollRecord): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'payrolls', payroll.id);
    await setDoc(docRef, { ...payroll, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to save payroll to Firestore:', err);
  }
}

export async function deleteAttendanceFromFirestore(attendanceId: string): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'attendance', attendanceId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete attendance from Firestore:', err);
  }
}

export async function deletePayrollFromFirestore(payrollId: string): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'payrolls', payrollId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete payroll from Firestore:', err);
  }
}

export async function saveInventoryMovementToFirestore(movement: any): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'inventory_movements', movement.id);
    await setDoc(docRef, { ...movement, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to save inventory movement to Firestore:', err);
  }
}

export async function deleteInventoryMovementFromFirestore(movementId: string): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'inventory_movements', movementId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete inventory movement from Firestore:', err);
  }
}

export async function saveSystemMetaToFirestore(meta: { customUnits?: string[]; expenseCategories?: string[] }): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'settings', 'system_meta');
    await setDoc(docRef, { ...meta, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Failed to save system meta to Firestore:', err);
  }
}

export async function saveCompanySettingsToFirestore(settings: CompanySettings): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'settings', 'company');
    await setDoc(docRef, { ...settings, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to save company settings to Firestore:', err);
  }
}

export async function saveUserToFirestore(user: User): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, { ...user, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to save user to Firestore:', err);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete user from Firestore:', err);
  }
}

export async function saveAuditLogToFirestore(log: AuditLogItem): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'audit_logs', log.id);
    await setDoc(docRef, { ...log, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to save audit log to Firestore:', err);
  }
}

export async function savePrintTemplateToFirestore(template: PrintTemplate): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'print_templates', template.id);
    await setDoc(docRef, { ...template, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to save print template to Firestore:', err);
  }
}

export async function deletePrintTemplateFromFirestore(templateId: string): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;
    const docRef = doc(db, 'print_templates', templateId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete print template from Firestore:', err);
  }
}

// Bulk sync all existing items to Firestore collections
export async function syncAllEntitiesToFirestore(state: {
  products?: Product[];
  sales?: SaleTransaction[];
  purchases?: PurchaseTransaction[];
  expenses?: ExpenseItem[];
  employees?: Employee[];
  attendance?: AttendanceRecord[];
  payrolls?: PayrollRecord[];
  companySettings?: CompanySettings;
  users?: User[];
  printTemplates?: PrintTemplate[];
}): Promise<void> {
  try {
    const db = firestoreDb || (await getFirebaseInstance()).db;
    if (!db) return;

    if (state.products && state.products.length > 0) {
      for (const p of state.products) {
        setDoc(doc(db, 'products', p.id), { ...p, syncedAt: new Date().toISOString() }).catch(() => {});
      }
    }

    if (state.sales && state.sales.length > 0) {
      for (const s of state.sales) {
        setDoc(doc(db, 'sales', s.id), { ...s, syncedAt: new Date().toISOString() }).catch(() => {});
      }
    }

    if (state.purchases && state.purchases.length > 0) {
      for (const pur of state.purchases) {
        setDoc(doc(db, 'purchases', pur.id), { ...pur, syncedAt: new Date().toISOString() }).catch(() => {});
      }
    }

    if (state.expenses && state.expenses.length > 0) {
      for (const exp of state.expenses) {
        setDoc(doc(db, 'expenses', exp.id), { ...exp, syncedAt: new Date().toISOString() }).catch(() => {});
      }
    }

    if (state.employees && state.employees.length > 0) {
      for (const emp of state.employees) {
        setDoc(doc(db, 'employees', emp.id), { ...emp, syncedAt: new Date().toISOString() }).catch(() => {});
      }
    }

    if (state.companySettings) {
      setDoc(doc(db, 'settings', 'company'), { ...state.companySettings, syncedAt: new Date().toISOString() }).catch(() => {});
    }

    if (state.users && state.users.length > 0) {
      for (const u of state.users) {
        setDoc(doc(db, 'users', u.id), { ...u, syncedAt: new Date().toISOString() }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Bulk entity sync notice:', err);
  }
}

// Test live Firestore connectivity
export async function testFirestoreConnection(db: Firestore): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const startTime = Date.now();
  try {
    const testDocRef = doc(db, 'devices_sync', 'connection_test_ping');
    await setDoc(testDocRef, {
      state: JSON.stringify({ ping: 'ok', timestamp: new Date().toISOString() }),
      updatedAt: new Date().toISOString(),
      clientSessionId: 'ping-test'
    });
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      latencyMs,
      message: `تم الاتصال بقاعدة بيانات Firestore بنجاح وبسرعة استجابة (${latencyMs} ميلي ثانية)`
    };
  } catch (error: any) {
    return {
      success: false,
      latencyMs: 0,
      message: error?.message || 'فشل الاتصال بقاعدة بيانات Firestore'
    };
  }
}

// Write app data state snapshot to Firestore under a specific device-sync key
export async function syncStateToFirestore(db: Firestore, syncKey: string, state: any): Promise<boolean> {
  const path = `devices_sync/${syncKey}`;
  try {
    const docRef = doc(db, 'devices_sync', syncKey);
    await setDoc(docRef, {
      state: JSON.stringify(state),
      updatedAt: new Date().toISOString(),
      clientSessionId: 'client-push'
    });
    return true;
  } catch (error) {
    console.error('Error synchronizing state to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch single-time state snapshot from Firestore
export async function fetchStateFromFirestore(db: Firestore, syncKey: string): Promise<any | null> {
  const path = `devices_sync/${syncKey}`;
  try {
    const docRef = doc(db, 'devices_sync', syncKey);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.state) {
        return JSON.parse(data.state);
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching state from Firestore:', error);
    handleFirestoreError(error, OperationType.GET, path);
  }
}
