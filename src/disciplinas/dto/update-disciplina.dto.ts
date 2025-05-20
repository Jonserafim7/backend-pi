import { PartialType } from "@nestjs/swagger"
import { CreateDisciplinaDto } from "./create-disciplina.dto"

/**
 * DTO para atualização de uma disciplina
 * Estende o DTO de criação, tornando todos os campos opcionais
 */
export class UpdateDisciplinaDto extends PartialType(CreateDisciplinaDto) {}
