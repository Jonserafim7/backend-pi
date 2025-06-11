/*
  Warnings:

  - A unique constraint covering the columns `[nome,id_curso]` on the table `matrizes_curriculares` will be added. If there are existing duplicate values, this will fail.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_alocacoes_horarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_turma" TEXT NOT NULL,
    "id_proposta_horario" TEXT,
    "dia_da_semana" TEXT NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fim" TEXT NOT NULL,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL,
    CONSTRAINT "alocacoes_horarios_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turmas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "alocacoes_horarios_id_proposta_horario_fkey" FOREIGN KEY ("id_proposta_horario") REFERENCES "propostas_horario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_alocacoes_horarios" ("data_atualizacao", "data_criacao", "dia_da_semana", "hora_fim", "hora_inicio", "id", "id_proposta_horario", "id_turma") SELECT "data_atualizacao", "data_criacao", "dia_da_semana", "hora_fim", "hora_inicio", "id", "id_proposta_horario", "id_turma" FROM "alocacoes_horarios";
DROP TABLE "alocacoes_horarios";
ALTER TABLE "new_alocacoes_horarios" RENAME TO "alocacoes_horarios";
CREATE UNIQUE INDEX "alocacoes_horarios_id_turma_dia_da_semana_hora_inicio_hora_fim_key" ON "alocacoes_horarios"("id_turma", "dia_da_semana", "hora_inicio", "hora_fim");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "matrizes_curriculares_nome_id_curso_key" ON "matrizes_curriculares"("nome", "id_curso");
