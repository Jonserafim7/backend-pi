import { ApiProperty } from "@nestjs/swagger"
import { CreateDisciplinaOfertadaDto } from "./create-disciplina-ofertada.dto"
import { DisciplinaResponseDto } from "../../disciplinas/dto/disciplina-response.dto"
import { PeriodoLetivoResponseDto } from "../../periodos-letivos/dto"

export class DisciplinaOfertadaResponseDto extends CreateDisciplinaOfertadaDto {
  @ApiProperty({
    description: "ID da oferta da disciplina (UUID)",
    example: "c1d2e3f4-a5b6-7890-1234-567890abcdef",
  })
  id!: string

  @ApiProperty({
    description: "Detalhes da disciplina ofertada",
    type: () => DisciplinaResponseDto,
  })
  disciplina?: DisciplinaResponseDto

  @ApiProperty({
    description: "Detalhes do período letivo da oferta",
    type: () => PeriodoLetivoResponseDto,
  })
  periodoLetivo?: PeriodoLetivoResponseDto

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
