import { ApiProperty } from "@nestjs/swagger"
import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsUUID,
} from "class-validator"
import { Transform } from "class-transformer"
import { StatusPeriodoLetivo } from "@prisma/client"

/**
 * DTO para busca de períodos letivos com filtros opcionais
 * @class FindPeriodoLetivoDto
 */
export class FindPeriodoLetivoDto {
  @ApiProperty({
    description: "ID do período letivo",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: "ID deve ser um UUID válido." })
  id?: string

  @ApiProperty({
    description: "Ano do período letivo",
    example: 2025,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "O ano deve ser um número inteiro." })
  @Min(2000, { message: "O ano deve ser maior ou igual a 2000." })
  @Max(2100, { message: "O ano deve ser menor ou igual a 2100." })
  @Transform(({ value }: { value: string }) =>
    value ? parseInt(value, 10) : undefined,
  )
  ano?: number

  @ApiProperty({
    description: "Semestre do período letivo (1 ou 2)",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "O semestre deve ser um número inteiro." })
  @Min(1, { message: "O semestre deve ser no mínimo 1." })
  @Max(2, { message: "O semestre deve ser no máximo 2." })
  @Transform(({ value }: { value: string }) =>
    value ? parseInt(value, 10) : undefined,
  )
  semestre?: number

  @ApiProperty({
    description: "Status do período letivo",
    enum: StatusPeriodoLetivo,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusPeriodoLetivo, {
    message: "O status deve ser ATIVO ou INATIVO.",
  })
  status?: StatusPeriodoLetivo

  @ApiProperty({
    description: "Data de início do período letivo (filtro a partir de)",
    example: "2025-01-01",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "A data de início deve estar em formato válido." })
  dataInicioGte?: string

  @ApiProperty({
    description: "Data de início do período letivo (filtro até)",
    example: "2025-12-31",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "A data de início deve estar em formato válido." })
  dataInicioLte?: string

  @ApiProperty({
    description: "Data de fim do período letivo (filtro a partir de)",
    example: "2025-01-01",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "A data de fim deve estar em formato válido." })
  dataFimGte?: string

  @ApiProperty({
    description: "Data de fim do período letivo (filtro até)",
    example: "2025-12-31",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "A data de fim deve estar em formato válido." })
  dataFimLte?: string
}
