// src/app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Leaf, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError || !data.session) {
        setError('E-mail ou senha inválidos.')
        setLoading(false)
        return
      }

      // Força navegação completa após sessão estabelecida
      setTimeout(() => {
        window.location.replace('/dashboard')
      }, 500)

    } catch {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1a0f] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a2e1a] via-[#0f1a0f] to-[#0a120a] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-[#4caf50] rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">RastreiO</span>
          </div>
          <p className="text-[#6b8f6b] text-sm">Plataforma de Rastreabilidade EUDR</p>
        </div>

        <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-white mb-1">Entrar na plataforma</h1>
          <p className="text-[#6b8f6b] text-sm mb-6">Acesse sua conta para continuar</p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading && !error && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700/50 rounded-lg text-green-400 text-sm">
              Login realizado! Redirecionando...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-4 py-2.5 text-white placeholder-[#3d5a3d] focus:outline-none focus:border-[#4caf50] transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a0b8a0] mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0f1a0f] border border-[#2d3d2d] rounded-lg px-4 py-2.5 text-white placeholder-[#3d5a3d] focus:outline-none focus:border-[#4caf50] transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4caf50] hover:bg-[#43a047] text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-[#6b8f6b] mt-6">
            Não tem conta?{' '}
            <Link href="/auth/signup" className="text-[#4caf50] hover:text-[#66bb6a] font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
