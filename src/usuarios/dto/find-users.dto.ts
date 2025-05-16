import { ApiProperty } from "@nestjs/swagger"
import { PapelUsuario } from "@prisma/client"
import { IsEnum, IsOptional, IsString } from "class-validator"

export class FindUsersDto {
  @ApiProperty({
    description: "Termo de busca para filtrar por nome ou email",
    example: "joão",
    required: false,
  })
  @IsString({ message: "O termo de busca deve ser uma string." })
  @IsOptional()
  busca?: string

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
