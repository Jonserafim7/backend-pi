import { PartialType } from "@nestjs/swagger"
import { CreateCursoDto } from "./create-curso.dto"

/**
 * DTO para atualização de um curso existente
 * Estende o CreateCursoDto tornando todas as propriedades opcionais
 */
export class UpdateCursoDto extends PartialType(CreateCursoDto) {}
