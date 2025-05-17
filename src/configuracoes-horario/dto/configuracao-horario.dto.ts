import { ApiProperty } from "@nestjs/swagger"

export class ConfiguracaoHorarioDto {
  @ApiProperty({ description: "ID da configuração", example: "uuid-aqui" })
  id!: string

  @ApiProperty({ description: "Duração da aula em minutos.", example: 50 })
  duracaoAulaMinutos!: number

  @ApiProperty({
    description: "Quantidade de aulas consecutivas por bloco.",
    example: 2,
  })
  qtdAulasPorBloco!: number

  @ApiProperty({
    description: "Horário de início do turno da manhã (HH:mm).",
    example: "07:30",
  })
  inicioTurnoManha!: string

  @ApiProperty({
    description: "Horário de término do turno da manhã (HH:mm).",
    example: "12:00",
  })
  fimTurnoManha!: string

  @ApiProperty({
    description: "Horário de início do turno da tarde (HH:mm).",
    example: "13:30",
  })
  inicioTurnoTarde!: string

  @ApiProperty({
    description: "Horário de término do turno da tarde (HH:mm).",
    example: "18:00",
  })
  fimTurnoTarde!: string

  @ApiProperty({
    description: "Horário de início do turno da noite (HH:mm).",
    example: "19:00",
  })
  inicioTurnoNoite!: string

  @ApiProperty({
    description: "Horário de término do turno da noite (HH:mm).",
    example: "22:30",
  })
  fimTurnoNoite!: string

  @ApiProperty({ description: "Data de criação da configuração" })
  dataCriacao!: Date

  @ApiProperty({ description: "Data da última atualização da configuração" })
  dataAtualizacao!: Date
}
