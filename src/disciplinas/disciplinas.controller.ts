import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common"
import { DisciplinasService } from "./disciplinas.service"
import { CreateDisciplinaDto } from "./dto/create-disciplina.dto"
import { UpdateDisciplinaDto } from "./dto/update-disciplina.dto"
import { DisciplinaResponseDto } from "./dto/disciplina-response.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { PapelUsuario } from "@prisma/client"
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger"
import { CurrentUser } from "../auth/decorators/current-user.decorator"

/**
 * Controlador para gerenciamento de disciplinas
 * Define os endpoints da API para operações CRUD de disciplinas
 */
@ApiTags("disciplinas")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("disciplinas")
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  /**
   * Cria uma nova disciplina
   */
  @Post()
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Criar uma nova disciplina" })
  @ApiResponse({
    status: 201,
    description: "Disciplina criada com sucesso",
    type: DisciplinaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Dados inválidos fornecidos",
  })
  @ApiResponse({
    status: 409,
    description: "Já existe uma disciplina com este código",
  })
  @ApiResponse({
    status: 401,
    description: "Não autorizado - Token JWT ausente ou inválido",
  })
  @ApiResponse({
    status: 403,
    description: "Proibido - Usuário não tem permissão para esta ação",
  })
  create(
    @Body() createDisciplinaDto: CreateDisciplinaDto,
  ): Promise<DisciplinaResponseDto> {
    return this.disciplinasService.create(createDisciplinaDto)
  }

  /**
   * Lista todas as disciplinas com opção de filtros
   */
  @Get()
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN, PapelUsuario.PROFESSOR)
  @ApiOperation({ summary: "Listar todas as disciplinas" })
  @ApiQuery({
    name: "nome",
    required: false,
    description: "Filtrar disciplinas por nome (pesquisa parcial)",
    type: String,
  })
  @ApiQuery({
    name: "codigo",
    required: false,
    description: "Filtrar disciplinas por código (pesquisa parcial)",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Lista de disciplinas recuperada com sucesso",
    type: [DisciplinaResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Não autorizado - Token JWT ausente ou inválido",
  })
  findAll(
    @Query("nome") nome?: string,
    @Query("codigo") codigo?: string,
  ): Promise<DisciplinaResponseDto[]> {
    return this.disciplinasService.findAll(nome, codigo)
  }

  /**
   * Busca uma disciplina específica pelo ID
   */
  @Get(":id")
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN, PapelUsuario.PROFESSOR)
  @ApiOperation({ summary: "Buscar disciplina por ID" })
  @ApiParam({
    name: "id",
    description: "ID da disciplina a ser buscada",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Disciplina encontrada com sucesso",
    type: DisciplinaResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Disciplina não encontrada",
  })
  @ApiResponse({
    status: 401,
    description: "Não autorizado - Token JWT ausente ou inválido",
  })
  findOne(@Param("id") id: string): Promise<DisciplinaResponseDto> {
    return this.disciplinasService.findOne(id)
  }

  /**
   * Atualiza uma disciplina existente
   */
  @Patch(":id")
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Atualizar disciplina por ID" })
  @ApiParam({
    name: "id",
    description: "ID da disciplina a ser atualizada",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Disciplina atualizada com sucesso",
    type: DisciplinaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Dados inválidos fornecidos",
  })
  @ApiResponse({
    status: 404,
    description: "Disciplina não encontrada",
  })
  @ApiResponse({
    status: 409,
    description:
      "O código informado já está sendo utilizado por outra disciplina",
  })
  @ApiResponse({
    status: 401,
    description: "Não autorizado - Token JWT ausente ou inválido",
  })
  @ApiResponse({
    status: 403,
    description: "Proibido - Usuário não tem permissão para esta ação",
  })
  update(
    @Param("id") id: string,
    @Body() updateDisciplinaDto: UpdateDisciplinaDto,
  ): Promise<DisciplinaResponseDto> {
    return this.disciplinasService.update(id, updateDisciplinaDto)
  }

  /**
   * Remove uma disciplina do sistema
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Remover disciplina por ID" })
  @ApiParam({
    name: "id",
    description: "ID da disciplina a ser removida",
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: "Disciplina removida com sucesso",
  })
  @ApiResponse({
    status: 404,
    description: "Disciplina não encontrada",
  })
  @ApiResponse({
    status: 409,
    description:
      "Disciplina não pode ser excluída devido a associações existentes",
  })
  @ApiResponse({
    status: 401,
    description: "Não autorizado - Token JWT ausente ou inválido",
  })
  @ApiResponse({
    status: 403,
    description: "Proibido - Usuário não tem permissão para esta ação",
  })
  async remove(@Param("id") id: string): Promise<void> {
    await this.disciplinasService.remove(id)
  }

  /**
   * Lista disciplinas das matrizes curriculares dos cursos que o coordenador coordena
   *
   * Endpoint específico para coordenadores que retorna apenas as disciplinas
   * que fazem parte das matrizes curriculares dos cursos sob sua coordenação
   */
  @ApiOperation({
    summary: "Listar disciplinas das matrizes do coordenador logado",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de disciplinas das matrizes curriculares do coordenador",
    type: [DisciplinaResponseDto],
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 403, description: "Acesso proibido" })
  @Roles(PapelUsuario.COORDENADOR)
  @Get("coordenador/minhas-disciplinas")
  findDisciplinasDoCoordenador(
    @CurrentUser() user: { id: string; email: string; papel: PapelUsuario },
  ): Promise<DisciplinaResponseDto[]> {
    return this.disciplinasService.findDisciplinasDoCoordenador(user.id)
  }
}
