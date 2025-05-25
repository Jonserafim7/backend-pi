import { ApiPropertyOptional } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { IsOptional, IsUUID, IsEnum, IsString, IsInt, Min } from "class-validator"
import { DiaSemana, StatusDisponibilidade } from "@prisma/client"

/**
 * DTO para query de listagem de disponibilidades com filtros
 */
export class ListarDisponibilidadesQueryDto {
  @ApiPropertyOptional({
    description: "ID do professor para filtrar",
    example: "c1f2e3a4-b5c6-4d7e-8f9a-123456789abc",
  })
  @IsOptional()
  @IsUUID(4, { message: "ID do professor deve ser um UUID válido" })
  professorId?: string

  @ApiPropertyOptional({
    description: "ID do período letivo para filtrar",
    example: "d2e3f4b5-c6d7-4e8f-9a0b-234567890def",
  })
  @IsOptional()
  @IsUUID(4, { message: "ID do período letivo deve ser um UUID válido" })
  periodoLetivoId?: string

  @ApiPropertyOptional({
    description: "Dia da semana para filtrar",
    enum: DiaSemana,
    example: DiaSemana.SEGUNDA,
  })
  @IsOptional()
  @IsEnum(DiaSemana, {
    message:
      "Dia da semana deve ser um valor válido: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO",
  })
  diaSemana?: DiaSemana

  @ApiPropertyOptional({
    description: "Status da disponibilidade para filtrar",
    enum: StatusDisponibilidade,
    example: StatusDisponibilidade.DISPONIVEL,
  })
  @IsOptional()
  @IsEnum(StatusDisponibilidade, {
    message: "Status deve ser DISPONIVEL ou INDISPONIVEL",
  })
  status?: StatusDisponibilidade

  @ApiPropertyOptional({
    description: "Campo para ordenação",
    example: "diaDaSemana",
    enum: ["diaDaSemana", "horaInicio", "horaFim", "dataCriacao"],
  })
  @IsOptional()
  @IsString()
  orderBy?: "diaDaSemana" | "horaInicio" | "horaFim" | "dataCriacao" =
    "diaDaSemana"

  @ApiPropertyOptional({
    description: "Direção da ordenação",
    example: "asc",
    enum: ["asc", "desc"],
  })
  @IsOptional()
  @IsString()
  orderDirection?: "asc" | "desc" = "asc"
}
