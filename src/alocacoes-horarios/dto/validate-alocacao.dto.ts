import { ApiProperty } from "@nestjs/swagger"
import { CreateAlocacaoHorarioDto } from "./create-alocacao-horario.dto"

export class ValidateAlocacaoDto extends CreateAlocacaoHorarioDto {}

export class ValidateAlocacaoResponseDto {
  @ApiProperty({
    description: "Indica se a alocação é válida",
    example: true,
  })
  valid: boolean

  @ApiProperty({
    description: "Mensagem de erro caso a alocação seja inválida",
    example: "Professor não está disponível neste horário",
    required: false,
  })
  error?: string

  @ApiProperty({
    description: "Detalhes adicionais sobre a validação",
    required: false,
  })
  details?: {
    professorDisponivel: boolean
    conflitosDetectados: string[]
    horarioValido: boolean
  }
}
