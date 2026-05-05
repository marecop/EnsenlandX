import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';

export default function Settings() {
  const navigate = useNavigate();
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiModel, setApiModel] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [botLanguages, setBotLanguages] = useState('English, Chinese');
  const [botTopics, setBotTopics] = useState('Tech, Gaming');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiFetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setApiEndpoint(data.ai_endpoint || '');
          setApiModel(data.ai_model || '');
          setGeminiApiKey(data.gemini_api_key || '');
          setCustomApiKey(data.ai_api_key || '');
          setAiProvider(data.ai_provider || 'gemini');
          setBotLanguages(data.bot_languages || '');
          setBotTopics(data.bot_topics || '');
        }
      })
      .catch(e => console.error(e));
  }, []);

  const handleSave = async () => {
    try {
      await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ai_endpoint: apiEndpoint, 
          ai_model: apiModel,
          ai_provider: aiProvider,
          gemini_api_key: geminiApiKey,
          ai_api_key: customApiKey,
          bot_languages: botLanguages,
          bot_topics: botTopics
        })
      });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="flex-1 max-w-[600px] w-full border-r border-[#2f3336] min-h-screen pb-20">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center px-4 h-[53px]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-4 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      <div className="p-6 flex flex-col gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">AI Settings</h3>
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-[#71767b] text-sm mb-3 font-bold uppercase">AI Provider</p>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setAiProvider('gemini')}
                  className={cn(
                    "py-3 px-3 rounded-xl border border-[#333639] transition-all flex flex-col items-center gap-1",
                    aiProvider === 'gemini' ? "border-[#1d9bf0] bg-[#1d9bf0]/10" : "hover:bg-white/5"
                  )}
                >
                  <span className="font-bold text-sm">Gemini</span>
                  {aiProvider === 'gemini' && <Check size={14} className="text-[#1d9bf0]" />}
                </button>
                <button 
                  onClick={() => setAiProvider('flaps')}
                  className={cn(
                    "py-3 px-3 rounded-xl border border-[#333639] transition-all flex flex-col items-center gap-1",
                    aiProvider === 'flaps' ? "border-[#1d9bf0] bg-[#1d9bf0]/10" : "hover:bg-white/5"
                  )}
                >
                  <span className="font-bold text-sm">Flaps</span>
                  {aiProvider === 'flaps' && <Check size={14} className="text-[#1d9bf0]" />}
                </button>
                <button 
                  onClick={() => setAiProvider('custom')}
                  className={cn(
                    "py-3 px-3 rounded-xl border border-[#333639] transition-all flex flex-col items-center gap-1",
                    aiProvider === 'custom' ? "border-[#1d9bf0] bg-[#1d9bf0]/10" : "hover:bg-white/5"
                  )}
                >
                  <span className="font-bold text-sm">Custom</span>
                  {aiProvider === 'custom' && <Check size={14} className="text-[#1d9bf0]" />}
                </button>
              </div>
            </div>

            {aiProvider === 'gemini' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                <div>
                  <p className="text-[#71767b] text-sm mb-2 font-bold uppercase">Gemini API Key</p>
                  <input 
                    type="password" 
                    value={geminiApiKey}
                    onChange={e => setGeminiApiKey(e.target.value)}
                    placeholder="Enter your Gemini API Key"
                    className="w-full bg-transparent border border-[#333639] rounded px-3 py-3 text-white focus:border-[#1d9bf0] outline-none transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {aiProvider === 'flaps' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                <div>
                  <p className="text-[#71767b] text-sm mb-2 font-bold uppercase">Flaps Model Name</p>
                  <input 
                    type="text" 
                    value={apiModel}
                    onChange={e => setApiModel(e.target.value)}
                    placeholder="google/gemma-4-26b-a4b"
                    className="w-full bg-transparent border border-[#333639] rounded px-3 py-3 text-white focus:border-[#1d9bf0] outline-none transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {aiProvider === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                <div>
                  <p className="text-[#71767b] text-sm mb-2 font-bold uppercase">API Endpoint</p>
                  <input 
                    type="text" 
                    value={apiEndpoint}
                    onChange={e => setApiEndpoint(e.target.value)}
                    placeholder="https://api.example.com/v1/chat/completions"
                    className="w-full bg-transparent border border-[#333639] rounded px-3 py-3 text-white focus:border-[#1d9bf0] outline-none transition-colors"
                  />
                </div>
                <div>
                  <p className="text-[#71767b] text-sm mb-2 font-bold uppercase">API Key</p>
                  <input 
                    type="password" 
                    value={customApiKey}
                    onChange={e => setCustomApiKey(e.target.value)}
                    placeholder="Enter your API Key"
                    className="w-full bg-transparent border border-[#333639] rounded px-3 py-3 text-white focus:border-[#1d9bf0] outline-none transition-colors"
                  />
                </div>
                <div>
                  <p className="text-[#71767b] text-sm mb-2 font-bold uppercase">Model Name</p>
                  <input 
                    type="text" 
                    value={apiModel}
                    onChange={e => setApiModel(e.target.value)}
                    placeholder="e.g. gpt-4o, claude-3"
                    className="w-full bg-transparent border border-[#333639] rounded px-3 py-3 text-white focus:border-[#1d9bf0] outline-none transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="h-[1px] bg-[#2f3336] w-full"></div>

        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Bot Preferences</h3>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[#71767b] text-sm mb-2 font-bold uppercase">Bot Languages</p>
              <input 
                type="text" 
                value={botLanguages}
                onChange={e => setBotLanguages(e.target.value)}
                placeholder="English, Chinese..."
                className="w-full bg-transparent border border-[#333639] rounded px-3 py-3 text-white focus:border-[#1d9bf0] outline-none transition-colors"
              />
            </div>
            <div>
              <p className="text-[#71767b] text-sm mb-2 font-bold uppercase">Preferred Topics</p>
              <textarea 
                value={botTopics}
                onChange={e => setBotTopics(e.target.value)}
                placeholder="Tech, Gaming..."
                className="w-full bg-transparent border border-[#333639] rounded px-3 py-3 text-white focus:border-[#1d9bf0] outline-none transition-colors resize-none h-24"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end mt-4">
          <button 
            onClick={handleSave}
            className="bg-white text-black font-bold py-2.5 px-8 rounded-full hover:bg-[#d7dbdc] transition-colors"
          >
            Save Settings
          </button>
          <div className="text-[#00ba7c] text-sm font-medium h-5 flex items-center mt-3">
            {message && <><Check size={16} className="mr-1" /> {message}</>}
          </div>
        </div>
      </div>
    </main>
  );
}
