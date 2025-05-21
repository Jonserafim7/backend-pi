import { ApiProperty } from "@nestjs/swagger"
import {
  IsInt,
  IsBoolean,
  IsOptional,
  IsISO8601,
  Min,
  Max,
  IsDateString,
  ValidateIf,
} from "class-validator"
import { PartialType } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { CreatePeriodoLetivoDto } from "./create-periodo-letivo.dto"
import { IsDateAfter } from "@/common/validators/is-date-after.validator"

/**
 * DTO para atualização parcial de um período letivo
 * @class UpdatePeriodoLetivoDto
 */
export class UpdatePeriodoLetivoDto extends PartialType(CreatePeriodoLetivoDto) {
  @ApiProperty({
    description: "Ano do período letivo",
    example: 2025,
    minimum: 2000,
    maximum: 2100,
    required: false,
  })
  @IsInt({ message: "O ano deve ser um número inteiro" })
  @Min(2000, { message: "O ano deve ser maior ou igual a 2000" })
  @Max(2100, { message: "O ano deve ser menor ou igual a 2100" })
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsOptional()
  ano?: number

  @ApiProperty({
    description: "Semestre do período letivo (1 ou 2)",
    example: 1,
    minimum: 1,
    maximum: 2,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "O semestre deve ser um número inteiro." })
  @Min(1, { message: "O semestre deve ser no mínimo 1." })
  @Max(2, { message: "O semestre deve ser no máximo 2." })
  @Transform(({ value }: { value: string | number | undefined }) => {
    if (value === undefined) return undefined
    if (typeof value === "string") {
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? undefined : parsed
    }
    return value
  })
  semestre?: number

  @ApiProperty({
    description: "Indica se o período está ativo para ofertas de disciplinas",
    example: true,
    required: false,
  })
  @IsBoolean({ message: "O campo ativo deve ser um booleano" })
  @IsOptional()
  @Transform(({ value }: { value: string | boolean | undefined }) => {
    if (typeof value === "string") {
      if (value.toLowerCase() === "true") return true
      if (value.toLowerCase() === "false") return false
    }
    if (typeof value === "boolean") {
      return value
    }
    return undefined // Garante que apenas boolean ou undefined sejam retornados
  })
  ativo?: boolean

  @ApiProperty({
    description: "Data de início do período letivo",
    example: "2025-02-10",
    required: false,
  })
  @IsISO8601({}, { message: "A data de início deve estar em formato ISO 8601" })
  @IsOptional()
  dataInicio?: string

  @ApiProperty({
    description: "Data de fim do período letivo",
    example: "2025-06-30",
    required: false,
    nullable: true,
  })
  @IsOptional() // Já é opcional devido ao PartialType, mas explícito para clareza
  @ValidateIf(
    (obj: UpdatePeriodoLetivoDto) =>
      obj.dataFim !== undefined && obj.dataFim !== null,
  )
  @IsDateString(
    { strict: true },
    { message: "dataFim deve ser uma data válida no formato ISO 8601." },
  )
  @IsDateAfter("dataInicio", {
    message: "dataFim deve ser posterior a dataInicio.",
  })
  @Transform(({ value }: { value: string | null | undefined }) => {
    if (value === "") return undefined // Trata string vazia como undefined
    if (value === undefined || value === null) return value // Mantém undefined ou null
    return new Date(value) // Transforma string em Date
  })
  dataFim?: Date | null

  // dataInicio é herdado de CreatePeriodoLetivoDto.
  // Se dataInicio for atualizado, ele já possui suas próprias validações.
  // Se dataFim for atualizado, ele será validado contra o dataInicio existente ou atualizado.
}
