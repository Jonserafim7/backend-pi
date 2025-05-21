import { PartialType } from "@nestjs/swagger"
import { CreateDisciplinaOfertadaDto } from "./create-disciplina-ofertada.dto"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsInt, IsOptional, Min, IsUUID, IsString } from "class-validator"

export class UpdateDisciplinaOfertadaDto extends PartialType(
  CreateDisciplinaOfertadaDto,
) {
  @ApiPropertyOptional({
    description: "ID da disciplina que será ofertada (UUID)",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @IsOptional()
  @IsString({ message: "O ID da disciplina deve ser uma string" })
  @IsUUID("all", { message: "O ID da disciplina deve ser um UUID válido" })
  idDisciplina?: string

  @ApiPropertyOptional({
    description: "ID do período letivo em que a disciplina será ofertada (UUID)",
    example: "b1c2d3e4-f5a6-7890-1234-567890abcdef",
  })
  @IsOptional()
  @IsString({ message: "O ID do período letivo deve ser uma string" })
  @IsUUID("all", { message: "O ID do período letivo deve ser um UUID válido" })
  idPeriodoLetivo?: string

  @ApiPropertyOptional({
    description: "Quantidade de turmas para esta disciplina ofertada",
    example: 2,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: "A quantidade de turmas deve ser um número inteiro" })
  @Min(1, { message: "A quantidade de turmas deve ser no mínimo 1" })
  quantidadeTurmas?: number
}
