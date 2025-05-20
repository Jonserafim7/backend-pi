import { ApiProperty } from "@nestjs/swagger"
import { CreateDisciplinaOfertadaDto } from "./create-disciplina-ofertada.dto"
import type { Disciplina, PeriodoLetivo } from "@prisma/client"

export class DisciplinaOfertadaResponseDto extends CreateDisciplinaOfertadaDto {
  @ApiProperty({
    description: "ID da oferta da disciplina (UUID)",
    example: "c1d2e3f4-a5b6-7890-1234-567890abcdef",
  })
  id!: string

  // Adicionando campos de exemplo para disciplina e periodoLetivo,
  // idealmente seriam DTOs próprios ou tipos mais complexos.
  @ApiProperty({
    description: "Detalhes da disciplina ofertada",
    // example: { id: "a1b2c3d4-e5f6-7890-1234-567890abcdef", nome: "Cálculo I", codigo: "MAT001", cargaHoraria: 60, dataCriacao: new Date(), dataAtualizacao: new Date() }
  })
  disciplina?: Disciplina

  @ApiProperty({
    description: "Detalhes do período letivo da oferta",
    // example: { id: "b1c2d3e4-f5a6-7890-1234-567890abcdef", ano: 2024, semestre: 1, dataCriacao: new Date(), dataAtualizacao: new Date() }
  })
  periodoLetivo?: PeriodoLetivo

  @ApiProperty({
    description: "Data de criação da oferta da disciplina",
    example: "2024-05-20T10:00:00.000Z",
    type: Date,
  })
  createdAt!: Date

  @ApiProperty({
    description: "Data da última atualização da oferta da disciplina",
    example: "2024-05-20T11:00:00.000Z",
    type: Date,
  })
  updatedAt!: Date
}
