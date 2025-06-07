import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString, MaxLength } from "class-validator"

/**
 * DTO para submissão de uma proposta de horário para aprovação
 */
export class SubmitPropostaHorarioDto {
  /**
   * Observações finais do coordenador ao submeter a proposta
   * @example "Proposta finalizada considerando todos os requisitos e disponibilidades"
   */
  @ApiProperty({
    description: "Observações finais do coordenador ao submeter a proposta",
    example:
      "Proposta finalizada considerando todos os requisitos e disponibilidades",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "As observações devem ser uma string" })
  @MaxLength(500, {
    message: "As observações devem ter no máximo 500 caracteres",
  })
  observacoesCoordenador?: string
}
