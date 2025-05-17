import { ApiProperty } from "@nestjs/swagger"
import { PapelUsuario } from "@prisma/client"
import { IsEnum, IsOptional } from "class-validator"

export class FindUsuariosByRoleQueryDto {
  @ApiProperty({
    description: "Filtrar por papel do usuário",
    enum: PapelUsuario,
    example: PapelUsuario.PROFESSOR,
    required: false,
  })
  @IsEnum(PapelUsuario, { message: "Papel de usuário inválido." })
  @IsOptional()
  papel?: PapelUsuario
}
