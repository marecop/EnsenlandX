import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import TweetCard from './TweetCard';
import { Tweet, Comment } from '../types';
import { apiFetch } from '../lib/api';

export default function TweetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const fetchTweet = async () => {
    try {
      const res = await apiFetch(`/api/tweets/${id}`);
      if (!res.ok) throw new Error('Tweet not found');
      const data = await res.json();
      const { comments: fetchedComments, ...tweetData } = data;
      setTweet(tweetData);
      setComments(fetchedComments);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweet();
  }, [id]);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setIsPosting(true);
    try {
      await apiFetch(`/api/tweets/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent })
      });
      setReplyContent('');
      fetchTweet();
    } catch (error) {
      console.error(error);
    } finally {
      setIsPosting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 max-w-[600px] w-full border-r border-[#2f3336] min-h-screen flex justify-center pt-8">
        <Loader2 className="animate-spin text-[#1d9bf0]" size={32} />
      </main>
    );
  }

  if (!tweet) {
    return (
      <main className="flex-1 max-w-[600px] w-full border-r border-[#2f3336] min-h-screen">
        <div className="h-[53px] px-4 flex items-center gap-6 sticky top-0 bg-black/80 backdrop-blur-md z-10">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[#181818] transition-colors"><ArrowLeft size={20} /></button>
          <h2 className="text-xl font-bold">Post</h2>
        </div>
        <div className="p-8 text-center text-[#71767b]">Post not found.</div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[600px] w-full border-r border-[#2f3336] min-h-screen pb-20">
      
      {/* Header */}
      <div className="h-[53px] px-4 flex items-center gap-6 sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#2f3336]">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[#181818] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold">Post</h2>
      </div>

      <div className="pb-2 border-b border-[#2f3336]">
        <TweetCard tweet={tweet} onInteract={fetchTweet} />
      </div>

      {/* Reply Box */}
      <div className="border-b border-[#2f3336] px-4 pt-3 pb-2 flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1d9bf0] to-[#8a2be2] shrink-0" />
        <div className="flex-1 flex flex-col pt-1">
          <textarea
            value={replyContent}
            onChange={(e) => {
              setReplyContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Post your reply"
            className="w-full bg-transparent outline-none text-xl placeholder-[#71767b] resize-none overflow-hidden min-h-[52px]"
          />
          <div className="flex justify-end mt-2">
            <button 
              onClick={handleReply}
              disabled={!replyContent.trim() || isPosting}
              className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-1.5 px-4 rounded-full transition-colors flex items-center gap-2"
            >
              {isPosting && <Loader2 size={16} className="animate-spin" />}
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex flex-col">
        {comments.map((comment) => (
          <TweetCard key={comment.id} tweet={comment as unknown as Tweet} onInteract={fetchTweet} />
        ))}
        {comments.length === 0 && (
          <div className="p-8 text-center text-[#71767b]">No replies yet.</div>
        )}
      </div>

    </main>
  );
}
