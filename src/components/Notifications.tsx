import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Repeat, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/api/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(console.error);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={28} className="text-[#f91880] fill-[#f91880]" />;
      case 'reply': return <MessageCircle size={28} className="text-[#1d9bf0] fill-[#1d9bf0]" />;
      case 'retweet': return <Repeat size={28} className="text-[#00ba7c]" />;
      case 'bookmark': return <Bookmark size={28} className="text-[#1d9bf0]" />;
      case 'recommendation': return <Heart size={28} className="text-[#8a2be2] fill-[#8a2be2]" />;
      default: return <Heart size={28} />;
    }
  };

  const getMessage = (type: string, name: string) => {
    switch (type) {
      case 'like': return <span className="font-bold text-white">{name} liked your reply</span>;
      case 'reply': return <span className="font-bold text-white">{name} replied to your post</span>;
      case 'retweet': return <span className="font-bold text-white">{name} reposted your post</span>;
      case 'bookmark': return <span className="font-bold text-white">{name} bookmarked your post</span>;
      case 'recommendation': return <span className="font-bold text-white">Recommended for you</span>;
      default: return <span className="font-bold text-white">{name} interacted with you</span>;
    }
  };

  return (
    <main className="flex-1 max-w-[600px] w-full border-r border-[#2f3336] min-h-screen pb-20">
      <div className="h-[53px] px-4 flex items-center sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#2f3336]">
        <h2 className="text-xl font-bold">Notifications</h2>
      </div>

      <div className="flex flex-col">
        {notifications.length === 0 && (
          <div className="p-8 text-center text-[#71767b]">No notifications yet.</div>
        )}
        {notifications.map((notif: any) => (
          <div 
            key={notif.id} 
            onClick={() => { if(notif.tweetId) navigate(`/tweet/${notif.tweetId}`); }}
            className="border-b border-[#2f3336] p-4 flex gap-3 hover:bg-[#181818] transition-colors cursor-pointer"
          >
            <div className="w-10 flex justify-end shrink-0 pt-1">
              {getIcon(notif.type)}
            </div>
            <div className="flex flex-col flex-1 gap-2">
              <div 
                className="w-8 h-8 rounded-full overflow-hidden cursor-pointer shrink-0"
                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${notif.actorId}`); }}
              >
                {notif.avatar ? (
                  <img src={notif.avatar} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1d9bf0]" />
                )}
              </div>
              <div className="text-[15px]">{getMessage(notif.type, notif.name || 'Someone')}</div>
              {notif.tweetContent && (
                <div className="text-[#71767b] text-[15px]">{notif.tweetContent}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
