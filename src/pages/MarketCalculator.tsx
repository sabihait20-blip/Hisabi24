import { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toBenNum } from '../lib/bengali';

export function MarketCalculator({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState([
    { id: 1, name: 'চাল', price: 65, quantity: 5, unit: 'কেজি' },
    { id: 2, name: 'ডাল', price: 120, quantity: 1, unit: 'কেজি' },
    { id: 3, name: 'তেল', price: 165, quantity: 2, unit: 'লিটার' },
  ]);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const addItem = () => {
    setItems([...items, { id: Date.now(), name: '', price: 0, quantity: 1, unit: 'টি' }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: string, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-md">
        <button onClick={onBack}><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-bold">বাজার হিসাব</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden mb-6">
          <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center">
            <h2 className="font-bold text-purple-800">মোট খরচ</h2>
            <span className="text-xl font-bold text-purple-700">{toBenNum(total)} ৳</span>
          </div>
          
          <div className="p-2 space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                  <span className="text-xs font-bold text-gray-400 w-4">{toBenNum(index + 1)}.</span>
                  <input 
                    type="text" 
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    placeholder="পণ্যের নাম"
                    className="flex-1 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-purple-400 min-w-0"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pl-6 sm:pl-0">
                  <input 
                    type="number" 
                    value={item.price || ''}
                    onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                    placeholder="দর"
                    className="w-16 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-purple-400 text-center"
                  />
                  <span className="text-xs text-gray-500">x</span>
                  <input 
                    type="number" 
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                    className="w-12 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-purple-400 text-center"
                  />
                  <select 
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                    className="w-16 bg-white border border-gray-200 rounded px-1 py-1.5 text-xs focus:outline-none focus:border-purple-400"
                  >
                    <option value="কেজি">কেজি</option>
                    <option value="গ্রাম">গ্রাম</option>
                    <option value="লিটার">লিটার</option>
                    <option value="টি">টি</option>
                    <option value="হালি">হালি</option>
                    <option value="ডজন">ডজন</option>
                  </select>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1 ml-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-100">
            <button 
              onClick={addItem}
              className="w-full py-2 border-2 border-dashed border-purple-200 text-purple-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors"
            >
              <Plus size={18} /> নতুন পণ্য যোগ করুন
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="flex-1 bg-white text-purple-700 border border-purple-200 font-bold py-3 rounded-xl shadow-sm hover:bg-purple-50 transition-colors">
            সেভ করুন
          </button>
          <button className="flex-1 bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md hover:bg-purple-800 transition-colors">
            শেয়ার করুন
          </button>
        </div>
      </div>
    </div>
  );
}
