-- CreateTable
CREATE TABLE "SimulacionActuarial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT,
    "coeficienteBTipo" TEXT NOT NULL,
    "nSimulaciones" INTEGER NOT NULL,
    "nivelConfianza" REAL NOT NULL,
    "precioOptimoMedia" REAL NOT NULL,
    "precioOptimoP5" REAL NOT NULL,
    "precioOptimoP95" REAL NOT NULL,
    "pisoSolvencia" REAL,
    "probPerdidaOptimo" REAL NOT NULL,
    "probPerdidaActual" REAL,
    "simuladoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimulacionActuarial_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
