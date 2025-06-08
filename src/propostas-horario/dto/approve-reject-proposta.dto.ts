import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, IsOptional, MaxLength } from "class-validator"

/**
 * DTO para aprovação de uma proposta de horário
 */
export class ApprovePropostaDto {
  /**
   * Observações do diretor ao aprovar a proposta
   * @example "Proposta aprovada. Está de acordo com as diretrizes pedagógicas."
   */
  @ApiProperty({
    description: "Observações do diretor ao aprovar a proposta",
    example: "Proposta aprovada. Está de acordo com as diretrizes pedagógicas.",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "As observações devem ser uma string" })
  @MaxLength(500, {
    message: "As observações devem ter no máximo 500 caracteres",
  })
  observacoesDiretor?: string
}

/**
 * DTO para rejeição de uma proposta de horário
 */
export class RejectPropostaDto {
  /**
   * Justificativa obrigatória para a rejeição da proposta
   * @example "Conflitos de horário identificados entre disciplinas do mesmo período"
   */
  @ApiProperty({
    description: "Justificativa obrigatória para a rejeição da proposta",
    example:
      "Conflitos de horário identificados entre disciplinas do mesmo período",
  })
  @IsNotEmpty({ message: "A justificativa para rejeição é obrigatória" })
  @IsString({ message: "A justificativa deve ser uma string" })
  @MaxLength(500, {
    message: "A justificativa deve ter no máximo 500 caracteres",
  })
  justificativaRejeicao!: string

  /**
   * Observações adicionais do diretor
   * @example "Sugestão de revisão dos horários das disciplinas de laboratório"
   */
  @ApiProperty({
    description: "Observações adicionais do diretor",
    example: "Sugestão de revisão dos horários das disciplinas de laboratório",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "As observações devem ser uma string" })
  @MaxLength(500, {
    message: "As observações devem ter no máximo 500 caracteres",
  })
  observacoesDiretor?: string
}
