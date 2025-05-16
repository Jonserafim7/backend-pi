import { ApiProperty } from "@nestjs/swagger"
import { UsuarioResponseDto } from "../../usuarios/dto/usuario.response.dto"

export class AuthResponseDto {
  @ApiProperty({
    description: "Token de acesso JWT",
    example:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  })
  accessToken: string

  @ApiProperty({
    description: "Dados do usuário autenticado",
    type: () => UsuarioResponseDto,
  })
  usuario: UsuarioResponseDto

  constructor(accessToken: string, usuario: UsuarioResponseDto) {
    this.accessToken = accessToken
    this.usuario = usuario
  }
}
