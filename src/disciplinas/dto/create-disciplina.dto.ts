import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator"

/**
 * DTO para criação de uma nova disciplina
 * Contém todas as informações necessárias para criar uma disciplina
 */
export class CreateDisciplinaDto {
  @ApiProperty({
    description: "Nome da disciplina",
    example: "Programação Orientada a Objetos",
    required: true,
  })
  @IsNotEmpty({ message: "O nome da disciplina é obrigatório" })
  @IsString({ message: "O nome da disciplina deve ser uma string" })
  nome!: string

  @ApiProperty({
    description: "Código único da disciplina",
    example: "POO001",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "O código da disciplina deve ser uma string" })
  codigo?: string

  @ApiProperty({
    description: "Carga horária total da disciplina em horas",
    example: 60,
    required: true,
  })
  @IsNotEmpty({ message: "A carga horária da disciplina é obrigatória" })
  @IsInt({ message: "A carga horária deve ser um número inteiro" })
  @Min(1, { message: "A carga horária deve ser maior que zero" })
  cargaHoraria!: number
}
