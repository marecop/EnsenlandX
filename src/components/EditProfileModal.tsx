import React, { useState } from 'react';
import { X } from 'lucide-react';
import { User } from '../types';
import { apiFetch } from '../lib/api';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: Partial<User>) => void;
}

export default function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [bgPic, setBgPic] = useState(user.bgPic || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, avatar, bgPic })
      });
      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm">
      <div className="bg-black border border-[#2f3336] rounded-2xl w-full max-w-[600px] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f3336]">
          <div className="flex items-center gap-6">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
              <X size={20} className="text-white" />
            </button>
            <h2 className="text-xl font-bold text-white">Edit profile</h2>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-white text-black font-bold py-1.5 px-4 rounded-full hover:bg-[#d7dbdc] transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>

        <div className="overflow-y-auto pb-6 relative">
          <div className="w-full h-[200px] bg-[#333639] relative group">
            {bgPic && <img src={bgPic} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" alt="Banner" />}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
               <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">Banner URL</span>
            </div>
            <input 
              type="text" 
              value={bgPic} 
              onChange={e => setBgPic(e.target.value)} 
              placeholder="Banner Image URL"
              className="absolute bottom-2 left-2 right-2 bg-black/60 text-white px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#1d9bf0]"
            />
          </div>

          <div className="px-4 relative mb-4">
            <div className="w-[112px] h-[112px] rounded-full border-4 border-black bg-[#16181c] absolute -top-[56px] group">
              {avatar ? <img src={avatar} className="w-full h-full rounded-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" alt="Avatar" /> : <div className="w-full h-full flex flex-col items-center justify-center text-white text-xl">{name[0] || 'U'}</div>}
               <input 
                  type="text" 
                  value={avatar} 
                  onChange={e => setAvatar(e.target.value)} 
                  placeholder="Avatar Image URL"
                  className="absolute -bottom-8 left-0 w-48 bg-black/80 text-white px-2 py-1 rounded text-xs outline-none focus:ring-1 focus:ring-[#1d9bf0] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                />
            </div>
          </div>
          
          <div className="px-4 mt-16 flex flex-col gap-4">
             <div className="border border-[#2f3336] rounded-md focus-within:border-[#1d9bf0] px-2 py-1 text-[#71767b] text-sm group transition-colors">
               <label className="block group-focus-within:text-[#1d9bf0]">Name</label>
               <input 
                 type="text" 
                 value={name} 
                 onChange={e => setName(e.target.value)} 
                 className="bg-transparent w-full outline-none text-white text-base py-1 disabled:opacity-50"
                 disabled={loading}
               />
             </div>

             <div className="border border-[#2f3336] rounded-md focus-within:border-[#1d9bf0] px-2 py-1 text-[#71767b] text-sm group transition-colors">
               <label className="block group-focus-within:text-[#1d9bf0]">Bio</label>
               <textarea 
                 value={bio} 
                 onChange={e => setBio(e.target.value)} 
                 className="bg-transparent w-full outline-none text-white text-base py-1 resize-none h-24 disabled:opacity-50"
                 disabled={loading}
               />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
