import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
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
import { DisponibilidadeProfessorService } from "./disponibilidade-professor.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { CurrentUser } from "../auth/decorators/current-user.decorator"
import { PapelUsuario } from "@prisma/client"
import {
  CreateDisponibilidadeDto,
  UpdateDisponibilidadeDto,
  DisponibilidadeResponseDto,
  ListarDisponibilidadesQueryDto,
} from "./dto"

/**
 * Interface para o usuário autenticado
 */
interface UserContext {
  id: string
  papel: PapelUsuario
  email: string
}

/**
 * Controller para gestão de disponibilidade de professores
 * Endpoints RESTful para CRUD completo de disponibilidades
 */
@ApiTags("Disponibilidade de Professores")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("disponibilidades")
export class DisponibilidadeProfessorController {
  constructor(
    private readonly disponibilidadeService: DisponibilidadeProfessorService,
  ) {}

  /**
   * Criar nova disponibilidade de professor
   */
  @Post()
  @Roles(PapelUsuario.PROFESSOR, PapelUsuario.ADMIN, PapelUsuario.DIRETOR)
  @ApiOperation({
    summary: "Criar nova disponibilidade",
    description:
      "Cria uma nova disponibilidade para um professor. Apenas o próprio professor, admin ou diretor podem criar.",
  })
  @ApiResponse({
    status: 201,
    description: "Disponibilidade criada com sucesso",
    type: DisponibilidadeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Dados inválidos ou conflito de horário",
  })
  @ApiResponse({
    status: 403,
    description: "Sem permissão para criar disponibilidade para este professor",
  })
  @ApiResponse({
    status: 404,
    description: "Professor ou período letivo não encontrado",
  })
  async create(
    @Body() createDto: CreateDisponibilidadeDto,
    @CurrentUser() user: UserContext,
  ): Promise<DisponibilidadeResponseDto> {
    console.log("🎯 [Controller.create] Endpoint chamado!")
    console.log("🎯 [Controller.create] DTO recebido:", createDto)
    console.log("🎯 [Controller.create] Usuário:", user)

    try {
      const result = await this.disponibilidadeService.create(createDto, user)
      console.log("✅ [Controller.create] Sucesso:", result)
      return result
    } catch (error) {
      console.error("❌ [Controller.create] Erro:", error)
      throw error
    }
  }

  /**
   * Listar disponibilidades com filtros e paginação
   */
  @Get()
  @Roles(
    PapelUsuario.PROFESSOR,
    PapelUsuario.COORDENADOR,
    PapelUsuario.ADMIN,
    PapelUsuario.DIRETOR,
  )
  @ApiOperation({
    summary: "Listar disponibilidades",
    description:
      "Lista disponibilidades com filtros opcionais e paginação. Professores veem apenas suas próprias.",
  })
  @ApiQuery({
    name: "professorId",
    required: false,
    description: "Filtrar por ID do professor",
  })
  @ApiQuery({
    name: "periodoLetivoId",
    required: false,
    description: "Filtrar por ID do período letivo",
  })
  @ApiQuery({
    name: "diaSemana",
    required: false,
    description: "Filtrar por dia da semana",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filtrar por status",
  })
  @ApiQuery({ name: "page", required: false, description: "Página (padrão: 1)" })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Itens por página (padrão: 10)",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de disponibilidades",
    schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: { $ref: "#/components/schemas/DisponibilidadeResponseDto" },
        },
        total: { type: "number" },
        page: { type: "number" },
        limit: { type: "number" },
        totalPages: { type: "number" },
      },
    },
  })
  async findAll(
    @Query() query: ListarDisponibilidadesQueryDto,
    @CurrentUser() user: UserContext,
  ) {
    // Se é professor, força filtro por seu próprio ID
    const finalQuery = {
      ...query,
      ...(user.papel === PapelUsuario.PROFESSOR && { professorId: user.id }),
    }

    if (finalQuery.professorId) {
      return this.disponibilidadeService.findByProfessor(
        finalQuery.professorId,
        finalQuery,
      )
    }

    if (finalQuery.periodoLetivoId) {
      return this.disponibilidadeService.findByPeriodo(
        finalQuery.periodoLetivoId,
        finalQuery,
      )
    }

    // Se não tem filtros específicos, busca por professor (para professores) ou período ativo (para outros)
    if (user.papel === PapelUsuario.PROFESSOR) {
      return this.disponibilidadeService.findByProfessor(user.id, finalQuery)
    }

    // Para outros papéis sem filtros específicos, retorna todas com paginação básica
    // TODO: Implementar busca genérica ou buscar por período ativo
    return this.disponibilidadeService.findByProfessor("", finalQuery) // Temporário
  }

  /**
   * Buscar disponibilidade específica por ID
   */
  @Get(":id")
  @Roles(
    PapelUsuario.PROFESSOR,
    PapelUsuario.COORDENADOR,
    PapelUsuario.ADMIN,
    PapelUsuario.DIRETOR,
  )
  @ApiOperation({
    summary: "Buscar disponibilidade por ID",
    description: "Busca uma disponibilidade específica pelo ID",
  })
  @ApiParam({ name: "id", description: "ID da disponibilidade" })
  @ApiResponse({
    status: 200,
    description: "Disponibilidade encontrada",
    type: DisponibilidadeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Disponibilidade não encontrada",
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<DisponibilidadeResponseDto> {
    return this.disponibilidadeService.findById(id)
  }

  /**
   * Listar disponibilidades de um professor específico
   */
  @Get("professor/:professorId")
  @Roles(
    PapelUsuario.PROFESSOR,
    PapelUsuario.COORDENADOR,
    PapelUsuario.ADMIN,
    PapelUsuario.DIRETOR,
  )
  @ApiOperation({
    summary: "Listar disponibilidades por professor",
    description: "Lista todas as disponibilidades de um professor específico",
  })
  @ApiParam({ name: "professorId", description: "ID do professor" })
  @ApiResponse({
    status: 200,
    description: "Lista de disponibilidades do professor",
  })
  async findByProfessor(
    @Param("professorId", ParseUUIDPipe) professorId: string,
    @Query() query: ListarDisponibilidadesQueryDto,
    @CurrentUser() user: UserContext,
  ) {
    // Professores só podem ver suas próprias disponibilidades
    if (user.papel === PapelUsuario.PROFESSOR && user.id !== professorId) {
      professorId = user.id
    }

    return this.disponibilidadeService.findByProfessor(professorId, query)
  }

  /**
   * Listar disponibilidades de um período letivo
   */
  @Get("periodo/:periodoId")
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN, PapelUsuario.DIRETOR)
  @ApiOperation({
    summary: "Listar disponibilidades por período",
    description:
      "Lista todas as disponibilidades de um período letivo específico",
  })
  @ApiParam({ name: "periodoId", description: "ID do período letivo" })
  @ApiResponse({
    status: 200,
    description: "Lista de disponibilidades do período",
  })
  async findByPeriodo(
    @Param("periodoId", ParseUUIDPipe) periodoId: string,
    @Query() query: ListarDisponibilidadesQueryDto,
  ) {
    return this.disponibilidadeService.findByPeriodo(periodoId, query)
  }

  /**
   * Listar disponibilidades de um professor em um período específico
   */
  @Get("professor/:professorId/periodo/:periodoId")
  @Roles(
    PapelUsuario.PROFESSOR,
    PapelUsuario.COORDENADOR,
    PapelUsuario.ADMIN,
    PapelUsuario.DIRETOR,
  )
  @ApiOperation({
    summary: "Listar disponibilidades por professor e período",
    description:
      "Lista disponibilidades de um professor em um período letivo específico",
  })
  @ApiParam({ name: "professorId", description: "ID do professor" })
  @ApiParam({ name: "periodoId", description: "ID do período letivo" })
  @ApiResponse({
    status: 200,
    description: "Lista de disponibilidades do professor no período",
    type: [DisponibilidadeResponseDto],
  })
  async findByProfessorAndPeriodo(
    @Param("professorId", ParseUUIDPipe) professorId: string,
    @Param("periodoId", ParseUUIDPipe) periodoId: string,
    @Query()
    query: Omit<
      ListarDisponibilidadesQueryDto,
      "professorId" | "periodoLetivoId"
    >,
    @CurrentUser() user: UserContext,
  ): Promise<DisponibilidadeResponseDto[]> {
    // Professores só podem ver suas próprias disponibilidades
    if (user.papel === PapelUsuario.PROFESSOR && user.id !== professorId) {
      professorId = user.id
    }

    return this.disponibilidadeService.findByProfessorAndPeriodo(
      professorId,
      periodoId,
      query,
    )
  }

  /**
   * Atualizar disponibilidade existente
   */
  @Put(":id")
  @Roles(PapelUsuario.PROFESSOR, PapelUsuario.ADMIN, PapelUsuario.DIRETOR)
  @ApiOperation({
    summary: "Atualizar disponibilidade",
    description:
      "Atualiza uma disponibilidade existente. Apenas o próprio professor, admin ou diretor podem atualizar.",
  })
  @ApiParam({ name: "id", description: "ID da disponibilidade" })
  @ApiResponse({
    status: 200,
    description: "Disponibilidade atualizada com sucesso",
    type: DisponibilidadeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Dados inválidos ou conflito de horário",
  })
  @ApiResponse({
    status: 403,
    description: "Sem permissão para atualizar esta disponibilidade",
  })
  @ApiResponse({
    status: 404,
    description: "Disponibilidade não encontrada",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDisponibilidadeDto,
    @CurrentUser() user: UserContext,
  ): Promise<DisponibilidadeResponseDto> {
    return this.disponibilidadeService.update(id, updateDto, user)
  }

  /**
   * Remover disponibilidade
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(PapelUsuario.PROFESSOR, PapelUsuario.ADMIN, PapelUsuario.DIRETOR)
  @ApiOperation({
    summary: "Remover disponibilidade",
    description:
      "Remove uma disponibilidade existente. Apenas o próprio professor, admin ou diretor podem remover.",
  })
  @ApiParam({ name: "id", description: "ID da disponibilidade" })
  @ApiResponse({
    status: 204,
    description: "Disponibilidade removida com sucesso",
  })
  @ApiResponse({
    status: 403,
    description: "Sem permissão para remover esta disponibilidade",
  })
  @ApiResponse({
    status: 404,
    description: "Disponibilidade não encontrada",
  })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<void> {
    return this.disponibilidadeService.remove(id, user)
  }
}
