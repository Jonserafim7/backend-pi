import { ApiProperty } from "@nestjs/swagger"
import { StatusPeriodoLetivo, PeriodoLetivo } from "@prisma/client"

/**
 * DTO para resposta de período letivo
 * @class PeriodoLetivoResponseDto
 */
export class PeriodoLetivoResponseDto {
  @ApiProperty({
    description: "ID único do período letivo",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  id: string

  @ApiProperty({
    description: "Ano do período letivo",
    example: 2025,
  })
  ano: number

  @ApiProperty({
    description: "Semestre do período letivo (1 ou 2)",
    example: 1,
  })
  semestre: number

  @ApiProperty({
    description: "Status atual do período letivo",
    enum: StatusPeriodoLetivo,
    example: StatusPeriodoLetivo.INATIVO,
  })
  status: StatusPeriodoLetivo

  @ApiProperty({
    description: "Data de início do período letivo",
    example: "2025-02-10T00:00:00.000Z",
  })
  dataInicio: string

  @ApiProperty({
    description: "Data de fim do período letivo",
    example: "2025-06-30T00:00:00.000Z",
  })
  dataFim: string

  @ApiProperty({
    description: "Data de criação do registro",
    example: "2025-01-15T10:30:00.000Z",
  })
  dataCriacao: string

  @ApiProperty({
    description: "Data da última atualização do registro",
    example: "2025-01-15T10:30:00.000Z",
  })
  dataAtualizacao: string

  constructor(data: PeriodoLetivo) {
    this.id = data.id
    this.ano = data.ano
    this.semestre = data.semestre
    this.status = data.status
    this.dataInicio = data.dataInicio.toISOString()
    this.dataFim = data.dataFim.toISOString()
    this.dataCriacao = data.dataCriacao.toISOString()
    this.dataAtualizacao = data.dataAtualizacao.toISOString()
  }

  /**
   * Converte uma entidade PeriodoLetivo do Prisma para DTO de resposta
   * @param data - Entidade PeriodoLetivo do Prisma
   * @returns Instância de PeriodoLetivoResponseDto
   */
  static fromEntity(data: PeriodoLetivo): PeriodoLetivoResponseDto {
    return new PeriodoLetivoResponseDto(data)
  }
}
