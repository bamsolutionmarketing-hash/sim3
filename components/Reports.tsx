
import React, { useMemo, useState } from 'react';
import { Transaction, SaleOrderWithStats, DueDateLog } from '../types';
import { formatCurrency, formatDate, generateId } from '../utils';
import { useAppStore } from '../hooks/useAppStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import {
  TrendingUp, Calendar, Edit, Eye, Filter, BarChart3,
  DollarSign, ChevronLeft, ChevronRight, Siren, Tag, MessageSquare, History
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  orders: SaleOrderWithStats[];
  onUpdateDueDate: (orderId: string, newDate: string, log: DueDateLog) => void;
}

const Reports: React.FC<Props> = ({ transactions, orders, onUpdateDueDate }) => {
  const { dueDateLogs } = useAppStore();
  const [activeTab, setActiveTab] = useState<'CASHFLOW' | 'DEBT' | 'CALENDAR'>('CASHFLOW');

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [selectedDayOrders, setSelectedDayOrders] = useState<{ date: string, orders: SaleOrderWithStats[] } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SaleOrderWithStats | null>(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [reason, setReason] = useState('');

  const debtOrders = useMemo(() => orders.filter(o => o.remaining > 0), [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (startDate && o.date < startDate) return false;
      if (endDate && o.date > endDate) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const statsData = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalProfit = filteredOrders.reduce((sum, o) => sum + (o.profit || 0), 0);
    const totalIn = filteredTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
    const totalOut = filteredTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);
    return { totalRevenue, totalProfit, totalIn, totalOut };
  }, [filteredOrders, filteredTransactions]);

  const monthlyData = useMemo(() => {
    const months = new Set<string>();
    filteredTransactions.forEach(t => months.add(t.date.substring(0, 7)));
    filteredOrders.forEach(o => months.add(o.date.substring(0, 7)));

    return Array.from(months).sort().map(month => {
      const monthTxs = filteredTransactions.filter(t => t.date.startsWith(month));
      const monthOrders = filteredOrders.filter(o => o.date.startsWith(month));
      return {
        name: month,
        Thu: monthTxs.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.amount, 0),
        Chi: monthTxs.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.amount, 0),
        Profit: monthOrders.reduce((acc, o) => acc + (o.profit || 0), 0)
      };
    });
  }, [filteredTransactions, filteredOrders]);

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewMonth, viewYear]);

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayOrders = orders.filter(o => o.date === dayStr);
      const dayProfit = dayOrders.reduce((sum, o) => sum + (o.profit || 0), 0);
      days.push({ day: i, date: dayStr, profit: dayProfit, orders: dayOrders });
    }
    return days;
  }, [viewMonth, viewYear, orders, daysInMonth]);

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const log: DueDateLog = {
      id: generateId(),
      orderId: selectedOrder.id,
      oldDate: selectedOrder.dueDate,
      newDate: newDueDate,
      reason: reason,
      updatedAt: new Date().toISOString()
    };
    onUpdateDueDate(selectedOrder.id, newDueDate, log);
    setIsModalOpen(false);
    setReason('');
  };

  const inputClass = "w-full px-4 py-3 bg-white text-slate-950 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none placeholder-slate-400 font-bold transition-all shadow-sm";

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-extrabold text-slate-800 uppercase tracking-tight">Báo cáo & Phân tích</h2>
        </div>
        {activeTab !== 'CALENDAR' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 shadow-inner">
              <Filter size={16} className="text-slate-400" />
              <input type="date" className="bg-transparent border-none text-xs font-bold text-slate-800 outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="text-slate-300">~</span>
              <input type="date" className="bg-transparent border-none text-xs font-bold text-slate-800 outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 border-b border-slate-200 ml-2">
        <button onClick={() => setActiveTab('CASHFLOW')} className={`pb-3 px-4 font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'CASHFLOW' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Dòng tiền</button>
        <button onClick={() => setActiveTab('CALENDAR')} className={`pb-3 px-4 font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'CALENDAR' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}>Lịch doanh số</button>
        <button onClick={() => setActiveTab('DEBT')} className={`pb-3 px-4 font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'DEBT' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-400'}`}>Sổ nợ đại lý</button>
      </div>

      {activeTab === 'CASHFLOW' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Doanh thu', value: statsData.totalRevenue, color: 'text-slate-900' },
              { label: 'Lợi nhuận gộp', value: statsData.totalProfit, color: 'text-emerald-600', prefix: '+' },
              { label: 'Thực thu', value: statsData.totalIn, color: 'text-blue-600' },
              { label: 'Thực chi', value: statsData.totalOut, color: 'text-rose-600' }
            ].map((card, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{card.label}</p>
                <p className={`text-xl font-extrabold ${card.color}`}>{card.prefix}{formatCurrency(card.value)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold mb-10 flex items-center gap-2 text-slate-800 uppercase tracking-widest"><TrendingUp className="text-emerald-500" /> Thống kê Thu/Chi</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip formatter={(v) => formatCurrency(v as number)} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontFamily: 'Open Sans' }} />
                    <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '20px', textTransform: 'uppercase' }} />
                    <Bar dataKey="Thu" name="Thu" fill="#10B981" radius={[6, 6, 0, 0]} barSize={22} />
                    <Bar dataKey="Chi" name="Chi" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold mb-10 flex items-center gap-2 text-slate-800 uppercase tracking-widest"><DollarSign className="text-indigo-500" /> Biểu đồ Lợi nhuận</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip formatter={(v) => formatCurrency(v as number)} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontFamily: 'Open Sans' }} />
                    <Line type="monotone" dataKey="Profit" name="Lợi nhuận" stroke="#6366F1" strokeWidth={5} dot={{ r: 6, fill: '#6366F1', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CALENDAR' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); }}
                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-500 transition-colors border border-slate-100"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="text-lg font-bold text-slate-800 w-56 text-center uppercase tracking-widest">Tháng {viewMonth + 1} / {viewYear}</div>
              <button
                onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); }}
                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-500 transition-colors border border-slate-100"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
            {calendarDays.map((item) => {
              const isToday = item.date === new Date().toISOString().split('T')[0];
              return (
                <div key={item.date} className={`bg-white p-5 rounded-[2.2rem] border shadow-sm transition-all flex flex-col justify-between min-h-[140px] relative group ${isToday ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-md' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-base font-bold ${isToday ? 'text-indigo-600 underline underline-offset-4' : 'text-slate-300'}`}>{item.day}</span>
                    {item.orders.length > 0 && (
                      <button onClick={() => setSelectedDayOrders({ date: item.date, orders: item.orders })} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm"><Eye size={14} /></button>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${item.profit > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>{item.orders.length} đơn</p>
                    <p className={`text-sm font-extrabold truncate mt-1 ${item.profit > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{item.profit > 0 ? `+${formatCurrency(item.profit)}` : '0 ₫'}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedDayOrders && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
              <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full p-10 animate-in zoom-in duration-200 flex flex-col max-h-[85vh] border border-slate-100 font-sans">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight uppercase">Chi tiết ngày {formatDate(selectedDayOrders.date)}</h3>
                  </div>
                  <button onClick={() => setSelectedDayOrders(null)} className="p-4 bg-slate-50 rounded-3xl hover:bg-slate-100 text-slate-400 transition-all"><ChevronRight className="rotate-90 md:rotate-0" /></button>
                </div>
                <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-5">
                  {selectedDayOrders.orders.map(order => (
                    <div key={order.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white text-indigo-600 rounded-2xl border border-slate-100 flex items-center justify-center font-bold text-xl shadow-sm">{order.customerName[0]}</div>
                        <div>
                          <div className="flex items-center gap-3"><span className="font-bold text-slate-800 text-base">{order.customerName}</span><span className="text-[8px] font-bold bg-white px-2 py-1 border border-slate-200 rounded-lg text-slate-400 uppercase tracking-tighter">{order.code}</span></div>
                          <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-tighter">{order.productName} • SL: {order.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lợi nhuận</p>
                        <p className="font-extrabold text-emerald-600 text-xl">+{formatCurrency(order.profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center">
                  <div className="bg-emerald-50 px-8 py-4 rounded-3xl border border-emerald-100 shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">Tổng lãi ngày</span>
                    <span className="text-2xl font-extrabold text-emerald-700">{formatCurrency(selectedDayOrders.orders.reduce((sum, o) => sum + o.profit, 0))}</span>
                  </div>
                  <button onClick={() => setSelectedDayOrders(null)} className="px-10 py-4 bg-slate-900 text-white font-bold rounded-3xl shadow-2xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest">Đóng</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'DEBT' && (
        <div className="space-y-6">
          {debtOrders.length === 0 ? (
            <div className="bg-white p-24 text-center rounded-[3rem] border border-dashed border-slate-300 text-slate-400 font-bold uppercase text-xs tracking-[0.2em] shadow-inner">Hiện tại không có khoản nợ nào.</div>
          ) : (
            debtOrders.map(order => (
              <div key={order.id} className={`bg-white p-8 rounded-[3rem] border shadow-sm transition-all flex flex-col md:flex-row gap-8 ${order.debtLevel === 'RECOVERY' ? 'ring-2 ring-red-500 bg-red-50/20' : 'border-slate-100'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <h4 className="font-extrabold text-slate-800 text-xl tracking-tight uppercase">{order.customerName}</h4>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-3 py-1 rounded-xl border border-slate-200 uppercase tracking-widest">{order.code}</span>
                    {order.debtLevel === 'RECOVERY' && <span className="flex items-center gap-2 text-[10px] font-bold bg-red-600 text-white px-4 py-1.5 rounded-full animate-pulse shadow-xl shadow-red-200 uppercase tracking-widest"><Siren size={14} /> Thu hồi khẩn cấp</span>}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                      { label: 'Tổng đơn', value: formatCurrency(order.totalAmount), color: 'text-slate-600' },
                      { label: 'Dư nợ', value: formatCurrency(order.remaining), color: 'text-red-600' },
                      { label: 'Ngày đến hạn', value: formatDate(order.dueDate), color: 'text-slate-800' },
                      { label: 'Gia hạn', value: `${order.dueDateChanges} lần`, color: 'text-orange-600' }
                    ].map((item, i) => (
                      <div key={i} className="bg-white/60 p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">{item.label}</p>
                        <p className={`font-extrabold text-base ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex md:flex-col justify-center gap-4">
                  <button onClick={() => { setSelectedOrder(order); setNewDueDate(order.dueDate); setIsModalOpen(true); }} className="flex-1 bg-indigo-50 text-indigo-700 px-8 py-4 rounded-3xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100 uppercase tracking-widest shadow-sm">
                    <Edit size={16} /> Gia hạn nợ
                  </button>
                  <button className="flex-1 bg-red-600 text-white px-8 py-4 rounded-3xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-2xl shadow-red-100 uppercase tracking-widest">
                    <MessageSquare size={16} /> Nhắc Zalo
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4 font-sans">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 animate-in zoom-in duration-200 border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Calendar size={20} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">Gia Hạn Nợ</h3>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Khách hàng</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700">{selectedOrder.customerName}</div>
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
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold transition-all hover:bg-slate-200 uppercase text-[11px] tracking-widest">Hủy</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 uppercase text-[11px] tracking-widest">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
