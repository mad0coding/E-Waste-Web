import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { MainInterface } from './components/MainInterface';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [user, setUser] = useState<string | null>(null);

  const handleLogin = (email: string) => {
    setUser(email);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="size-full">
      {user ? (
        <MainInterface userEmail={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
      <Toaster />
    </div>
  );
}