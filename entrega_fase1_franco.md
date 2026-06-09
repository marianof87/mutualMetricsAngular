# MutualMetrics — Documento de Diseño Técnico: Slice 4
## Módulo: Historial & Escenarios de Simulación
**Alumno Responsable:** Franco (@Franco1212)

Para dar cumplimiento a la Definición de Terminado (DoD) y los lineamientos de arquitectura de MutualMetrics, detallo el diseño de ingeniería para el Slice 4, el cual permite a los usuarios autenticados persistir, paginar y re-ejecutar simulaciones matemáticas (cuadráticas y optimización de precios).

### 1. Modelado de Datos y Persistencia (Prisma + SQLite)
He diseñado la estructura de la entidad `Escenario` en el archivo compartido `apps/backend/prisma/schema.prisma`. El modelo cuenta con una relación de clave foránea (FK) directa hacia la tabla de usuarios administrada por el Slice 1 (@Nubiru):

```prisma
model Escenario {
  id           String   @id @default(uuid())
  nombre       String
  tipo         String   // "CUADRATICA" o "PRICING"
  parametros   String   // JSON String con los inputs (a, b, c o curvas de demanda)
  resultado    String   // JSON String con los vértices, raíces o break-even optimizados
  creadoEn     DateTime @default(now())
  usuarioId    String
  usuario      Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  @@index([usuarioId])
}