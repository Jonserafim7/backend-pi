import { ApiProperty } from "@nestjs/swagger"
import { DiaSemana, StatusDisponibilidade } from "@prisma/client"

/**
 * DTO simplificado para dados do usuário professor
 */
export class ProfessorSimplificadoDto {
  @ApiProperty({
    description: "ID do professor",
    example: "c1f2e3a4-b5c6-4d7e-8f9a-123456789abc",
  })
  id!: string

  @ApiProperty({
    description: "Nome do professor",
    example: "João da Silva",
  })
  nome!: string

  @ApiProperty({
    description: "Email do professor",
    example: "joao.silva@escola.edu",
  })
  email!: string
}

/**
 * DTO simplificado para dados do período letivo
 */
export class PeriodoLetivoSimplificadoDto {
  @ApiProperty({
    description: "ID do período letivo",
    example: "d2e3f4b5-c6d7-4e8f-9a0b-234567890def",
  })
  id!: string

  @ApiProperty({
    description: "Ano do período",
    example: 2025,
  })
  ano!: number

  @ApiProperty({
    description: "Semestre do período",
    example: 1,
  })
  semestre!: number

  @ApiProperty({
    description: "Status do período letivo",
    example: "ATIVO",
  })
  status!: string
}

/**
 * DTO de resposta completo para disponibilidade de professor
 */
export class DisponibilidadeResponseDto {
  @ApiProperty({
    description: "ID único da disponibilidade",
    example: "a1b2c3d4-e5f6-4g7h-8i9j-123456789abc",
  })
  id!: string

  @ApiProperty({
    description: "Dia da semana",
    enum: DiaSemana,
    example: DiaSemana.SEGUNDA,
  })
  diaDaSemana!: DiaSemana

  @ApiProperty({
    description: "Horário de início (formato HH:mm)",
    example: "07:30",
  })
  horaInicio!: string

  @ApiProperty({
    description: "Horário de fim (formato HH:mm)",
    example: "12:00",
  })
  horaFim!: string

  @ApiProperty({
    description: "Status da disponibilidade",
    enum: StatusDisponibilidade,
    example: StatusDisponibilidade.DISPONIVEL,
  })
  status!: StatusDisponibilidade

  @ApiProperty({
    description: "Data de criação",
    example: "2025-01-15T10:30:00.000Z",
  })
  dataCriacao!: Date

  @ApiProperty({
    description: "Data da última atualização",
    example: "2025-01-15T10:30:00.000Z",
  })
  dataAtualizacao!: Date

  @ApiProperty({
    description: "Dados do professor",
    type: ProfessorSimplificadoDto,
  })
  usuarioProfessor!: ProfessorSimplificadoDto

  @ApiProperty({
    description: "Dados do período letivo",
    type: PeriodoLetivoSimplificadoDto,
  })
  periodoLetivo!: PeriodoLetivoSimplificadoDto
}
