import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { adminLogin, getAdminSession } from "../lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAdminSession().then((session) => {
      if (session) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mx-auto mb-4">
            <Lock size={20} />
          </div>
          <h1 className="text-2xl font-black text-black tracking-tight">Last Lab · Admin</h1>
          <p className="text-sm text-zinc-500 mt-1">Área interna — calendários de conteúdo</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 sm:p-8 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              autoComplete="username"
              className="w-full px-4 py-3 rounded-[12px] border border-zinc-300 text-base focus:outline-none focus:ring-2 focus:ring-black/80"
              placeholder="voce@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-[12px] border border-zinc-300 text-base focus:outline-none focus:ring-2 focus:ring-black/80"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[12px] bg-black text-white font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
