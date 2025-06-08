import { ApiProperty } from "@nestjs/swagger"
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
} from "class-validator"

/**
 * DTO para criação de uma nova proposta de horário
 */
export class CreatePropostaHorarioDto {
  /**
   * ID do curso para o qual a proposta será criada
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  @ApiProperty({
    description: "ID do curso para o qual a proposta será criada",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  @IsNotEmpty({ message: "O ID do curso é obrigatório" })
  @IsUUID("4", { message: "O ID do curso deve ser um UUID válido" })
  idCurso!: string

  /**
   * ID do período letivo para o qual a proposta será criada
   * @example "b2c3d4e5-f6g7-8901-bcde-f23456789012"
   */
  @ApiProperty({
    description: "ID do período letivo para o qual a proposta será criada",
    example: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  })
  @IsNotEmpty({ message: "O ID do período letivo é obrigatório" })
  @IsUUID("4", { message: "O ID do período letivo deve ser um UUID válido" })
  idPeriodoLetivo!: string

  /**
   * Observações do coordenador sobre a proposta
   * @example "Proposta considerando a disponibilidade dos professores e salas disponíveis"
   */
  @ApiProperty({
    description: "Observações do coordenador sobre a proposta",
    example:
      "Proposta considerando a disponibilidade dos professores e salas disponíveis",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "As observações devem ser uma string" })
  @MaxLength(500, {
    message: "As observações devem ter no máximo 500 caracteres",
  })
  observacoesCoordenador?: string
}
