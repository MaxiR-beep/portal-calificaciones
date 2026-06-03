'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Calificacion {
  id?: number
  actividad: string
  nota: string
  observacion: string
  periodo: string
}

interface Alumno {
  id: string
  nombre: string
  apellido: string
  legajo: string
  calificaciones: Calificacion[]
}

export default function DocentePage() {
  const router = useRouter()
  const supabase = createClient()
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [materia, setMateria] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState<string | null>(null)
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

      if (!perfiles) { setCargando(false); return }

      const { data: califs } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('materia_id', mat.id)

      const alumnosConNotas: Alumno[] = perfiles.map(p => {
        const notasAlumno = califs?.filter(c => c.alumno_id === p.id) || []
        return {
          id: p.id,
          nombre: p.nombre,
          apellido: p.apellido,
          legajo: p.legajo,
          calificaciones: notasAlumno.length > 0
            ? notasAlumno.map(c => ({
                id: c.id,
                actividad: c.actividad || '',
                nota: c.nota?.toString() || '',
                observacion: c.observacion || '',
                periodo: c.periodo || '2025-1',
              }))
            : [{ actividad: '', nota: '', observacion: '', periodo: '2025-1' }],
        }
      })

      setAlumnos(alumnosConNotas)
      setCargando(false)
    }
    cargarDatos()
  }, [])

  function agregarActividad(alumnoId: string) {
    setAlumnos(prev => prev.map(a =>
      a.id === alumnoId
        ? { ...a, calificaciones: [...a.calificaciones, { actividad: '', nota: '', observacion: '', periodo: '2025-1' }] }
        : a
    ))
  }

  function actualizarCalif(alumnoId: string, idx: number, campo: string, valor: string) {
    setAlumnos(prev => prev.map(a =>
      a.id === alumnoId
        ? {
            ...a,
            calificaciones: a.calificaciones.map((c, i) =>
              i === idx ? { ...c, [campo]: valor } : c
            )
          }
        : a
    ))
  }

  async function guardarCalificacion(alumnoId: string, idx: number) {
    const calif = alumnos.find(a => a.id === alumnoId)?.calificaciones[idx]
    if (!calif) return
    setGuardando(`${alumnoId}-${idx}`)
    setMensaje('')

    if (calif.id) {
      await supabase
        .from('calificaciones')
        .update({
          actividad: calif.actividad,
          nota: parseFloat(calif.nota),
          observacion: calif.observacion,
          periodo: calif.periodo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', calif.id)
    } else {
      const { data } = await supabase
        .from('calificaciones')
        .insert({
          alumno_id: alumnoId,
          materia_id: materia.id,
          actividad: calif.actividad,
          nota: parseFloat(calif.nota),
          observacion: calif.observacion,
          periodo: calif.periodo,
        })
        .select()
        .single()

      if (data) {
        setAlumnos(prev => prev.map(a =>
          a.id === alumnoId
            ? {
                ...a,
                calificaciones: a.calificaciones.map((c, i) =>
                  i === idx ? { ...c, id: data.id } : c
                )
              }
            : a
        ))
      }
    }

    setMensaje('Guardado correctamente')
    setTimeout(() => setMensaje(''), 3000)
    setGuardando(null)
  }

  async function eliminarCalificacion(alumnoId: string, idx: number) {
    const calif = alumnos.find(a => a.id === alumnoId)?.calificaciones[idx]
    if (!calif?.id) return

    await supabase.from('calificaciones').delete().eq('id', calif.id)

    setAlumnos(prev => prev.map(a =>
      a.id === alumnoId
        ? { ...a, calificaciones: a.calificaciones.filter((_, i) => i !== idx) }
        : a
    ))

    setMensaje('Eliminado correctamente')
    setTimeout(() => setMensaje(''), 3000)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (cargando) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Cargando...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
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

        <div className="space-y-6">
          {alumnos.map(alumno => (
            <div key={alumno.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {alumno.nombre} {alumno.apellido}
                  </p>
                  <p className="text-xs text-gray-400">Legajo: {alumno.legajo}</p>
                </div>
                <button
                  onClick={() => agregarActividad(alumno.id)}
                  className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition-colors"
                >
                  + Agregar actividad
                </button>
              </div>

              <div className="space-y-3">
                {alumno.calificaciones.map((calif, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Actividad</label>
                        <input
                          type="text"
                          value={calif.actividad}
                          onChange={e => actualizarCalif(alumno.id, idx, 'actividad', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="TP 1, Parcial, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nota (0-10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={calif.nota}
                          onChange={e => actualizarCalif(alumno.id, idx, 'nota', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Período</label>
                        <input
                          type="text"
                          value={calif.periodo}
                          onChange={e => actualizarCalif(alumno.id, idx, 'periodo', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="2025-1"
                        />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs text-gray-500 mb-1">Observación</label>
                      <textarea
                        value={calif.observacion}
                        onChange={e => actualizarCalif(alumno.id, idx, 'observacion', e.target.value)}
                        rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        placeholder="Devolución de la actividad..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => eliminarCalificacion(alumno.id, idx)}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={() => guardarCalificacion(alumno.id, idx)}
                        disabled={guardando === `${alumno.id}-${idx}`}
                        className="text-xs bg-indigo-600 text-white rounded-lg px-4 py-1.5 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {guardando === `${alumno.id}-${idx}` ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
