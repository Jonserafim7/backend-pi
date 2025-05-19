import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsString, Matches, Min, IsOptional } from "class-validator"

export class UpsertConfiguracaoHorarioDto {
  @ApiProperty({
    description: "Duração da aula em minutos.",
    example: 50,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "A duração da aula deve ser um número inteiro." })
  @Min(1, { message: "A duração da aula deve ser de no mínimo 1 minuto." })
  duracaoAulaMinutos?: number

  @ApiProperty({
    description: "Número de aulas por turno.",
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "O número de aulas por turno deve ser um número inteiro." })
  @Min(1, { message: "O número de aulas por turno deve ser no mínimo 1." })
  numeroAulasPorTurno?: number

  @ApiProperty({
    description: "Horário de início do turno da manhã (HH:mm).",
    example: "07:30",
    required: false,
  })
  @IsOptional()
  @IsString({
    message: "O horário de início do turno da manhã deve ser uma string.",
  })
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "O horário de início do turno da manhã deve estar no formato HH:mm.",
  })
  inicioTurnoManha?: string

  @ApiProperty({
    description: "Horário de início do turno da tarde (HH:mm).",
    example: "13:30",
    required: false,
  })
  @IsOptional()
  @IsString({
    message: "O horário de início do turno da tarde deve ser uma string.",
  })
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "O horário de início do turno da tarde deve estar no formato HH:mm.",
  })
  inicioTurnoTarde?: string

  @ApiProperty({
    description: "Horário de início do turno da noite (HH:mm).",
    example: "19:00",
    required: false,
  })
  @IsOptional()
  @IsString({
    message: "O horário de início do turno da noite deve ser uma string.",
  })
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "O horário de início do turno da noite deve estar no formato HH:mm.",
  })
  inicioTurnoNoite?: string
}
