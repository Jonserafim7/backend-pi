import { ApiProperty, PartialType } from "@nestjs/swagger"
import { CreateMatrizCurricularDto } from "./create-matriz-curricular.dto"
import { IsArray, IsOptional, IsUUID } from "class-validator"

/**
 * DTO para atualização de uma Matriz Curricular
 *
 * Estende o DTO de criação tornando todos os campos opcionais,
 * e adiciona campos específicos para atualização
 */
export class UpdateMatrizCurricularDto extends PartialType(
  CreateMatrizCurricularDto,
) {
  @ApiProperty({
    description:
      "Lista de IDs das disciplinas a serem adicionadas à matriz curricular",
    example: ["550e8400-e29b-41d4-a716-446655440000"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: "disciplinasParaAdicionar deve ser um array" })
  @IsUUID("4", {
    each: true,
    message: "Cada ID de disciplina deve ser um UUID válido",
  })
  disciplinasParaAdicionar?: string[]

  @ApiProperty({
    description:
      "Lista de IDs das disciplinas a serem removidas da matriz curricular",
    example: ["550e8400-e29b-41d4-a716-446655440001"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: "disciplinasParaRemover deve ser um array" })
  @IsUUID("4", {
    each: true,
    message: "Cada ID de disciplina deve ser um UUID válido",
  })
  disciplinasParaRemover?: string[]
}
