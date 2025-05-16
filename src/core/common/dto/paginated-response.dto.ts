import { ApiProperty } from "@nestjs/swagger"
import { IsNumber } from "class-validator"

/**
 * Classe de metadados de paginação
 *
 * @description Esta classe representa os metadados de uma resposta paginada
 */
export class PaginationMeta {
  @ApiProperty({
    description: "Número total de itens em todas as páginas",
    example: 100,
    type: Number,
  })
  @IsNumber()
  total!: number

  @ApiProperty({
    description: "Número total de páginas disponíveis",
    example: 10,
    type: Number,
  })
  @IsNumber()
  paginas!: number

  @ApiProperty({
    description: "Número da página atual (começando em 1)",
    example: 1,
    type: Number,
  })
  @IsNumber()
  pagina!: number

  @ApiProperty({
    description: "Número máximo de itens por página",
    example: 10,
    type: Number,
  })
  @IsNumber()
  limite!: number
}

/**
 * Interface genérica para resposta paginada
 *
 * @description Esta interface pode ser utilizada para criar DTOs de resposta paginada para qualquer tipo de dados
 */
export interface PaginatedResponse<T> {
  meta: PaginationMeta
  data: T[]
}
