import { ApiProperty } from "@nestjs/swagger"
import {
  IsNotEmpty,
  IsInt,
  IsDateString,
  Min,
  Max,
  IsEnum,
  IsOptional,
} from "class-validator"
import { Transform } from "class-transformer"
import { IsDateAfter } from "@/common/validators/is-date-after.validator"
import { StatusPeriodoLetivo } from "@prisma/client"

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
  @IsNotEmpty({ message: "O ano é obrigatório." })
  @IsInt({ message: "O ano deve ser um número inteiro." })
  @Min(2000, { message: "O ano deve ser maior ou igual a 2000." })
  @Max(2100, { message: "O ano deve ser menor ou igual a 2100." })
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === "string") {
      return parseInt(value, 10)
    }
    return value
  })
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
    description: "Status inicial do período letivo",
    enum: StatusPeriodoLetivo,
    example: StatusPeriodoLetivo.INATIVO,
    default: StatusPeriodoLetivo.INATIVO,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusPeriodoLetivo, {
    message: "O status deve ser ATIVO ou INATIVO.",
  })
  status?: StatusPeriodoLetivo = StatusPeriodoLetivo.INATIVO

  @ApiProperty({
    description: "Data de início do período letivo no formato YYYY-MM-DD",
    example: "2025-02-10",
  })
  @IsNotEmpty({ message: "A data de início é obrigatória." })
  @IsDateString(
    {},
    { message: "A data de início deve estar em formato válido (YYYY-MM-DD)." },
  )
  dataInicio!: string

  @ApiProperty({
    description: "Data de fim do período letivo no formato YYYY-MM-DD",
    example: "2025-06-30",
  })
  @IsNotEmpty({ message: "A data de fim é obrigatória." })
  @IsDateString(
    {},
    { message: "A data de fim deve estar em formato válido (YYYY-MM-DD)." },
  )
  @IsDateAfter("dataInicio", {
    message: "A data de fim deve ser posterior à data de início.",
  })
  dataFim!: string
}
