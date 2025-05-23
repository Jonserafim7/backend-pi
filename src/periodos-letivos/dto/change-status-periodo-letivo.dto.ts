import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsNotEmpty } from "class-validator"
import { StatusPeriodoLetivo } from "@prisma/client"

/**
 * DTO para mudança de status de um período letivo
 * @class ChangeStatusPeriodoLetivoDto
 */
export class ChangeStatusPeriodoLetivoDto {
  @ApiProperty({
    description: "Novo status do período letivo",
    enum: StatusPeriodoLetivo,
    example: StatusPeriodoLetivo.ATIVO,
  })
  @IsNotEmpty({ message: "O status é obrigatório." })
  @IsEnum(StatusPeriodoLetivo, {
    message: "O status deve ser ATIVO ou INATIVO.",
  })
  status!: StatusPeriodoLetivo
}
