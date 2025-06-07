import {
  PropostaHorario,
  Curso,
  PeriodoLetivo,
  Usuario,
  AlocacaoHorario,
} from "@prisma/client"

/**
 * Tipo que representa uma proposta de horário com seus relacionamentos
 */
export type PropostaHorarioComRelacionamentos = PropostaHorario & {
  curso: Pick<Curso, "id" | "nome" | "codigo">
  periodoLetivo: Pick<
    PeriodoLetivo,
    "id" | "ano" | "semestre" | "dataInicio" | "dataFim"
  >
  coordenadorQueSubmeteu: Pick<Usuario, "id" | "nome" | "email">
  alocacoesPropostas?: AlocacaoHorario[]
}
