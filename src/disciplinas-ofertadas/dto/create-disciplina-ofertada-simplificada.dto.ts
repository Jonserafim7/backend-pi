import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, IsInt, Min, Max } from "class-validator"

/**
 * DTO para criação simplificada de disciplina ofertada
 *
 * Usa o período letivo ativo automaticamente, sem necessidade de especificar
 */
export class CreateDisciplinaOfertadaSimplificadaDto {
  @ApiProperty({
    description: "ID da disciplina a ser ofertada",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsNotEmpty({ message: "O ID da disciplina é obrigatório" })
  @IsString({ message: "O ID da disciplina deve ser uma string" })
  idDisciplina: string = ""

  @ApiProperty({
    description: "Quantidade de turmas para esta disciplina",
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsNotEmpty({ message: "A quantidade de turmas é obrigatória" })
  @IsInt({ message: "A quantidade de turmas deve ser um número inteiro" })
  @Min(1, { message: "A quantidade de turmas deve ser pelo menos 1" })
  @Max(10, { message: "A quantidade de turmas deve ser no máximo 10" })
  quantidadeTurmas: number = 1
}
