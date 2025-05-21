import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class CreateTurmaDto {
  @ApiProperty({
    description: "ID da disciplina ofertada à qual esta turma pertence.",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @IsString()
  @IsNotEmpty()
  idDisciplinaOfertada!: string

  @ApiProperty({
    description: "Código/identificador da turma (ex: T1, T2, A, B).",
    example: "T1",
  })
  @IsString()
  @IsNotEmpty()
  codigoDaTurma!: string

  // Outros campos relevantes podem ser adicionados aqui, como idProfessor, etc.
  // Mas para a criação automática inicial, apenas idDisciplinaOfertada e nome (identificador) são essenciais.
}
