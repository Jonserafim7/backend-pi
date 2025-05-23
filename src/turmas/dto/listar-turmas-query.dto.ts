import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsUUID } from "class-validator"

/**
 * DTO para filtros de listagem de turmas
 */
export class ListarTurmasQueryDto {
  @ApiProperty({
    description: "ID da disciplina ofertada para filtrar",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  idDisciplinaOfertada?: string

  @ApiProperty({
    description: "ID do professor para filtrar",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  idProfessor?: string

  @ApiProperty({
    description: "ID do período letivo para filtrar",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  idPeriodoLetivo?: string
}
