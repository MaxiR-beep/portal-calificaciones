'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AlumnoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [perfil, setPerfil] = useState<any>(null)
  const [calificaciones, setCalificaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('session:', session?.user?.id)

      if (!session) {
        router.push('/')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      console.log('profile:', profile)
      console.log('profileError:', profileError)

      if (!profile) {
        router.push('/')
        return
      }

      setPerfil(profile)

      const { data: notas } = await supabase
        .from('calificaciones')
        .select('*, materias(nombre)')
        .eq('alumno_id', profile.id)

      setCalificaciones(notas || [])
      setLoading(false)
    }
    cargarDatos()
  }, [])

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Cargando...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              Hola, {perfil.nombre} {perfil.apellido}
            </h1>
            <p className="text-sm text-gray-500">Legajo: {perfil.legajo}</p>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Mis calificaciones</h2>
          {calificaciones.length === 0 ? (
            <p className="text-sm text-gray-400">No tenés calificaciones cargadas todavía.</p>
          ) : (
            <div className="space-y-4">
              {calificaciones.map((c) => (
                <div key={c.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{c.materias.nombre}</span>
                    <span className="text-sm font-semibold text-indigo-600">{c.nota}/10</span>
                  </div>
                  {c.observacion && (
                    <p className="text-sm text-gray-500 mt-1">{c.observacion}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Período: {c.periodo}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}