import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, Search, MoreVertical, Edit2, X } from 'lucide-react';
import { toBenNum } from '../lib/bengali';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

interface FardItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface Fard {
  id: string;
  title: string;
  items: FardItem[];
  date: string;
  uid: string;
  createdAt?: any;
}

export function Ford({ onBack }: { onBack: () => void }) {
  const [fards, setFards] = useState<Fard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{title: string, items: FardItem[]}>({
    title: '',
    items: []
  });
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'fards'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fardsData: Fard[] = [];
      snapshot.forEach((doc) => {
        fardsData.push({ id: doc.id, ...doc.data() } as Fard);
      });
      
      // Sort client-side to avoid requiring a composite index
      fardsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setFards(fardsData);
    }, (error) => {
      console.error("Error fetching fards:", error);
    });

    return () => unsubscribe();
  }, []);

  const filteredFards = fards.filter(fard => 
    fard.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fard.items.some(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openModal = () => {
    setFormData({ title: '', items: [] });
    setNewItemText('');
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (fard: Fard) => {
    setFormData({ 
      title: fard.title, 
      items: [...fard.items]
    });
    setNewItemText('');
    setEditingId(fard.id);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemText.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), text: newItemText.trim(), isCompleted: false }]
    }));
    setNewItemText('');
  };

  const handleRemoveItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleToggleItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item)
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !auth.currentUser) return;
    
    let finalItems = [...formData.items];
    if (newItemText.trim()) {
      finalItems.push({ id: Date.now().toString(), text: newItemText.trim(), isCompleted: false });
    }
    
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    try {
      if (editingId) {
        const docRef = doc(db, 'fards', editingId);
        await updateDoc(docRef, {
          title: formData.title,
          items: finalItems,
          date: formattedDate,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'fards'), {
          title: formData.title,
          items: finalItems,
          date: formattedDate,
          uid: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewItemText('');
    } catch (error: any) {
      console.error("Error saving fard:", error);
      alert("Error: " + error.message);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, 'fards', deleteId));
        setDeleteId(null);
        setActiveMenuId(null);
      } catch (error) {
        console.error("Error deleting fard:", error);
      }
    }
  };

  const toggleFardItemDirectly = async (fard: Fard, itemId: string) => {
    const updatedItems = fard.items.map(item => 
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    
    try {
      const docRef = doc(db, 'fards', fard.id);
      await updateDoc(docRef, {
        items: updatedItems,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-md">
        <button onClick={onBack}><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-bold">ফর্দ</h1>
      </div>

      <div className="p-4">
        <div className="relative mb-6">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ফর্দ খুঁজুন..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500 shadow-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {fards.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500">কোনো ফর্দ নেই</p>
            <p className="text-sm mt-1">নতুন ফর্দ তৈরি করতে + বাটনে ক্লিক করুন</p>
          </div>
        ) : filteredFards.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            কোনো ফর্দ পাওয়া যায়নি
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 mb-6">
            {filteredFards.map((fard) => {
              const completedCount = fard.items.filter(i => i.isCompleted).length;
              const totalCount = fard.items.length;
              const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

              return (
                <div 
                  key={fard.id} 
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-8 cursor-pointer flex-1" onClick={() => openEditModal(fard)}>
                      <h3 className="font-bold text-gray-800 text-lg">{fard.title}</h3>
                      <p className="text-xs text-gray-500">{toBenNum(fard.date)} • {toBenNum(completedCount)}/{toBenNum(totalCount)} সম্পন্ন</p>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === fard.id ? null : fard.id);
                      }}
                      className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeMenuId === fard.id && (
                      <div 
                        className="absolute right-4 top-10 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 animate-in fade-in zoom-in duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          onClick={() => { openEditModal(fard); setActiveMenuId(null); }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition-colors"
                        >
                          <Edit2 size={16} /> এডিট
                        </button>
                        <button 
                          onClick={() => { setDeleteId(fard.id); setActiveMenuId(null); }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={16} /> ডিলিট
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4 overflow-hidden">
                    <div 
                      className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="space-y-2">
                    {fard.items.slice(0, 5).map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-3 cursor-pointer group/item"
                        onClick={() => toggleFardItemDirectly(fard, item.id)}
                      >
                        <button className={`shrink-0 ${item.isCompleted ? 'text-purple-600' : 'text-gray-300 group-hover/item:text-purple-400'}`}>
                          {item.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                        <span className={`text-sm flex-1 truncate ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                    {fard.items.length > 5 && (
                      <div 
                        className="text-xs text-purple-600 font-medium pt-1 cursor-pointer"
                        onClick={() => openEditModal(fard)}
                      >
                        আরো {toBenNum(fard.items.length - 5)}টি আইটেম দেখুন...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button 
          onClick={openModal}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition-colors z-30"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 bg-purple-600 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-lg">
                {editingId ? 'ফর্দ এডিট করুন' : 'নতুন ফর্দ'}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              <div>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="ফর্দের নাম (যেমন: আজকের বাজার)"
                  className="w-full text-lg font-bold border-b-2 border-gray-200 px-0 py-2 focus:outline-none focus:border-purple-500 text-gray-800 placeholder:text-gray-400 bg-transparent transition-colors"
                />
              </div>
              
              <div className="flex-1">
                <div className="space-y-2 mb-4">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <button 
                        onClick={() => handleToggleItem(item.id)}
                        className={`shrink-0 ${item.isCompleted ? 'text-purple-600' : 'text-gray-400 hover:text-purple-500'}`}
                      >
                        {item.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                      <input 
                        type="text" 
                        value={item.text}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].text = e.target.value;
                          setFormData({...formData, items: newItems});
                        }}
                        className={`flex-1 bg-transparent border-none focus:outline-none text-sm ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                      />
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddItem} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="নতুন আইটেম যোগ করুন..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  />
                  <button 
                    type="submit"
                    disabled={!newItemText.trim()}
                    className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                  >
                    <Plus size={20} />
                  </button>
                </form>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-3">
              <button 
                onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
              >
                বাতিল
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.title}
                className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
              </button>
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
            <p className="text-gray-500 mb-6">এই ফর্দটি মুছে ফেললে তা আর ফিরে পাওয়া যাবে না।</p>
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
