
import React, { useState } from 'react';
import { SimPackage, SimType, InventoryProductStat } from '../types';
import { formatCurrency, generateCode, generateId, formatDate, formatNumberWithCommas, parseFormattedNumber } from '../utils';
import { Plus, Trash2, Box, ChevronDown, ChevronRight, History } from 'lucide-react';

interface Props {
  inventoryStats: InventoryProductStat[];
  simTypes: SimType[];
  onAdd: (pkg: SimPackage) => void;
  onDeleteBatch: (id: string) => void;
  onNavigateToProducts: () => void;
}

const SimInventory: React.FC<Props> = ({ inventoryStats, simTypes, onAdd, onDeleteBatch, onNavigateToProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    simTypeId: '',
    quantity: 0,
    totalImportPrice: 0,
    importDate: new Date().toISOString().split('T')[0],
  });

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedType = simTypes.find(t => t.id === formData.simTypeId);
    if (!selectedType) return;

    const newPackage: SimPackage = {
      id: generateId(),
      code: generateCode('SIM'),
      name: selectedType.name,
      simTypeId: selectedType.id,
      quantity: Number(formData.quantity) || 0,
      totalImportPrice: Number(formData.totalImportPrice) || 0,
      importDate: formData.importDate,
    };
    onAdd(newPackage);
    setIsModalOpen(false);
    setFormData({ simTypeId: '', quantity: 0, totalImportPrice: 0, importDate: new Date().toISOString().split('T')[0] });
  };

  const inputClass = "w-full px-4 py-3 bg-white text-slate-950 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-blue-500 outline-none placeholder-slate-400 font-bold transition-all shadow-sm";

  return (
    <div className="space-y-4 font-sans">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <Box className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-extrabold text-slate-800 uppercase tracking-tight">Kho Sim</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all shadow-xl shadow-blue-100 uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" />
          Nhập Lô Mới
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 tracking-widest">
              <tr>
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Tên Sản Phẩm</th>
                <th className="px-6 py-4 text-right">Tổng Nhập</th>
                <th className="px-6 py-4 text-right">Tổng Bán</th>
                <th className="px-6 py-4 text-right">Tồn Kho</th>
                <th className="px-6 py-4 text-right">Giá Vốn TB</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventoryStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic font-bold uppercase text-xs tracking-widest">
                    Chưa có hàng trong kho.
                  </td>
                </tr>
              ) : (
                inventoryStats.map((stat) => (
                  <React.Fragment key={stat.simTypeId}>
                    <tr 
                      className="hover:bg-slate-50 transition-colors cursor-pointer bg-white group"
                      onClick={() => toggleExpand(stat.simTypeId)}
                    >
                      <td className="px-6 py-4 text-slate-400">
                        {expandedRows.includes(stat.simTypeId) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-700 text-base">{stat.name}</td>
                      <td className="px-6 py-4 text-right text-slate-600 font-medium">{stat.totalImported.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-slate-600 font-medium">{stat.totalSold.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-900 text-lg">{stat.currentStock.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-slate-500 italic">{formatCurrency(stat.weightedAvgCost)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${stat.status === 'LOW_STOCK' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                          {stat.status === 'LOW_STOCK' ? 'Sắp hết' : 'Đủ hàng'}
                        </span>
                      </td>
                    </tr>

                    {expandedRows.includes(stat.simTypeId) && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={7} className="p-0">
                          <div className="px-8 py-6 border-y border-slate-100">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 flex items-center gap-2 tracking-widest">
                              <History size={14} /> Chi tiết các lô hàng nhập
                            </h4>
                            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px]">
                                  <tr>
                                    <th className="px-6 py-3 text-left">Mã Lô</th>
                                    <th className="px-6 py-3 text-left">Ngày Nhập</th>
                                    <th className="px-6 py-3 text-right">SL</th>
                                    <th className="px-6 py-3 text-right">Tổng Tiền</th>
                                    <th className="px-6 py-3 text-right">Giá Vốn</th>
                                    <th className="px-6 py-3 text-center">Xóa</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {stat.batches.map(batch => (
                                    <tr key={batch.id} className="hover:bg-blue-50/30 transition-colors">
                                      <td className="px-6 py-3 font-bold text-slate-500">{batch.code}</td>
                                      <td className="px-6 py-3 text-slate-600">{formatDate(batch.importDate)}</td>
                                      <td className="px-6 py-3 text-right font-bold text-slate-800">{batch.quantity.toLocaleString()}</td>
                                      <td className="px-6 py-3 text-right text-slate-900 font-bold">{formatCurrency(batch.totalImportPrice)}</td>
                                      <td className="px-6 py-3 text-right text-slate-400 italic">
                                        {formatCurrency(batch.quantity > 0 ? batch.totalImportPrice / batch.quantity : 0)}
                                      </td>
                                      <td className="px-6 py-3 text-center">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); onDeleteBatch(batch.id); }}
                                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 animate-in fade-in zoom-in duration-200 border border-slate-100">
            <h3 className="text-2xl font-extrabold text-slate-800 mb-8 uppercase tracking-tight">Nhập Lô Sim</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Loại Sim</label>
                {simTypes.length > 0 ? (
                  <select
                    required
                    className={inputClass}
                    value={formData.simTypeId}
                    onChange={(e) => setFormData({ ...formData, simTypeId: e.target.value })}
                  >
                    <option value="">-- Chọn Loại Sim --</option>
                    {simTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center p-8 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                    <p className="text-xs text-slate-500 mb-4 font-bold uppercase">Danh mục trống!</p>
                    <button 
                      type="button" 
                      onClick={() => { setIsModalOpen(false); onNavigateToProducts(); }}
                      className="text-blue-600 font-bold text-xs hover:underline uppercase tracking-widest"
                    >
                      + Tạo sản phẩm mới
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Ngày Nhập</label>
                  <input
                    type="date"
                    required
                    className={inputClass}
                    value={formData.importDate}
                    onChange={(e) => setFormData({ ...formData, importDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Số Lượng</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={formatNumberWithCommas(formData.quantity)}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFormattedNumber(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Tổng Giá Nhập (VNĐ)</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  placeholder="50,000,000"
                  value={formatNumberWithCommas(formData.totalImportPrice)}
                  onChange={(e) => setFormData({ ...formData, totalImportPrice: parseFormattedNumber(e.target.value) })}
                />
              </div>
              
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 font-bold text-[11px] uppercase tracking-widest transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!formData.simTypeId}
                  className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-bold text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
                >
                  Nhập Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimInventory;
