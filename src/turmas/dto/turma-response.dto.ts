import { ApiProperty } from "@nestjs/swagger"
import { DisciplinaOfertadaResponseDto } from "../../disciplinas-ofertadas/dto/disciplina-ofertada-response.dto" // Assuming path
// import { UsuarioResponseDto } from "../../usuarios/dto/usuario-response.dto"; // If we include professor

export class TurmaResponseDto {
  @ApiProperty({ description: "ID da turma", example: "uuid-turma-123" })
  id!: string

  @ApiProperty({ description: "Código/identificador da turma", example: "T1" })
  codigoDaTurma!: string

  @ApiProperty({
    description: "ID da disciplina ofertada à qual esta turma pertence.",
    example: "uuid-disciplina-ofertada-456",
  })
  idDisciplinaOfertada!: string

  // Optional: Include the full DisciplinaOfertada object
  @ApiProperty({
    description: "Detalhes da disciplina ofertada",
    type: () => DisciplinaOfertadaResponseDto,
    required: false,
  })
  disciplinaOfertada?: DisciplinaOfertadaResponseDto

  // Optional: Include professor assigned
  // @ApiProperty({ description: "ID do professor atribuído", example: "uuid-professor-789", required: false })
  // idProfessor?: string;

  // @ApiProperty({ description: "Detalhes do professor", type: () => UsuarioResponseDto, required: false })
  // professor?: UsuarioResponseDto;

  @ApiProperty({ description: "Data de criação da turma" })
  dataCriacao!: Date

  @ApiProperty({ description: "Data da última atualização da turma" })
  dataAtualizacao!: Date
}
