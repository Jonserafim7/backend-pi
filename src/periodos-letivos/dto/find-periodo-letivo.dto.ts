import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsBoolean, IsOptional, Min, Max } from "class-validator"
import { Transform } from "class-transformer"

/**
 * DTO para consulta de períodos letivos com filtros e paginação
 * @class FindPeriodoLetivoDto
 */
export class FindPeriodoLetivoDto {
  @ApiProperty({
    description: "Filtra pelo ano do período letivo",
    example: 2025,
    minimum: 2000,
    maximum: 2100,
    required: false,
  })
  @IsInt({ message: "O ano deve ser um número inteiro" })
  @Min(2000, { message: "O ano deve ser maior ou igual a 2000" })
  @Max(2100, { message: "O ano deve ser menor ou igual a 2100" })
  @Transform(({ value }: { value: string }) =>
    value ? parseInt(value, 10) : undefined,
  )
  @IsOptional()
  ano?: number

  @ApiProperty({
    description: "Filtra pelo semestre do período letivo (1 ou 2)",
    example: 1,
    minimum: 1,
    maximum: 2,
    required: false,
  })
  @IsInt({ message: "O semestre deve ser um número inteiro" })
  @Min(1, { message: "O semestre deve ser 1 ou 2" })
  @Max(2, { message: "O semestre deve ser 1 ou 2" })
  @Transform(({ value }: { value: string }) =>
    value ? parseInt(value, 10) : undefined,
  )
  @IsOptional()
  semestre?: number

  @ApiProperty({
    description: "Filtra por períodos letivos ativos ou inativos",
    example: true,
    required: false,
  })
  @IsBoolean({ message: "O campo ativo deve ser um booleano" })
  @Transform(({ value }: { value: string | boolean | undefined }) => {
    if (typeof value === "string") {
      const lowerValue = value.toLowerCase()
      if (lowerValue === "true") return true
      if (lowerValue === "false") return false
    }
    if (typeof value === "boolean") {
      return value
    }
    return undefined // Para outros casos, não aplicar filtro por 'ativo'
  })
  @IsOptional()
  ativo?: boolean

  @ApiProperty({
    description: "Número da página para paginação",
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsInt({ message: "A página deve ser um número inteiro" })
  @Min(1, { message: "A página deve ser maior ou igual a 1" })
  @Transform(({ value }: { value: string }) => (value ? parseInt(value, 10) : 1))
  @IsOptional()
  pagina?: number

  @ApiProperty({
    description: "Número de itens por página",
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsInt({ message: "O limite deve ser um número inteiro" })
  @Min(1, { message: "O limite deve ser maior ou igual a 1" })
  @Max(100, { message: "O limite deve ser menor ou igual a 100" })
  @Transform(({ value }: { value: string }) => (value ? parseInt(value, 10) : 10))
  @IsOptional()
  limite?: number
}
