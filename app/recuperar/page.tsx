'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setEnviado(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Recuperar contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ingresá tu email y te enviaremos un link para restablecerla
          </p>
        </div>

        {enviado ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-green-600">
              Revisá tu casilla de email. Si existe una cuenta con ese correo, vas a recibir un link
              para restablecer tu contraseña.
            </p>
            <Link
              href="/"
              className="inline-block text-sm text-indigo-600 hover:text-indigo-700"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="tu@email.com"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </main>
  )
}
