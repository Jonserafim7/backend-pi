import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsOptional, IsString, IsEnum } from "class-validator"
import { DiaSemana } from "@prisma/client"

export class AlocacaoHorarioQueryDto {
  @ApiPropertyOptional({
    description: "Filtrar por ID da turma",
    example: "clx1234567890abcdef",
  })
  @IsOptional()
  @IsString()
  idTurma?: string

  @ApiPropertyOptional({
    description: "Filtrar por ID do professor",
    example: "clx1234567890abcdef",
  })
  @IsOptional()
  @IsString()
  idProfessor?: string

  @ApiPropertyOptional({
    description: "Filtrar por ID do período letivo",
    example: "clx1234567890abcdef",
  })
  @IsOptional()
  @IsString()
  idPeriodoLetivo?: string

  @ApiPropertyOptional({
    description: "Filtrar por dia da semana",
    enum: DiaSemana,
    example: DiaSemana.SEGUNDA,
  })
  @IsOptional()
  @IsEnum(DiaSemana)
  diaDaSemana?: DiaSemana

  @ApiPropertyOptional({
    description: "Filtrar por ID da proposta de horário",
    example: "clx1234567890abcdef",
  })
  @IsOptional()
  @IsString()
  idPropostaHorario?: string
}
