import { ApiProperty } from "@nestjs/swagger"

/**
 * Representação simplificada de um usuário coordenador para resposta
 */
class CoordenadorDto {
  @ApiProperty({
    description: "ID do usuário coordenador",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  id: string = ""

  @ApiProperty({
    description: "Nome do coordenador",
    example: "José Silva",
  })
  nome: string = ""

  @ApiProperty({
    description: "Email do coordenador",
    example: "jose.silva@universidade.edu.br",
  })
  email: string = ""
}

/**
 * DTO para resposta de dados de um curso
 */
export class CursoResponseDto {
  @ApiProperty({
    description: "ID do curso",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  id: string = ""

  @ApiProperty({
    description: "Nome do curso",
    example: "Engenharia de Software",
  })
  nome: string = ""

  @ApiProperty({
    description: "Código do curso",
    example: "ENG-SOFT",
  })
  codigo: string = ""

  @ApiProperty({
    description: "Data de criação do curso",
    example: "2025-05-16T12:00:00Z",
  })
  dataCriacao: Date = new Date()

  @ApiProperty({
    description: "Data da última atualização do curso",
    example: "2025-05-16T12:00:00Z",
  })
  dataAtualizacao: Date = new Date()

  @ApiProperty({
    description: "Dados do coordenador do curso",
    type: CoordenadorDto,
    required: false,
    nullable: true,
  })
  coordenador?: CoordenadorDto | null = null
}
