import React, { useState } from 'react';
import { Tweet } from '../types';
import { MessageCircle, Repeat2, Heart, BarChart2, Share, MoreHorizontal, Bookmark, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface TweetCardProps {
  tweet: Tweet;
  onInteract: () => void;
  key?: React.Key;
}

export default function TweetCard({ tweet, onInteract }: TweetCardProps) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleInteract = async (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (action === 'comment') {
      navigate(`/tweet/${tweet.id}`);
      return;
    }

    await apiFetch(`/api/tweets/${tweet.id}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    
    onInteract();
  };

  const handleCardClick = () => {
    navigate(`/tweet/${tweet.id}`);
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${tweet.userId}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this tweet?')) return;
    await apiFetch(`/api/tweets/${tweet.id}`, { method: 'DELETE' });
    window.location.reload();
  };

  const formattedDate = formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: false })
    .replace('about ', '')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' months', 'mo')
    .replace(' month', 'mo')
    .replace(' years', 'y')
    .replace(' year', 'y');

  return (
    <article onClick={handleCardClick} className="border-b border-[#2f3336] px-4 pt-3 pb-2 hover:bg-[#080808] transition-colors cursor-pointer flex gap-3 relative">
      {/* Avatar */}
      <div onClick={handleUserClick} className="shrink-0 z-10 cursor-pointer">
        {tweet.user?.avatar ? (
          <img src={tweet.user.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#16181c] flex items-center justify-center text-lg font-bold">
            {tweet.user?.name?.[0] || 'U'}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div onClick={handleUserClick} className="flex items-center gap-1.5 text-[15px] truncate max-w-full z-10 cursor-pointer">
            <span className="font-bold text-white hover:underline truncate">{tweet.user?.name || 'User'}</span>
            <span className="text-[#71767b] truncate">@{tweet.user?.username || 'user'}</span>
            <span className="text-[#71767b]">·</span>
            <span className="text-[#71767b] hover:underline whitespace-nowrap">{formattedDate}</span>
          </div>
          
          <div className="relative z-20">
            <button onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }} className="text-[#71767b] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full p-1 -mr-2 transition-colors">
              <MoreHorizontal size={18} />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-8 w-40 bg-black border border-[#2f3336] shadow-md shadow-white/5 rounded-xl overflow-hidden">
                <button onClick={handleDelete} className="w-full text-left px-4 py-3 text-red-500 font-bold hover:bg-[#16181c] flex items-center gap-2">
                  <Trash size={18} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body Text */}
        <div className="text-[15px] text-white whitespace-pre-wrap mt-0.5 leading-normal">
          {tweet.content}
        </div>

        {/* Media */}
        {tweet.image && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-[#2f3336]">
            <img src={tweet.image} alt="Tweet media" className="w-full h-auto object-cover max-h-[500px]" loading="lazy" />
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-between text-[#71767b] mt-3 max-w-[425px]">
          
          {/* Reply */}
          <button 
            onClick={(e) => handleInteract(e, 'comment')}
            className="flex items-center gap-1.5 group transition-colors"
          >
            <div className="p-2 -m-2 rounded-full group-hover:bg-[#1d9bf0]/10 group-hover:text-[#1d9bf0] transition-colors">
              <MessageCircle size={18} className="group-hover:text-[#1d9bf0]" />
            </div>
            <span className="text-sm group-hover:text-[#1d9bf0] tabular-nums">
              {tweet.commentsCount > 0 && tweet.commentsCount}
            </span>
          </button>

          {/* Retweet */}
          <button 
            onClick={(e) => handleInteract(e, 'retweet')}
            className={cn("flex items-center gap-1.5 group transition-colors", tweet.isRetweeted && "text-[#00ba7c]")}
          >
            <div className="p-2 -m-2 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors">
              <Repeat2 size={18} />
            </div>
            <span className="text-sm tabular-nums">
              {tweet.retweets > 0 && tweet.retweets}
            </span>
          </button>

          {/* Like */}
          <button 
            onClick={(e) => handleInteract(e, 'like')}
            className={cn("flex items-center gap-1.5 group transition-colors", tweet.isLiked && "text-[#f91880]")}
          >
            <div className="p-2 -m-2 rounded-full group-hover:bg-[#f91880]/10 transition-colors">
              <Heart size={18} className={cn(tweet.isLiked && "fill-[#f91880] text-[#f91880]")} />
            </div>
            <span className="text-sm tabular-nums">
              {tweet.likes > 0 && tweet.likes}
            </span>
          </button>

          {/* Views */}
          <button 
            onClick={(e) => handleInteract(e, 'view')}
            className="flex items-center gap-1.5 group transition-colors"
          >
            <div className="p-2 -m-2 rounded-full group-hover:bg-[#1d9bf0]/10 group-hover:text-[#1d9bf0] transition-colors">
              <BarChart2 size={18} className="group-hover:text-[#1d9bf0]" />
            </div>
            <span className="text-sm group-hover:text-[#1d9bf0] tabular-nums">
              {tweet.views > 0 && tweet.views}
            </span>
          </button>

          {/* Share & Bookmark */}
          <div className="flex items-center gap-1.5 group">
            <button 
              onClick={(e) => handleInteract(e, 'bookmark')}
              className={cn("p-2 -m-2 rounded-full group-hover:bg-[#1d9bf0]/10 group-hover:text-[#1d9bf0] transition-colors", tweet.isBookmarked ? "text-[#1d9bf0]" : "text-[#71767b]")}
            >
              <Bookmark size={18} className={cn(tweet.isBookmarked && "fill-[#1d9bf0] text-[#1d9bf0]")} />
            </button>
            <button className="p-2 -m-2 ml-1 rounded-full group-hover:bg-[#1d9bf0]/10 group-hover:text-[#1d9bf0] transition-colors text-[#71767b]">
              <Share size={18} />
            </button>
          </div>

        </div>
      </div>
    </article>
  );
}
