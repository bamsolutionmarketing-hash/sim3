
import React, { useState, useMemo } from 'react';
import { SaleOrder, InventoryProductStat, SaleOrderWithStats, Customer, DueDateLog, Transaction } from '../types';
import { formatCurrency, generateCode, generateId, formatDate, formatNumberWithCommas, parseFormattedNumber } from '../utils';
import { Plus, Trash2, ShoppingCart, CheckSquare, Square, User, AlertCircle, Edit, Calendar } from 'lucide-react';

interface Props {
  orders: SaleOrder[];
  inventoryStats: InventoryProductStat[];
  customers: Customer[];
  getOrderStats: (order: SaleOrder) => SaleOrderWithStats;
  onAdd: (order: SaleOrder) => void;
  onAddTransaction: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onUpdateDueDate: (orderId: string, newDate: string, log: DueDateLog) => void;
}

const SalesList: React.FC<Props> = ({ orders, inventoryStats, customers, getOrderStats, onAdd, onAddTransaction, onDelete, onUpdateDueDate }) => {
  const [activeTab, setActiveTab] = useState<'WHOLESALE' | 'RETAIL'>('WHOLESALE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH' | 'COD'>('TRANSFER');

  const [formData, setFormData] = useState({
    customerId: '',
    retailCustomerInfo: '',
    simTypeId: '',
    quantity: 1,
    salePrice: 0,
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    note: ''
  });

  // Extension Modal State
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');

  const availableProducts = inventoryStats.filter(p => p.currentStock > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = generateId();
    const customer = customers.find(c => c.id === formData.customerId);
    const total = formData.quantity * formData.salePrice;

    const newOrder: SaleOrder = {
      id: orderId, code: generateCode('SO'), date: formData.date,
      customerId: activeTab === 'WHOLESALE' ? formData.customerId : undefined,
      agentName: activeTab === 'WHOLESALE' ? (customer?.name || 'Đại lý') : (formData.retailCustomerInfo || 'Khách lẻ'),
      saleType: activeTab, simTypeId: formData.simTypeId,
      quantity: Number(formData.quantity) || 1, salePrice: Number(formData.salePrice) || 0,
      dueDate: isPaid ? '' : formData.dueDate, dueDateChanges: 0,
      note: formData.note, isFinished: isPaid
    };

    if (isPaid) {
      onAddTransaction({
        id: generateId(), code: generateCode('TX'), type: 'IN', date: formData.date,
        amount: total, category: activeTab === 'WHOLESALE' ? 'Thu bán sỉ' : 'Thu bán lẻ',
        method: paymentMethod, saleOrderId: orderId, note: `Tự động thu đơn ${newOrder.code}`
      });
    }

    onAdd(newOrder);
    setIsModalOpen(false);
    setFormData({ customerId: '', retailCustomerInfo: '', simTypeId: '', quantity: 1, salePrice: 0, date: new Date().toISOString().split('T')[0], dueDate: '', note: '' });
  };

  const handleExtensionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    // Create log entry
    const log: DueDateLog = {
      id: generateId(),
      orderId: selectedOrder.id,
      oldDate: selectedOrder.dueDate,
      newDate: newDueDate,
      reason: extensionReason,
      updatedAt: new Date().toISOString()
    };

    onUpdateDueDate(selectedOrder.id, newDueDate, log);
    setIsExtensionModalOpen(false);
    setSelectedOrder(null);
    setNewDueDate('');
    setExtensionReason('');
  };

  const filteredOrders = useMemo(() => orders.filter(o => o.saleType === activeTab).map(getOrderStats).sort((a, b) => b.date.localeCompare(a.date)), [orders, activeTab, getOrderStats]);

  const inputClass = "w-full px-4 py-3 bg-white text-slate-950 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none placeholder-slate-400 font-bold transition-all shadow-sm";

  return (
    <div className="space-y-4 font-sans">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-extrabold text-slate-800 uppercase tracking-tight">Bán Hàng</h2>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all uppercase text-[11px] tracking-widest"><Plus size={18} /> Đơn Mới</button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 ml-2">
        <button onClick={() => setActiveTab('WHOLESALE')} className={`pb-3 px-4 font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'WHOLESALE' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Bán Sỉ (Đại lý)</button>
        <button onClick={() => setActiveTab('RETAIL')} className={`pb-3 px-4 font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'RETAIL' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Bán Lẻ (Khách lẻ)</button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] border-b border-slate-100 tracking-widest">
            <tr>
              <th className="px-6 py-4">Mã / Ngày</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4 text-right">Tổng tiền</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-center w-20">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredOrders.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-300 italic font-bold uppercase text-xs tracking-widest">Chưa có đơn hàng nào được ghi nhận.</td></tr>
            ) : (
              filteredOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 tracking-tight">{o.code}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase">{formatDate(o.date)}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-600">{o.customerName}</td>
                  <td className="px-6 py-4 text-right font-extrabold text-slate-900 text-base">{formatCurrency(o.totalAmount)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border tracking-tight ${o.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                      {o.status === 'PAID' ? 'Hoàn tất' : 'Còn nợ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {o.status !== 'PAID' && (
                        <button
                          onClick={() => {
                            const originalOrder = orders.find(ord => ord.id === o.id);
                            if (originalOrder) {
                              setSelectedOrder(originalOrder);
                              setNewDueDate(originalOrder.dueDate);
                              setIsExtensionModalOpen(true);
                            }
                          }}
                          className="text-slate-300 hover:text-indigo-600 transition-colors p-2"
                          title="Gia hạn nợ"
                        >
                          <Calendar size={16} />
                        </button>
                      )}
                      <button onClick={() => onDelete(o.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 animate-in zoom-in duration-200 border border-slate-100">
            <h3 className="text-2xl font-extrabold text-slate-800 mb-8 uppercase tracking-tight">Tạo Đơn Hàng</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === 'WHOLESALE' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Khách Hàng (Đại lý)</label>
                  <select required className={inputClass} value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}>
                    <option value="">-- Chọn Khách --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Thông tin khách lẻ</label>
                  <input type="text" placeholder="Tên và SĐT khách..." className={inputClass} value={formData.retailCustomerInfo} onChange={(e) => setFormData({ ...formData, retailCustomerInfo: e.target.value })} />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Chọn Gói Sim</label>
                <select required className={inputClass} value={formData.simTypeId} onChange={(e) => setFormData({ ...formData, simTypeId: e.target.value })}>
                  <option value="">-- Chọn Sản Phẩm --</option>
                  {availableProducts.map(p => <option key={p.simTypeId} value={p.simTypeId}>{p.name} (Tồn: {p.currentStock})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Số lượng</label>
                  <input type="text" className={inputClass} value={formatNumberWithCommas(formData.quantity)} onChange={(e) => setFormData({ ...formData, quantity: parseFormattedNumber(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Đơn giá bán</label>
                  <input type="text" className={inputClass} value={formatNumberWithCommas(formData.salePrice)} onChange={(e) => setFormData({ ...formData, salePrice: parseFormattedNumber(e.target.value) })} />
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setIsPaid(!isPaid)}>
                    {isPaid ? <CheckSquare className="text-indigo-600 w-6 h-6" /> : <Square className="text-slate-300 w-6 h-6" />}
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Đã thu đủ tiền</span>
                  </div>
                </div>
                {!isPaid && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Ngày hẹn thanh toán</label>
                    <input type="date" required className={inputClass} value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                  </div>
                )}
                {isPaid && (
                  <div className="flex gap-2">
                    {['TRANSFER', 'CASH', 'COD'].map(m => (
                      <button key={m} type="button" onClick={() => setPaymentMethod(m as any)} className={`flex-1 py-3 text-[10px] font-bold rounded-xl border transition-all uppercase tracking-widest ${paymentMethod === m ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-white text-slate-400 border-slate-200'}`}>
                        {m === 'TRANSFER' ? 'Chuyển khoản' : (m === 'CASH' ? 'Tiền mặt' : 'COD')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold transition-all hover:bg-slate-200 uppercase text-[11px] tracking-widest">Hủy</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 uppercase text-[11px] tracking-widest">Lưu Đơn</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isExtensionModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4 font-sans">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 animate-in zoom-in duration-200 border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Calendar size={20} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">Gia Hạn Nợ</h3>
            </div>

            <form onSubmit={handleExtensionSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Mã Đơn Hàng</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700">{selectedOrder.code}</div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Hạn Thanh Toán Mới</label>
                <input
                  type="date"
                  required
                  className={inputClass}
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Lý do gia hạn</label>
                <textarea
                  required
                  className={inputClass}
                  rows={3}
                  placeholder="Nhập lý do gia hạn..."
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsExtensionModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold transition-all hover:bg-slate-200 uppercase text-[11px] tracking-widest">Hủy</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 uppercase text-[11px] tracking-widest">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesList;
