/*
  Warnings:

  - Added the required column `status` to the `periodos_letivos` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_periodos_letivos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ano" INTEGER NOT NULL,
    "semestre" INTEGER NOT NULL,
    "data_inicio" DATETIME NOT NULL,
    "data_fim" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL
);
INSERT INTO "new_periodos_letivos" ("ano", "data_atualizacao", "data_criacao", "data_fim", "data_inicio", "id", "semestre") SELECT "ano", "data_atualizacao", "data_criacao", "data_fim", "data_inicio", "id", "semestre" FROM "periodos_letivos";
DROP TABLE "periodos_letivos";
ALTER TABLE "new_periodos_letivos" RENAME TO "periodos_letivos";
CREATE UNIQUE INDEX "periodos_letivos_ano_semestre_key" ON "periodos_letivos"("ano", "semestre");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
