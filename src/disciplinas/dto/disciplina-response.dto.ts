import { ApiProperty } from "@nestjs/swagger"
import { Disciplina } from "@prisma/client"

/**
 * DTO para padronizar as respostas relacionadas a disciplinas
 * Contém todos os campos que serão retornados pela API
 */
export class DisciplinaResponseDto implements Partial<Disciplina> {
  @ApiProperty({
    description: "ID único da disciplina",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id!: string

  @ApiProperty({
    description: "Nome da disciplina",
    example: "Programação Orientada a Objetos",
  })
  nome!: string

  @ApiProperty({
    description: "Código único da disciplina",
    example: "POO001",
    required: false,
  })
  codigo?: string

  @ApiProperty({
    description: "Carga horária total da disciplina em horas",
    example: 60,
  })
  cargaHoraria!: number

  @ApiProperty({
    description: "Data de criação do registro",
    example: "2025-05-19T12:00:00Z",
  })
  dataCriacao!: Date

  @ApiProperty({
    description: "Data da última atualização do registro",
    example: "2025-05-19T12:30:00Z",
  })
  dataAtualizacao!: Date

  /**
   * Método estático para converter uma entidade Disciplina em um DTO de resposta
   * @param disciplina A entidade Disciplina a ser convertida
   * @returns Um objeto DisciplinaResponseDto
   */
  static fromEntity(disciplina: Disciplina): DisciplinaResponseDto {
    return {
      id: disciplina.id,
      nome: disciplina.nome,
      codigo: disciplina.codigo || undefined,
      cargaHoraria: disciplina.cargaHoraria,
      dataCriacao: disciplina.dataCriacao,
      dataAtualizacao: disciplina.dataAtualizacao,
    }
  }
}
