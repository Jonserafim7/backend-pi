import { PartialType, OmitType } from "@nestjs/swagger"
import { CreateDisponibilidadeDto } from "./create-disponibilidade.dto"

/**
 * DTO para atualização de uma disponibilidade de professor
 * Remove os campos que não devem ser alterados em updates (professor e período)
 * e torna todos os outros campos opcionais
 */
export class UpdateDisponibilidadeDto extends PartialType(
  OmitType(CreateDisponibilidadeDto, [
    "idUsuarioProfessor",
    "idPeriodoLetivo",
  ] as const),
) {
  // Todos os campos do CreateDisponibilidadeDto ficam opcionais
  // exceto idUsuarioProfessor e idPeriodoLetivo que não podem ser alterados
}
