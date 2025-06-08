import { ApiProperty } from "@nestjs/swagger"
import { PropostaHorarioStatus } from "@prisma/client"
import { PropostaHorarioComRelacionamentos } from "../types/proposta-horario-com-relacionamentos.type"

/**
 * DTO para dados do curso na resposta da proposta
 */
export class CursoPropostaDto {
  @ApiProperty({
    description: "ID do curso",
    example: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  })
  id!: string

  @ApiProperty({
    description: "Nome do curso",
    example: "Engenharia de Software",
  })
  nome!: string

  @ApiProperty({
    description: "Código do curso",
    example: "ENG-SOFT",
    required: false,
  })
  codigo!: string | null
}

/**
 * DTO para dados do período letivo na resposta da proposta
 */
export class PeriodoLetivoPropostaDto {
  @ApiProperty({
    description: "ID do período letivo",
    example: "c3d4e5f6-g7h8-9012-cdef-345678901234",
  })
  id!: string

  @ApiProperty({
    description: "Ano do período letivo",
    example: 2024,
  })
  ano!: number

  @ApiProperty({
    description: "Semestre do período letivo",
    example: 1,
  })
  semestre!: number

  @ApiProperty({
    description: "Data de início do período letivo",
    example: "2024-02-01T00:00:00.000Z",
    type: "string",
    format: "date-time",
  })
  dataInicio!: Date

  @ApiProperty({
    description: "Data de fim do período letivo",
    example: "2024-06-30T23:59:59.999Z",
    type: "string",
    format: "date-time",
  })
  dataFim!: Date
}

/**
 * DTO para dados do coordenador na resposta da proposta
 */
export class CoordenadorPropostaDto {
  @ApiProperty({
    description: "ID do coordenador",
    example: "d4e5f6g7-h8i9-0123-defg-456789012345",
  })
  id!: string

  @ApiProperty({
    description: "Nome do coordenador",
    example: "Prof. João Silva",
  })
  nome!: string

  @ApiProperty({
    description: "Email do coordenador",
    example: "joao.silva@instituicao.edu",
  })
  email!: string
}

/**
 * DTO de resposta para proposta de horário
 */
export class PropostaHorarioResponseDto {
  /**
   * ID único da proposta
   */
  @ApiProperty({
    description: "ID único da proposta",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  id!: string

  /**
   * Dados do curso
   */
  @ApiProperty({
    description: "Dados do curso",
    type: CursoPropostaDto,
  })
  curso!: CursoPropostaDto

  /**
   * Dados do período letivo
   */
  @ApiProperty({
    description: "Dados do período letivo",
    type: PeriodoLetivoPropostaDto,
  })
  periodoLetivo!: PeriodoLetivoPropostaDto

  /**
   * Dados do coordenador que submeteu
   */
  @ApiProperty({
    description: "Dados do coordenador que submeteu",
    type: CoordenadorPropostaDto,
  })
  coordenadorQueSubmeteu!: CoordenadorPropostaDto

  /**
   * Status atual da proposta
   */
  @ApiProperty({
    description: "Status atual da proposta",
    enum: PropostaHorarioStatus,
    example: PropostaHorarioStatus.DRAFT,
  })
  status!: PropostaHorarioStatus

  /**
   * Data de submissão da proposta
   */
  @ApiProperty({
    description: "Data de submissão da proposta",
    example: "2024-01-15T10:30:00.000Z",
    type: "string",
    format: "date-time",
    required: false,
  })
  dataSubmissao!: Date | null

  /**
   * Data de aprovação ou rejeição
   */
  @ApiProperty({
    description: "Data de aprovação ou rejeição",
    example: "2024-01-20T14:15:00.000Z",
    type: "string",
    format: "date-time",
    required: false,
  })
  dataAprovacaoRejeicao!: Date | null

  /**
   * Justificativa em caso de rejeição
   */
  @ApiProperty({
    description: "Justificativa em caso de rejeição",
    example: "Conflitos de horário identificados",
    required: false,
  })
  justificativaRejeicao!: string | null

  /**
   * Observações do coordenador
   */
  @ApiProperty({
    description: "Observações do coordenador",
    example: "Proposta considerando disponibilidade dos professores",
    required: false,
  })
  observacoesCoordenador!: string | null

  /**
   * Observações do diretor
   */
  @ApiProperty({
    description: "Observações do diretor",
    example: "Aprovada com ressalvas",
    required: false,
  })
  observacoesDiretor!: string | null

  /**
   * Quantidade de alocações na proposta
   */
  @ApiProperty({
    description: "Quantidade de alocações na proposta",
    example: 15,
  })
  quantidadeAlocacoes!: number

  /**
   * Data de criação
   */
  @ApiProperty({
    description: "Data de criação",
    example: "2024-01-10T08:00:00.000Z",
    type: "string",
    format: "date-time",
  })
  dataCriacao!: Date

  /**
   * Data da última atualização
   */
  @ApiProperty({
    description: "Data da última atualização",
    example: "2024-01-15T10:30:00.000Z",
    type: "string",
    format: "date-time",
  })
  dataAtualizacao!: Date

  constructor(proposta: PropostaHorarioComRelacionamentos) {
    this.id = proposta.id
    this.curso = {
      id: proposta.curso.id,
      nome: proposta.curso.nome,
      codigo: proposta.curso.codigo,
    }
    this.periodoLetivo = {
      id: proposta.periodoLetivo.id,
      ano: proposta.periodoLetivo.ano,
      semestre: proposta.periodoLetivo.semestre,
      dataInicio: proposta.periodoLetivo.dataInicio,
      dataFim: proposta.periodoLetivo.dataFim,
    }
    this.coordenadorQueSubmeteu = {
      id: proposta.coordenadorQueSubmeteu.id,
      nome: proposta.coordenadorQueSubmeteu.nome,
      email: proposta.coordenadorQueSubmeteu.email,
    }
    this.status = proposta.status
    this.dataSubmissao = proposta.dataSubmissao
    this.dataAprovacaoRejeicao = proposta.dataAprovacaoRejeicao
    this.justificativaRejeicao = proposta.justificativaRejeicao
    this.observacoesCoordenador = proposta.observacoesCoordenador
    this.observacoesDiretor = proposta.observacoesDiretor
    this.quantidadeAlocacoes = proposta.alocacoesPropostas?.length || 0
    this.dataCriacao = proposta.dataCriacao
    this.dataAtualizacao = proposta.dataAtualizacao
  }
}
