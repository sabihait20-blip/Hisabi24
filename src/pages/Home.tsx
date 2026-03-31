import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ArrowLeftRight, TrendingUp, Wallet, Calculator, FileText, Book, ShoppingCart, Bell, LogOut, Search, Settings, Clock, X, Menu } from 'lucide-react';
import { toBenNum } from '../lib/bengali';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

function BannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [time, setTime] = useState(new Date());
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'admin_ads'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setAd(snapshot.docs[0].data());
      } else {
        setAd(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const slides = [
    { id: 'welcome', type: 'welcome' },
    { id: 'clock', type: 'clock' },
  ];
  
  if (ad) {
    slides.push({ id: 'ad', type: 'ad' });
  }

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(slideTimer);
  }, [slides.length]);

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative z-10 h-[88px] w-full flex items-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full absolute"
        >
          {currentSlide.type === 'welcome' && (
            <div>
              <h3 className="text-lg font-bold mb-1">হিসেব খাতা</h3>
              <p className="text-sm opacity-90 mb-2">অ্যাপে আপনাকে</p>
              <h2 className="text-2xl font-bold text-yellow-400">স্বাগতম</h2>
            </div>
          )}
          
          {currentSlide.type === 'clock' && (
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-yellow-400 tracking-wider">
                {toBenNum(time.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))}
              </h2>
              <p className="text-sm opacity-90 mt-1">
                {toBenNum(time.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}
              </p>
            </div>
          )}

          {currentSlide.type === 'ad' && ad && (
            <div>
              <h3 className="text-sm font-bold opacity-90 mb-1">বিজ্ঞাপন</h3>
              <p className="text-lg font-bold text-yellow-400 line-clamp-2">{ad.title}</p>
              {ad.description && <p className="text-xs opacity-80 line-clamp-1">{ad.description}</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function Home({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [activeAlarms, setActiveAlarms] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [totalDena, setTotalDena] = useState(0);
  const [totalPaona, setTotalPaona] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    if (!user) return;

    const alarmsQuery = query(
      collection(db, 'alarms'),
      where('uid', '==', user.uid),
      where('isActive', '==', true)
    );
    const unsubAlarms = onSnapshot(alarmsQuery, (snapshot) => {
      const alarms: any[] = [];
      snapshot.forEach(doc => alarms.push({ id: doc.id, ...doc.data() }));
      setActiveAlarms(alarms);
    });

    const transQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid)
    );
    const unsubTrans = onSnapshot(transQuery, (snapshot) => {
      const trans: any[] = [];
      snapshot.forEach(doc => trans.push({ id: doc.id, ...doc.data() }));
      trans.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return timeB - timeA;
      });
      setRecentTransactions(trans.slice(0, 3));
    });

    const denaPaonaQuery = query(
      collection(db, 'denaPaona'),
      where('uid', '==', user.uid)
    );
    const unsubDenaPaona = onSnapshot(denaPaonaQuery, (snapshot) => {
      let dena = 0;
      let paona = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        dena += (Number(data.dena) || 0);
        paona += (Number(data.paona) || 0);
      });
      console.log('DenaPaona fetched:', { dena, paona, docs: snapshot.size });
      setTotalDena(dena);
      setTotalPaona(paona);
    }, (error) => {
      console.error('Error fetching DenaPaona:', error);
    });

    const savingsQuery = query(
      collection(db, 'savings_accounts'),
      where('uid', '==', user.uid)
    );
    const unsubSavings = onSnapshot(savingsQuery, (snapshot) => {
      let savings = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        savings += (Number(data.balance) || 0);
      });
      console.log('Savings fetched:', { savings, docs: snapshot.size });
      setTotalSavings(savings);
    }, (error) => {
      console.error('Error fetching Savings:', error);
    });

    return () => {
      unsubAlarms();
      unsubTrans();
      unsubDenaPaona();
      unsubSavings();
    };
  }, [user]);

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

  const quickLinks = [
    { id: 'income-expense', title: 'আয়-ব্যয় যোগ করুন', icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' },
    { id: 'dena-paona', title: 'দেনা-পাওনা যোগ করুন', icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'notes', title: 'নতুন নোট লিখুন', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'alarm', title: 'এলার্ম সেট করুন', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const searchResults = quickLinks.concat(menuItems.map(m => ({ ...m, color: 'text-purple-600', bg: 'bg-purple-100' }))).filter(link => 
    link.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Remove duplicates from search results based on id
  const uniqueSearchResults = Array.from(new Map(searchResults.map(item => [item.id, item])).values());

  return (
    <div className="pb-6">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-[60] animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`absolute top-0 left-0 h-full w-72 bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 bg-purple-700 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">মেনু</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <X size={20} className="text-white" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Profile Section */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={24} className="text-purple-600" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-gray-800 truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Search */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="খুঁজুন..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={16} className="text-gray-400" />
                </button>
              )}
            </div>
            
            {searchQuery && (
              <div className="mt-2 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {uniqueSearchResults.length > 0 ? (
                  uniqueSearchResults.map(link => (
                    <button
                      key={link.id}
                      onClick={() => { onNavigate(link.id); setIsSidebarOpen(false); setSearchQuery(""); }}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className={`p-1.5 rounded-lg ${link.bg} ${link.color}`}>
                        <link.icon size={16} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{link.title}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">কিছু পাওয়া যায়নি</div>
                )}
              </div>
            )}
          </div>

          {/* Quick Add */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">কুইক অ্যাকশন</h3>
            <div className="space-y-1">
              {quickLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => { onNavigate(link.id); setIsSidebarOpen(false); }}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className={`p-2 rounded-xl ${link.bg} ${link.color}`}>
                    <link.icon size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{link.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">নোটিফিকেশন</h3>
              {activeAlarms.length > 0 && (
                <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {toBenNum(activeAlarms.length)} নতুন
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              {activeAlarms.length > 0 ? (
                activeAlarms.map(alarm => (
                  <div key={alarm.id} className="p-3 bg-orange-50 rounded-xl flex gap-3 cursor-pointer" onClick={() => {onNavigate('alarm'); setIsSidebarOpen(false);}}>
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{alarm.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">সময়: {toBenNum(alarm.time)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-xl">
                  <Bell size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs">কোনো নোটিফিকেশন নেই</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <button 
            onClick={() => {
              onNavigate('settings');
              setIsSidebarOpen(false);
            }}
            className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <Settings size={18} className="text-gray-400" />
            <span>সেটিংস</span>
          </button>
          <button 
            onClick={() => {
              logout();
              setIsSidebarOpen(false);
            }}
            className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={18} className="text-red-500" />
            <span>লগ আউট</span>
          </button>
        </div>
      </div>

      <div className="bg-purple-700 text-white pb-16 pt-6 px-6 rounded-b-[40px] shadow-md relative">
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <Menu size={20} className="text-white" />
            </button>
            <h1 className="text-2xl font-bold">হিসেব খাতা</h1>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-base opacity-90 mb-1">Hello</p>
            <h2 className="text-2xl font-bold tracking-wide uppercase">{user?.displayName || 'User'}</h2>
          </div>
        </div>
      </div>
      
      <div className="-mt-10 px-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-5 flex justify-between text-center divide-x divide-gray-100 border border-gray-50">
          <div className="flex-1 px-2">
            <p className="text-sm text-gray-500 font-medium mb-1">দেনা</p>
            <p className="text-purple-700 font-bold text-lg">{toBenNum(totalDena.toLocaleString('en-IN'))} ৳</p>
          </div>
          <div className="flex-1 px-2">
            <p className="text-sm text-gray-500 font-medium mb-1">পাওনা</p>
            <p className="text-red-500 font-bold text-lg">{toBenNum(totalPaona.toLocaleString('en-IN'))} ৳</p>
          </div>
          <div className="flex-1 px-2">
            <p className="text-sm text-gray-500 font-medium mb-1">সঞ্চয়</p>
            <p className="text-blue-600 font-bold text-lg">{toBenNum(totalSavings.toLocaleString('en-IN'))} ৳</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg relative overflow-hidden h-32">
          <BannerSlider />
          <div className="relative z-10 w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0 ml-4">
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
