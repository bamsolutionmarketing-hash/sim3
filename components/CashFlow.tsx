
import React, { useState, useMemo } from 'react';
import { Transaction, SaleOrderWithStats, SimPackage } from '../types';
import { formatCurrency, generateCode, generateId, formatDate, formatNumberWithCommas, parseFormattedNumber } from '../utils';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, Filter } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  orders: SaleOrderWithStats[];
  packages: SimPackage[];
  onAdd: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

const CashFlow: React.FC<Props> = ({ transactions, orders, packages, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');
  
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: 'Thu bán sỉ',
    method: 'TRANSFER',
    saleOrderId: '',
    note: ''
  });

  const pendingOrders = useMemo(() => orders.filter(o => o.remaining > 0), [orders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
      id: generateId(),
      code: generateCode('TX'),
      type: transactionType,
      date: formData.date,
      amount: Number(formData.amount) || 0,
      category: formData.category,
      method: formData.method as any,
      saleOrderId: formData.saleOrderId || undefined,
      note: formData.note
    };
    onAdd(newTx);
    setIsModalOpen(false);
    setFormData(prev => ({ ...prev, amount: 0, saleOrderId: '', note: '' }));
  };

  const handleTypeChange = (type: 'IN' | 'OUT') => {
      setTransactionType(type);
      setFormData(prev => ({
          ...prev,
          category: type === 'IN' ? 'Thu bán sỉ' : 'Chi nhập SIM',
          saleOrderId: ''
      }));
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (filterStart) result = result.filter(t => t.date >= filterStart);
    if (filterEnd) result = result.filter(t => t.date <= filterEnd);
    return result;
  }, [transactions, filterStart, filterEnd]);

  const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const inputClass = "w-full px-4 py-2.5 bg-white text-slate-950 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-400 font-medium transition-all shadow-sm";

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 gap-4">
        <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Sổ Quỹ (Thu/Chi)
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Quản lý và đối soát dòng tiền chi tiết</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <input 
                    type="date" 
                    className="bg-transparent text-slate-700 text-xs font-black outline-none border-none"
                    value={filterStart}
                    onChange={(e) => setFilterStart(e.target.value)}
                />
                <span className="text-slate-300">~</span>
                <input 
                    type="date" 
                    className="bg-transparent text-slate-700 text-xs font-black outline-none border-none"
                    value={filterEnd}
                    onChange={(e) => setFilterEnd(e.target.value)}
                />
             </div>

            <div className="flex gap-2">
                <button
                onClick={() => { handleTypeChange('IN'); setIsModalOpen(true); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-black shadow-md shadow-emerald-100 transition-all"
                >
                <Plus className="w-4 h-4" /> THU
                </button>
                <button
                onClick={() => { handleTypeChange('OUT'); setIsModalOpen(true); }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-black shadow-md shadow-rose-100 transition-all"
                >
                <Plus className="w-4 h-4" /> CHI
                </button>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Mã GD</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-center">Đơn hàng</th>
                <th className="px-4 py-3">Ghi chú</th>
                <th className="px-4 py-3 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-400 italic font-medium">
                     Chưa ghi nhận giao dịch tài chính nào trong khoảng thời gian này.
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => {
                    const relatedOrder = orders.find(o => o.id === tx.saleOrderId);
                    return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-4 py-3 text-slate-400 font-mono text-[9px]">{tx.code}</td>
                            <td className="px-4 py-3 text-slate-700 font-bold">{formatDate(tx.date)}</td>
                            <td className="px-4 py-3">
                                {tx.type === 'IN' ? (
                                    <span className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase">
                                        <ArrowUpCircle className="w-3.5 h-3.5" /> Thu vào
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-rose-600 font-black text-[10px] uppercase">
                                        <ArrowDownCircle className="w-3.5 h-3.5" /> Chi ra
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-[10px] font-black uppercase tracking-tighter">{tx.category}</td>
                            <td className={`px-4 py-3 text-right font-black ${tx.type === 'IN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {tx.type === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                            <td className="px-4 py-3 text-center text-[10px] text-blue-600 font-black font-mono">
                                {relatedOrder ? relatedOrder.code : '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate text-xs">{tx.note}</td>
                            <td className="px-4 py-3 text-center">
                                <button
                                    onClick={() => onDelete(tx.id)}
                                    className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    );
                })
              )}
            </tbody>
          </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-200 border border-slate-100">
            <h3 className={`text-xl font-black mb-6 flex items-center gap-2 ${transactionType === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {transactionType === 'IN' ? <ArrowUpCircle /> : <ArrowDownCircle />}
                {transactionType === 'IN' ? 'Lập Phiếu Thu Tiền' : 'Lập Phiếu Chi Tiền'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Ngày chứng từ</label>
                    <input type="date" required className={inputClass} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Phương thức</label>
                     <select className={inputClass} value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}>
                         <option value="CASH">Tiền mặt</option>
                         <option value="TRANSFER">Chuyển khoản</option>
                         <option value="COD">Thu hộ (COD)</option>
                     </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Số tiền (VNĐ)</label>
                <input type="text" required className={`${inputClass} text-xl font-black text-slate-900`} value={formatNumberWithCommas(formData.amount)} onChange={(e) => setFormData({ ...formData, amount: parseFormattedNumber(e.target.value) })} />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Phân loại danh mục</label>
                <select className={inputClass} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    {transactionType === 'IN' ? (
                        <>
                            <option value="Thu bán sỉ">Thu bán sỉ</option>
                            <option value="Thu bán lẻ">Thu bán lẻ</option>
                            <option value="Thu khác">Thu khác</option>
                        </>
                    ) : (
                        <>
                            <option value="Chi nhập SIM">Chi nhập SIM</option>
                            <option value="Chi ship">Chi ship</option>
                            <option value="Chi phí mặt bằng">Chi phí mặt bằng</option>
                            <option value="Chi khác">Chi khác</option>
                        </>
                    )}
                </select>
              </div>

              {transactionType === 'IN' && (formData.category === 'Thu bán sỉ' || formData.category === 'Thu bán lẻ') && (
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Đối soát theo đơn hàng</label>
                      <select className={inputClass} value={formData.saleOrderId} onChange={(e) => {
                              const orderId = e.target.value;
                              const order = orders.find(o => o.id === orderId);
                              setFormData(prev => ({ ...prev, saleOrderId: orderId, amount: order && prev.amount === 0 ? order.remaining : prev.amount }));
                          }}
                      >
                          <option value="">-- Không gán đơn --</option>
                          {pendingOrders.map(o => (
                              <option key={o.id} value={o.id}>
                                  {o.code} - {o.customerName} (Nợ: {formatCurrency(o.remaining)})
                              </option>
                          ))}
                      </select>
                  </div>
              )}

              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nội dung ghi chú</label>
                  <textarea rows={2} className={inputClass} value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
              </div>
              
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black transition-all hover:bg-slate-200 uppercase text-[11px]">Hủy</button>
                <button type="submit" className={`flex-1 py-3 text-white rounded-2xl font-black transition-all shadow-lg uppercase text-[11px] ${transactionType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'}`}>Xác Nhận Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlow;
