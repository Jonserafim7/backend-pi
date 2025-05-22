import { ApiProperty } from "@nestjs/swagger"
import {
  IsNotEmpty,
  IsInt,
  IsDateString,
  Min,
  Max,
  IsEnum,
  IsUUID,
  IsString,
} from "class-validator"
import { Transform } from "class-transformer"
import { IsDateAfter } from "@/common/validators/is-date-after.validator"
import { StatusPeriodoLetivo, PeriodoLetivo } from "@prisma/client"

/**
 * DTO para criação de um novo período letivo
 * @class CreatePeriodoLetivoDto
 */
export class PeriodoLetivoDto {
  @ApiProperty({
    description: "ID do período letivo",
    example: "1",
  })
  @IsString()
  @IsUUID()
  id: string

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
  ano: number

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
  semestre: number

  @ApiProperty({
    description: "Indica se o período está ativo para ofertas de disciplinas",
    example: StatusPeriodoLetivo.INATIVO,
    default: StatusPeriodoLetivo.INATIVO,
  })
  @IsEnum(StatusPeriodoLetivo)
  status: StatusPeriodoLetivo

  @ApiProperty({
    description: "Data de início do período letivo no formato YYYY-MM-DD",
    example: "2025-02-10",
  })
  @IsNotEmpty({ message: "A data de início é obrigatória." })
  @IsDateString()
  dataInicio: string

  @ApiProperty({
    description: "Data de fim do período letivo no formato YYYY-MM-DD",
    example: "2025-06-30",
  })
  @IsNotEmpty({ message: "A data de fim é obrigatória." })
  @IsDateString()
  @IsDateAfter("dataInicio", {
    message: "dataFim deve ser posterior a dataInicio.",
  })
  dataFim: string

  @ApiProperty({
    description: "Data de criação do período letivo",
    example: "2025-02-10",
  })
  @IsDateString()
  dataCriacao: string

  @ApiProperty({
    description: "Data de atualização do período letivo",
    example: "2025-02-10",
  })
  @IsDateString()
  dataAtualizacao: string

  constructor(data: PeriodoLetivo) {
    this.id = data.id
    this.ano = data.ano
    this.semestre = data.semestre
    this.status = data.status
    this.dataInicio = data.dataInicio.toISOString()
    this.dataFim = data.dataFim.toISOString()
    this.dataCriacao = data.dataCriacao.toISOString()
    this.dataAtualizacao = data.dataAtualizacao.toISOString()
  }

  static fromEntity(data: PeriodoLetivo): PeriodoLetivoDto {
    return new PeriodoLetivoDto(data)
  }
}
