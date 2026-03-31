import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { toBenNum } from '../lib/bengali';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

export interface SavingsAccount {
  id: string;
  name: string;
  accountNumber: string;
  address: string;
  balance: number;
}

export function SavingsLedger({ account, onBack }: { account: SavingsAccount, onBack: () => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txForm, setTxForm] = useState({ amount: '', type: 'deposit', note: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'savingsTransactions'),
      where('accountId', '==', account.id),
      where('uid', '==', auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: any[] = [];
      snapshot.forEach((doc) => txs.push({ id: doc.id, ...doc.data() }));
      txs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setTransactions(txs);
    });
    return () => unsubscribe();
  }, [account.id]);

  const handleSave = async () => {
    if (!txForm.amount || !auth.currentUser) return;
    const amount = Number(txForm.amount);
    if (amount <= 0) return;

    try {
      const batch = writeBatch(db);
      const txRef = doc(collection(db, 'savingsTransactions'));
      const accountRef = doc(db, 'savings_accounts', account.id);

      let newBalance = account.balance || 0;

      if (txForm.type === 'deposit') newBalance += amount;
      if (txForm.type === 'withdrawal') newBalance = Math.max(0, newBalance - amount);

      batch.set(txRef, {
        accountId: account.id,
        amount,
        type: txForm.type,
        note: txForm.note || '',
        uid: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      batch.update(accountRef, {
        balance: newBalance
      });

      await batch.commit();
      setIsModalOpen(false);
      setTxForm({ amount: '', type: 'deposit', note: '' });
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const tx = transactions.find(t => t.id === deleteId);
      if (!tx) return;

      const batch = writeBatch(db);
      batch.delete(doc(db, 'savingsTransactions', deleteId));

      let newBalance = account.balance || 0;

      if (tx.type === 'deposit') newBalance = Math.max(0, newBalance - tx.amount);
      if (tx.type === 'withdrawal') newBalance += tx.amount;

      batch.update(doc(db, 'savings_accounts', account.id), {
        balance: newBalance
      });

      await batch.commit();
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const getTxDetails = (type: string) => {
    switch (type) {
      case 'deposit': return { label: 'জমা করা হয়েছে', color: 'text-green-600', bg: 'bg-green-50', icon: ArrowDownRight };
      case 'withdrawal': return { label: 'উত্তোলন করা হয়েছে', color: 'text-red-600', bg: 'bg-red-50', icon: ArrowUpRight };
      default: return { label: 'লেনদেন', color: 'text-gray-600', bg: 'bg-gray-50', icon: ArrowUpRight };
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-md">
        <button onClick={onBack}><ArrowLeft size={24} /></button>
        <div>
          <h1 className="text-lg font-bold">{account.name}</h1>
          <p className="text-xs opacity-80">AC: {toBenNum(account.accountNumber)}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white border-2 border-purple-600 rounded-xl py-6 text-center shadow-sm mb-6 max-w-[250px] mx-auto">
          <Wallet size={32} className="mx-auto text-purple-600 mb-2" />
          <p className="text-purple-700 font-bold text-sm mb-1">বর্তমান ব্যালেন্স</p>
          <p className="text-gray-800 font-bold text-2xl">{toBenNum(account.balance.toLocaleString('en-IN'))} ৳</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md hover:bg-purple-800 transition-colors mb-6 flex items-center justify-center gap-2"
        >
          <Plus size={20} /> নতুন লেনদেন যোগ করুন
        </button>

        <h3 className="font-bold text-gray-700 mb-3 px-1">লেনদেনের ইতিহাস</h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
              কোনো লেনদেন পাওয়া যায়নি
            </div>
          ) : (
            transactions.map((tx) => {
              const details = getTxDetails(tx.type);
              const Icon = details.icon;
              return (
                <div key={tx.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${details.bg} ${details.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${details.color}`}>{details.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{toBenNum(formatDate(tx.createdAt))}</p>
                    {tx.note && <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-1.5 rounded">{tx.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{toBenNum(tx.amount.toLocaleString('en-IN'))} ৳</p>
                    <button 
                      onClick={() => setDeleteId(tx.id)}
                      className="text-red-400 hover:text-red-600 p-1 mt-1 inline-block"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="px-4 py-3 bg-purple-600 text-white">
              <h2 className="font-bold text-lg">নতুন লেনদেন</h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">লেনদেনের ধরন <span className="text-red-500">*</span></label>
                <select 
                  value={txForm.type}
                  onChange={(e) => setTxForm({...txForm, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="deposit">টাকা জমা</option>
                  <option value="withdrawal">টাকা উত্তোলন</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পরিমাণ (৳) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  value={txForm.amount}
                  onChange={(e) => setTxForm({...txForm, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">নোট (ঐচ্ছিক)</label>
                <input 
                  type="text" 
                  value={txForm.note}
                  onChange={(e) => setTxForm({...txForm, note: e.target.value})}
                  placeholder="লেনদেনের বিবরণ"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => { setIsModalOpen(false); setTxForm({ amount: '', type: 'deposit', note: '' }); }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!txForm.amount}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">মুছে ফেলতে চান?</h2>
            <p className="text-gray-500 mb-6">এই লেনদেন মুছে ফেললে মূল ব্যালেন্স থেকে টাকা সমন্বয় করা হবে।</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                বাতিল
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
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
