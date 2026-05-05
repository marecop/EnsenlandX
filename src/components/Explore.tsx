import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, User as UserIcon } from 'lucide-react';
import TweetCard from './TweetCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tweet, User } from '../types';
import { apiFetch } from '../lib/api';

export default function Explore() {
  const [trends, setTrends] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputVal, setInputVal] = useState(query);
  
  const [searchedTweets, setSearchedTweets] = useState<Tweet[]>([]);
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query) {
      apiFetch('/api/trends')
        .then(res => res.json())
        .then(data => setTrends(data))
        .catch(console.error);
    } else {
      setLoading(true);
      apiFetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setSearchedTweets(data.tweets || []);
          setSearchedUsers(data.users || []);
        })
        .finally(() => setLoading(false));
    }
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    } else {
      setSearchParams({});
    }
  };

  return (
    <main className="flex-1 max-w-[600px] w-full border-r border-[#2f3336] min-h-screen pb-20">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 px-4 py-2 border-b border-[#2f3336] flex items-center gap-4">
        {query && (
          <button onClick={() => { setSearchParams({}); setInputVal(''); }} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="bg-[#202327] rounded-full flex items-center px-4 py-2.5 focus-within:bg-black focus-within:border focus-within:border-[#1d9bf0] border border-transparent transition-colors group">
            <Search size={20} className="text-[#71767b] group-focus-within:text-[#1d9bf0] mr-4" />
            <input 
              type="text" 
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Search" 
              className="bg-transparent outline-none w-full text-white placeholder-[#71767b]"
            />
          </div>
        </form>
      </div>

      {!query ? (
        <div className="mt-2">
          <h2 className="text-xl font-extrabold text-white px-4 py-3">Trends for you</h2>
          <div className="flex flex-col">
            {trends.map((trend, index) => (
              <div 
                key={index} 
                className="hover:bg-[#181818] cursor-pointer px-4 py-3 transition-colors"
                onClick={() => {
                  setInputVal(trend.name);
                  setSearchParams({ q: trend.name });
                }}
              >
                <div className="text-[13px] text-[#71767b] flex justify-between">
                  <span>{trend.category}</span>
                </div>
                <div className="font-bold text-[15px] mt-0.5 text-white">{trend.name}</div>
                <div className="text-[13px] text-[#71767b] mt-1">{trend.posts}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {loading ? (
            <div className="p-4 text-center text-[#71767b]">Loading...</div>
          ) : (
            <>
              {searchedUsers.length > 0 && (
                <div className="border-b border-[#2f3336]">
                  <h3 className="px-4 py-3 text-lg font-bold">People</h3>
                  {searchedUsers.map(u => (
                    <div 
                      key={u.id} 
                      onClick={() => navigate(`/profile/${u.id}`)}
                      className="px-4 py-3 hover:bg-[#080808] cursor-pointer flex items-center gap-3 transition-colors"
                    >
                      {u.avatar ? (
                        <img src={u.avatar} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-[#16181c] rounded-full flex items-center justify-center font-bold">{u.name?.[0] || 'U'}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white truncate">{u.name}</div>
                        <div className="text-[#71767b] truncate">@{u.username}</div>
                        <div className="text-sm mt-1 truncate">{u.bio}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchedTweets.length > 0 ? (
                <div>
                  <h3 className="px-4 py-3 text-lg font-bold">Posts</h3>
                  {searchedTweets.map(tweet => (
                     <TweetCard
                       key={tweet.id}
                       tweet={tweet}
                       onInteract={() => {}}
                     />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <h2 className="text-[31px] font-extrabold break-words">No results for "{query}"</h2>
                  <p className="text-[#71767b] text-[15px] mt-2">Try searching for something else, or check your Search settings.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
