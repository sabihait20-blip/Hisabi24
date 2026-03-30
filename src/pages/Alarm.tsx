import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Bell, X, Clock } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

interface AlarmItem {
  id: string;
  title: string;
  time: string; // HH:MM
  isActive: boolean;
}

export function Alarm({ onBack }: { onBack: () => void }) {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTime, setNewTime] = useState('08:00');
  const [newTitle, setNewTitle] = useState('');
  const [triggeredAlarm, setTriggeredAlarm] = useState<AlarmItem | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'alarms'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alarmsData: AlarmItem[] = [];
      snapshot.forEach((doc) => {
        alarmsData.push({ id: doc.id, ...doc.data() } as AlarmItem);
      });
      
      // Sort client-side to avoid requiring a composite index
      alarmsData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setAlarms(alarmsData);
    }, (error) => {
      console.error("Error fetching alarms:", error);
    });

    return () => unsubscribe();
  }, []);

  // Alarm checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      const activeAlarm = alarms.find(a => a.isActive && a.time === currentTime);
      if (activeAlarm && triggeredAlarm?.id !== activeAlarm.id) {
        setTriggeredAlarm(activeAlarm);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [alarms, triggeredAlarm]);

  const handleAddAlarm = async () => {
    if (!auth.currentUser || !newTime) return;
    
    try {
      await addDoc(collection(db, 'alarms'), {
        title: newTitle || 'এলার্ম',
        time: newTime,
        isActive: true,
        uid: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewTime('08:00');
    } catch (error) {
      console.error("Error adding alarm:", error);
    }
  };

  const toggleAlarm = async (alarm: AlarmItem) => {
    try {
      await updateDoc(doc(db, 'alarms', alarm.id), {
        isActive: !alarm.isActive
      });
    } catch (error) {
      console.error("Error toggling alarm:", error);
    }
  };

  const deleteAlarm = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'alarms', id));
    } catch (error) {
      console.error("Error deleting alarm:", error);
    }
  };

  const stopAlarm = async () => {
    if (triggeredAlarm) {
      try {
        await updateDoc(doc(db, 'alarms', triggeredAlarm.id), {
          isActive: false
        });
      } catch (error) {
        console.error("Error stopping alarm:", error);
      }
      setTriggeredAlarm(null);
    }
  };

  const formatTime = (time24: string) => {
    const [h, m] = time24.split(':');
    const hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${m} ${ampm}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      <div className="bg-purple-700 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack}><ArrowLeft size={24} /></button>
          <h1 className="text-lg font-bold">এলার্ম</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {alarms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center text-gray-500">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <Clock size={40} className="text-purple-600" />
            </div>
            <p className="text-lg font-medium">কোনো এলার্ম সেট করা নেই</p>
            <p className="text-sm mt-2">নতুন এলার্ম যোগ করতে উপরের + বাটনে ক্লিক করুন</p>
          </div>
        ) : (
          alarms.map((alarm) => (
            <div key={alarm.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-colors ${alarm.isActive ? 'border-purple-200' : 'border-gray-100 opacity-70'}`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-600">{alarm.title}</h3>
                <button 
                  onClick={() => deleteAlarm(alarm.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex justify-between items-end">
                <div className={`text-4xl font-light tracking-tight ${alarm.isActive ? 'text-purple-700' : 'text-gray-400'}`}>
                  {formatTime(alarm.time)}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={alarm.isActive}
                    onChange={() => toggleAlarm(alarm)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Alarm Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-purple-600 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">নতুন এলার্ম</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">সময় নির্বাচন করুন</label>
                <input 
                  type="time" 
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full text-4xl text-center border-b-2 border-purple-200 py-2 focus:outline-none focus:border-purple-600 text-gray-800 font-light tracking-wider"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">এলার্মের নাম (ঐচ্ছিক)</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="যেমন: ওষুধ খাওয়ার সময়"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleAddAlarm}
                  className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700"
                >
                  সেভ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ringing Alarm Modal */}
      {triggeredAlarm && (
        <div className="fixed inset-0 bg-purple-900/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Bell size={48} className="text-purple-600 animate-pulse" />
            </div>
            <h2 className="text-3xl font-light text-gray-800 mb-2">{formatTime(triggeredAlarm.time)}</h2>
            <p className="text-xl font-medium text-purple-600 mb-8">{triggeredAlarm.title}</p>
            
            <button 
              onClick={stopAlarm}
              className="w-full py-4 bg-purple-600 text-white text-lg font-bold rounded-2xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/30"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
