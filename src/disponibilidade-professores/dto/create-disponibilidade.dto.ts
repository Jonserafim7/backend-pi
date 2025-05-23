import { ApiProperty } from "@nestjs/swagger"
import {
  IsString,
  IsUUID,
  IsEnum,
  IsNotEmpty,
  Matches,
  ValidateIf,
} from "class-validator"
import { Transform } from "class-transformer"
import { DiaSemana, StatusDisponibilidade } from "@prisma/client"

/**
 * DTO para criação de uma nova disponibilidade de professor
 */
export class CreateDisponibilidadeDto {
  @ApiProperty({
    description: "ID do usuário professor",
    example: "c1f2e3a4-b5c6-4d7e-8f9a-123456789abc",
  })
  @IsUUID(4, { message: "ID do professor deve ser um UUID válido" })
  @IsNotEmpty({ message: "ID do professor é obrigatório" })
  idUsuarioProfessor!: string

  @ApiProperty({
    description: "ID do período letivo",
    example: "d2e3f4b5-c6d7-4e8f-9a0b-234567890def",
  })
  @IsUUID(4, { message: "ID do período letivo deve ser um UUID válido" })
  @IsNotEmpty({ message: "ID do período letivo é obrigatório" })
  idPeriodoLetivo!: string

  @ApiProperty({
    description: "Dia da semana",
    enum: DiaSemana,
    example: DiaSemana.SEGUNDA,
  })
  @IsEnum(DiaSemana, {
    message:
      "Dia da semana deve ser um valor válido: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO",
  })
  @IsNotEmpty({ message: "Dia da semana é obrigatório" })
  diaDaSemana!: DiaSemana

  @ApiProperty({
    description: "Horário de início (formato HH:mm)",
    example: "07:30",
    pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
  })
  @IsString({ message: "Hora de início deve ser uma string" })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Hora de início deve estar no formato HH:mm (ex: 07:30, 14:00)",
  })
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty({ message: "Hora de início é obrigatória" })
  horaInicio!: string

  @ApiProperty({
    description: "Horário de fim (formato HH:mm)",
    example: "12:00",
    pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
  })
  @IsString({ message: "Hora de fim deve ser uma string" })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Hora de fim deve estar no formato HH:mm (ex: 12:00, 18:30)",
  })
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty({ message: "Hora de fim é obrigatória" })
  horaFim!: string

  @ApiProperty({
    description: "Status da disponibilidade",
    enum: StatusDisponibilidade,
    example: StatusDisponibilidade.DISPONIVEL,
    default: StatusDisponibilidade.DISPONIVEL,
  })
  @IsEnum(StatusDisponibilidade, {
    message: "Status deve ser DISPONIVEL ou INDISPONIVEL",
  })
  @ValidateIf((o) => o.status !== undefined)
  status?: StatusDisponibilidade = StatusDisponibilidade.DISPONIVEL
}
