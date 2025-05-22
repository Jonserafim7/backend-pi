import { PartialType } from "@nestjs/swagger"
import { CreatePeriodoLetivoDto } from "./create-periodo-letivo.dto"

/**
 * DTO para atualização de um período letivo
 * @class UpdatePeriodoLetivoDto
 */
export class UpdatePeriodoLetivoDto extends PartialType(CreatePeriodoLetivoDto) {}
