import { ApiProperty } from "@nestjs/swagger"

// Helper type for individual class schedule
class AulaHorarioDto {
  @ApiProperty({
    description: "Horário de início da aula (HH:mm).",
    example: "07:30",
  })
  inicio!: string

  @ApiProperty({
    description: "Horário de término da aula (HH:mm).",
    example: "08:20",
  })
  fim!: string
}

export class ConfiguracaoHorarioDto {
  @ApiProperty({ description: "ID da configuração", example: "uuid-aqui" })
  id!: string

  @ApiProperty({ description: "Duração da aula em minutos.", example: 50 })
  duracaoAulaMinutos!: number

  @ApiProperty({ description: "Número de aulas por turno.", example: 4 })
  numeroAulasPorTurno!: number

  @ApiProperty({
    description: "Horário de início do turno da manhã (HH:mm).",
    example: "07:30",
  })
  inicioTurnoManha!: string

  @ApiProperty({
    description: "Horário de término do turno da manhã calculado (HH:mm).",
    example: "10:50",
  })
  fimTurnoManhaCalculado!: string

  @ApiProperty({
    description: "Horário de início do turno da tarde (HH:mm).",
    example: "13:30",
  })
  inicioTurnoTarde!: string

  @ApiProperty({
    description: "Horário de término do turno da tarde calculado (HH:mm).",
    example: "16:50",
  })
  fimTurnoTardeCalculado!: string

  @ApiProperty({
    description: "Horário de início do turno da noite (HH:mm).",
    example: "19:00",
  })
  inicioTurnoNoite!: string

  @ApiProperty({
    description: "Horário de término do turno da noite calculado (HH:mm).",
    example: "22:20",
  })
  fimTurnoNoiteCalculado!: string

  @ApiProperty({
    description: "Lista detalhada dos horários das aulas do turno da manhã.",
    type: [AulaHorarioDto],
  })
  aulasTurnoManha!: AulaHorarioDto[]

  @ApiProperty({
    description: "Lista detalhada dos horários das aulas do turno da tarde.",
    type: [AulaHorarioDto],
  })
  aulasTurnoTarde!: AulaHorarioDto[]

  @ApiProperty({
    description: "Lista detalhada dos horários das aulas do turno da noite.",
    type: [AulaHorarioDto],
  })
  aulasTurnoNoite!: AulaHorarioDto[]

  @ApiProperty({ description: "Data de criação da configuração" })
  dataCriacao!: Date

  @ApiProperty({ description: "Data da última atualização da configuração" })
  dataAtualizacao!: Date
}
