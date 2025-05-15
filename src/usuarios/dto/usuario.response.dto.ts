import { ApiProperty } from "@nestjs/swagger"
import { PapelUsuario } from "@prisma/client"

export class UsuarioResponseDto {
  @ApiProperty({
    example: "clq1g0qj4000008mmn07765x7",
    description: "ID único do usuário",
  })
  id: string

  @ApiProperty({
    example: "João da Silva",
    description: "Nome completo do usuário",
  })
  nome: string

  @ApiProperty({
    example: "joao.silva@example.com",
    description: "Endereço de e-mail do usuário",
  })
  email: string

  @ApiProperty({
    enum: PapelUsuario,
    example: PapelUsuario.PROFESSOR,
    description: "Papel do usuário no sistema",
  })
  papel: PapelUsuario

  @ApiProperty({
    example: "2023-01-01T10:00:00.000Z",
    description: "Data de criação do usuário",
  })
  dataCriacao: Date

  @ApiProperty({
    example: "2023-01-02T11:00:00.000Z",
    description: "Data da última atualização do usuário",
  })
  dataAtualizacao: Date

  // Nota: Não incluímos hashSenha ou outras informações sensíveis.
  // Relações como 'cursosCoordenados', 'disponibilidades', etc., seriam incluídas aqui
  // se precisarmos retorná-las diretamente com o usuário e se forem transformadas em DTOs de resposta apropriados.
  // Por enquanto, manteremos simples.
}
