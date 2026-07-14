# InsureTech CRM

Sistema web de gestión de seguros — proyecto académico (Tópicos Especiales I: Computación en la
Nube) construido con el stack **MEAN** (MongoDB, Express.js, Angular, Node.js).

Especificación completa: [`PRD.md`](./PRD.md).

## ¿Qué hace?

Un CRM funcional para una aseguradora local: administración de usuarios y roles (`guest`, `user`,
`admin`), clientes, pólizas, pagos, siniestros, reclamaciones y notificaciones automáticas, con
autenticación JWT, autorización por rol aplicada tanto en el backend como en el frontend, reglas
de integridad de negocio y un dashboard operativo por rol.

## Estructura del repositorio

```text
insuretech-crm/
├── backend/      # API REST — Node.js, Express, Mongoose
├── frontend/     # SPA — Angular 19 (sin SSR)
├── docs/         # API.md, TESTING.md, DEPLOYMENT.md, DEMO.md
├── PRD.md
└── README.md
```

## Puesta en marcha local

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # configurar MONGO_URI y JWT_SECRET
npm run dev             # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start                # http://localhost:4200
```

### 3. (Opcional) Datos de demostración

```bash
cd backend
npm run seed:demo
```

Credenciales creadas: ver [`docs/DEMO.md`](./docs/DEMO.md).

Detalles de cada paquete en [`backend/README.md`](./backend/README.md) y
[`frontend/README.md`](./frontend/README.md).

## Documentación

- [`docs/API.md`](./docs/API.md) — referencia completa de endpoints.
- [`docs/TESTING.md`](./docs/TESTING.md) — estrategia de pruebas y checklist manual E2E.
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — despliegue en MongoDB Atlas + Render/Railway + Vercel/Netlify.
- [`docs/DEMO.md`](./docs/DEMO.md) — guion de demostración de 10-15 minutos.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 19 (standalone components, signals, Reactive Forms, lazy-loaded routes) |
| Backend | Node.js, Express, Mongoose |
| Base de datos | MongoDB (Atlas en producción) |
| Auth | JWT + bcrypt |
| Validación | express-validator (backend), Reactive Forms (frontend) |
| Seguridad | helmet, express-rate-limit, express-mongo-sanitize, CORS restringido |

## Roles

| Rol | Alcance |
|---|---|
| `guest` | Solo perfil propio; sin acceso operativo (mensaje de "acceso pendiente") |
| `user` (agente) | CRUD de clientes, pólizas, pagos, siniestros, reclamaciones; notificaciones propias |
| `admin` | Todo lo anterior + gestión de usuarios/roles + visibilidad global |

## Estado

Backend: 7 colecciones con CRUD real, reglas de integridad, notificaciones automáticas e
identificadores legibles (`POL-YYYY-000001`, etc.), 23 pruebas automatizadas en verde.

Frontend: los 8 módulos (usuarios, clientes, pólizas, pagos, siniestros, reclamaciones,
notificaciones, dashboard) implementados con búsqueda, filtros, paginación, confirmación de
eliminación y manejo de errores del backend. Flujo completo verificado end-to-end en navegador
real (registro → guest → promoción a agente → cliente → póliza → pago → siniestro →
reclamación → notificaciones → historial → integridad de eliminación).