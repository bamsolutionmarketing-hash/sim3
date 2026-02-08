
import { useState, useEffect } from 'react';
import { SimPackage, SaleOrder, Transaction, SimType, Customer, DueDateLog } from '../types';
import { supabase } from '../supabaseClient';

interface AppData {
  packages: SimPackage[];
  orders: SaleOrder[];
  transactions: Transaction[];
  simTypes: SimType[];
  customers: Customer[];
  dueDateLogs: DueDateLog[];
}

const initialData: AppData = {
  packages: [],
  orders: [],
  transactions: [],
  simTypes: [],
  customers: [],
  dueDateLogs: []
};

export const useAppStore = () => {
  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: simTypes } = await supabase.from('sim_types').select('*');
      const { data: packages } = await supabase.from('sim_packages').select('*');
      const { data: customers } = await supabase.from('customers').select('*');
      const { data: orders } = await supabase.from('sale_orders').select('*');
      const { data: transactions } = await supabase.from('transactions').select('*');
      const { data: dueDateLogs } = await supabase.from('due_date_logs').select('*');

      setData({
        simTypes: (simTypes || []).map(d => ({ ...d })),
        packages: (packages || []).map(d => ({
          ...d,
          simTypeId: d.sim_type_id,
          importDate: d.import_date,
          totalImportPrice: d.total_import_price
        })),
        customers: (customers || []).map(d => ({ ...d })),
        orders: (orders || []).map(d => ({
          ...d,
          customerId: d.customer_id,
          agentName: d.agent_name,
          saleType: d.sale_type,
          simTypeId: d.sim_type_id,
          salePrice: d.sale_price,
          dueDate: d.due_date,
          dueDateChanges: d.due_date_changes,
          isFinished: d.is_finished
        })),
        transactions: (transactions || []).map(d => ({
          ...d,
          saleOrderId: d.sale_order_id
        })),
        dueDateLogs: (dueDateLogs || []).map(d => ({
          ...d,
          orderId: d.order_id,
          oldDate: d.old_date,
          newDate: d.new_date,
          updatedAt: d.updated_at
        }))
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchData();
      } else if (event === 'SIGNED_OUT') {
        setData(initialData);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const importFullData = (newData: AppData) => {
    // Deprecated or implement bulk insert if needed
    console.warn('Import not supported in Supabase mode');
  };

  // --- Actions ---

  const addSimType = async (type: SimType) => {
    // Optimistic update
    setData(p => ({ ...p, simTypes: [type, ...p.simTypes] }));
    const { error } = await supabase.from('sim_types').insert([{
      id: type.id,
      name: type.name
    }]);
    if (error) console.error('Error adding sim type:', error);
  };

  const deleteSimType = async (id: string) => {
    setData(p => ({ ...p, simTypes: p.simTypes.filter(i => i.id !== id) }));
    const { error } = await supabase.from('sim_types').delete().eq('id', id);
    if (error) console.error('Error deleting sim type:', error);
  };

  const addPackage = async (pkg: SimPackage) => {
    setData(p => ({ ...p, packages: [pkg, ...p.packages] }));
    const { error } = await supabase.from('sim_packages').insert([{
      id: pkg.id,
      code: pkg.code,
      name: pkg.name,
      sim_type_id: pkg.simTypeId,
      import_date: pkg.importDate,
      quantity: pkg.quantity,
      total_import_price: pkg.totalImportPrice
    }]);
    if (error) console.error('Error adding package:', error);
  };

  const deletePackage = async (id: string) => {
    setData(p => ({ ...p, packages: p.packages.filter(i => i.id !== id) }));
    const { error } = await supabase.from('sim_packages').delete().eq('id', id);
    if (error) console.error('Error deleting package:', error);
  };

  const addCustomer = async (c: Customer) => {
    setData(p => ({ ...p, customers: [c, ...p.customers] }));
    const { error } = await supabase.from('customers').insert([{
      id: c.id,
      cid: c.cid,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      type: c.type,
      note: c.note
    }]);
    if (error) console.error('Error adding customer:', error);
  };

  const updateCustomer = async (c: Customer) => {
    setData(p => ({ ...p, customers: p.customers.map(i => i.id === c.id ? c : i) }));
    const { error } = await supabase.from('customers').update({
      cid: c.cid,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      type: c.type,
      note: c.note
    }).eq('id', c.id);
    if (error) console.error('Error updating customer:', error);
  };

  const deleteCustomer = async (id: string) => {
    setData(p => ({ ...p, customers: p.customers.filter(i => i.id !== id) }));
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) console.error('Error deleting customer:', error);
  };

  const addOrder = async (order: SaleOrder) => {
    setData(p => ({ ...p, orders: [order, ...p.orders] }));
    const { error } = await supabase.from('sale_orders').insert([{
      id: order.id,
      code: order.code,
      date: order.date,
      customer_id: order.customerId,
      agent_name: order.agentName,
      sale_type: order.saleType,
      sim_type_id: order.simTypeId,
      quantity: order.quantity,
      sale_price: order.salePrice,
      due_date: order.dueDate || null,
      due_date_changes: order.dueDateChanges,
      note: order.note,
      is_finished: order.isFinished
    }]);
    if (error) console.error('Error adding order:', error);
  };

  const deleteOrder = async (id: string) => {
    setData(p => ({ ...p, orders: p.orders.filter(i => i.id !== id) }));
    const { error } = await supabase.from('sale_orders').delete().eq('id', id);
    if (error) console.error('Error deleting order:', error);
  };

  const updateOrderDueDate = async (orderId: string, newDate: string, log: DueDateLog) => {
    setData(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === orderId ? { ...o, dueDate: newDate, dueDateChanges: (o.dueDateChanges || 0) + 1 } : o),
      dueDateLogs: [log, ...prev.dueDateLogs]
    }));

    // We can't easily get the current due_date_changes without fetching, but for now we assume the frontend state is correct-ish or we use an RPC.
    // simpler to just update the field.
    // Fetching current value to increment might be safer, but let's trust the passed value or params if possible.
    // The hook logic above increments local state.

    // We'll trust the local state calculation for now or just standard increment in DB?
    // Supabase supports `auth.uid()` etc but not direct field increment in simpler update calls without Rpc/Stored procedure usually? 
    // Actually, we can just update with the value we calculated locally.

    // Find the order to get the new change count
    const order = data.orders.find(o => o.id === orderId);
    const newChanges = (order?.dueDateChanges || 0) + 1;

    const { error: orderError } = await supabase.from('sale_orders').update({
      due_date: newDate,
      due_date_changes: newChanges
    }).eq('id', orderId);

    if (orderError) console.error('Error updating order due date:', orderError);

    const { error: logError } = await supabase.from('due_date_logs').insert([{
      id: log.id,
      order_id: log.orderId,
      old_date: log.oldDate,
      new_date: log.newDate,
      reason: log.reason,
      updated_at: log.updatedAt
    }]);

    if (logError) console.error('Error adding due date log:', logError);

    // Update Customer Tags if order has customerId (and reason exists)
    const orderToUpdate = data.orders.find(o => o.id === orderId);
    if (orderToUpdate && orderToUpdate.customerId && log.reason) {
      const customer = data.customers.find(c => c.id === orderToUpdate.customerId);
      if (customer) {
        const currentTags = customer.tags || [];
        // Avoid duplicate tags if exactly the same reason already exists? Or just append?
        // User request: "Lưu lại lý do chậm trả dưới dạng thẻ từ lý do nhập vào".
        // Let's split commas if user entered multiple, and trim.
        const newTags = log.reason.split(',').map(t => t.trim()).filter(t => t);
        const uniqueTags = Array.from(new Set([...currentTags, ...newTags]));

        // Update local state
        setData(p => ({
          ...p,
          customers: p.customers.map(c => c.id === customer.id ? { ...c, tags: uniqueTags } : c)
        }));

        // Update DB
        const { error: tagError } = await supabase.from('customers').update({
          tags: uniqueTags
        }).eq('id', customer.id);

        if (tagError) console.error('Error updating customer tags:', tagError);
      }
    }
  };

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('Cannot add transaction: No user logged in');
    return;
  }

  const newTransaction = { ...tx, user_id: user.id };
  setData(p => ({ ...p, transactions: [newTransaction, ...p.transactions] }));

  const { error } = await supabase.from('transactions').insert([{
    id: tx.id,
    code: tx.code,
    date: tx.date,
    type: tx.type,
    category: tx.category,
    amount: tx.amount,
    method: tx.method,
    sale_order_id: tx.saleOrderId,
    user_id: user.id, // Add user_id manually
    note: tx.note
  }]);
  if (error) console.error('Error adding transaction:', error);
};

const deleteTransaction = async (id: string) => {
  setData(p => ({ ...p, transactions: p.transactions.filter(i => i.id !== id) }));
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) console.error('Error deleting transaction:', error);
};

return {
  ...data, fullData: data, importFullData, loading,
  addPackage, deletePackage, addOrder, deleteOrder, updateOrderDueDate,
  addTransaction, deleteTransaction, addSimType, deleteSimType,
  addCustomer, updateCustomer, deleteCustomer
};
};
