
import React, { useState } from 'react';
import { SimType } from '../types';
import { generateId } from '../utils';
import { Plus, Trash2, Tags } from 'lucide-react';

interface Props {
  simTypes: SimType[];
  onAdd: (type: SimType) => void;
  onDelete: (id: string) => void;
}

const ProductManager: React.FC<Props> = ({ simTypes, onAdd, onDelete }) => {
  const [newTypeName, setNewTypeName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    const newType: SimType = {
      id: generateId(),
      name: newTypeName.trim(),
    };
    onAdd(newType);
    setNewTypeName('');
  };

  const inputClass = "flex-1 px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none bg-white text-slate-950 placeholder-slate-400 shadow-sm transition-all font-bold";

  return (
    <div className="space-y-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-8 uppercase tracking-tighter">
          <Tags className="w-6 h-6 text-purple-600" />
          Danh mục Loại Sim (Sản phẩm)
        </h2>
        
        <form onSubmit={handleSubmit} className="flex gap-3 mb-10">
          <input
            type="text"
            className={inputClass}
            placeholder="Nhập tên loại sim mới (VD: SIM5G-90N, C90N...)"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newTypeName.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-2xl font-black transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-100 uppercase text-[11px] tracking-widest"
          >
            <Plus className="w-4 h-4" /> Thêm mới
          </button>
        </form>

        <div className="border-t border-slate-100 pt-8">
          <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest">Danh sách sản phẩm hiện có ({simTypes.length})</h3>
          {simTypes.length === 0 ? (
            <div className="text-slate-400 italic text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-bold">
              Chưa có loại sim nào. Hãy thêm sản phẩm đầu tiên của bạn.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {simTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 group hover:border-purple-500 hover:shadow-sm transition-all group">
                  <span className="font-bold text-slate-700">{type.name}</span>
                  <button
                    onClick={() => onDelete(type.id)}
                    className="text-slate-200 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManager;
