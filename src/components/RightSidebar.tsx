import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface Trend {
  category: string;
  name: string;
  posts: string;
}

export default function RightSidebar() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/api/trends')
      .then(res => res.json())
      .then(data => setTrends(data))
      .catch(console.error);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <div className="hidden lg:flex flex-col w-[350px] pl-8 py-2 gap-4 h-screen overflow-y-auto sticky top-0 pb-20">
      
      {/* Search Bar */}
      <div className="sticky top-0 bg-black pt-1 pb-3 z-10">
        <form onSubmit={handleSearchSubmit} className="bg-[#202327] rounded-full flex items-center px-4 py-3 focus-within:bg-black focus-within:border focus-within:border-[#1d9bf0] border border-transparent transition-colors group">
          <Search size={20} className="text-[#71767b] group-focus-within:text-[#1d9bf0] mr-4" />
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search" 
            className="bg-transparent outline-none w-full text-white placeholder-[#71767b]"
          />
        </form>
      </div>

      {/* Premium Subscribe Box */}
      <div className="bg-[#16181c] rounded-2xl p-4 flex flex-col gap-2 border border-[#2f3336]">
        <h2 className="text-xl font-extrabold text-white">Subscribe to Premium</h2>
        <p className="text-[15px] font-medium leading-tight">Subscribe to unlock new features and if eligible, receive a share of ads revenue.</p>
        <button className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-2 px-4 rounded-full w-fit mt-2">
          Subscribe
        </button>
      </div>

      {/* Trends */}
      <div className="bg-[#16181c] rounded-2xl flex flex-col border border-[#2f3336]">
        <h2 className="text-xl font-extrabold text-white p-4">What's happening</h2>
        
        {trends.map((trend, index) => (
          <div key={index} onClick={() => navigate(`/explore?q=${encodeURIComponent(trend.name)}`)} className="hover:bg-[#1d1f23] cursor-pointer px-4 py-3 transition-colors">
            <div className="text-[13px] text-[#71767b] flex justify-between">
              <span>{trend.category}</span>
              <span className="hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full px-1">...</span>
            </div>
            <div className="font-bold text-[15px] mt-0.5 text-white">{trend.name}</div>
            <div className="text-[13px] text-[#71767b] mt-1">{trend.posts}</div>
          </div>
        ))}
        
        <div className="p-4 hover:bg-[#1d1f23] cursor-pointer transition-colors rounded-b-2xl">
          <span className="text-[#1d9bf0] text-[15px]">Show more</span>
        </div>
      </div>
      
      {/* Footer Links */}
      <div className="px-4 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[#71767b]">
        <a href="#" className="hover:underline">Terms of Service</a>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <a href="#" className="hover:underline">Cookie Policy</a>
        <a href="#" className="hover:underline">Accessibility</a>
        <a href="#" className="hover:underline">Ads info</a>
        <span>© 2026 X Corp.</span>
      </div>

    </div>
  );
}
