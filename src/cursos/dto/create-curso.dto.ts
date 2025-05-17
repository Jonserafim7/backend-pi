import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from "class-validator"

/**
 * DTO para criação de um novo curso
 */
export class CreateCursoDto {
  /**
   * Nome do curso
   * @example "Engenharia de Software"
   */
  @ApiProperty({
    description: "Nome do curso",
    example: "Engenharia de Software",
  })
  @IsNotEmpty({ message: "O nome do curso é obrigatório" })
  @IsString({ message: "O nome do curso deve ser uma string" })
  @Length(3, 100, { message: "O nome deve ter entre 3 e 100 caracteres" })
  nome!: string

  /**
   * Código do curso (único)
   * @example "ENG-SOFT"
   */
  @ApiProperty({
    description: "Código do curso (único)",
    example: "ENG-SOFT",
  })
  @IsNotEmpty({ message: "O código do curso é obrigatório" })
  @IsString({ message: "O código do curso deve ser uma string" })
  @Length(3, 20, { message: "O código deve ter entre 3 e 20 caracteres" })
  codigo!: string

  /**
   * ID do coordenador principal do curso (opcional na criação)
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  @ApiProperty({
    description: "ID do coordenador principal",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    required: false,
  })
  @IsOptional()
  @IsUUID("4", { message: "O ID do coordenador deve ser um UUID válido" })
  idCoordenador?: string
}
