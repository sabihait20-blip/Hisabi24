import { useState } from 'react';
import { ArrowLeft, RotateCcw, Calculator } from 'lucide-react';
import { toBenNum } from '../lib/bengali';

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export function TakaGunun({ onBack }: { onBack: () => void }) {
  const [counts, setCounts] = useState<{ [key: number]: number }>(
    DENOMINATIONS.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {})
  );

  const handleCountChange = (denomination: number, value: string) => {
    const numValue = parseInt(value, 10);
    setCounts(prev => ({
      ...prev,
      [denomination]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const resetCounts = () => {
    setCounts(DENOMINATIONS.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}));
  };

  const totalAmount = DENOMINATIONS.reduce((sum, denom) => sum + (denom * counts[denom]), 0);
  const totalNotes = (Object.values(counts) as number[]).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-gray-50 min-h-screen pb-32 relative">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack}><ArrowLeft size={24} /></button>
          <h1 className="text-lg font-bold">টাকা গুনুন</h1>
        </div>
        <button 
          onClick={resetCounts}
          className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
          title="রিসেট করুন"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {DENOMINATIONS.map((denom) => (
          <div key={denom} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-20 bg-purple-100 text-purple-800 font-bold py-2 rounded-lg text-center shrink-0">
              {toBenNum(denom)} ৳
            </div>
            <div className="text-gray-400 font-bold">×</div>
            <input
              type="number"
              min="0"
              value={counts[denom] || ''}
              onChange={(e) => handleCountChange(denom, e.target.value)}
              placeholder="0"
              className="flex-1 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
            />
            <div className="text-gray-400 font-bold">=</div>
            <div className="w-24 text-right font-bold text-gray-800 shrink-0">
              {toBenNum(denom * counts[denom])} ৳
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-0 md:left-0 md:right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
        <div className="flex justify-between items-end mb-2">
          <div className="text-gray-500 font-medium">সর্বমোট নোট/কয়েন: <span className="text-purple-700 font-bold">{toBenNum(totalNotes)}</span> টি</div>
          <div className="text-right">
            <div className="text-sm text-gray-500 font-medium mb-1">সর্বমোট পরিমাণ</div>
            <div className="text-3xl font-bold text-purple-700">{toBenNum(totalAmount)} ৳</div>
          </div>
        </div>
      </div>
    </div>
  );
}
