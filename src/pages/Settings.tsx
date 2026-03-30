import { useState, useEffect } from 'react';
import { ArrowLeft, User, Moon, Sun, Download, Trash2, LogOut, Bell, Shield, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

export function Settings({ onBack, isDarkMode, toggleTheme }: { onBack: () => void, isDarkMode: boolean, toggleTheme: () => void }) {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(localStorage.getItem('hiseb_notifications') === 'true');
    setAppLockEnabled(localStorage.getItem('hiseb_app_lock') === 'true');
  }, []);

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem('hiseb_notifications', 'true');
        } else {
          alert('নোটিফিকেশন পারমিশন দেওয়া হয়নি।');
        }
      } else {
        alert('আপনার ব্রাউজার নোটিফিকেশন সাপোর্ট করে না।');
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('hiseb_notifications', 'false');
    }
  };

  const toggleAppLock = () => {
    const newState = !appLockEnabled;
    setAppLockEnabled(newState);
    localStorage.setItem('hiseb_app_lock', String(newState));
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const collections = ['transactions', 'denaPaona', 'savings', 'savings_accounts', 'notes', 'alarms'];
      const exportData: any = {};

      for (const colName of collections) {
        const q = query(collection(db, colName), where('uid', '==', user.uid));
        const snapshot = await getDocs(q);
        exportData[colName] = [];
        snapshot.forEach(document => {
          exportData[colName].push({ id: document.id, ...document.data() });
        });
      }

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `hiseb_khata_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error exporting data:", error);
      alert('ডাটা ব্যাকআপ নিতে সমস্যা হয়েছে।');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const collections = ['transactions', 'denaPaona', 'savings', 'savings_accounts', 'notes', 'alarms'];
      
      for (const colName of collections) {
        const q = query(collection(db, colName), where('uid', '==', user.uid));
        const snapshot = await getDocs(q);
        
        const deletePromises = snapshot.docs.map(document => 
          deleteDoc(doc(db, colName, document.id))
        );
        await Promise.all(deletePromises);
      }
      
      setShowDeleteModal(false);
      alert('আপনার সমস্ত ডাটা সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (error) {
      console.error("Error deleting data:", error);
      alert('ডাটা মুছতে সমস্যা হয়েছে।');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-20 transition-colors relative">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-md">
        <button onClick={onBack} className="hover:bg-purple-600 p-1 rounded-full transition-colors"><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-bold">সেটিংস</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center overflow-hidden border-2 border-purple-200 dark:border-purple-800 shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={32} className="text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">{user?.displayName || 'User'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* General Settings */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">সাধারণ সেটিংস</h3>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                  {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">ডার্ক মোড</span>
              </div>
              <button 
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
                  <Bell size={20} />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">নোটিফিকেশন</span>
              </div>
              <button 
                onClick={toggleNotifications}
                className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                  <Shield size={20} />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">অ্যাপ লক (পিন/পাসওয়ার্ড)</span>
              </div>
              <button 
                onClick={toggleAppLock}
                className={`w-12 h-6 rounded-full transition-colors relative ${appLockEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${appLockEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">ডাটা ম্যানেজমেন্ট</h3>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Download size={20} />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">ডাটা ব্যাকআপ নিন (JSON)</span>
              </div>
              {isExporting && <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>}
            </button>
            
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                <Trash2 size={20} />
              </div>
              <span className="font-medium text-red-600 dark:text-red-400">সব ডাটা মুছে ফেলুন</span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={logout}
          className="w-full bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 rounded-2xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 mt-4"
        >
          <LogOut size={20} />
          লগ আউট করুন
        </button>
        
        <div className="text-center mt-8 mb-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">ভার্সন ১.০.০</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">তৈরি করেছে হিসেব খাতা টিম</p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">সব ডাটা মুছে ফেলতে চান?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              আপনার আয়-ব্যয়, দেনা-পাওনা, সঞ্চয় এবং নোট সহ সমস্ত ডাটা মুছে যাবে। এই কাজ আর ফিরিয়ে আনা সম্ভব নয়।
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                বাতিল
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "মুছে ফেলুন"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
