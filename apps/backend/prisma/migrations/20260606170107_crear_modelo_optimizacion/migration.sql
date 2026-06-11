-- CreateTable
CREATE TABLE "Optimizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coeficienteA" REAL NOT NULL,
    "coeficienteB" REAL NOT NULL,
    "coeficienteC" REAL NOT NULL,
    "precioMinimo" REAL NOT NULL,
    "precioMaximo" REAL NOT NULL,
    "precioOptimo" REAL NOT NULL,
    "gananciaMaxima" REAL NOT NULL,
    "estrategiaSugerida" TEXT NOT NULL,
    "calculadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
