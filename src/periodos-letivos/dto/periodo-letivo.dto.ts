import { ApiProperty } from "@nestjs/swagger"

export class PeriodoLetivoDto {
  @ApiProperty({
    description: "ID do período letivo (UUID)",
    example: "b1c2d3e4-f5a6-7890-1234-567890abcdef",
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
    type: Date,
    nullable: true,
  })
  dataInicio!: Date | null

  @ApiProperty({
    description: "Data de fim do período letivo",
    example: "2024-06-30T00:00:00.000Z",
    type: Date,
    nullable: true,
  })
  dataFim!: Date | null

  @ApiProperty({
    description: "Data de criação do período letivo",
    example: "2024-01-15T10:00:00.000Z",
    type: Date,
  })
  createdAt!: Date

  @ApiProperty({
    description: "Data da última atualização do período letivo",
    example: "2024-01-20T11:00:00.000Z",
    type: Date,
  })
  updatedAt!: Date
}
