import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, MoreVertical, X, Edit2, Trash2 } from 'lucide-react';
import { toBenNum } from '../lib/bengali';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  color: string;
}

const COLORS = [
  'bg-yellow-50 border-yellow-200',
  'bg-blue-50 border-blue-200',
  'bg-green-50 border-green-200',
  'bg-pink-50 border-pink-200',
  'bg-purple-50 border-purple-200',
  'bg-orange-50 border-orange-200',
];

export function Notebook({ onBack }: { onBack: () => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: COLORS[0]
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notes'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData: Note[] = [];
      snapshot.forEach((doc) => {
        notesData.push({ id: doc.id, ...doc.data() } as Note);
      });
      setNotes(notesData);
    }, (error) => {
      console.error("Error fetching notes:", error);
    });

    return () => unsubscribe();
  }, []);

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = () => {
    setFormData({ title: '', content: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setFormData({ 
      title: note.title, 
      content: note.content, 
      color: note.color || COLORS[0]
    });
    setEditingId(note.id);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content || !auth.currentUser) return;
    
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    try {
      if (editingId) {
        const docRef = doc(db, 'notes', editingId);
        await updateDoc(docRef, {
          title: formData.title,
          content: formData.content,
          color: formData.color,
          date: formattedDate
        });
      } else {
        await addDoc(collection(db, 'notes'), {
          title: formData.title,
          content: formData.content,
          color: formData.color,
          date: formattedDate,
          uid: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, 'notes', deleteId));
        setDeleteId(null);
        setActiveMenuId(null);
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-md">
        <button onClick={onBack}><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-bold">নোট বুক</h1>
      </div>

      <div className="p-4">
        <div className="relative mb-6">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নোট খুঁজুন..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500 shadow-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500">কোনো নোট নেই</p>
            <p className="text-sm mt-1">নতুন নোট যোগ করতে + বাটনে ক্লিক করুন</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            কোনো নোট পাওয়া যায়নি
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4 mb-6">
            {filteredNotes.map((note) => (
              <div 
                key={note.id} 
                className={`rounded-xl p-4 shadow-sm border relative group cursor-pointer hover:shadow-md transition-shadow ${note.color || COLORS[0]}`}
                onClick={() => openEditModal(note)}
              >
                <h3 className="font-bold text-gray-800 mb-2 line-clamp-1 pr-6">{note.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3 whitespace-pre-wrap">{note.content}</p>
                <p className="text-[10px] text-gray-500 font-medium">{toBenNum(note.date)}</p>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === note.id ? null : note.id);
                  }}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-black/5 transition-colors"
                >
                  <MoreVertical size={18} />
                </button>

                {activeMenuId === note.id && (
                  <div 
                    className="absolute right-2 top-10 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 animate-in fade-in zoom-in duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={() => { openEditModal(note); setActiveMenuId(null); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition-colors"
                    >
                      <Edit2 size={16} /> এডিট
                    </button>
                    <button 
                      onClick={() => { setDeleteId(note.id); setActiveMenuId(null); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} /> ডিলিট
                    </button>
                  </div>
                )}
              </div>
            ))}
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
                {editingId ? 'নোট এডিট করুন' : 'নতুন নোট'}
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
                  placeholder="নোটের শিরোনাম"
                  className="w-full text-xl font-bold border-none px-0 py-2 focus:outline-none focus:ring-0 text-gray-800 placeholder:text-gray-400 bg-transparent"
                />
              </div>
              
              <div className="flex-1 min-h-[200px]">
                <textarea 
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="এখানে লিখুন..."
                  className="w-full h-full min-h-[200px] border-none px-0 py-2 focus:outline-none focus:ring-0 text-gray-600 resize-none bg-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">রঙ নির্বাচন করুন</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({...formData, color})}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${color} ${formData.color === color ? 'ring-2 ring-purple-500 ring-offset-2 scale-110' : 'border-transparent hover:scale-110'}`}
                    />
                  ))}
                </div>
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
                disabled={!formData.title || !formData.content}
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
            <p className="text-gray-500 mb-6">এই নোটটি মুছে ফেললে তা আর ফিরে পাওয়া যাবে না।</p>
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
