import { ApiProperty } from "@nestjs/swagger"
import { Curso, Usuario } from "@prisma/client"
import { Type } from "class-transformer"
import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator"

/**
 * DTO simplificado para informações do Coordenador
 */
export class CoordenadorSimplificadoDto {
  @ApiProperty({
    description: "ID único do coordenador no formato UUID v4",
    example: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  })
  @IsUUID(4)
  id: string

  @ApiProperty({
    description: "Nome completo do coordenador",
    example: "Dr. Ana Silva",
  })
  @IsString()
  @IsNotEmpty()
  nome: string

  @ApiProperty({
    description: "Email do coordenador",
    example: "ana.silva@example.com",
  })
  @IsString()
  @IsNotEmpty()
  email: string

  constructor(coordenador: Pick<Usuario, "id" | "nome" | "email">) {
    this.id = coordenador.id
    this.nome = coordenador.nome
    this.email = coordenador.email
  }
}

/**
 * DTO para resposta de dados de um curso
 */
export class CursoResponseDto {
  @ApiProperty({
    description: "ID único do curso no formato UUID v4",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  @IsUUID(4)
  id: string

  @ApiProperty({
    description: "Nome completo do curso",
    example: "Engenharia de Software",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  nome: string

  @ApiProperty({
    description: "Código único de identificação do curso",
    example: "ENG-SOFT-2023",
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  codigo: string

  @ApiProperty({
    description: "Data de criação do registro no formato ISO 8601",
    example: "2025-05-16T12:00:00.000Z",
  })
  @IsDateString()
  dataCriacao: Date

  @ApiProperty({
    description: "Data da última atualização no formato ISO 8601",
    example: "2025-05-16T15:30:00.000Z",
  })
  @IsDateString()
  dataAtualizacao: Date

  @ApiProperty({
    description: "Coordenador principal do curso",
    type: () => CoordenadorSimplificadoDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordenadorSimplificadoDto)
  @IsObject()
  coordenadorPrincipal?: CoordenadorSimplificadoDto

  constructor(
    curso: Curso & {
      coordenadorPrincipal?: Pick<Usuario, "id" | "nome" | "email"> | null
    },
  ) {
    this.id = curso.id
    this.nome = curso.nome
    this.codigo = curso.codigo || ""
    this.dataCriacao = curso.dataCriacao
    this.dataAtualizacao = curso.dataAtualizacao
    if (curso.coordenadorPrincipal) {
      this.coordenadorPrincipal = new CoordenadorSimplificadoDto(
        curso.coordenadorPrincipal,
      )
    }
  }
}
