
import React, { useState, useMemo } from 'react';
import { useAppStore } from './hooks/useAppStore';
import { InventoryProductStat, SaleOrderWithStats, CustomerWithStats } from './types';
import SimInventory from './components/SimInventory';
import SalesList from './components/SalesList';
import CashFlow from './components/CashFlow';
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import CustomerCRM from './components/CustomerCRM';
import Reports from './components/Reports';
import DataManager from './components/DataManager';
import { LayoutDashboard, Package, ShoppingCart, Wallet, Tags, Users, BarChart3, Database, Cpu } from 'lucide-react';

import { LogOut, UserCircle } from 'lucide-react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import { Session } from '@supabase/supabase-js';

function App() {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PRODUCTS' | 'INVENTORY' | 'SALES' | 'CASHFLOW' | 'CUSTOMERS' | 'REPORTS' | 'DATA'>('DASHBOARD');
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Thống kê Kho ---
  const inventoryStats: InventoryProductStat[] = useMemo(() => {
    return store.simTypes.map(type => {
      const batches = store.packages.filter(p => p.simTypeId === type.id);
      const imported = batches.reduce((s, p) => s + p.quantity, 0);
      const cost = imported > 0 ? Math.round(batches.reduce((s, p) => s + p.totalImportPrice, 0) / imported) : 0;
      const sold = store.orders.filter(o => o.simTypeId === type.id).reduce((s, o) => s + o.quantity, 0);
      return {
        simTypeId: type.id, name: type.name, totalImported: imported, totalSold: sold,
        currentStock: imported - sold, weightedAvgCost: cost,
        status: (imported - sold) <= 20 ? 'LOW_STOCK' : 'OK',
        batches
      };
    });
  }, [store.simTypes, store.packages, store.orders]);

  // --- Thống kê Đơn hàng ---
  const orderStats: SaleOrderWithStats[] = useMemo(() => {
    return store.orders.map(order => {
      const stats = inventoryStats.find(s => s.simTypeId === order.simTypeId);
      const total = order.quantity * order.salePrice;
      const profit = total - (order.quantity * (stats?.weightedAvgCost || 0));
      const paid = store.transactions.filter(t => t.saleOrderId === order.id && t.type === 'IN').reduce((s, t) => s + t.amount, 0);
      const remaining = Math.max(0, total - paid);
      const customer = store.customers.find(c => c.id === order.customerId);
      const latestLog = store.dueDateLogs
        .filter(l => l.orderId === order.id)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

      let debtLevel: 'NORMAL' | 'WARNING' | 'OVERDUE' | 'RECOVERY' = 'NORMAL';
      if (remaining > 0) {
        if (order.dueDateChanges >= 3) debtLevel = 'RECOVERY';
        else if (order.dueDate && new Date() > new Date(order.dueDate)) debtLevel = 'OVERDUE';
      }

      return {
        ...order,
        productName: stats?.name || '?',
        customerName: customer?.name || order.agentName,
        totalAmount: total,
        cost: order.quantity * (stats?.weightedAvgCost || 0),
        profit,
        paidAmount: paid,
        remaining,
        isOverdue: debtLevel === 'OVERDUE' || debtLevel === 'RECOVERY',
        status: remaining <= 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID'),
        debtLevel,
        latestReason: latestLog?.reason
      };
    });
  }, [store.orders, inventoryStats, store.transactions, store.customers]);

  // --- Thống kê Khách hàng ---
  const customerStats: CustomerWithStats[] = useMemo(() => {
    return store.customers.map(c => {
      const cOrders = orderStats.filter(o => o.customerId === c.id);
      const lv = ['NORMAL', 'WARNING', 'OVERDUE', 'RECOVERY'];

      const worstLevel = cOrders.reduce((w, o) => {
        return lv.indexOf(o.debtLevel) > lv.indexOf(w) ? o.debtLevel : w;
      }, 'NORMAL' as 'NORMAL' | 'WARNING' | 'OVERDUE' | 'RECOVERY');

      return {
        ...c,
        gmv: cOrders.reduce((s, o) => s + o.totalAmount, 0),
        currentDebt: cOrders.reduce((s, o) => s + o.remaining, 0),
        nextDueDate: cOrders.filter(o => o.remaining > 0 && o.dueDate).map(o => o.dueDate).sort()[0] || null,
        worstDebtLevel: worstLevel
      };
    });
  }, [store.customers, orderStats]);

  const menu = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Tổng quan' },
    { id: 'REPORTS', icon: BarChart3, label: 'Báo cáo & Lịch' },
    { id: 'SALES', icon: ShoppingCart, label: 'Bán Hàng' },
    { id: 'CASHFLOW', icon: Wallet, label: 'Sổ Quỹ' },
    { id: 'INVENTORY', icon: Package, label: 'Kho Sim' },
    { id: 'CUSTOMERS', icon: Users, label: 'Khách Hàng' },
    { id: 'PRODUCTS', icon: Tags, label: 'Sản phẩm' },
    { id: 'DATA', icon: Database, label: 'Dữ liệu' }
  ];

  // Ensure loading state is handled if needed, but for now we rely on initial session check.
  // Actually, we might want a loading state while fetching session?
  // The current implementation initializes session as null.
  // We can add a simple loading check if helpful, but let's stick to the prompt.

  if (!session) {
    return <Auth onClose={() => { }} />; // onClose is now no-op or we can remove the prop from Auth if we refactor it further, but for now just pass empty function.
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-900">
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:w-64 md:h-screen bg-white border-t md:border-r border-slate-200 z-50 flex flex-col">
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-slate-100">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">SIM B2B</h1>
        </div>
        <div className="flex md:flex-col justify-around md:justify-start p-2 md:p-4 gap-1 flex-1 overflow-y-auto">
          {menu.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 font-medium'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] md:text-sm uppercase tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="hidden md:block p-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <UserCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'DASHBOARD' && (
            <Dashboard
              packages={inventoryStats}
              orders={orderStats}
              transactions={store.transactions}
              customers={customerStats}
            />
          )}
          {activeTab === 'REPORTS' && (
            <Reports
              transactions={store.transactions}
              orders={orderStats}
              customers={store.customers}
              onUpdateDueDate={store.updateOrderDueDate}
            />
          )}
          {activeTab === 'SALES' && (
            <SalesList
              orders={store.orders}
              inventoryStats={inventoryStats}
              customers={store.customers}
              getOrderStats={(o) => orderStats.find(os => os.id === o.id) || ({} as any)}
              onAdd={store.addOrder}
              onAddTransaction={store.addTransaction}
              onDelete={store.deleteOrder}
              onUpdateDueDate={store.updateOrderDueDate}
            />
          )}
          {activeTab === 'CASHFLOW' && (
            <CashFlow
              transactions={store.transactions}
              orders={orderStats}
              packages={store.packages}
              onAdd={store.addTransaction}
              onDelete={store.deleteTransaction}
            />
          )}
          {activeTab === 'INVENTORY' && (
            <SimInventory
              inventoryStats={inventoryStats}
              simTypes={store.simTypes}
              onAdd={store.addPackage}
              onDeleteBatch={store.deletePackage}
              onNavigateToProducts={() => setActiveTab('PRODUCTS')}
            />
          )}
          {activeTab === 'CUSTOMERS' && (
            <CustomerCRM
              customers={customerStats}
              onAdd={store.addCustomer}
              onUpdate={store.updateCustomer}
              onDelete={store.deleteCustomer}
            />
          )}
          {activeTab === 'PRODUCTS' && (
            <ProductManager
              simTypes={store.simTypes}
              onAdd={store.addSimType}
              onDelete={store.deleteSimType}
            />
          )}
          {activeTab === 'DATA' && (
            <DataManager
              fullData={store.fullData}
              onImport={store.importFullData}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
