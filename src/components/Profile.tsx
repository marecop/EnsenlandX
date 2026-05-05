import React, { useState, useEffect } from 'react';
import TweetCard from './TweetCard';
import { ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { Tweet, User } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import EditProfileModal from './EditProfileModal';
import { apiFetch } from '../lib/api';

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMe, setIsMe] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      if (id) {
        const res = await apiFetch(`/api/users/${id}?tab=${activeTab}`);
        const data = await res.json();
        setTweets(data.tweets);
        setUser(data.user);
        
        // Check if it's me
        const meRes = await apiFetch('/api/me');
        const meData = await meRes.json();
        setIsMe(meData.id === parseInt(id));
      } else {
        const [tweetsRes, userRes] = await Promise.all([
          apiFetch(`/api/profile?tab=${activeTab}`),
          apiFetch('/api/me')
        ]);
        const tweetsData = await tweetsRes.json();
        const userData = await userRes.json();
        setTweets(tweetsData);
        setUser(userData);
        setIsMe(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [activeTab, id]);

  const handleFollow = async () => {
    if (!user || isMe) return;
    try {
      const res = await apiFetch(`/api/users/${user.id}/follow`, { method: 'POST' });
      const data = await res.json();
      setUser(prev => prev ? {
        ...prev, 
        isFollowing: data.following,
        followersCount: (prev.followersCount || 0) + (data.following ? 1 : -1)
      } : null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="flex-1 max-w-[600px] w-full border-r border-[#2f3336] min-h-screen pb-20">
      
      {/* Header */}
      <div className="h-[53px] px-4 flex items-center gap-6 sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#2f3336]">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[#181818] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold leading-tight">{user?.name || 'Loading'}</h2>
          <span className="text-[13px] text-[#71767b] leading-tight mt-0.5">{tweets.length} posts</span>
        </div>
      </div>

      {/* Banner & Avatar */}
      <div className="w-full h-[200px] bg-[#333639]">
        {user?.bgPic && <img src={user.bgPic} className="w-full h-full object-cover" />}
      </div>
      <div className="px-4 pb-4">
        <div className="flex justify-between items-start relative pb-2">
          {user?.avatar ? (
            <img src={user.avatar} className="w-[134px] h-[134px] rounded-full border-4 border-black absolute -top-[67px] object-cover" />
          ) : (
            <div className="w-[134px] h-[134px] rounded-full border-4 border-black bg-[#16181c] absolute -top-[67px] flex items-center justify-center text-4xl font-bold">
              {user?.name?.[0] || 'U'}
            </div>
          )}
          <div className="w-[134px]"></div>
          {isMe ? (
            <button 
              onClick={() => setShowEditModal(true)}
              className="mt-3 font-bold py-1.5 px-4 rounded-full border border-[#536471] hover:bg-[#181818] transition-colors text-white"
            >
              Edit profile
            </button>
          ) : (
            <div className="mt-3 flex gap-2">
              <button onClick={() => navigate(`/messages/${user?.id}`)} className="p-1.5 border border-[#536471] rounded-full hover:bg-[#181818] transition-colors flex items-center justify-center h-9 w-9">
                <span className="text-white flex items-center justify-center">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"></path></svg>
                </span>
              </button>
              <button 
                onClick={handleFollow}
                className={`font-bold py-1.5 px-4 rounded-full transition-colors ${
                  user?.isFollowing 
                    ? 'border border-[#536471] bg-transparent text-white hover:border-red-900 hover:text-red-500 hover:bg-red-900/20' 
                    : 'bg-white text-black hover:bg-[#d7dbdc]'
                }`}
              >
                {user?.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <h2 className="text-xl font-extrabold text-white">{user?.name || ''}</h2>
          <p className="text-[#71767b] text-[15px]">@{user?.username || ''}</p>
        </div>
        
        <div className="mt-3 text-[15px]">
          <p>{user?.bio || ''}</p>
        </div>
        
        <div className="flex items-center gap-1.5 mt-3 text-[#71767b] text-[15px]">
          <Calendar size={18} />
          <span>Joined May 2026</span>
        </div>
        
        <div className="flex items-center gap-4 mt-3 text-[15px]">
          <div className="hover:underline cursor-pointer"><span className="text-white font-bold">{user?.followingCount || 0}</span> <span className="text-[#71767b]">Following</span></div>
          <div className="hover:underline cursor-pointer"><span className="text-white font-bold">{user?.followersCount || 0}</span> <span className="text-[#71767b]">Followers</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#2f3336] flex">
        {['posts', 'replies', 'likes'].map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 flex justify-center hover:bg-[#181818] transition-colors cursor-pointer"
          >
            <div className="h-[53px] flex items-center justify-center relative">
              <span className={`capitalize text-[15px] ${activeTab === tab ? 'text-white font-bold' : 'text-[#71767b] font-medium'}`}>
                {tab}
              </span>
              {activeTab === tab && <div className="absolute bottom-0 h-1 w-full bg-[#1d9bf0] rounded-full"></div>}
            </div>
          </div>
        ))}
      </div>

      {/* Feed List */}
      <div className="flex flex-col">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-[#1d9bf0]" size={32} />
          </div>
        ) : tweets.length === 0 ? (
          <div className="p-8 text-center text-[#71767b]">
            <h2 className="text-xl font-bold text-white mb-2">No {activeTab} yet.</h2>
            <p>When you start interacting, it will show up here.</p>
          </div>
        ) : (
          tweets.map((tweet) => (
            <TweetCard key={tweet.id + 'profile'} tweet={tweet} onInteract={fetchProfileData} />
          ))
        )}
      </div>

      {showEditModal && user && (
        <EditProfileModal 
          user={user} 
          onClose={() => setShowEditModal(false)} 
          onSave={(u) => setUser(prev => prev ? { ...prev, ...u } as User : null)} 
        />
      )}
    </main>
  );
}
