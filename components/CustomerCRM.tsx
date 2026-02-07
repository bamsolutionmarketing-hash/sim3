
import React, { useState } from 'react';
import { Customer, CustomerWithStats } from '../types';
import { generateId, generateCID, formatCurrency, formatDate } from '../utils';
import { Plus, Trash2, Edit2, Users, Search, MapPin, Phone, Siren, ShieldAlert } from 'lucide-react';

interface Props {
  customers: CustomerWithStats[];
  onAdd: (c: Customer) => void;
  onUpdate: (c: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerCRM: React.FC<Props> = ({ customers, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState<Customer>({
    id: '', cid: '', name: '', phone: '', email: '', address: '', type: 'RETAIL', note: ''
  });

  const handleOpenAdd = () => {
      setEditMode(false);
      setFormData({ id: '', cid: '', name: '', phone: '', email: '', address: '', type: 'RETAIL', note: '' });
      setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
      setEditMode(true);
      setFormData({ ...customer });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMode) onUpdate(formData);
    else {
        const newCustomer: Customer = { ...formData, id: generateId(), cid: generateCID(formData.name, formData.phone, formData.email) };
        onAdd(newCustomer);
    }
    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.cid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = "w-full px-4 py-3 bg-white text-slate-950 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none placeholder-slate-400 font-bold transition-all shadow-sm";

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-extrabold text-slate-800 uppercase tracking-tight">Khách Hàng</h2>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text"
                    placeholder="Tìm theo tên hoặc SĐT..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-slate-400 text-slate-900 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest">
                <Plus className="w-4 h-4" /> THÊM
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-100 text-slate-400 font-bold italic border-dashed shadow-inner uppercase text-xs tracking-widest">Không có dữ liệu khách hàng.</div>
          ) : (
            filteredCustomers.map(c => (
                <div key={c.id} className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all relative group ${c.worstDebtLevel === 'RECOVERY' ? 'ring-2 ring-red-500 bg-red-50/20' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                             <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-200 uppercase tracking-tighter">{c.cid}</span>
                             <h3 className="text-lg font-extrabold text-slate-800 mt-2">{c.name}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${c.type === 'WHOLESALE' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {c.type === 'WHOLESALE' ? 'SỈ' : 'LẺ'}
                        </span>
                    </div>

                    <div className="space-y-3 text-sm text-slate-600 mb-6 font-medium">
                        <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-indigo-400" /> {c.phone || 'Chưa cập nhật'}</div>
                        <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-slate-300" /> <span className="truncate">{c.address || 'Chưa cập nhật'}</span></div>
                    </div>

                    <div className="border-t border-slate-100 pt-5 grid grid-cols-2 gap-3">
                         <div className="bg-slate-50 p-3 rounded-2xl text-center">
                             <p className="text-[9px] text-slate-400 font-bold uppercase mb-1 tracking-widest">Doanh số</p>
                             <p className="font-extrabold text-slate-800">{formatCurrency(c.gmv)}</p>
                         </div>
                         <div className={`p-3 rounded-2xl text-center border ${c.currentDebt > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                             <p className="text-[9px] text-slate-400 font-bold uppercase mb-1 tracking-widest">Nợ</p>
                             <p className={`font-extrabold ${c.currentDebt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(c.currentDebt)}</p>
                         </div>
                    </div>

                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleOpenEdit(c)} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-sm"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(c.id)} className="p-2 bg-white border border-slate-200 hover:bg-red-50 rounded-xl text-red-500 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
            ))
          )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 font-sans">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 animate-in zoom-in duration-200 border border-slate-100">
            <h3 className="text-2xl font-extrabold text-slate-800 mb-8 uppercase tracking-tight">{editMode ? 'Sửa thông tin khách' : 'Thêm khách mới'}</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Họ và Tên</label>
                    <input type="text" required className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">SĐT</label>
                    <input type="text" className={inputClass} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Loại khách</label>
                      <select className={inputClass} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
                          <option value="RETAIL">Khách lẻ</option>
                          <option value="WHOLESALE">Đại lý</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Email</label>
                      <input type="email" className={inputClass} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
              </div>

              <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Địa chỉ</label>
                  <input type="text" className={inputClass} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold transition-all hover:bg-slate-200 uppercase text-[11px] tracking-widest">Hủy</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 uppercase text-[11px] tracking-widest">{editMode ? 'Cập nhật' : 'Xác nhận'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCRM;
