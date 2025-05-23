import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsUUID } from "class-validator"

/**
 * DTO para atribuir professor a uma turma
 */
export class AtribuirProfessorDto {
  @ApiProperty({
    description: "ID do professor a ser atribuído à turma",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @IsNotEmpty()
  @IsUUID()
  idUsuarioProfessor!: string
}
