import { ApiProperty } from "@nestjs/swagger"
import { IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator"

/**
 * DTO para criação de uma nova Matriz Curricular
 *
 * Permite definir os dados básicos da matriz curricular e
 * as disciplinas que a compõem
 */
export class CreateMatrizCurricularDto {
  @ApiProperty({
    description: "Nome da matriz curricular",
    example: "Matriz 2023.1 - Engenharia de Software",
  })
  @IsNotEmpty({ message: "O nome da matriz curricular é obrigatório" })
  @IsString({ message: "O nome deve ser uma string" })
  nome: string = ""

  @ApiProperty({
    description: "ID do curso ao qual a matriz curricular pertence",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsNotEmpty({ message: "O ID do curso é obrigatório" })
  @IsUUID("4", { message: "O ID do curso deve ser um UUID válido" })
  idCurso: string = ""

  @ApiProperty({
    description: "Lista de IDs das disciplinas da matriz curricular",
    example: [
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001",
    ],
    type: [String],
  })
  @IsArray({ message: "disciplinasIds deve ser um array" })
  @IsUUID("4", {
    each: true,
    message: "Cada ID de disciplina deve ser um UUID válido",
  })
  disciplinasIds: string[] = []
}
