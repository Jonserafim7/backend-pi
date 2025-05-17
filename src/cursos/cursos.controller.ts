import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
  HttpStatus,
} from "@nestjs/common"
import { CursosService } from "./cursos.service"
import { CreateCursoDto } from "./dto/create-curso.dto"
import { UpdateCursoDto } from "./dto/update-curso.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { PapelUsuario } from "@prisma/client"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger"
import { CursoResponseDto } from "./dto/curso-response.dto"

@ApiTags("cursos")
@ApiBearerAuth()
@Controller("cursos")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  /**
   * Cria um novo curso
   */
  @Post()
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Criar um novo curso" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Curso criado com sucesso",
    type: CursoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos fornecidos",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Já existe um curso com este código",
  })
  create(@Body() createCursoDto: CreateCursoDto) {
    return this.cursosService.create(createCursoDto)
  }

  /**
   * Lista todos os cursos
   */
  @Get()
  @ApiOperation({ summary: "Listar todos os cursos" })
  @ApiQuery({
    name: "incluirCoordenador",
    required: false,
    type: Boolean,
    description: "Se true, inclui os dados do coordenador na resposta",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de cursos retornada com sucesso",
    type: [CursoResponseDto],
  })
  findAll(@Query("incluirCoordenador") incluirCoordenador?: string) {
    const includeCoordinator = incluirCoordenador === "true"
    return this.cursosService.findAll(includeCoordinator)
  }

  /**
   * Busca um curso pelo ID
   */
  @Get(":id")
  @ApiOperation({ summary: "Buscar um curso pelo ID" })
  @ApiParam({
    name: "id",
    description: "ID do curso",
    type: String,
    format: "uuid",
  })
  @ApiQuery({
    name: "incluirCoordenador",
    required: false,
    type: Boolean,
    description: "Se true, inclui os dados do coordenador na resposta",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Curso encontrado",
    type: CursoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Curso não encontrado",
  })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("incluirCoordenador") incluirCoordenador?: string,
  ) {
    const includeCoordinator = incluirCoordenador !== "false" // default é true
    return this.cursosService.findOne(id, includeCoordinator)
  }

  /**
   * Atualiza um curso
   */
  @Patch(":id")
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Atualizar um curso" })
  @ApiParam({
    name: "id",
    description: "ID do curso",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Curso atualizado com sucesso",
    type: CursoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Curso não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Já existe outro curso com este código",
  })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateCursoDto: UpdateCursoDto,
  ) {
    return this.cursosService.update(id, updateCursoDto)
  }

  /**
   * Remove um curso
   */
  @Delete(":id")
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Remover um curso" })
  @ApiParam({
    name: "id",
    description: "ID do curso",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Curso removido com sucesso",
    type: CursoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Curso não encontrado",
  })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.cursosService.remove(id)
  }
}
