import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, Min, IsUUID, IsString } from "class-validator"

export class CreateDisciplinaOfertadaDto {
  @ApiProperty({
    description: "ID da disciplina que será ofertada (UUID)",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @IsString({ message: "O ID da disciplina deve ser uma string" })
  @IsUUID("all", { message: "O ID da disciplina deve ser um UUID válido" })
  @IsNotEmpty({ message: "O ID da disciplina não pode estar vazio" })
  idDisciplina!: string

  @ApiProperty({
    description: "ID do período letivo em que a disciplina será ofertada (UUID)",
    example: "b1c2d3e4-f5a6-7890-1234-567890abcdef",
  })
  @IsString({ message: "O ID do período letivo deve ser uma string" })
  @IsUUID("all", { message: "O ID do período letivo deve ser um UUID válido" })
  @IsNotEmpty({ message: "O ID do período letivo não pode estar vazio" })
  idPeriodoLetivo!: string

  @ApiProperty({
    description: "Quantidade de turmas para esta disciplina ofertada",
    example: 2,
    minimum: 1,
  })
  @IsInt({ message: "A quantidade de turmas deve ser um número inteiro" })
  @Min(1, { message: "A quantidade de turmas deve ser no mínimo 1" })
  @IsNotEmpty({ message: "A quantidade de turmas não pode estar vazia" })
  quantidadeTurmas!: number
}
