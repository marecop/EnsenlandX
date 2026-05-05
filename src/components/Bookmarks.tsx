import React, { useState, useEffect } from 'react';
import TweetCard from './TweetCard';
import { Loader2 } from 'lucide-react';
import { Tweet } from '../types';
import { apiFetch } from '../lib/api';

export default function Bookmarks() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      const res = await apiFetch('/api/bookmarks');
      const data = await res.json();
      setTweets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  return (
    <main className="flex-1 max-w-[600px] w-full border-r border-[#2f3336] min-h-screen pb-20">
      {/* Header */}
      <div className="h-[53px] px-4 flex items-center sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#2f3336]">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold leading-tight">Bookmarks</h2>
          <span className="text-[13px] text-[#71767b] leading-tight mt-0.5">@jasonzhang</span>
        </div>
      </div>

      {/* Feed List */}
      <div className="flex flex-col">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-[#1d9bf0]" size={32} />
          </div>
        ) : tweets.length === 0 ? (
          <div className="p-10 flex flex-col items-start text-[#71767b]">
            <h2 className="text-[31px] font-extrabold text-white leading-tight mb-2 max-w-[400px]">Save posts for later</h2>
            <p className="text-[15px] max-w-[400px]">Bookmark posts to easily find them again in the future.</p>
          </div>
        ) : (
          tweets.map((tweet) => (
            <TweetCard key={tweet.id + 'bookmark'} tweet={tweet} onInteract={fetchBookmarks} />
          ))
        )}
      </div>

    </main>
  );
}
