import { ApiProperty } from "@nestjs/swagger"
import { PaginationMeta } from "src/core/common/dto/paginated-response.dto"
import { UsuarioResponseDto } from "./usuario.response.dto"

/**
 * DTO para resposta paginada de usuários
 *
 * @description Este DTO representa a estrutura de resposta para consultas de usuários com paginação
 */
export class UsuariosResponseDto {
  @ApiProperty({
    description: "Metadados de paginação",
    type: PaginationMeta,
  })
  meta!: PaginationMeta

  @ApiProperty({
    description: "Lista de usuários",
    type: "array",
    items: {
      type: "object",
      $ref: "#/components/schemas/UsuarioResponseDto",
    },
  })
  data!: UsuarioResponseDto[]
}
