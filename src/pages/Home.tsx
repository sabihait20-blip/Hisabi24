import { Menu, User, ArrowLeftRight, TrendingUp, Wallet, Calculator, FileText, Book, ShoppingCart, Bell, LogOut } from 'lucide-react';
import { toBenNum } from '../lib/bengali';
import { useAuth } from '../lib/AuthContext';

export function Home({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, logout } = useAuth();
  
  const menuItems = [
    { id: 'dena-paona', title: 'দেনা-পাওনা', icon: ArrowLeftRight },
    { id: 'income-expense', title: 'আয়-ব্যয়', icon: TrendingUp },
    { id: 'savings', title: 'আমার সঞ্চয়ী', icon: Wallet },
    { id: 'taka-gunun', title: 'টাকা গুনুন', icon: Calculator },
    { id: 'ford', title: 'ফর্দ', icon: FileText },
    { id: 'notes', title: 'নোট বুক', icon: Book },
    { id: 'market-calculator', title: 'বাজার হিসাব', icon: ShoppingCart },
    { id: 'alarm', title: 'এলার্ম', icon: Bell },
    { id: 'calculator', title: 'ক্যালকুলেটর', icon: Calculator },
  ];

  return (
    <div className="pb-6">
      <div className="bg-purple-700 text-white pb-16 pt-10 px-6 rounded-b-[40px] shadow-md relative">
        <div className="absolute top-6 right-6">
          <button onClick={logout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <LogOut size={20} className="text-white" />
          </button>
        </div>
        <div className="flex items-center gap-4 mb-8">
          <Menu size={28} className="cursor-pointer" />
          <h1 className="text-2xl font-bold">হিসেব খাতা</h1>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-base opacity-90 mb-1">Hello</p>
            <h2 className="text-2xl font-bold tracking-wide uppercase">{user?.displayName || 'User'}</h2>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30 backdrop-blur-sm">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={32} className="text-white" />
            )}
          </div>
        </div>
      </div>
      
      <div className="-mt-10 px-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-5 flex justify-between text-center divide-x divide-gray-100 border border-gray-50">
          <div className="flex-1 px-2">
            <p className="text-sm text-gray-500 font-medium mb-1">দেনা</p>
            <p className="text-purple-700 font-bold text-lg">{toBenNum(16000.0)} ৳</p>
          </div>
          <div className="flex-1 px-2">
            <p className="text-sm text-gray-500 font-medium mb-1">পাওনা</p>
            <p className="text-red-500 font-bold text-lg">{toBenNum(18000.0)} ৳</p>
          </div>
          <div className="flex-1 px-2">
            <p className="text-sm text-gray-500 font-medium mb-1">সঞ্চয়</p>
            <p className="text-blue-600 font-bold text-lg">{toBenNum(45500.0)} ৳</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-1">হিসেব খাতা</h3>
            <p className="text-sm opacity-90 mb-2">অ্যাপে আপনাকে</p>
            <h2 className="text-2xl font-bold text-yellow-400">স্বাগতম</h2>
          </div>
          <div className="relative z-10 w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Wallet size={40} className="text-yellow-400" />
          </div>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="absolute right-10 -bottom-10 w-24 h-24 bg-white/5 rounded-full"></div>
        </div>
      </div>

      <div className="px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-2 min-[380px]:grid-cols-3 gap-3 sm:gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button 
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-purple-50 hover:shadow-md hover:border-purple-200 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                  <Icon size={24} className="text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
