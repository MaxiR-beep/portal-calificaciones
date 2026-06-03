# Portal de Calificaciones — Práctica Profesionalizante II

## Stack
- **Next.js 16** + **React 19** — framework
- **TypeScript** — lenguaje
- **Tailwind CSS v4** — estilos
- **Supabase** — autenticación + base de datos PostgreSQL

## Páginas

| Ruta | Acceso | Qué hace |
|---|---|---|
| `/` | Público | Login con email y contraseña |
| `/registro` | Público | Crear cuenta (nombre, email, legajo, rol) |
| `/recuperar` | Público | Solicitar reset de contraseña por email |
| `/actualizar-password` | Público | Cambiar contraseña desde el link del email |
| `/alumno` | Requiere sesión (rol alumno) | Ver calificaciones y devoluciones |
| `/docente` | Requiere sesión (rol docente) | Cargar/editar/eliminar calificaciones de alumnos |

## Base de datos (Supabase)

### `profiles`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK |
| user_id | uuid (FK → auth.users) | ID del usuario de autenticación |
| nombre | text | Nombre |
| apellido | text | Apellido |
| legajo | text | Número de legajo |
| rol | text | 'alumno' o 'docente' |

### `materias`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK |
| nombre | text | Nombre de la materia |

### `calificaciones`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK |
| alumno_id | uuid (FK → profiles) | Alumno |
| materia_id | uuid (FK → materias) | Materia |
| actividad | text | Nombre de la actividad (TP, Parcial, etc.) |
| nota | numeric (0-10) | Calificación |
| observacion | text | Devolución del docente |
| periodo | text | Ej: "2025-1" |
| updated_at | timestamp | Última modificación |

## Flujo de la app
1. El usuario se registra o lo registran en Supabase
2. Inicia sesión → el sistema detecta su rol y redirige
3. **Docente**: ve todos los alumnos, carga actividades con nota y devolución
4. **Alumno**: ve sus calificaciones y devoluciones

## Funcionalidades clave
- **Login** con Supabase Auth (email/contraseña)
- **Registro** con creación automática del perfil
- **Recuperación de contraseña** por email
- **CRUD de calificaciones** desde el panel docente
- **Multi-actividad** por alumno (varias notas/devouciónes)
- **Middleware** que protege rutas de alumnos y docentes

## Variables de entorno
```
NEXT_PUBLIC_SUPABASE_URL=<url de tu proyecto Supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key de Supabase>
```

## Comandos principales
```bash
npm install      # instalar dependencias
npm run dev      # desarrollo local (http://localhost:3000)
npm run build    # compilar para producción
vercel --prod    # deploy en Vercel
```
