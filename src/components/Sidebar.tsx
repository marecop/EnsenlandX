import React, { useState, useRef, useEffect } from 'react';
import { Home, Search, Bell, Mail, Bookmark, User, Settings as SettingsIcon, Feather, MoreHorizontal, Check, Plus, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import Login from './Login';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  to: string;
}

function NavItem({ icon, label, isActive, to }: NavItemProps) {
  return (
    <Link to={to} className="w-full flex items-center xl:justify-start justify-center group cursor-pointer">
      <div className={cn(
        "flex items-center gap-5 p-3 rounded-full transition-colors duration-200 group-hover:bg-[#181818]",
        isActive && "font-bold"
      )}>
        <div className="text-2xl relative">
          {icon}
          {isActive && <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>}
        </div>
        <span className="text-xl hidden xl:inline pr-4">{label}</span>
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, accounts, switchAccount, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <header className="flex flex-col justify-between items-end xl:w-[275px] w-[68px] h-screen px-2 xl:px-4 py-2 border-r border-[#2f3336] sticky top-0 bg-black z-10">
      <div className="w-full flex flex-col items-center xl:items-start gap-1">
        <Link to="/" className="p-3 w-fit hover:bg-[#181818] rounded-full cursor-pointer transition-colors mt-2 mb-2">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-8 h-8 fill-white"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
        </Link>

        <nav className="flex flex-col w-full gap-1">
          <NavItem to="/" icon={<Home size={28} strokeWidth={location.pathname === '/' ? 3 : 2} />} label="Home" isActive={location.pathname === '/'} />
          <NavItem to="/explore" icon={<Search size={28} strokeWidth={location.pathname === '/explore' ? 3 : 2} />} label="Explore" isActive={location.pathname === '/explore'} />
          <NavItem to="/notifications" icon={<Bell size={28} strokeWidth={location.pathname === '/notifications' ? 3 : 2} />} label="Notifications" isActive={location.pathname === '/notifications'} />
          <NavItem to="/messages" icon={<Mail size={28} strokeWidth={location.pathname === '/messages' ? 3 : 2} />} label="Messages" isActive={location.pathname === '/messages'} />
          <NavItem to="/bookmarks" icon={<Bookmark size={28} strokeWidth={location.pathname === '/bookmarks' ? 3 : 2} />} label="Bookmarks" isActive={location.pathname === '/bookmarks'} />
          <NavItem to="/profile" icon={<User size={28} strokeWidth={location.pathname === '/profile' ? 3 : 2} />} label="Profile" isActive={location.pathname === '/profile'} />
          
          <div onClick={() => navigate('/settings')} className="w-full flex items-center xl:justify-start justify-center group cursor-pointer">
            <div className="flex items-center gap-5 p-3 rounded-full transition-colors duration-200 group-hover:bg-[#181818]">
              <div className="text-2xl relative">
                <SettingsIcon size={28} strokeWidth={location.pathname === '/settings' ? 3 : 2} />
              </div>
              <span className={cn("text-xl hidden xl:inline pr-4", location.pathname === '/settings' && "font-bold")}>Settings</span>
            </div>
          </div>
        </nav>

        <button className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-full mt-4 xl:w-[90%] w-12 h-12 xl:h-14 font-bold text-[17px] transition-colors shadow-sm flex items-center justify-center">
          <span className="hidden xl:inline">Post</span>
          <Feather className="xl:hidden w-6 h-6" />
        </button>
      </div>

      <div className="w-full relative" ref={menuRef}>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-3 left-0 w-[300px] bg-black border border-[#2f3336] rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] py-3 z-50 overflow-hidden"
            >
              <div className="max-h-[300px] overflow-y-auto">
                {accounts.map((acc) => (
                  <div 
                    key={acc.id}
                    onClick={() => {
                      switchAccount(acc.id);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#181818] cursor-pointer transition-colors group"
                  >
                    <img src={acc.avatar || `https://i.pravatar.cc/150?u=${acc.username}`} alt={acc.name} className="w-10 h-10 rounded-full" />
                    <div className="flex flex-col flex-1 leading-tight overflow-hidden">
                      <span className="font-bold truncate">{acc.name}</span>
                      <span className="text-[#71767b] truncate text-sm">@{acc.username}</span>
                    </div>
                    {currentUser.id === acc.id && (
                      <Check className="text-[#1d9bf0]" size={18} />
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-[#2f3336] mt-1 pt-1">
                <button 
                  onClick={() => {
                    setShowAddAccount(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#181818] transition-colors font-bold text-[15px]"
                >
                  <Plus size={20} />
                  <span>Add an existing account</span>
                </button>
                <button 
                  onClick={() => {
                    logout(currentUser.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#181818] transition-colors font-bold text-[15px]"
                >
                  <LogOut size={20} />
                  <span>Log out @{currentUser.username}</span>
                </button>
              </div>

              {/* Triangle pointer */}
              <div className="absolute top-full left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-black"></div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full mb-4 p-3 flex items-center gap-3 hover:bg-[#181818] rounded-full cursor-pointer transition-colors justify-center xl:justify-start"
        >
          {currentUser.avatar ? (
             <img src={currentUser.avatar} alt="" className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1d9bf0] to-[#8a2be2] flex items-center justify-center font-bold">
              {currentUser.name[0]}
            </div>
          )}
          <div className="hidden xl:flex flex-col flex-1 leading-tight overflow-hidden">
            <span className="font-bold whitespace-nowrap truncate">{currentUser.name}</span>
            <span className="text-[#71767b] truncate">@{currentUser.username}</span>
          </div>
          <div className="hidden xl:block text-xl">
            <MoreHorizontal size={20} />
          </div>
        </div>
      </div>

      {showAddAccount && (
        <Login onClose={() => setShowAddAccount(false)} isAddingAccount />
      )}
    </header>
  );
}
