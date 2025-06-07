import { ApiProperty } from "@nestjs/swagger"
import { PropostaHorarioStatus } from "@prisma/client"
import { PropostaHorarioComRelacionamentos } from "../types/proposta-horario-com-relacionamentos.type"

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
    example: {
      id: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
      nome: "Engenharia de Software",
      codigo: "ENG-SOFT",
    },
  })
  curso!: {
    id: string
    nome: string
    codigo: string | null
  }

  /**
   * Dados do período letivo
   */
  @ApiProperty({
    description: "Dados do período letivo",
    example: {
      id: "c3d4e5f6-g7h8-9012-cdef-345678901234",
      ano: 2024,
      semestre: 1,
      dataInicio: "2024-02-01T00:00:00.000Z",
      dataFim: "2024-06-30T23:59:59.999Z",
    },
  })
  periodoLetivo!: {
    id: string
    ano: number
    semestre: number
    dataInicio: Date
    dataFim: Date
  }

  /**
   * Dados do coordenador que submeteu
   */
  @ApiProperty({
    description: "Dados do coordenador que submeteu",
    example: {
      id: "d4e5f6g7-h8i9-0123-defg-456789012345",
      nome: "Prof. João Silva",
      email: "joao.silva@instituicao.edu",
    },
  })
  coordenadorQueSubmeteu!: {
    id: string
    nome: string
    email: string
  }

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
    required: false,
  })
  dataSubmissao!: Date | null

  /**
   * Data de aprovação ou rejeição
   */
  @ApiProperty({
    description: "Data de aprovação ou rejeição",
    example: "2024-01-20T14:15:00.000Z",
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
  })
  dataCriacao!: Date

  /**
   * Data da última atualização
   */
  @ApiProperty({
    description: "Data da última atualização",
    example: "2024-01-15T10:30:00.000Z",
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
