import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import RightSidebar from './components/RightSidebar';
import Profile from './components/Profile';
import Bookmarks from './components/Bookmarks';
import TweetDetail from './components/TweetDetail';
import Explore from './components/Explore';
import Messages from './components/Messages';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import Login from './components/Login';
import { AuthProvider, useAuth } from './AuthContext';

function AppContent() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) return null;

  if (!currentUser) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="w-full flex justify-center min-h-screen bg-black text-white">
        <div className="flex w-full max-w-[1265px] min-h-screen relative">
          <Sidebar />
          
          <main className="flex-1 border-x border-[#2f3336] max-w-[600px] w-full ml-[68px] sm:ml-[88px] xl:ml-[275px]">
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:id" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/tweet/:id" element={<TweetDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
          
          <RightSidebar />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}


