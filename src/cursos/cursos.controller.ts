import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
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
  async create(
    @Body() createCursoDto: CreateCursoDto,
  ): Promise<CursoResponseDto> {
    const curso = await this.cursosService.create(createCursoDto)
    return new CursoResponseDto(curso)
  }

  /**
   * Lista todos os cursos
   */
  @Get()
  @ApiOperation({ summary: "Listar todos os cursos" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de cursos retornada com sucesso",
    type: [CursoResponseDto],
  })
  async findAll(): Promise<CursoResponseDto[]> {
    const cursos = await this.cursosService.findAll()
    return cursos.map((curso) => new CursoResponseDto(curso))
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Curso encontrado",
    type: CursoResponseDto,
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<CursoResponseDto> {
    const curso = await this.cursosService.findOne(id)
    return new CursoResponseDto(curso)
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
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateCursoDto: UpdateCursoDto,
  ): Promise<CursoResponseDto> {
    const curso = await this.cursosService.update(id, updateCursoDto)
    return new CursoResponseDto(curso)
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
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<CursoResponseDto> {
    const curso = await this.cursosService.remove(id)
    return new CursoResponseDto(curso)
  }
}
