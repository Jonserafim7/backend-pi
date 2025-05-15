import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator"

export class SignInDto {
  @ApiProperty({
    description: "Endereço de e-mail do usuário para login",
    example: "joao.silva@example.com",
  })
  @IsEmail({}, { message: "O e-mail fornecido não é válido." })
  @IsNotEmpty({ message: "O e-mail não pode estar vazio." })
  email: string

  @ApiProperty({
    description: "Senha do usuário (mínimo de 8 caracteres)",
    example: "secret123",
  })
  @IsString({ message: "A senha deve ser uma string." })
  @MinLength(8, { message: "A senha deve ter no mínimo 8 caracteres." })
  @IsNotEmpty({ message: "A senha não pode estar vazia." })
  senha: string
}
