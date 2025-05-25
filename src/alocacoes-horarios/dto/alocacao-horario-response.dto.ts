import { ApiProperty } from "@nestjs/swagger"
import { DiaSemana } from "@prisma/client"

export class TurmaBasicaDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  codigoDaTurma: string

  @ApiProperty()
  disciplinaOfertada: {
    id: string
    disciplina: {
      id: string
      nome: string
      codigo: string
      cargaHoraria: number
    }
  }

  @ApiProperty()
  professorAlocado?: {
    id: string
    nome: string
    email: string
  }
}

export class AlocacaoHorarioResponseDto {
  @ApiProperty({
    description: "ID único da alocação",
    example: "clx1234567890abcdef",
  })
  id: string

  @ApiProperty({
    description: "ID da turma alocada",
    example: "clx1234567890abcdef",
  })
  idTurma: string

  @ApiProperty({
    description: "Dia da semana da alocação",
    enum: DiaSemana,
    example: DiaSemana.SEGUNDA,
  })
  diaDaSemana: DiaSemana

  @ApiProperty({
    description: "Hora de início da aula",
    example: "08:00",
  })
  horaInicio: string

  @ApiProperty({
    description: "Hora de fim da aula",
    example: "09:40",
  })
  horaFim: string

  @ApiProperty({
    description: "Data de criação da alocação",
  })
  dataCriacao: Date

  @ApiProperty({
    description: "Data da última atualização",
  })
  dataAtualizacao: Date

  @ApiProperty({
    description: "Dados da turma alocada",
    type: TurmaBasicaDto,
  })
  turma: TurmaBasicaDto
}
