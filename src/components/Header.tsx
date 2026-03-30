import { useState, useEffect, useRef } from "react";
import { Search, Bell, Sun, Moon, Plus, LogOut, User, Settings, FileText, Wallet, ArrowLeftRight, Clock } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { toBenNum } from "../lib/bengali";

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setActiveTab: (tab: string) => void;
}

export function Header({ isDarkMode, toggleTheme, setActiveTab }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [activeAlarms, setActiveAlarms] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setShowProfileMenu(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) setShowQuickAdd(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch data for notifications and quick stats
  useEffect(() => {
    if (!user) return;

    // Fetch active alarms
    const alarmsQuery = query(
      collection(db, 'alarms'),
      where('uid', '==', user.uid),
      where('isActive', '==', true)
    );
    const unsubAlarms = onSnapshot(alarmsQuery, (snapshot) => {
      const alarms: any[] = [];
      snapshot.forEach(doc => alarms.push({ id: doc.id, ...doc.data() }));
      setActiveAlarms(alarms);
    }, (error) => {
      console.error("Error fetching alarms:", error);
    });

    // Fetch recent transactions
    const transQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid)
    );
    const unsubTrans = onSnapshot(transQuery, (snapshot) => {
      const trans: any[] = [];
      snapshot.forEach(doc => trans.push({ id: doc.id, ...doc.data() }));
      
      // Sort client-side to avoid requiring a composite index
      trans.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return timeB - timeA;
      });
      
      setRecentTransactions(trans.slice(0, 3));
    }, (error) => {
      console.error("Error fetching transactions:", error);
    });

    return () => {
      unsubAlarms();
      unsubTrans();
    };
  }, [user]);

  const quickLinks = [
    { id: 'income-expense', title: 'আয়-ব্যয় যোগ করুন', icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' },
    { id: 'dena-paona', title: 'দেনা-পাওনা যোগ করুন', icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'notes', title: 'নতুন নোট লিখুন', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'alarm', title: 'এলার্ম সেট করুন', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const searchResults = quickLinks.filter(link => 
    link.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="h-20 px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-colors">
      <div className="flex items-center gap-6">
        <h2 className="text-xl font-bold text-purple-700 dark:text-purple-400 hidden lg:block">হিসেবি খাতা</h2>
        
        <div className="relative w-64 lg:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={20} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="খুঁজুন (যেমন: নোট, আয়)..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 transition-all"
          />
          
          {/* Search Dropdown */}
          {searchQuery && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {searchResults.length > 0 ? (
                searchResults.map(link => (
                  <button
                    key={link.id}
                    onClick={() => {
                      setActiveTab(link.id);
                      setSearchQuery("");
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className={`p-1.5 rounded-lg ${link.bg} ${link.color} dark:bg-opacity-20`}>
                      <link.icon size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.title}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">কিছু পাওয়া যায়নি</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        {/* Quick Add Button */}
        <div className="relative" ref={quickAddRef}>
          <button 
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="hidden sm:flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-full font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
          >
            <Plus size={18} />
            <span>নতুন যোগ করুন</span>
          </button>

          {showQuickAdd && (
            <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">কুইক অ্যাকশন</div>
              {quickLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    setShowQuickAdd(false);
                  }}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className={`p-2 rounded-xl ${link.bg} ${link.color} dark:bg-opacity-20`}>
                    <link.icon size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isDarkMode ? "Light Mode" : "Dark Mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Bell size={20} />
            {activeAlarms.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-gray-200">নোটিফিকেশন</h3>
                <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 text-xs px-2 py-1 rounded-full font-bold">
                  {toBenNum(activeAlarms.length)} নতুন
                </span>
              </div>
              
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {activeAlarms.length > 0 ? (
                  <div className="p-2">
                    <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase">সক্রিয় এলার্ম</div>
                    {activeAlarms.map(alarm => (
                      <div key={alarm.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors flex gap-3 cursor-pointer" onClick={() => {setActiveTab('alarm'); setShowNotifications(false);}}>
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center shrink-0">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{alarm.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">সময়: {toBenNum(alarm.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">কোনো নতুন নোটিফিকেশন নেই</p>
                  </div>
                )}

                {recentTransactions.length > 0 && (
                  <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase">সাম্প্রতিক লেনদেন</div>
                    {recentTransactions.map(t => (
                      <div key={t.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors flex justify-between items-center cursor-pointer" onClick={() => {setActiveTab('income-expense'); setShowNotifications(false);}}>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.category}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{toBenNum(t.date)}</p>
                        </div>
                        <span className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '-'}{toBenNum(t.amount)} ৳
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 p-[2px] cursor-pointer hover:shadow-md transition-shadow"
          >
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="User" 
                className="w-full h-full rounded-full border-2 border-white dark:border-gray-900 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-full border-2 border-white dark:border-gray-900 bg-purple-100 flex items-center justify-center">
                <User size={20} className="text-purple-600" />
              </div>
            )}
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{user?.displayName || 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => {
                    setActiveTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <Settings size={18} className="text-gray-400" />
                  <span>সেটিংস</span>
                </button>
                <button 
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors mt-1"
                >
                  <LogOut size={18} className="text-red-500" />
                  <span>লগ আউট</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
