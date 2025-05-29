import { ApiProperty } from "@nestjs/swagger"
import { DiaSemana } from "@prisma/client"

export class DisciplinaBasicaDto {
  @ApiProperty({ description: "ID da disciplina" })
  id: string

  @ApiProperty({ description: "Nome da disciplina" })
  nome: string

  @ApiProperty({ description: "Código da disciplina" })
  codigo: string

  @ApiProperty({ description: "Carga horária da disciplina" })
  cargaHoraria: number
}

export class DisciplinaOfertadaBasicaDto {
  @ApiProperty({ description: "ID da disciplina ofertada" })
  id: string

  @ApiProperty({ description: "Dados da disciplina", type: DisciplinaBasicaDto })
  disciplina: DisciplinaBasicaDto
}

export class ProfessorBasicoDto {
  @ApiProperty({ description: "ID do professor" })
  id: string

  @ApiProperty({ description: "Nome do professor" })
  nome: string

  @ApiProperty({ description: "Email do professor" })
  email: string
}

export class TurmaBasicaDto {
  @ApiProperty({ description: "ID da turma" })
  id: string

  @ApiProperty({ description: "Código da turma" })
  codigoDaTurma: string

  @ApiProperty({
    description: "Dados da disciplina ofertada",
    type: DisciplinaOfertadaBasicaDto,
  })
  disciplinaOfertada: DisciplinaOfertadaBasicaDto

  @ApiProperty({
    description: "Professor alocado à turma",
    type: ProfessorBasicoDto,
    required: false,
  })
  professorAlocado?: ProfessorBasicoDto
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
