import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Mail } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from '../types';
import { apiFetch } from '../lib/api';

export default function Messages() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      apiFetch(`/api/users/${id}`)
        .then(res => res.json())
        .then(data => setUser(data));
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    } else {
      apiFetch('/api/conversations')
        .then(res => res.json())
        .then(data => setConversations(data));
    }
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = () => {
    if (!id) return;
    apiFetch(`/api/messages/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setMessages(data);
      });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !id || loading) return;

    const tmp = content;
    setContent('');
    setLoading(true);

    setMessages(prev => [...prev, { senderId: 1, receiverId: parseInt(id), content: tmp, id: Date.now() }]);
    
    const activeId = localStorage.getItem('twitter_clone_active_id');
    const senderId = activeId ? parseInt(activeId, 10) : 1;

    await apiFetch(`/api/messages/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: tmp })
    });
    
    setLoading(false);
    fetchMessages();
  };

  if (!id) {
    return (
      <main className="flex-1 max-w-[600px] w-full border-r border-[#2f3336] min-h-screen">
        <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center justify-between px-4 h-[53px] border-b border-[#2f3336]">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        
        {conversations.length === 0 ? (
          <div className="p-10 flex flex-col items-start px-8">
            <h2 className="text-[31px] font-extrabold text-white leading-tight mb-2">Welcome to your inbox!</h2>
            <p className="text-[15px] text-[#71767b] mb-6">Drop a line, share posts and more with private conversations between you and others on X.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {conversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="padding-4 flex items-center gap-3 p-4 border-b border-[#2f3336] hover:bg-[#181818] cursor-pointer transition-colors"
                style={{ padding: '16px' }}
              >
                {conv.avatar ? (
                  <img src={conv.avatar} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                   <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1d9bf0] to-[#8a2be2] flex items-center justify-center font-bold text-white text-xl">
                      {conv.name[0]}
                   </div>
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white">{conv.name}</span>
                    <span className="text-[#71767b]">@{conv.username}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[600px] w-full border-r border-[#2f3336] min-h-screen flex flex-col">
      <div className="h-[53px] px-4 flex items-center gap-6 sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#2f3336]">
        <button onClick={() => navigate('/messages')} className="p-2 rounded-full hover:bg-[#181818] transition-colors -ml-2">
          <ArrowLeft size={20} />
        </button>
        {user && (
          <div className="flex items-center gap-3">
             {user.avatar ? (
                <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1d9bf0]" />
              )}
            <h2 className="text-xl font-bold">{user.name}</h2>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-0" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-[#71767b] mt-10">
            Start a conversation with {user?.name || 'this user'}.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.senderId === 1 ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.senderId === 1 ? 'bg-[#1d9bf0] text-white rounded-br-sm' : 'bg-[#2f3336] text-white rounded-bl-sm'}`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-[#2f3336] text-white rounded-2xl px-4 py-2 text-sm flex gap-1 rounded-bl-sm">
               <span className="w-2 h-2 bg-[#71767b] rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-[#71767b] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
               <span className="w-2 h-2 bg-[#71767b] rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
             </div>
          </div>
        )}
        <div className="h-4"></div>
      </div>

      <div className="p-4 pt-2 border-t border-[#2f3336]">
        <form onSubmit={handleSend} className="bg-[#202327] rounded-full flex items-center px-4 py-2 border border-transparent focus-within:border-[#1d9bf0] transition-colors">
          <input 
            type="text" 
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Start a new message"
            className="bg-transparent outline-none text-white flex-1 min-w-0"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={!content.trim() || loading}
            className="p-2 ml-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center h-9 w-9"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </main>
  );
}
