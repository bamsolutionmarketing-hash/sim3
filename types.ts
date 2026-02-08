
export interface SimType {
  id: string;
  name: string;
}

export interface SimPackage {
  id: string;
  code: string;
  name: string;
  simTypeId: string;
  importDate: string;
  quantity: number;
  totalImportPrice: number;
}

export interface Customer {
  id: string;
  cid: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'WHOLESALE' | 'RETAIL';
  tags?: string[];
  note: string;
}

export interface CustomerWithStats extends Customer {
  gmv: number;
  currentDebt: number;
  nextDueDate: string | null;
  worstDebtLevel: 'NORMAL' | 'WARNING' | 'OVERDUE' | 'RECOVERY';
}

export interface DueDateLog {
  id: string;
  orderId: string;
  oldDate: string;
  newDate: string;
  reason: string;
  updatedAt: string;
}

export interface SaleOrder {
  id: string;
  code: string;
  date: string;
  customerId?: string;
  agentName: string;
  saleType: 'WHOLESALE' | 'RETAIL';
  simTypeId: string;
  quantity: number;
  salePrice: number;
  dueDate: string;
  dueDateChanges: number;
  note: string;
  isFinished: boolean;
}

export interface Transaction {
  id: string;
  code: string;
  date: string;
  type: 'IN' | 'OUT';
  category: string;
  amount: number;
  method: 'CASH' | 'TRANSFER' | 'COD';
  saleOrderId?: string;
  note: string;
}

export interface InventoryProductStat {
  simTypeId: string;
  name: string;
  totalImported: number;
  totalSold: number;
  currentStock: number;
  weightedAvgCost: number;
  status: 'OK' | 'LOW_STOCK';
  batches: SimPackage[];
}

export interface SaleOrderWithStats extends SaleOrder {
  productName: string;
  customerName: string;
  totalAmount: number;
  cost: number;
  profit: number;
  paidAmount: number;
  remaining: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  isOverdue: boolean;
  debtLevel: 'NORMAL' | 'WARNING' | 'OVERDUE' | 'RECOVERY';
  latestReason?: string;
}

// Added ZaloConfig interface to fix import error in ZaloManager.tsx
export interface ZaloConfig {
  oaId: string;
  accessToken: string;
  phoneNumber: string;
  isEnabled: boolean;
}
