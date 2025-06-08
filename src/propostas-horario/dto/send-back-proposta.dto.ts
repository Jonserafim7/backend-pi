import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, MaxLength } from "class-validator"

/**
 * DTO para devolução de uma proposta aprovada para edição
 */
export class SendBackPropostaDto {
  /**
   * Motivo obrigatório para devolver a proposta para edição
   * @example "Necessárias alterações nos horários de laboratório conforme nova demanda"
   */
  @ApiProperty({
    description: "Motivo obrigatório para devolver a proposta para edição",
    example:
      "Necessárias alterações nos horários de laboratório conforme nova demanda",
  })
  @IsNotEmpty({ message: "O motivo para devolução é obrigatório" })
  @IsString({ message: "O motivo deve ser uma string" })
  @MaxLength(500, {
    message: "O motivo deve ter no máximo 500 caracteres",
  })
  motivoDevolucao!: string
}
