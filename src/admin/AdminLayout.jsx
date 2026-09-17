import React, { useEffect, useState } from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { LayoutGrid, LogOut } from "lucide-react";
import { getAdminSession, onAdminAuthChange, adminLogout } from "../lib/api";

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    getAdminSession().then(setSession);
    return onAdminAuthChange(setSession);
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center text-zinc-400 text-sm">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await adminLogout();
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-black text-lg text-black tracking-tight">
            <LayoutGrid size={20} />
            Last Lab · Admin
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-black transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-8" key={location.pathname}>
        {children}
      </main>
    </div>
  );
}
