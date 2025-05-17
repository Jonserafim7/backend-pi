import { ApiProperty } from "@nestjs/swagger"
import { PapelUsuario } from "@prisma/client"
import { IsString, IsUUID, IsEnum, IsDateString } from "class-validator"
import { Usuario } from "@prisma/client"

export class UsuarioResponseDto {
  @ApiProperty({
    example: "clq1g0qj4000008mmn07765x7",
    description: "ID único do usuário",
  })
  @IsUUID()
  id: string

  @ApiProperty({
    example: "João da Silva",
    description: "Nome completo do usuário",
  })
  @IsString()
  nome: string

  @ApiProperty({
    example: "joao.silva@example.com",
    description: "Endereço de e-mail do usuário",
  })
  @IsString()
  email: string

  @ApiProperty({
    enum: PapelUsuario,
    example: PapelUsuario.PROFESSOR,
    description: "Papel do usuário no sistema",
  })
  @IsEnum(PapelUsuario)
  papel: PapelUsuario

  @ApiProperty({
    example: "2023-01-01T10:00:00.000Z",
    description: "Data de criação do usuário",
  })
  @IsDateString()
  dataCriacao: Date

  @ApiProperty({
    example: "2023-01-02T11:00:00.000Z",
    description: "Data da última atualização do usuário",
  })
  @IsDateString()
  dataAtualizacao: Date

  constructor(usuario: Usuario) {
    this.id = usuario.id
    this.nome = usuario.nome
    this.email = usuario.email
    this.papel = usuario.papel
    this.dataCriacao = usuario.dataCriacao
    this.dataAtualizacao = usuario.dataAtualizacao
  }
}
