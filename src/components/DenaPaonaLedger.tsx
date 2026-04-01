import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import { toBenNum } from '../lib/bengali';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { addBengaliFont } from '../lib/pdfFont';

export interface DenaPaonaPerson {
  id: string;
  name: string;
  phone: string;
  address: string;
  paona: number;
  dena: number;
}

export function DenaPaonaLedger({ person, onBack }: { person: DenaPaonaPerson, onBack: () => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txForm, setTxForm] = useState({ amount: '', type: 'paona_increase', note: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'denaPaonaTransactions'),
      where('personId', '==', person.id),
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
  }, [person.id]);

  const handleSave = async () => {
    if (!txForm.amount || !auth.currentUser) return;
    const amount = Number(txForm.amount);
    if (amount <= 0) return;

    try {
      const batch = writeBatch(db);
      const txRef = doc(collection(db, 'denaPaonaTransactions'));
      const personRef = doc(db, 'denaPaona', person.id);

      let newPaona = person.paona || 0;
      let newDena = person.dena || 0;

      if (txForm.type === 'paona_increase') newPaona += amount;
      if (txForm.type === 'paona_decrease') newPaona = Math.max(0, newPaona - amount);
      if (txForm.type === 'dena_increase') newDena += amount;
      if (txForm.type === 'dena_decrease') newDena = Math.max(0, newDena - amount);

      batch.set(txRef, {
        personId: person.id,
        amount,
        type: txForm.type,
        note: txForm.note || '',
        uid: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      batch.update(personRef, {
        paona: newPaona,
        dena: newDena
      });

      await batch.commit();
      setIsModalOpen(false);
      setTxForm({ amount: '', type: 'paona_increase', note: '' });
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
      batch.delete(doc(db, 'denaPaonaTransactions', deleteId));

      let newPaona = person.paona || 0;
      let newDena = person.dena || 0;

      if (tx.type === 'paona_increase') newPaona = Math.max(0, newPaona - tx.amount);
      if (tx.type === 'paona_decrease') newPaona += tx.amount;
      if (tx.type === 'dena_increase') newDena = Math.max(0, newDena - tx.amount);
      if (tx.type === 'dena_decrease') newDena += tx.amount;

      batch.update(doc(db, 'denaPaona', person.id), {
        paona: newPaona,
        dena: newDena
      });

      await batch.commit();
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const getTxDetails = (type: string) => {
    switch (type) {
      case 'paona_increase': return { label: 'পাওনা যোগ হয়েছে (ধার দিয়েছি)', color: 'text-red-600', bg: 'bg-red-50', icon: ArrowUpRight };
      case 'paona_decrease': return { label: 'পাওনা আদায় হয়েছে (ফেরত পেয়েছি)', color: 'text-green-600', bg: 'bg-green-50', icon: ArrowDownRight };
      case 'dena_increase': return { label: 'দেনা যোগ হয়েছে (ধার নিয়েছি)', color: 'text-purple-600', bg: 'bg-purple-50', icon: ArrowDownRight };
      case 'dena_decrease': return { label: 'দেনা পরিশোধ করেছি (ফেরত দিয়েছি)', color: 'text-blue-600', bg: 'bg-blue-50', icon: ArrowUpRight };
      default: return { label: 'লেনদেন', color: 'text-gray-600', bg: 'bg-gray-50', icon: ArrowUpRight };
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const downloadPDF = async () => {
    const doc = new jsPDF();
    
    // Add Bengali font support
    await addBengaliFont(doc);
    
    // Header
    doc.setFont('HindSiliguri', 'bold');
    doc.setFontSize(22);
    doc.text('লেনদেনের হিসাব খাতা', 14, 22);
    
    doc.setFont('HindSiliguri', 'normal');
    doc.setFontSize(12);
    doc.text(`নাম: ${person.name}`, 14, 32);
    doc.text(`ফোন: ${toBenNum(person.phone) || 'নেই'}`, 14, 38);
    doc.text(`ঠিকানা: ${person.address || 'নেই'}`, 14, 44);
    doc.text(`মোট পাওনা: ${toBenNum(person.paona.toLocaleString('en-IN'))} টাকা`, 14, 50);
    doc.text(`মোট দেনা: ${toBenNum(person.dena.toLocaleString('en-IN'))} টাকা`, 14, 56);
    doc.text(`তারিখ: ${toBenNum(new Date().toLocaleDateString('bn-BD'))}`, 14, 62);

    // Table
    const tableData = transactions.map(tx => {
      const details = getTxDetails(tx.type);
      const date = tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString('bn-BD') : 'N/A';
      return [
        toBenNum(date),
        details.label.split('(')[0].trim(),
        toBenNum(tx.amount.toLocaleString('en-IN')),
        tx.note || '-'
      ];
    });

    (doc as any).autoTable({
      startY: 70,
      head: [['তারিখ', 'ধরন', 'পরিমাণ (টাকা)', 'নোট']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [126, 34, 206], font: 'HindSiliguri', fontStyle: 'bold' },
      styles: { font: 'HindSiliguri' },
    });

    doc.save(`${person.name}_হিসাব.pdf`);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack}><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-lg font-bold">{person.name}</h1>
            <p className="text-xs opacity-80">{toBenNum(person.phone) || 'ফোন নম্বর নেই'}</p>
          </div>
        </div>
        <button 
          onClick={downloadPDF}
          className="p-2 hover:bg-purple-600 rounded-full transition-colors"
          title="Download PDF"
        >
          <Download size={24} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-4 text-center shadow-sm">
            <p className="text-red-600 font-bold mb-1">মোট পাওনা</p>
            <p className="text-red-600 font-bold text-lg">{toBenNum(person.paona.toLocaleString('en-IN'))} ৳</p>
          </div>
          <div className="flex-1 bg-purple-50 border border-purple-100 rounded-xl p-4 text-center shadow-sm">
            <p className="text-purple-700 font-bold mb-1">মোট দেনা</p>
            <p className="text-purple-700 font-bold text-lg">{toBenNum(person.dena.toLocaleString('en-IN'))} ৳</p>
          </div>
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
                  <option value="paona_increase">পাওনা যোগ (আমি ধার দিয়েছি)</option>
                  <option value="paona_decrease">পাওনা আদায় (আমি ফেরত পেয়েছি)</option>
                  <option value="dena_increase">দেনা যোগ (আমি ধার নিয়েছি)</option>
                  <option value="dena_decrease">দেনা পরিশোধ (আমি ফেরত দিয়েছি)</option>
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
                  onClick={() => { setIsModalOpen(false); setTxForm({ amount: '', type: 'paona_increase', note: '' }); }}
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
            <p className="text-gray-500 mb-6">এই লেনদেন মুছে ফেললে মূল হিসাব থেকে টাকা সমন্বয় করা হবে।</p>
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
