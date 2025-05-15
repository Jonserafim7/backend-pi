-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hash_senha" TEXT NOT NULL,
    "papel" TEXT NOT NULL,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "id_coordenador" TEXT NOT NULL,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL,
    CONSTRAINT "cursos_id_coordenador_fkey" FOREIGN KEY ("id_coordenador") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "configuracoes_horario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duracao_aula_minutos" INTEGER NOT NULL,
    "qtd_aulas_por_bloco" INTEGER NOT NULL,
    "inicio_turno_manha" TEXT NOT NULL,
    "fim_turno_manha" TEXT NOT NULL,
    "inicio_turno_tarde" TEXT NOT NULL,
    "fim_turno_tarde" TEXT NOT NULL,
    "inicio_turno_noite" TEXT NOT NULL,
    "fim_turno_noite" TEXT NOT NULL,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "periodos_letivos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ano" INTEGER NOT NULL,
    "semestre" INTEGER NOT NULL,
    "data_inicio" DATETIME,
    "data_fim" DATETIME,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "matrizes_curriculares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "id_curso" TEXT NOT NULL,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL,
    CONSTRAINT "matrizes_curriculares_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "carga_horaria" INTEGER NOT NULL,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "matrizes_disciplinas" (
    "id_matriz_curricular" TEXT NOT NULL,
    "id_disciplina" TEXT NOT NULL,
    "numero_periodo" INTEGER,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id_matriz_curricular", "id_disciplina"),
    CONSTRAINT "matrizes_disciplinas_id_matriz_curricular_fkey" FOREIGN KEY ("id_matriz_curricular") REFERENCES "matrizes_curriculares" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "matrizes_disciplinas_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplinas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disponibilidades_professor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_usuario_professor" TEXT NOT NULL,
    "id_periodo_letivo" TEXT NOT NULL,
    "dia_da_semana" TEXT NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fim" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL,
    CONSTRAINT "disponibilidades_professor_id_usuario_professor_fkey" FOREIGN KEY ("id_usuario_professor") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "disponibilidades_professor_id_periodo_letivo_fkey" FOREIGN KEY ("id_periodo_letivo") REFERENCES "periodos_letivos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disciplinas_ofertadas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_disciplina" TEXT NOT NULL,
    "id_periodo_letivo" TEXT NOT NULL,
    "quantidade_turmas" INTEGER NOT NULL,
    "id_coordenador" TEXT NOT NULL,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL,
    CONSTRAINT "disciplinas_ofertadas_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplinas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disciplinas_ofertadas_id_periodo_letivo_fkey" FOREIGN KEY ("id_periodo_letivo") REFERENCES "periodos_letivos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disciplinas_ofertadas_id_coordenador_fkey" FOREIGN KEY ("id_coordenador") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_disciplina_ofertada" TEXT NOT NULL,
    "codigo_da_turma" TEXT NOT NULL,
    "id_usuario_professor" TEXT,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL,
    CONSTRAINT "turmas_id_disciplina_ofertada_fkey" FOREIGN KEY ("id_disciplina_ofertada") REFERENCES "disciplinas_ofertadas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "turmas_id_usuario_professor_fkey" FOREIGN KEY ("id_usuario_professor") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alocacoes_horarios" (
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

-- CreateTable
CREATE TABLE "propostas_horario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_curso" TEXT NOT NULL,
    "id_periodo_letivo" TEXT NOT NULL,
    "id_coordenador_submissao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "data_submissao" DATETIME,
    "data_aprovacao_rejeicao" DATETIME,
    "justificativa_rejeicao" TEXT,
    "observacoes_coordenador" TEXT,
    "observacoes_diretor" TEXT,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL,
    CONSTRAINT "propostas_horario_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "propostas_horario_id_periodo_letivo_fkey" FOREIGN KEY ("id_periodo_letivo") REFERENCES "periodos_letivos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "propostas_horario_id_coordenador_submissao_fkey" FOREIGN KEY ("id_coordenador_submissao") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_codigo_key" ON "cursos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_letivos_ano_semestre_key" ON "periodos_letivos"("ano", "semestre");

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_codigo_key" ON "disciplinas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "disponibilidades_professor_id_usuario_professor_id_periodo_letivo_dia_da_semana_hora_inicio_hora_fim_key" ON "disponibilidades_professor"("id_usuario_professor", "id_periodo_letivo", "dia_da_semana", "hora_inicio", "hora_fim");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_id_disciplina_ofertada_codigo_da_turma_key" ON "turmas"("id_disciplina_ofertada", "codigo_da_turma");

-- CreateIndex
CREATE UNIQUE INDEX "alocacoes_horarios_id_turma_dia_da_semana_hora_inicio_hora_fim_key" ON "alocacoes_horarios"("id_turma", "dia_da_semana", "hora_inicio", "hora_fim");
