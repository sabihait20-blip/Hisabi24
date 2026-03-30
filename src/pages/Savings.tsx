import React, { useState, useEffect } from 'react';
import { ArrowLeft, Cloud, Plus, MoreVertical, X, Wallet, Edit, Trash2 } from 'lucide-react';
import { toBenNum } from '../lib/bengali';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export function Savings({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [address, setAddress] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Fetch savings accounts
    const q = query(
      collection(db, 'savings_accounts'),
      where('uid', '==', user.uid)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const accs: any[] = [];
      snapshot.forEach(doc => accs.push({ id: doc.id, ...doc.data() }));
      
      // Sort client-side
      accs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setAccounts(accs);
    }, (error) => {
      console.error("Error fetching savings accounts:", error);
    });
    
    return () => unsub();
  }, [user]);

  const resetForm = () => {
    setIsAddingProfile(false);
    setEditingId(null);
    setName('');
    setAccountNumber('');
    setAddress('');
    setInitialBalance('');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !accountNumber || !user) return;
    
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'savings_accounts', editingId), {
          name,
          accountNumber,
          address,
          balance: Number(initialBalance) || 0,
        });
      } else {
        await addDoc(collection(db, 'savings_accounts'), {
          uid: user.uid,
          name,
          accountNumber,
          address,
          balance: Number(initialBalance) || 0,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving account:", error);
      alert("অ্যাকাউন্ট সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (acc: any) => {
    setEditingId(acc.id);
    setName(acc.name);
    setAccountNumber(acc.accountNumber);
    setAddress(acc.address || '');
    setInitialBalance(acc.balance.toString());
    setIsAddingProfile(true);
    setActiveDropdown(null);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      await deleteDoc(doc(db, 'savings_accounts', accountToDelete));
      setAccountToDelete(null);
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("অ্যাকাউন্ট মুছতে সমস্যা হয়েছে।");
    }
  };

  const totalSavings = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="hover:bg-purple-600 p-1 rounded-full transition-colors"><ArrowLeft size={24} /></button>
          <h1 className="text-lg font-bold">সঞ্চয়ী হিসাব</h1>
        </div>
        <button className="hover:bg-purple-600 p-1 rounded-full transition-colors"><Cloud size={24} /></button>
      </div>

      <div className="p-4">
        <div className="bg-white border-2 border-purple-600 rounded-xl py-4 text-center shadow-sm mb-6 max-w-[200px] mx-auto">
          <p className="text-purple-700 font-bold text-sm mb-1">সর্বমোট সঞ্চয়</p>
          <p className="text-gray-800 font-bold text-xl">{toBenNum(totalSavings.toFixed(1))} ৳</p>
        </div>

        <div className="space-y-4 mb-6">
          {accounts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-purple-200">
              <Wallet size={48} className="mx-auto text-purple-200 mb-3" />
              <p className="text-gray-500 font-medium">কোনো সঞ্চয় প্রোফাইল নেই</p>
              <p className="text-sm text-gray-400 mt-1">নতুন প্রোফাইল যোগ করতে নিচের বাটনে ক্লিক করুন</p>
            </div>
          ) : (
            accounts.map((acc) => (
              <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden relative group">
                <div className="flex">
                  <div className="flex-1 p-4">
                    <h3 className="font-bold text-purple-700 mb-2 text-lg">{acc.name}</h3>
                    <div className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded inline-block mb-2">
                      AC- {toBenNum(acc.accountNumber)}
                    </div>
                    {acc.address && <p className="text-xs text-gray-600 font-medium mb-1">{acc.address}</p>}
                    <p className="text-[10px] text-gray-400">{toBenNum(formatDate(acc.createdAt))}</p>
                  </div>
                  <div className="w-28 sm:w-32 bg-purple-50 p-3 flex flex-col justify-center items-center border-l border-purple-100 relative">
                    <p className="text-purple-700 font-bold text-sm mb-1">ব্যালেন্স</p>
                    <p className="text-purple-700 font-bold text-lg">{toBenNum(acc.balance.toFixed(1))}</p>
                    <div className="absolute right-2 top-2">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === acc.id ? null : acc.id)}
                        className="text-purple-400 hover:text-purple-700 transition-colors p-1 rounded-full hover:bg-purple-100"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {activeDropdown === acc.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-100 w-32 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <button 
                              onClick={() => openEditModal(acc)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                            >
                              <Edit size={14} /> এডিট
                            </button>
                            <button 
                              onClick={() => {
                                setAccountToDelete(acc.id);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={14} /> ডিলেট
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button 
          onClick={() => {
            resetForm();
            setIsAddingProfile(true);
          }}
          className="w-full bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-purple-800 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          সঞ্চয় প্রোফাইল যোগ করুন
        </button>
      </div>

      {/* Add/Edit Profile Modal */}
      {isAddingProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-purple-700 text-white px-5 py-4 flex justify-between items-center">
              <h2 className="font-bold text-lg">{editingId ? 'সঞ্চয় প্রোফাইল এডিট করুন' : 'নতুন সঞ্চয় প্রোফাইল'}</h2>
              <button 
                onClick={resetForm}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ব্যাংক/প্রতিষ্ঠানের নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: ইসলামী ব্যাংক"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">অ্যাকাউন্ট নম্বর *</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="যেমন: 2050XXXXXXXXX"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা / শাখা (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="যেমন: মতিঝিল শাখা"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">প্রাথমিক ব্যালেন্স (৳)</label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="যেমন: 5000"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading || !name || !accountNumber}
                  className="flex-1 px-4 py-2.5 bg-purple-700 text-white font-medium rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    editingId ? "সেভ করুন" : "যোগ করুন"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">অ্যাকাউন্ট মুছতে চান?</h3>
            <p className="text-gray-500 mb-6 text-sm">এই অ্যাকাউন্টটি মুছে ফেললে তা আর ফিরে পাওয়া যাবে না।</p>
            <div className="flex gap-3">
              <button
                onClick={() => setAccountToDelete(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
