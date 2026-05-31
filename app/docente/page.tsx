'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DocentePage() {
  const router = useRouter()
  const supabase = createClient()
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [materia, setMateria] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    async function cargarDatos() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('user_id', session.user.id)
        .single()

      if (!profile || profile.rol !== 'docente') { router.push('/'); return }

      const { data: mat } = await supabase
        .from('materias')
        .select('*')
        .single()

      setMateria(mat)

      const { data: perfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('rol', 'alumno')

      if (!perfiles) { setLoading(false); return }

      const { data: califs } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('materia_id', mat.id)

      const alumnosConNotas = perfiles.map(p => {
        const calif = califs?.find(c => c.alumno_id === p.id)
        return {
          ...p,
          calif_id: calif?.id || null,
          nota: calif?.nota?.toString() || '',
          observacion: calif?.observacion || '',
          periodo: calif?.periodo || '2025-1',
        }
      })

      setAlumnos(alumnosConNotas)
      setLoading(false)
    }
    cargarDatos()
  }, [])

  async function guardarCalificacion(alumno: any) {
    setGuardando(true)
    setMensaje('')

    if (alumno.calif_id) {
      await supabase
        .from('calificaciones')
        .update({
          nota: parseFloat(alumno.nota),
          observacion: alumno.observacion,
          periodo: alumno.periodo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alumno.calif_id)
    } else {
      const { data } = await supabase
        .from('calificaciones')
        .insert({
          alumno_id: alumno.id,
          materia_id: materia.id,
          nota: parseFloat(alumno.nota),
          observacion: alumno.observacion,
          periodo: alumno.periodo,
        })
        .select()
        .single()

      setAlumnos(prev => prev.map(a =>
        a.id === alumno.id ? { ...a, calif_id: data?.id } : a
      ))
    }

    setMensaje('Guardado correctamente')
    setTimeout(() => setMensaje(''), 3000)
    setGuardando(false)
  }

  function actualizarAlumno(id: string, campo: string, valor: string) {
    setAlumnos(prev => prev.map(a =>
      a.id === id ? { ...a, [campo]: valor } : a
    ))
  }

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
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-medium text-gray-900">Panel docente</h1>
            <p className="text-sm text-gray-500">{materia?.nombre}</p>
          </div>
          <div className="flex items-center gap-3">
            {mensaje && <span className="text-sm text-green-600">{mensaje}</span>}
            <button
              onClick={cerrarSesion}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {alumnos.map(alumno => (
            <div key={alumno.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {alumno.nombre} {alumno.apellido}
                  </p>
                  <p className="text-xs text-gray-400">Legajo: {alumno.legajo}</p>
                </div>
                <button
                  onClick={() => guardarCalificacion(alumno)}
                  disabled={guardando}
                  className="text-sm bg-indigo-600 text-white rounded-lg px-4 py-1.5 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Guardar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nota (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={alumno.nota}
                    onChange={e => actualizarAlumno(alumno.id, 'nota', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Período</label>
                  <input
                    type="text"
                    value={alumno.periodo}
                    onChange={e => actualizarAlumno(alumno.id, 'periodo', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="2025-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Observación</label>
                <textarea
                  value={alumno.observacion}
                  onChange={e => actualizarAlumno(alumno.id, 'observacion', e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Escribí una observación para el alumno..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}