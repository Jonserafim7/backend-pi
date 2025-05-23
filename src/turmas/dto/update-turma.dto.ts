import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString, IsUUID } from "class-validator"

/**
 * DTO para atualização de turmas
 * Permite atualizar código da turma e/ou professor atribuído
 */
export class UpdateTurmaDto {
  @ApiProperty({
    description: "Novo código/identificador da turma (ex: T1, T2, A, B)",
    example: "T2",
    required: false,
  })
  @IsOptional()
  @IsString()
  codigoDaTurma?: string

  @ApiProperty({
    description: "ID do professor a ser atribuído à turma",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  idUsuarioProfessor?: string
}
