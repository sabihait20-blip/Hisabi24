import { ArrowLeft, Cloud, Plus, MoreVertical } from 'lucide-react';
import { toBenNum } from '../lib/bengali';

export function Savings({ onBack }: { onBack: () => void }) {
  const accounts = [
    { name: 'জনতা ব্যাংক', ac: '999999999900', address: 'ঠিকানা - নরসিংদী', date: '2025-02-04 16:17:33 PM', balance: 25000 },
    { name: 'ইসলামী ব্যাংক', ac: '0000000000', address: 'ঠিকানা - Dhka, Porani', date: '2025-02-04 16:42:44 PM', balance: 20500 },
    { name: 'pobali bank', ac: '999999999', address: 'ঠিকানা - narsingdi', date: '2025-02-04 16:43:06 PM', balance: 0 },
    { name: 'ific', ac: '3333333333', address: 'ঠিকানা - dhaka narsingdi', date: '2025-02-04 16:43:31 PM', balance: 0 },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack}><ArrowLeft size={24} /></button>
          <h1 className="text-lg font-bold">সঞ্চয়ী হিসাব</h1>
        </div>
        <button><Cloud size={24} /></button>
      </div>

      <div className="p-4">
        <div className="bg-white border-2 border-purple-600 rounded-xl py-4 text-center shadow-sm mb-6 max-w-[200px] mx-auto">
          <p className="text-purple-700 font-bold text-sm mb-1">সর্বমোট সঞ্চয়</p>
          <p className="text-gray-800 font-bold text-xl">{toBenNum(45500.0)} ৳</p>
        </div>

        <div className="space-y-4 mb-6">
          {accounts.map((acc, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden">
              <div className="flex">
                <div className="flex-1 p-3">
                  <h3 className="font-bold text-purple-700 mb-2">{acc.name}</h3>
                  <div className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded inline-block mb-2">
                    AC- {toBenNum(acc.ac)}
                  </div>
                  <p className="text-xs text-gray-600 font-medium mb-1">{acc.address}</p>
                  <p className="text-[10px] text-gray-400">{toBenNum(acc.date)}</p>
                </div>
                <div className="w-24 sm:w-32 bg-purple-50 p-3 flex flex-col justify-center items-center border-l border-purple-100 relative">
                  <p className="text-purple-700 font-bold text-sm mb-1">ব্যালেন্স</p>
                  <p className="text-purple-700 font-bold text-lg">{toBenNum(acc.balance.toFixed(1))}</p>
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md hover:bg-purple-800 transition-colors flex items-center justify-center gap-2">
          <Plus size={20} />
          সঞ্চয় প্রোফাইল যোগ করুন
        </button>
      </div>
    </div>
  );
}
