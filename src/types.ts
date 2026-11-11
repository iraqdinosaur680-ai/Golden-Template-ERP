export type RoleName = 'ADMIN' | 'CASHIER' | 'ACCOUNTANT' | string;
export type UserRole = RoleName;

export interface Permission {
  manageUsers: boolean;
  manageProducts: boolean;
  managePurchases: boolean;
  manageSales: boolean;
  manageExpenses: boolean;
  manageDebts: boolean;
  manageEmployees: boolean;
  manageTemplates: boolean;
  manageBackups: boolean;
  viewAuditLogs: boolean;
  modifyRecords: boolean;
  deleteRecords: boolean;
  restoreDeleted: boolean;
  viewFinancialReports: boolean;
}

export type UserPermissions = Permission;

export interface User {
  id: string;
  username: string;
  fullName: string;
  password?: string;
  role: RoleName;
  permissions: Permission;
  isActive: boolean;
  createdAt: string;
}

export interface CostComponent {
  id: string;
  name: string;
  amount: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  minStock: number;
  isAvailable: boolean;
  productionCostComponents: CostComponent[];
  calculatedProductionCost: number;
  manualProductionCostOverride?: number | null;
  effectiveProductionCost: number;
  purchasePrice: number;
  sellingPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'PURCHASE' | 'SALE' | 'PRODUCTION' | 'RETURN' | 'ADJUSTMENT';
  quantity: number;
  unit: string;
  date: string;
  username: string;
  referenceNo?: string;
  remainingQuantity: number;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  transactionId: string;
  transactionType: 'SALE' | 'PURCHASE' | 'DEBT_PAYMENT';
  amount: number;
  date: string;
  time: string;
  recordedBy: string;
  method: string;
  notes?: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  productionCostSnapshot?: number;
  notes?: string;
}

export interface SaleTransaction {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone?: string;
  customerCompany?: string;
  date: string;
  time: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  finalTotal: number;
  paidAmount: number;
  debtAmount: number;
  notes?: string;
  createdBy: string;
  payments: PaymentRecord[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
}

export interface PurchaseTransaction {
  id: string;
  invoiceNo: string;
  supplierName: string;
  supplierPhone?: string;
  supplierCompany?: string;
  date: string;
  time: string;
  items: TransactionItem[];
  subtotal: number;
  finalTotal: number;
  paidAmount: number;
  debtAmount: number;
  expectedPaymentDate?: string;
  notes?: string;
  createdBy: string;
  payments: PaymentRecord[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
}

export interface PersonDebtRecord {
  id: string;
  personName: string;
  phone?: string;
  companyName?: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  totalBilled: number;
  totalPaid: number;
  remainingDebt: number;
  transactionCount: number;
  lastTransactionDate: string;
  lastPaymentDate?: string;
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  category: string;
  amount: number;
  date: string;
  time?: string;
  description: string;
  title?: string;
  paymentMethod?: string;
  recipient?: string;
  notes?: string;
  createdBy: string;
  isDeleted?: boolean;
  deleteReason?: string;
}

export type Expense = ExpenseRecord;
export type ExpenseItem = ExpenseRecord;

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'OTHER';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  phone: string;
  position: string;
  shift: string;
  startTime: string;
  endTime: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  role?: string;
  status?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  baseSalary: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  bonus: number;
  deductions: number;
  grossSalary: number;
  paidSalary: number;
  remainingSalary: number;
  manualOverride?: boolean;
  paymentHistory: PaymentRecord[];
  notes?: string;
}

export interface PrintTemplate {
  id: string;
  name: string;
  paperSize: 'A4' | 'A5';
  companyName: string;
  companyNameArabic: string;
  companyAddress: string;
  companyPhone: string;
  logoUrl?: string;
  headerNotes?: string;
  footerNotes?: string;
  showSignatureArea: boolean;
  showStampArea: boolean;
  showLogo: boolean;
  showCompanyDetails?: boolean;
  primaryColor: string;
}

export interface AuditLogItem {
  id: string;
  username: string;
  action: string;
  entity: string;
  entityId?: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  date: string;
  read: boolean;
}

export interface CompanySettings {
  companyName: string;
  companyNameArabic: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  taxNumber?: string;
  currency: string;
  defaultLanguage: 'ar' | 'en';
  devContactPhone?: string;
  devInstagram?: string;
  devWhatsapp?: string;
  devTelegram?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'products'
  | 'purchases'
  | 'sales'
  | 'expenses'
  | 'debts'
  | 'statements'
  | 'employees'
  | 'reports'
  | 'print-templates'
  | 'backup'
  | 'settings';
