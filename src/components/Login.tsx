import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Feather, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';

interface LoginProps {
  onClose?: () => void;
  isAddingAccount?: boolean;
}

const Login: React.FC<LoginProps> = ({ onClose, isAddingAccount }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const body = isRegistering ? { name, username, password } : { username, password };

    try {
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.user);
        if (onClose) onClose();
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#5b7083]/40 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black w-full max-w-[600px] rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[400px]"
      >
        <div className="flex items-center justify-between p-4">
          {onClose && (
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full">
              <X size={20} />
            </button>
          )}
          <div className="flex-1 flex justify-center mr-8">
            <Feather className="text-[#1d9bf0]" size={32} />
          </div>
        </div>

        <div className="flex-1 px-8 py-4 max-w-[400px] mx-auto w-full">
          <h1 className="text-3xl font-bold mb-8">
            {isAddingAccount ? 'Add an account' : isRegistering ? 'Join X today' : 'Log in to X'}
          </h1>

          {error && (
            <div className="bg-[#1d9bf0]/10 text-[#1d9bf0] p-3 rounded-lg mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full bg-black border border-[#333639] rounded px-4 py-3 focus:border-[#1d9bf0] outline-none text-lg transition"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Username"
                className="w-full bg-black border border-[#333639] rounded px-4 py-3 focus:border-[#1d9bf0] outline-none text-lg transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-black border border-[#333639] rounded px-4 py-3 focus:border-[#1d9bf0] outline-none text-lg transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-[#d7dbdc] transition mt-4"
            >
              {isRegistering ? 'Sign up' : 'Next'}
            </button>
          </form>

          <p className="text-[#71767b] mt-8 text-sm">
            {isRegistering ? 'Have an account already?' : "Don't have an account?"}
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[#1d9bf0] ml-1 hover:underline"
            >
              {isRegistering ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
