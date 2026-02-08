
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { InventoryProductStat, SaleOrderWithStats, Transaction, CustomerWithStats } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { TrendingUp, TrendingDown, DollarSign, Package, Calendar, Filter, MessageCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

interface Props {
  packages: InventoryProductStat[];
  orders: SaleOrderWithStats[];
  transactions: Transaction[];
  customers: CustomerWithStats[];
}

const Dashboard: React.FC<Props> = ({ packages, orders, transactions, customers }) => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const todayStr = new Date().toISOString().split('T')[0];

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

  const totalStock = packages.reduce((acc, p) => acc + p.currentStock, 0);
  const totalReceivables = filteredOrders.reduce((acc, o) => acc + o.remaining, 0);
  const totalIn = filteredTransactions.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.amount, 0);
  const totalOut = filteredTransactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.amount, 0);
  const cashBalance = totalIn - totalOut;
  const totalEstimatedProfit = filteredOrders.reduce((acc, o) => acc + o.profit, 0);

  const todayRevenue = orders.filter(o => o.date === todayStr).reduce((s, o) => s + o.totalAmount, 0);
  const todayProfit = orders.filter(o => o.date === todayStr).reduce((s, o) => s + o.profit, 0);
  const todayOrdersCount = orders.filter(o => o.date === todayStr).length;

  const nextWeekStr = new Date();
  nextWeekStr.setDate(nextWeekStr.getDate() + 7);
  const nextWeekISO = nextWeekStr.toISOString().split('T')[0];

  const weeklyDebtOrders = orders.filter(o =>
    o.remaining > 0 &&
    o.dueDate &&
    o.dueDate <= nextWeekISO
  ).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  const zaloDebtMessage = useMemo(() => {
    const header = `📋 THÔNG BÁO THU HỒI NỢ TUẦN NÀY (${formatDate(todayStr)})\n----------------------------\n`;
    const bodyText = weeklyDebtOrders.length > 0
      ? weeklyDebtOrders.map(o => {
        const cust = customers.find(c => c.id === o.customerId);
        const statusIcon = o.debtLevel === 'RECOVERY' ? '🚨' : (o.debtLevel === 'WARNING' ? '⚠️' : (o.isOverdue ? '⏰' : '📅'));
        return `${statusIcon} ${o.customerName} - ${cust?.phone || 'N/A'}\n💰 Nợ: ${formatCurrency(o.remaining)}\n📅 Hạn: ${formatDate(o.dueDate)}\n`;
      }).join('\n')
      : "✅ Không có nợ đến hạn trong tuần này.";

    const footer = `\n----------------------------\n👉 Nhân viên phụ trách vui lòng kiểm tra và đôn đốc!`;
    return header + bodyText + footer;
  }, [weeklyDebtOrders, customers, todayStr]);

  const handleCopyZalo = () => {
    navigator.clipboard.writeText(zaloDebtMessage);
    alert("Đã copy tin nhắn nhắc nợ!");
  };

  const chartData = useMemo(() => {
    // Map to store { retail: 0, wholesale: 0 } for each date
    const map = new Map<string, { retail: number; wholesale: number }>();

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const d = new Date(start);
      while (d <= end) {
        map.set(d.toISOString().split('T')[0], { retail: 0, wholesale: 0 });
        d.setDate(d.getDate() + 1);
      }
    }

    filteredOrders.forEach(o => {
      const current = map.get(o.date) || { retail: 0, wholesale: 0 };
      if (o.saleType === 'RETAIL') {
        current.retail += o.totalAmount;
      } else {
        current.wholesale += o.totalAmount;
      }
      map.set(o.date, current);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => {
        const d = new Date(date);
        return {
          name: `${d.getDate()}/${d.getMonth() + 1}`,
          retail: data.retail,
          wholesale: data.wholesale,
          total: data.retail + data.wholesale
        };
      });
  }, [filteredOrders, startDate, endDate]);

  const dateInputClass = "px-4 py-2 bg-white text-slate-950 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none shadow-sm transition-all";

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-7 h-7 text-blue-600" />
          <h2 className="text-2xl font-extrabold text-slate-800 uppercase tracking-tight">Tổng quan</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Từ</span>
            <input
              type="date"
              className={dateInputClass}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đến</span>
            <input
              type="date"
              className={dateInputClass}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Dòng Tiền Thực', value: cashBalance, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Công Nợ Kỳ Này', value: totalReceivables, icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Tổng Tồn Kho', value: totalStock, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', isQty: true },
          { label: 'Lợi Nhuận Gộp', value: totalEstimatedProfit, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
              <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className={`text-2xl font-black ${card.color}`}>
              {card.isQty ? card.value.toLocaleString() : formatCurrency(card.value as number)}
            </h3>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Biểu đồ Doanh Thu</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Đơn vị: VNĐ</span>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} dy={10} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(value) => {
                  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                  return value;
                }}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Open Sans' }}
                formatter={(v: any) => formatCurrency(v)}
              />
              <Legend iconType="circle" />
              <Bar name="Bán Lẻ" dataKey="retail" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar name="Bán Sỉ" dataKey="wholesale" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-widest">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Ngày hôm nay
            </h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-semibold text-slate-400 uppercase">Đơn hàng mới</span>
                <span className="font-extrabold text-indigo-600 text-xl">{todayOrdersCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-semibold text-slate-400 uppercase">Doanh thu</span>
                <span className="font-extrabold text-slate-900 text-lg">{formatCurrency(todayRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Lợi nhuận</span>
                <span className="font-extrabold text-emerald-600 text-lg">+{formatCurrency(todayProfit)}</span>
              </div>
            </div>
          </div>
          <div className="mt-10 p-5 bg-indigo-50/50 rounded-3xl text-[11px] text-indigo-700 leading-relaxed font-bold italic border border-indigo-100">
            Cập nhật lần cuối: {formatDate(todayStr)}.
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                Nợ đến hạn (7 ngày)
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 uppercase mt-2">Tổng cộng {weeklyDebtOrders.length} khách nợ</p>
            </div>
            <button
              onClick={handleCopyZalo}
              className="bg-[#0068ff] hover:bg-[#0051cc] text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-[11px] font-bold shadow-xl shadow-blue-100 transition-all uppercase tracking-widest"
            >
              <MessageCircle className="w-4 h-4" /> Copy Nhắc Nợ
            </button>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {weeklyDebtOrders.length === 0 ? (
              <div className="text-center py-16 text-slate-400 italic bg-slate-50 rounded-3xl border border-dashed border-slate-200 font-bold uppercase text-xs tracking-widest">
                Chưa có nợ đến hạn trong tuần.
              </div>
            ) : (
              weeklyDebtOrders.map(o => (
                <div key={o.id} className={`p-5 rounded-[2rem] border flex items-center justify-between transition-all hover:shadow-sm ${o.debtLevel === 'RECOVERY' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${o.debtLevel === 'RECOVERY' ? 'bg-red-600 text-white' : (o.debtLevel === 'WARNING' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white')}`}>
                      {o.debtLevel === 'RECOVERY' ? <ShieldAlert className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-base">
                        {o.customerName}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-tight mt-1">
                        Hạn: {formatDate(o.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-extrabold text-lg ${o.debtLevel === 'RECOVERY' ? 'text-red-600' : 'text-slate-900'}`}>
                      {formatCurrency(o.remaining)}
                    </p>
                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase border mt-1 inline-block ${o.debtLevel === 'RECOVERY' ? 'bg-red-100 text-red-700 border-red-200' : (o.debtLevel === 'WARNING' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200')}`}>
                      {o.debtLevel === 'RECOVERY' ? 'THU HỒI NỢ' : (o.debtLevel === 'WARNING' ? 'CẢNH BÁO' : (o.isOverdue ? 'QUÁ HẠN' : 'CHỜ THU'))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
