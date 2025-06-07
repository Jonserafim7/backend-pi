import { PartialType } from "@nestjs/swagger"
import { CreatePropostaHorarioDto } from "./create-proposta-horario.dto"

/**
 * DTO para atualização de uma proposta de horário
 */
export class UpdatePropostaHorarioDto extends PartialType(
  CreatePropostaHorarioDto,
) {}
