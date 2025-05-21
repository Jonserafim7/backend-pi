import { ApiProperty } from "@nestjs/swagger"

/**
 * Tipo para os dados do período letivo do banco de dados
 */
interface PeriodoLetivoEntity {
  id: string
  ano: number
  semestre: number
  ativo: boolean
  dataInicio?: Date | null
  dataFim?: Date | null
  dataCriacao: Date
  dataAtualizacao: Date
}

/**
 * DTO para padronização das respostas relacionadas a períodos letivos
 * @class PeriodoLetivoResponseDto
 */
export class PeriodoLetivoResponseDto {
  @ApiProperty({
    description: "Identificador único do período letivo",
    example: "c056ca62-d1aa-4b5a-9c7f-583d949aa793",
  })
  id!: string

  @ApiProperty({
    description: "Ano do período letivo",
    example: 2025,
  })
  ano!: number

  @ApiProperty({
    description: "Semestre do período letivo (1 ou 2)",
    example: 1,
  })
  semestre!: number

  @ApiProperty({
    description: "Indica se o período está ativo para ofertas de disciplinas",
    example: true,
  })
  ativo!: boolean

  @ApiProperty({
    description: "Data de início do período letivo",
    example: "2025-02-10T00:00:00.000Z",
    required: false,
  })
  dataInicio?: Date

  @ApiProperty({
    description: "Data de fim do período letivo",
    example: "2025-06-30T00:00:00.000Z",
    required: false,
  })
  dataFim?: Date

  @ApiProperty({
    description: "Data e hora de criação do registro",
    example: "2025-01-15T10:30:00.000Z",
  })
  dataCriacao!: Date

  @ApiProperty({
    description: "Data e hora da última atualização do registro",
    example: "2025-01-15T10:30:00.000Z",
  })
  dataAtualizacao!: Date

  /**
   * Cria uma string representando o período letivo no formato "SEMESTRE/ANO"
   * @example "1/2025" para o primeiro semestre de 2025
   */
  @ApiProperty({
    description: "Representação do período letivo no formato SEMESTRE/ANO",
    example: "1/2025",
  })
  get periodoFormatado(): string {
    return `${this.semestre}/${this.ano}`
  }

  /**
   * Status legível do período letivo
   * @example "Ativo" ou "Inativo"
   */
  @ApiProperty({
    description: "Status do período letivo em formato legível",
    example: "Ativo",
  })
  get statusFormatado(): string {
    return this.ativo ? "Ativo" : "Inativo"
  }

  /**
   * Converte um objeto PeriodoLetivo do Prisma para PeriodoLetivoResponseDto
   * @param data Dados do período letivo do banco
   * @returns PeriodoLetivoResponseDto com os dados formatados
   */
  static fromEntity(data: PeriodoLetivoEntity): PeriodoLetivoResponseDto {
    const dto = new PeriodoLetivoResponseDto()
    dto.id = data.id
    dto.ano = data.ano
    dto.semestre = data.semestre
    dto.ativo = data.ativo
    dto.dataInicio = data.dataInicio ?? undefined
    dto.dataFim = data.dataFim ?? undefined
    dto.dataCriacao = data.dataCriacao
    dto.dataAtualizacao = data.dataAtualizacao
    return dto
  }
}
