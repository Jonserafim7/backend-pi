import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common"
import { MatrizesCurricularesService } from "./matrizes-curriculares.service"
import { CreateMatrizCurricularDto } from "./dto/create-matriz-curricular.dto"
import { UpdateMatrizCurricularDto } from "./dto/update-matriz-curricular.dto"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger"
import { MatrizCurricularResponseDto } from "./dto/matriz-curricular-response.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { CurrentUser } from "../auth/decorators/current-user.decorator"
import { PapelUsuario } from "@prisma/client"

/**
 * Controlador para o gerenciamento de Matrizes Curriculares
 *
 * Permite que coordenadores criem, visualizem, atualizem e removam matrizes curriculares
 * para os cursos sob sua responsabilidade.
 */
@ApiTags("matrizes-curriculares")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("matrizes-curriculares")
export class MatrizesCurricularesController {
  constructor(
    private readonly matrizesCurricularesService: MatrizesCurricularesService,
  ) {}

  /**
   * Cria uma nova matriz curricular
   *
   * Endpoint que permite a criação de uma matriz curricular e associação com disciplinas.
   * O curso é automaticamente identificado através do coordenador logado.
   */
  @ApiOperation({ summary: "Criar nova matriz curricular" })
  @ApiResponse({
    status: 201,
    description: "Matriz curricular criada com sucesso",
    type: MatrizCurricularResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Requisição inválida (dados inválidos ou nome já existe para o curso)",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 403, description: "Acesso proibido" })
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @Post()
  create(
    @Body() createMatrizCurricularDto: CreateMatrizCurricularDto,
    @CurrentUser() user: { id: string; email: string; papel: PapelUsuario },
  ): Promise<MatrizCurricularResponseDto> {
    return this.matrizesCurricularesService.create(
      createMatrizCurricularDto,
      user.id,
    )
  }

  /**
   * Lista todas as matrizes curriculares
   *
   * Endpoint que retorna todas as matrizes curriculares ou filtra por curso
   */
  @ApiOperation({ summary: "Listar todas as matrizes curriculares" })
  @ApiResponse({
    status: 200,
    description: "Lista de matrizes curriculares",
    type: [MatrizCurricularResponseDto],
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiQuery({
    name: "idCurso",
    required: false,
    description: "ID do curso para filtrar matrizes curriculares",
  })
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN, PapelUsuario.DIRETOR)
  @Get()
  findAll(
    @Query("idCurso") idCurso?: string,
  ): Promise<MatrizCurricularResponseDto[]> {
    return this.matrizesCurricularesService.findAll(idCurso)
  }

  /**
   * Lista matrizes curriculares do coordenador logado
   *
   * Endpoint que retorna apenas as matrizes curriculares dos cursos que o coordenador coordena
   */
  @ApiOperation({ summary: "Listar matrizes curriculares do coordenador logado" })
  @ApiResponse({
    status: 200,
    description: "Lista de matrizes curriculares do coordenador",
    type: [MatrizCurricularResponseDto],
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 403, description: "Acesso proibido" })
  @Roles(PapelUsuario.COORDENADOR)
  @Get("coordenador/minhas-matrizes")
  findMatrizesDoCoordenador(
    @CurrentUser() user: { id: string; email: string; papel: PapelUsuario },
  ): Promise<MatrizCurricularResponseDto[]> {
    return this.matrizesCurricularesService.findMatrizesDoCoordenador(user.id)
  }

  /**
   * Busca uma matriz curricular específica
   *
   * Endpoint que retorna os detalhes de uma matriz curricular pelo seu ID
   */
  @ApiOperation({ summary: "Buscar matriz curricular por ID" })
  @ApiResponse({
    status: 200,
    description: "Matriz curricular encontrada",
    type: MatrizCurricularResponseDto,
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 404, description: "Matriz curricular não encontrada" })
  @ApiParam({
    name: "id",
    description: "ID da matriz curricular",
  })
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN, PapelUsuario.DIRETOR)
  @Get(":id")
  findOne(@Param("id") id: string): Promise<MatrizCurricularResponseDto> {
    return this.matrizesCurricularesService.findOne(id)
  }

  /**
   * Atualiza uma matriz curricular
   *
   * Endpoint que permite a atualização de uma matriz curricular e suas disciplinas
   */
  @ApiOperation({ summary: "Atualizar matriz curricular" })
  @ApiResponse({
    status: 200,
    description: "Matriz curricular atualizada com sucesso",
    type: MatrizCurricularResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Requisição inválida (dados inválidos ou nome já existe para o curso)",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 403, description: "Acesso proibido" })
  @ApiResponse({ status: 404, description: "Matriz curricular não encontrada" })
  @ApiParam({
    name: "id",
    description: "ID da matriz curricular",
  })
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateMatrizCurricularDto: UpdateMatrizCurricularDto,
  ): Promise<MatrizCurricularResponseDto> {
    return this.matrizesCurricularesService.update(id, updateMatrizCurricularDto)
  }

  /**
   * Remove uma matriz curricular
   *
   * Endpoint que permite a remoção de uma matriz curricular e suas associações
   */
  @ApiOperation({ summary: "Remover matriz curricular" })
  @ApiResponse({
    status: 204,
    description: "Matriz curricular removida com sucesso",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 403, description: "Acesso proibido" })
  @ApiResponse({ status: 404, description: "Matriz curricular não encontrada" })
  @ApiResponse({
    status: 409,
    description: "Conflito - Não é possível remover matriz curricular em uso",
  })
  @ApiParam({
    name: "id",
    description: "ID da matriz curricular",
  })
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string): Promise<void> {
    return this.matrizesCurricularesService.remove(id)
  }
}
