import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, IsEnum } from "class-validator"
import { DiaSemana } from "@prisma/client"

export class CreateAlocacaoHorarioDto {
  @ApiProperty({
    description: "ID da turma que será alocada",
    example: "clx1234567890abcdef",
  })
  @IsNotEmpty()
  @IsString()
  idTurma: string

  @ApiProperty({
    description: "Dia da semana para a alocação",
    enum: DiaSemana,
    example: DiaSemana.SEGUNDA,
  })
  @IsNotEmpty()
  @IsEnum(DiaSemana)
  diaDaSemana: DiaSemana

  @ApiProperty({
    description: "Hora de início da aula (formato HH:mm)",
    example: "08:00",
  })
  @IsNotEmpty()
  @IsString()
  horaInicio: string

  @ApiProperty({
    description: "Hora de fim da aula (formato HH:mm)",
    example: "09:40",
  })
  @IsNotEmpty()
  @IsString()
  horaFim: string
}
