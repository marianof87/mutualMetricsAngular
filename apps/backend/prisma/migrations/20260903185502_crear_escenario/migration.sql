-- CreateTable
CREATE TABLE "Escenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "inputs" TEXT NOT NULL,
    "outputs" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Escenario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Escenario_usuarioId_creadoEn_idx" ON "Escenario"("usuarioId", "creadoEn");
