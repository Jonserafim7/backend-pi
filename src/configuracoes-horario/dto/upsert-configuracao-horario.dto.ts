import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, IsString, Matches, Min } from "class-validator"

export class UpsertConfiguracaoHorarioDto {
  @ApiProperty({
    description: "Duração da aula em minutos.",
    example: 50,
  })
  @IsInt({ message: "A duração da aula deve ser um número inteiro." })
  @Min(1, { message: "A duração da aula deve ser de no mínimo 1 minuto." })
  @IsNotEmpty({ message: "A duração da aula não pode estar vazia." })
  duracaoAulaMinutos!: number

  @ApiProperty({
    description: "Quantidade de aulas consecutivas por bloco.",
    example: 2,
  })
  @IsInt({
    message: "A quantidade de aulas por bloco deve ser um número inteiro.",
  })
  @Min(1, { message: "A quantidade de aulas por bloco deve ser no mínimo 1." })
  @IsNotEmpty({
    message: "A quantidade de aulas por bloco não pode estar vazia.",
  })
  qtdAulasPorBloco!: number

  @ApiProperty({
    description: "Horário de início do turno da manhã (HH:mm).",
    example: "07:30",
  })
  @IsString({
    message: "O horário de início do turno da manhã deve ser uma string.",
  })
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "O horário de início do turno da manhã deve estar no formato HH:mm.",
  })
  @IsNotEmpty({
    message: "O horário de início do turno da manhã não pode estar vazio.",
  })
  inicioTurnoManha!: string

  @ApiProperty({
    description: "Horário de término do turno da manhã (HH:mm).",
    example: "12:00",
  })
  @IsString({
    message: "O horário de término do turno da manhã deve ser uma string.",
  })
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message:
      "O horário de término do turno da manhã deve estar no formato HH:mm.",
  })
  @IsNotEmpty({
    message: "O horário de término do turno da manhã não pode estar vazio.",
  })
  fimTurnoManha!: string

  @ApiProperty({
    description: "Horário de início do turno da tarde (HH:mm).",
    example: "13:30",
  })
  @IsString({
    message: "O horário de início do turno da tarde deve ser uma string.",
  })
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "O horário de início do turno da tarde deve estar no formato HH:mm.",
  })
  @IsNotEmpty({
    message: "O horário de início do turno da tarde não pode estar vazio.",
  })
  inicioTurnoTarde!: string

  @ApiProperty({
    description: "Horário de término do turno da tarde (HH:mm).",
    example: "18:00",
  })
  @IsString({
    message: "O horário de término do turno da tarde deve ser uma string.",
  })
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message:
      "O horário de término do turno da tarde deve estar no formato HH:mm.",
  })
  @IsNotEmpty({
    message: "O horário de término do turno da tarde não pode estar vazio.",
  })
  fimTurnoTarde!: string

  @ApiProperty({
    description: "Horário de início do turno da noite (HH:mm).",
    example: "19:00",
  })
  @IsString({
    message: "O horário de início do turno da noite deve ser uma string.",
  })
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "O horário de início do turno da noite deve estar no formato HH:mm.",
  })
  @IsNotEmpty({
    message: "O horário de início do turno da noite não pode estar vazio.",
  })
  inicioTurnoNoite!: string

  @ApiProperty({
    description: "Horário de término do turno da noite (HH:mm).",
    example: "22:30",
  })
  @IsString({
    message: "O horário de término do turno da noite deve ser uma string.",
  })
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message:
      "O horário de término do turno da noite deve estar no formato HH:mm.",
  })
  @IsNotEmpty({
    message: "O horário de término do turno da noite não pode estar vazio.",
  })
  fimTurnoNoite!: string
}
