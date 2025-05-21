import { ApiProperty } from "@nestjs/swagger"
import {
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsOptional,
  IsISO8601,
  Min,
  Max,
  IsDateString,
  ValidateIf,
} from "class-validator"
import { Transform } from "class-transformer"
import { IsDateAfter } from "@/common/validators/is-date-after.validator"

/**
 * DTO para criação de um novo período letivo
 * @class CreatePeriodoLetivoDto
 */
export class CreatePeriodoLetivoDto {
  @ApiProperty({
    description: "Ano do período letivo",
    example: 2025,
    minimum: 2000,
    maximum: 2100,
  })
  @IsInt({ message: "O ano deve ser um número inteiro" })
  @Min(2000, { message: "O ano deve ser maior ou igual a 2000" })
  @Max(2100, { message: "O ano deve ser menor ou igual a 2100" })
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  ano!: number

  @ApiProperty({
    description: "Semestre do período letivo (1 ou 2)",
    example: 1,
    minimum: 1,
    maximum: 2,
  })
  @IsNotEmpty({ message: "O semestre é obrigatório." })
  @IsInt({ message: "O semestre deve ser um número inteiro." })
  @Min(1, { message: "O semestre deve ser no mínimo 1." })
  @Max(2, { message: "O semestre deve ser no máximo 2." })
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === "string") {
      return parseInt(value, 10)
    }
    return value
  })
  semestre!: number

  @ApiProperty({
    description: "Indica se o período está ativo para ofertas de disciplinas",
    example: false,
    default: false,
  })
  @IsBoolean({ message: "O campo ativo deve ser um booleano" })
  @IsOptional()
  @Transform(({ value }: { value: string | boolean }) => {
    if (typeof value === "string") {
      if (value.toLowerCase() === "true") return true
      if (value.toLowerCase() === "false") return false
    }
    return value as boolean
  })
  ativo?: boolean

  @ApiProperty({
    description: "Data de início do período letivo",
    example: "2025-02-10",
    required: false,
  })
  @IsISO8601(
    { strict: true },
    { message: "A data de início deve estar em formato ISO 8601 (YYYY-MM-DD)" },
  )
  @IsOptional()
  dataInicio?: string

  @ApiProperty({
    description: "Data de fim do período letivo",
    example: "2025-06-30",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf(
    (obj: CreatePeriodoLetivoDto) =>
      obj.dataFim !== null && obj.dataFim !== undefined,
  )
  @IsDateString(
    { strict: true },
    { message: "dataFim deve ser uma data válida no formato ISO 8601." },
  )
  @IsDateAfter("dataInicio", {
    message: "dataFim deve ser posterior a dataInicio.",
  })
  @Transform(({ value }: { value: string | null }) => {
    if (value === "") return undefined
    return (
      value === null ? null
      : value ? new Date(value)
      : undefined
    )
  })
  dataFim?: Date | null = null
}
