import { useState, useEffect } from 'react';
import { ArrowLeft, Filter, X, Edit2, Trash2 } from 'lucide-react';
import { toBenNum } from '../lib/bengali';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: TransactionType;
}

export function IncomeExpense({ onBack }: { onBack: () => void }) {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('income');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData: Transaction[] = [];
      snapshot.forEach((doc) => {
        transactionsData.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      
      // Sort client-side to avoid requiring a composite index
      transactionsData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setHistory(transactionsData);
    }, (error) => {
      console.error("Error fetching transactions:", error);
    });

    return () => unsubscribe();
  }, []);

  const currentMonthIncome = history.filter(h => h.type === 'income').reduce((sum, h) => sum + h.amount, 0);
  const currentMonthExpense = history.filter(h => h.type === 'expense').reduce((sum, h) => sum + h.amount, 0);
  const currentMonthSavings = currentMonthIncome - currentMonthExpense;

  const openModal = (type: TransactionType) => {
    setModalType(type);
    setFormData({ title: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Transaction) => {
    setModalType(item.type);
    const dateParts = item.date.split('/');
    let formattedDateForInput = new Date().toISOString().split('T')[0];
    if (dateParts.length === 3) {
      formattedDateForInput = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    }
    
    setFormData({ 
      title: item.title, 
      amount: item.amount.toString(), 
      date: formattedDateForInput 
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.amount || !auth.currentUser) return;
    
    const [year, month, day] = formData.date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    try {
      if (editingId) {
        const docRef = doc(db, 'transactions', editingId);
        await updateDoc(docRef, {
          title: formData.title,
          amount: Number(formData.amount),
          date: formattedDate,
          type: modalType
        });
      } else {
        await addDoc(collection(db, 'transactions'), {
          title: formData.title,
          amount: Number(formData.amount),
          date: formattedDate,
          type: modalType,
          uid: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, 'transactions', deleteId));
        setDeleteId(null);
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-md">
        <button onClick={onBack}><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-bold">হিসেব খাতা</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-center divide-x divide-gray-100">
            <div>
              <p className="text-xs text-gray-500 font-bold mb-1">গত-মাসের আয়</p>
              <p className="text-gray-800 font-bold">{toBenNum(0.0)} ৳</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold mb-1">এই মাসের আয়</p>
              <p className="text-purple-600 font-bold">{toBenNum(currentMonthIncome)} ৳</p>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-bold mb-1">গত-মাসের ব্যয়</p>
              <p className="text-gray-800 font-bold">{toBenNum(0.0)} ৳</p>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-bold mb-1">এই মাসের ব্যয়</p>
              <p className="text-red-500 font-bold">{toBenNum(currentMonthExpense)} ৳</p>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-bold mb-1">গত-মাসের সঞ্চয়</p>
              <p className="text-blue-500 font-bold">{toBenNum(0.0)} ৳</p>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-bold mb-1">এই মাসের সঞ্চয়</p>
              <p className="text-yellow-500 font-bold">{toBenNum(currentMonthSavings)} ৳</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between bg-white rounded-xl shadow-sm border border-purple-100 p-2 mb-6">
          <button className="flex-1 flex flex-col items-center py-2 text-purple-700">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-1">
              <span className="font-bold text-sm">{toBenNum(1)}</span>
            </div>
            <span className="text-xs font-bold">দৈনিক</span>
          </button>
          <button className="flex-1 flex flex-col items-center py-2 text-gray-400 hover:text-purple-700 transition-colors">
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-1">
              <span className="font-bold text-sm">{toBenNum(30)}</span>
            </div>
            <span className="text-xs font-bold">মাসিক</span>
          </button>
          <button className="flex-1 flex flex-col items-center py-2 text-gray-400 hover:text-purple-700 transition-colors">
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-1">
              <span className="font-bold text-sm">{toBenNum(365)}</span>
            </div>
            <span className="text-xs font-bold">বাৎসরিক</span>
          </button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-800">আয়-ব্যয় হিস্ট্রি</h2>
          <button className="flex items-center gap-1 text-sm font-bold text-gray-600">
            ফিল্টার <Filter size={16} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              কোনো হিস্ট্রি পাওয়া যায়নি
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center group">
                <div>
                  <h3 className="font-bold text-gray-800">{item.title}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">{toBenNum(item.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${item.type === 'income' ? 'text-purple-600' : 'text-red-500'}`}>
                    {item.type === 'income' ? '+' : '-'}{toBenNum(item.amount.toFixed(1))} ৳
                  </span>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => openModal('income')}
            className="flex-1 bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md hover:bg-purple-800 transition-colors"
          >
            আয় যোগ করুন
          </button>
          <button 
            onClick={() => openModal('expense')}
            className="flex-1 bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md hover:bg-purple-800 transition-colors"
          >
            ব্যয় যোগ করুন
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className={`px-4 py-3 flex justify-between items-center text-white ${modalType === 'income' ? 'bg-purple-600' : 'bg-red-500'}`}>
              <h2 className="font-bold text-lg">
                {editingId ? 'হিসাব আপডেট করুন' : (modalType === 'income' ? 'নতুন আয় যোগ করুন' : 'নতুন ব্যয় যোগ করুন')}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="যেমন: বেতন, বাজার..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পরিমাণ (৳)</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">তারিখ</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleSave}
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl ${modalType === 'income' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {editingId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
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
            <p className="text-gray-500 mb-6">এই হিসাবটি মুছে ফেললে তা আর ফিরে পাওয়া যাবে না।</p>
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
