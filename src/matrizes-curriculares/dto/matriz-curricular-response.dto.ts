import { ApiProperty } from "@nestjs/swagger"
import { DisciplinaResponseDto } from "../../disciplinas/dto/disciplina-response.dto"

/**
 * DTO para resposta padrão das operações de Matriz Curricular
 *
 * Utilizado para padronizar o formato de resposta da API
 */
export class MatrizCurricularResponseDto {
  @ApiProperty({
    description: "ID único da matriz curricular",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  id: string = ""

  @ApiProperty({
    description: "Nome da matriz curricular",
    example: "Matriz 2023.1 - Engenharia de Software",
  })
  nome: string = ""

  @ApiProperty({
    description: "ID do curso ao qual a matriz curricular pertence",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  idCurso: string = ""

  @ApiProperty({
    description: "Nome do curso ao qual a matriz curricular pertence",
    example: "Engenharia de Software",
  })
  nomeCurso: string = ""

  @ApiProperty({
    description: "Data de criação da matriz curricular",
    example: "2023-05-19T10:00:00Z",
  })
  createdAt: Date = new Date()

  @ApiProperty({
    description: "Data da última atualização da matriz curricular",
    example: "2023-05-19T10:00:00Z",
  })
  updatedAt: Date = new Date()

  @ApiProperty({
    description: "Lista de disciplinas da matriz curricular",
    type: [DisciplinaResponseDto],
  })
  disciplinas: DisciplinaResponseDto[] = []
}
