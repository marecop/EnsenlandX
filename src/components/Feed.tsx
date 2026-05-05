import React, { useState, useEffect } from 'react';
import TweetCard from './TweetCard';
import { Image, FileSliders, Smile, Calendar, MapPin, Loader2 } from 'lucide-react';
import { Tweet } from '../types';
import { apiFetch } from '../lib/api';

export default function Feed() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');

  const fetchTweets = async () => {
    try {
      const res = await apiFetch(activeTab === 'following' ? '/api/tweets?feed=following' : '/api/tweets');
      const data = await res.json();
      setTweets(data);
    } catch (error) {
      console.error('Failed to fetch tweets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, [activeTab]);

  const handlePost = async () => {
    if (!content.trim()) return;
    setIsPosting(true);
    
    try {
      const res = await apiFetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      if (res.ok) {
        setContent('');
        fetchTweets();
      }
    } catch (error) {
      console.error('Failed to create tweet', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <main className="flex-1 max-w-[600px] w-full border-r border-[#2f3336] min-h-screen pb-20">
      
      {/* Top Tabs */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
        <div className="h-[53px] flex text-[15px] font-bold cursor-pointer">
          <div 
            onClick={() => setActiveTab('forYou')}
            className="flex-1 flex justify-center hover:bg-[#181818] transition-colors relative"
          >
            <span className={`flex items-center h-full ${activeTab === 'forYou' ? 'text-white' : 'text-[#71767b] font-medium'}`}>
              For you
              {activeTab === 'forYou' && <div className="absolute bottom-0 h-1 w-14 bg-[#1d9bf0] rounded-full"></div>}
            </span>
          </div>
          <div 
            onClick={() => setActiveTab('following')}
            className="flex-1 flex justify-center hover:bg-[#181818] transition-colors relative"
          >
            <span className={`flex items-center h-full ${activeTab === 'following' ? 'text-white' : 'text-[#71767b] font-medium'}`}>
              Following
              {activeTab === 'following' && <div className="absolute bottom-0 h-1 w-[72px] bg-[#1d9bf0] rounded-full"></div>}
            </span>
          </div>
        </div>
      </div>

      {/* Compose Tweet */}
      <div className="border-b border-[#2f3336] px-4 pt-3 pb-2 flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1d9bf0] to-[#8a2be2] shrink-0" />
        
        <div className="flex-1 flex flex-col pt-1">
          <textarea
            value={content}
            onChange={handleTextareaInput}
            placeholder="What is happening?!"
            className="w-full bg-transparent outline-none text-xl placeholder-[#71767b] resize-none overflow-hidden min-h-[52px]"
          />
          
          {/* A fake separator if content is typed */}
          {content.length > 0 && (
            <div className="h-[1px] bg-[#2f3336] w-full mt-2 mb-2"></div>
          )}

          <div className="flex justify-between items-center mt-2">
            <div className="flex text-[#1d9bf0] gap-1">
              <button className="p-2 rounded-full hover:bg-[#1d9bf0]/10 transition-colors">
                <Image size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-[#1d9bf0]/10 transition-colors">
                <FileSliders size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-[#1d9bf0]/10 transition-colors">
                <Smile size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-[#1d9bf0]/10 transition-colors hidden sm:block">
                <Calendar size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-[#1d9bf0]/10 transition-colors">
                <MapPin size={20} />
              </button>
            </div>
            
            <button 
              onClick={handlePost}
              disabled={!content.trim() || isPosting}
              className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-1.5 px-4 rounded-full transition-colors flex items-center gap-2"
            >
              {isPosting && <Loader2 size={16} className="animate-spin" />}
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-[#2f3336]"></div>

      {/* Feed List */}
      <div className="flex flex-col">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-[#1d9bf0]" size={32} />
          </div>
        ) : tweets.length === 0 ? (
          <div className="p-8 text-center text-[#71767b]">
            <h2 className="text-xl font-bold text-white mb-2">Welcome to X</h2>
            <p>Write your first post to see it here.</p>
          </div>
        ) : (
          tweets.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} onInteract={fetchTweets} />
          ))
        )}
      </div>

    </main>
  );
}
