import { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Plus, X, Edit2, Trash2, Download } from 'lucide-react';
import { toBenNum } from '../lib/bengali';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { DenaPaonaLedger, DenaPaonaPerson } from '../components/DenaPaonaLedger';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { addBengaliFont } from '../lib/pdfFont';

export function DenaPaona({ onBack }: { onBack: () => void }) {
  const [people, setPeople] = useState<DenaPaonaPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<DenaPaonaPerson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paona: '',
    dena: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'denaPaona'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const peopleData: DenaPaonaPerson[] = [];
      snapshot.forEach((doc) => {
        peopleData.push({ id: doc.id, ...doc.data() } as DenaPaonaPerson);
      });
      
      // Sort client-side to avoid requiring a composite index
      peopleData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setPeople(peopleData);
    }, (error) => {
      console.error("Error fetching dena paona:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedPerson) {
      const updated = people.find(p => p.id === selectedPerson.id);
      if (updated) setSelectedPerson(updated);
    }
  }, [people]);

  const totalPaona = people.reduce((sum, p) => sum + p.paona, 0);
  const totalDena = people.reduce((sum, p) => sum + p.dena, 0);

  const openModal = () => {
    setFormData({ name: '', phone: '', address: '', paona: '', dena: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (person: DenaPaonaPerson) => {
    setFormData({ 
      name: person.name, 
      phone: person.phone, 
      address: person.address, 
      paona: person.paona ? person.paona.toString() : '', 
      dena: person.dena ? person.dena.toString() : '' 
    });
    setEditingId(person.id);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSave = async () => {
    if (!formData.name || !auth.currentUser) return;
    
    try {
      if (editingId) {
        const docRef = doc(db, 'denaPaona', editingId);
        await updateDoc(docRef, {
          name: formData.name,
          phone: formData.phone || '',
          address: formData.address || '',
          paona: Number(formData.paona) || 0,
          dena: Number(formData.dena) || 0
        });
      } else {
        await addDoc(collection(db, 'denaPaona'), {
          name: formData.name,
          phone: formData.phone || '',
          address: formData.address || '',
          paona: Number(formData.paona) || 0,
          dena: Number(formData.dena) || 0,
          uid: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving person:", error);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, 'denaPaona', deleteId));
        setDeleteId(null);
        setActiveMenuId(null);
      } catch (error) {
        console.error("Error deleting person:", error);
      }
    }
  };

  const downloadSummaryPDF = async () => {
    const doc = new jsPDF();
    await addBengaliFont(doc);

    doc.setFont('HindSiliguri', 'bold');
    doc.setFontSize(22);
    doc.text('দেনা পাওনা হিসাবের সারসংক্ষেপ', 14, 22);

    doc.setFont('HindSiliguri', 'normal');
    doc.setFontSize(12);
    doc.text(`মোট পাওনা: ${toBenNum(totalPaona.toLocaleString('en-IN'))} টাকা`, 14, 32);
    doc.text(`মোট দেনা: ${toBenNum(totalDena.toLocaleString('en-IN'))} টাকা`, 14, 38);
    doc.text(`তারিখ: ${toBenNum(new Date().toLocaleDateString('bn-BD'))}`, 14, 44);

    const tableData = people.map(p => [
      p.name,
      toBenNum(p.phone) || '-',
      toBenNum(p.paona.toLocaleString('en-IN')),
      toBenNum(p.dena.toLocaleString('en-IN'))
    ]);

    (doc as any).autoTable({
      startY: 52,
      head: [['নাম', 'ফোন', 'পাওনা (টাকা)', 'দেনা (টাকা)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [126, 34, 206], font: 'HindSiliguri', fontStyle: 'bold' },
      styles: { font: 'HindSiliguri' },
    });

    doc.save('দেনা_পাওনা_সারসংক্ষেপ.pdf');
  };

  if (selectedPerson) {
    return <DenaPaonaLedger person={selectedPerson} onBack={() => setSelectedPerson(null)} />;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack}><ArrowLeft size={24} /></button>
          <h1 className="text-lg font-bold">দেনা পাওনা হিসাব</h1>
        </div>
        <button 
          onClick={downloadSummaryPDF}
          className="p-2 hover:bg-purple-600 rounded-full transition-colors"
          title="Download Summary PDF"
        >
          <Download size={24} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-4 text-center shadow-sm">
            <p className="text-red-600 font-bold mb-1">পাওনা</p>
            <p className="text-red-600 font-bold text-lg">{toBenNum(totalPaona)} ৳</p>
          </div>
          <div className="flex-1 bg-purple-50 border border-purple-100 rounded-xl p-4 text-center shadow-sm">
            <p className="text-purple-700 font-bold mb-1">দেনা</p>
            <p className="text-purple-700 font-bold text-lg">{toBenNum(totalDena)} ৳</p>
          </div>
        </div>

        <button 
          onClick={openModal}
          className="w-full bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md hover:bg-purple-800 transition-colors mb-6 flex items-center justify-center gap-2"
        >
          <Plus size={20} /> ব্যক্তি যোগ করুন
        </button>

        <div className="space-y-4">
          {people.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              কোনো ব্যক্তির তথ্য যোগ করা হয়নি
            </div>
          ) : (
            people.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPerson(item)}
              >
                <h3 className="font-bold text-gray-800 mb-3 pr-8">{item.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg font-medium">
                    পাওনা - {toBenNum(item.paona)} ৳
                  </div>
                  <div className="flex items-center text-gray-600 font-medium px-2">
                    {toBenNum(item.phone) || 'ফোন নম্বর নেই'}
                  </div>
                  <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg font-medium">
                    দেনা - {toBenNum(item.dena)} ৳
                  </div>
                  <div className="flex items-center text-gray-600 text-xs px-2">
                    {item.address || 'ঠিকানা নেই'}
                  </div>
                </div>
                
                <div className="absolute right-2 top-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }}
                    className="text-gray-400 hover:text-purple-600 p-2 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {activeMenuId === item.id && (
                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 animate-in fade-in zoom-in duration-150">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition-colors"
                      >
                        <Edit2 size={16} /> এডিট
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); setActiveMenuId(null); }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} /> ডিলিট
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="px-4 py-3 bg-purple-600 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">
                {editingId ? 'ব্যক্তির তথ্য আপডেট করুন' : 'নতুন ব্যক্তি যোগ করুন'}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">নাম <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="ব্যক্তির নাম"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পাওনা পরিমাণ (৳)</label>
                <input 
                  type="number" 
                  value={formData.paona}
                  onChange={(e) => setFormData({...formData, paona: e.target.value})}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">দেনা পরিমাণ (৳)</label>
                <input 
                  type="number" 
                  value={formData.dena}
                  onChange={(e) => setFormData({...formData, dena: e.target.value})}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="01XXXXXXXXX"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা</label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="ঠিকানা লিখুন"
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
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
                  disabled={!formData.name}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-gray-500 mb-6">এই ব্যক্তির তথ্য মুছে ফেললে তা আর ফিরে পাওয়া যাবে না।</p>
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
