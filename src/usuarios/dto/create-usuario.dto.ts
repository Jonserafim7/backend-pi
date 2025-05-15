import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { PapelUsuario } from "@prisma/client"

export class CreateUsuarioDto {
  @ApiProperty({
    description: "Nome completo do usuário",
    example: "João da Silva",
  })
  @IsString({ message: "O nome deve ser uma string." })
  @IsNotEmpty({ message: "O nome não pode estar vazio." })
  nome: string

  @ApiProperty({
    description: "Endereço de e-mail do usuário (será usado para login)",
    example: "joao.silva@example.com",
  })
  @IsEmail({}, { message: "O e-mail fornecido não é válido." })
  @IsNotEmpty({ message: "O e-mail não pode estar vazio." })
  email: string

  @ApiProperty({
    description: "Senha do usuário (mínimo de 8 caracteres)",
    example: "secret123",
    minLength: 8,
  })
  @IsString({ message: "A senha deve ser uma string." })
  @MinLength(8, { message: "A senha deve ter no mínimo 8 caracteres." })
  @IsNotEmpty({ message: "A senha não pode estar vazia." })
  senha: string // A senha será "crua" aqui, o hash é feito no service

  @ApiProperty({
    description: "Papel do usuário no sistema",
    enum: PapelUsuario,
    example: PapelUsuario.PROFESSOR,
  })
  @IsEnum(PapelUsuario, { message: "Papel de usuário inválido." })
  @IsNotEmpty({ message: "O papel do usuário não pode estar vazio." })
  papel: PapelUsuario
}
