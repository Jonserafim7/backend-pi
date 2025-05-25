import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger"
import { AlocacoesHorariosService } from "./alocacoes-horarios.service"
import {
  CreateAlocacaoHorarioDto,
  AlocacaoHorarioResponseDto,
  AlocacaoHorarioQueryDto,
  ValidateAlocacaoDto,
  ValidateAlocacaoResponseDto,
} from "./dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { PapelUsuario } from "@prisma/client"

@ApiTags("Alocações de Horário")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("alocacoes-horarios")
export class AlocacoesHorariosController {
  constructor(private readonly alocacoesService: AlocacoesHorariosService) {}

  @Post()
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @ApiOperation({
    summary: "Criar nova alocação de horário",
    description:
      "Cria uma nova alocação de horário após validar disponibilidade e conflitos",
  })
  @ApiResponse({
    status: 201,
    description: "Alocação criada com sucesso",
    type: AlocacaoHorarioResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Dados inválidos ou conflito detectado",
  })
  async create(
    @Body() dto: CreateAlocacaoHorarioDto,
  ): Promise<AlocacaoHorarioResponseDto> {
    return this.alocacoesService.create(dto)
  }

  @Post("validate")
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Validar alocação antes de criar",
    description: "Valida se uma alocação pode ser criada sem conflitos",
  })
  @ApiResponse({
    status: 200,
    description: "Resultado da validação",
    type: ValidateAlocacaoResponseDto,
  })
  async validate(
    @Body() dto: ValidateAlocacaoDto,
  ): Promise<ValidateAlocacaoResponseDto> {
    return this.alocacoesService.validateAlocacao(dto)
  }

  @Get()
  @Roles(
    PapelUsuario.COORDENADOR,
    PapelUsuario.DIRETOR,
    PapelUsuario.ADMIN,
    PapelUsuario.PROFESSOR,
  )
  @ApiOperation({
    summary: "Buscar alocações com filtros",
    description: "Busca alocações aplicando filtros opcionais",
  })
  @ApiQuery({
    name: "idTurma",
    required: false,
    description: "Filtrar por ID da turma",
  })
  @ApiQuery({
    name: "idProfessor",
    required: false,
    description: "Filtrar por ID do professor",
  })
  @ApiQuery({
    name: "idPeriodoLetivo",
    required: false,
    description: "Filtrar por período letivo",
  })
  @ApiQuery({
    name: "diaDaSemana",
    required: false,
    description: "Filtrar por dia da semana",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de alocações encontradas",
    type: [AlocacaoHorarioResponseDto],
  })
  async findMany(
    @Query() query: AlocacaoHorarioQueryDto,
  ): Promise<AlocacaoHorarioResponseDto[]> {
    return this.alocacoesService.findMany(query)
  }

  @Get("turma/:idTurma")
  @Roles(
    PapelUsuario.COORDENADOR,
    PapelUsuario.DIRETOR,
    PapelUsuario.ADMIN,
    PapelUsuario.PROFESSOR,
  )
  @ApiOperation({
    summary: "Buscar alocações por turma",
    description: "Busca todas as alocações de uma turma específica",
  })
  @ApiParam({ name: "idTurma", description: "ID da turma" })
  @ApiResponse({
    status: 200,
    description: "Lista de alocações da turma",
    type: [AlocacaoHorarioResponseDto],
  })
  async findByTurma(
    @Param("idTurma") idTurma: string,
  ): Promise<AlocacaoHorarioResponseDto[]> {
    return this.alocacoesService.findByTurma(idTurma)
  }

  @Get("professor/:idProfessor")
  @Roles(
    PapelUsuario.COORDENADOR,
    PapelUsuario.DIRETOR,
    PapelUsuario.ADMIN,
    PapelUsuario.PROFESSOR,
  )
  @ApiOperation({
    summary: "Buscar alocações por professor",
    description: "Busca todas as alocações de um professor específico",
  })
  @ApiParam({ name: "idProfessor", description: "ID do professor" })
  @ApiResponse({
    status: 200,
    description: "Lista de alocações do professor",
    type: [AlocacaoHorarioResponseDto],
  })
  async findByProfessor(
    @Param("idProfessor") idProfessor: string,
  ): Promise<AlocacaoHorarioResponseDto[]> {
    return this.alocacoesService.findByProfessor(idProfessor)
  }

  @Delete(":id")
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Remover alocação",
    description: "Remove uma alocação de horário existente",
  })
  @ApiParam({ name: "id", description: "ID da alocação" })
  @ApiResponse({
    status: 204,
    description: "Alocação removida com sucesso",
  })
  @ApiResponse({
    status: 404,
    description: "Alocação não encontrada",
  })
  async delete(@Param("id") id: string): Promise<void> {
    return this.alocacoesService.delete(id)
  }
}
