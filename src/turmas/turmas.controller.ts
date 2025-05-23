import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  NotFoundException,
  Req,
  ForbiddenException,
} from "@nestjs/common"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger"
import { TurmasService } from "./turmas.service"
import { TurmaResponseDto } from "./dto/turma-response.dto"
import { CreateTurmaDto } from "./dto/create-turma.dto"
import { UpdateTurmaDto } from "./dto/update-turma.dto"
import { AtribuirProfessorDto } from "./dto/atribuir-professor.dto"
import { ListarTurmasQueryDto } from "./dto/listar-turmas-query.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { PapelUsuario } from "@prisma/client"
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface"
// import { RolesGuard } from "../auth/guards/roles.guard"; // If needed for specific roles
// import { Roles } from "../auth/decorators/roles.decorator"; // If needed
// import { PapelUsuario } from "@prisma/client"; // If using Roles

@ApiTags("Turmas")
@Controller("turmas")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Apply auth to all routes in this controller
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  @Post()
  @ApiOperation({ summary: "Criar uma nova turma (Coordenador)" })
  @ApiResponse({
    status: 201,
    description: "Turma criada com sucesso.",
    type: TurmaResponseDto,
  })
  @ApiResponse({ status: 400, description: "Parâmetros inválidos." })
  @ApiResponse({ status: 403, description: "Acesso negado." })
  // @Roles(PapelUsuario.COORDENADOR, PapelUsuario.DIRETOR, PapelUsuario.PROFESSOR) // Example roles
  // @UseGuards(RolesGuard) // Apply role guard if needed
  async create(
    @Body() createTurmaDto: CreateTurmaDto,
    @Req() request: RequestWithUser,
  ): Promise<TurmaResponseDto> {
    const user = request.user
    if (user.papel !== PapelUsuario.COORDENADOR) {
      throw new ForbiddenException("Apenas coordenadores podem criar turmas.")
    }
    return this.turmasService.create(createTurmaDto)
  }

  @Get()
  @ApiOperation({ summary: "Listar turmas com filtros (Coordenador, Diretor)" })
  @ApiQuery({
    name: "idDisciplinaOfertada",
    required: false,
    type: String,
    description: "ID da disciplina ofertada para filtrar",
  })
  @ApiQuery({
    name: "idProfessor",
    required: false,
    type: String,
    description: "ID do professor para filtrar",
  })
  @ApiQuery({
    name: "idPeriodoLetivo",
    required: false,
    type: String,
    description: "ID do período letivo para filtrar",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de turmas.",
    type: [TurmaResponseDto],
  })
  async findAll(
    @Query() query: ListarTurmasQueryDto,
    @Req() request: RequestWithUser,
  ): Promise<TurmaResponseDto[]> {
    const user = request.user
    if (
      user.papel !== PapelUsuario.COORDENADOR &&
      user.papel !== PapelUsuario.DIRETOR
    ) {
      throw new ForbiddenException("Acesso negado para listar turmas.")
    }
    return this.turmasService.findAll(query)
  }

  @Get("disciplina-ofertada/:idDisciplinaOfertada")
  @ApiOperation({
    summary: "Listar turmas de uma disciplina ofertada (Coordenador, Diretor)",
  })
  @ApiParam({
    name: "idDisciplinaOfertada",
    description: "ID da disciplina ofertada",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Lista de turmas da disciplina ofertada.",
    type: [TurmaResponseDto],
  })
  async findByDisciplinaOfertada(
    @Param("idDisciplinaOfertada", ParseUUIDPipe) idDisciplinaOfertada: string,
    @Req() request: RequestWithUser,
  ): Promise<TurmaResponseDto[]> {
    const user = request.user
    if (
      user.papel !== PapelUsuario.COORDENADOR &&
      user.papel !== PapelUsuario.DIRETOR
    ) {
      throw new ForbiddenException("Acesso negado.")
    }
    return this.turmasService.findByDisciplinaOfertada(idDisciplinaOfertada)
  }

  @Get("professor/:idProfessor")
  @ApiOperation({
    summary: "Listar turmas de um professor (Coordenador, Diretor, Professor)",
  })
  @ApiParam({
    name: "idProfessor",
    description: "ID do professor",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Lista de turmas do professor.",
    type: [TurmaResponseDto],
  })
  async findByProfessor(
    @Param("idProfessor", ParseUUIDPipe) idProfessor: string,
    @Req() request: RequestWithUser,
  ): Promise<TurmaResponseDto[]> {
    const user = request.user
    if (
      user.papel !== PapelUsuario.COORDENADOR &&
      user.papel !== PapelUsuario.DIRETOR &&
      user.papel !== PapelUsuario.PROFESSOR
    ) {
      throw new ForbiddenException("Acesso negado.")
    }
    return this.turmasService.findByProfessor(idProfessor)
  }

  @Get(":id")
  @ApiOperation({ summary: "Obter detalhes de uma turma específica" })
  @ApiParam({ name: "id", description: "ID da turma (UUID)", type: String })
  @ApiResponse({
    status: 200,
    description: "Detalhes da turma retornados com sucesso.",
    type: TurmaResponseDto,
  })
  @ApiResponse({ status: 404, description: "Turma não encontrada." })
  @ApiResponse({ status: 403, description: "Acesso negado." })
  // @Roles(PapelUsuario.COORDENADOR, PapelUsuario.DIRETOR, PapelUsuario.PROFESSOR) // Example roles
  // @UseGuards(RolesGuard) // Apply role guard if needed
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<TurmaResponseDto> {
    const turma = await this.turmasService.findOne(id)
    if (!turma) {
      throw new NotFoundException(`Turma com ID "${id}" não encontrada.`)
    }
    return turma
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar dados de uma turma (Coordenador)" })
  @ApiParam({ name: "id", description: "ID da turma", type: String })
  @ApiResponse({
    status: 200,
    description: "Turma atualizada com sucesso.",
    type: TurmaResponseDto,
  })
  @ApiResponse({ status: 404, description: "Turma não encontrada." })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTurmaDto: UpdateTurmaDto,
    @Req() request: RequestWithUser,
  ): Promise<TurmaResponseDto> {
    const user = request.user
    if (user.papel !== PapelUsuario.COORDENADOR) {
      throw new ForbiddenException("Apenas coordenadores podem atualizar turmas.")
    }
    return this.turmasService.update(id, updateTurmaDto)
  }

  @Put(":id/professor")
  @ApiOperation({ summary: "Atribuir professor à turma (Coordenador)" })
  @ApiParam({ name: "id", description: "ID da turma", type: String })
  @ApiResponse({
    status: 200,
    description: "Professor atribuído com sucesso.",
    type: TurmaResponseDto,
  })
  async atribuirProfessor(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() atribuirProfessorDto: AtribuirProfessorDto,
    @Req() request: RequestWithUser,
  ): Promise<TurmaResponseDto> {
    const user = request.user
    if (user.papel !== PapelUsuario.COORDENADOR) {
      throw new ForbiddenException(
        "Apenas coordenadores podem atribuir professores.",
      )
    }
    return this.turmasService.atribuirProfessor(
      id,
      atribuirProfessorDto.idUsuarioProfessor,
    )
  }

  @Delete(":id/professor")
  @ApiOperation({ summary: "Remover professor da turma (Coordenador)" })
  @ApiParam({ name: "id", description: "ID da turma", type: String })
  @ApiResponse({
    status: 200,
    description: "Professor removido com sucesso.",
    type: TurmaResponseDto,
  })
  async removerProfessor(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<TurmaResponseDto> {
    const user = request.user
    if (user.papel !== PapelUsuario.COORDENADOR) {
      throw new ForbiddenException(
        "Apenas coordenadores podem remover professores.",
      )
    }
    return this.turmasService.removerProfessor(id)
  }

  @Delete(":id")
  @ApiOperation({ summary: "Deletar uma turma (Coordenador)" })
  @ApiParam({ name: "id", description: "ID da turma", type: String })
  @ApiResponse({
    status: 200,
    description: "Turma deletada com sucesso.",
  })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    const user = request.user
    if (user.papel !== PapelUsuario.COORDENADOR) {
      throw new ForbiddenException("Apenas coordenadores podem deletar turmas.")
    }
    return this.turmasService.remove(id)
  }

  // Outros endpoints para listar, criar, atualizar turmas podem ser adicionados aqui.
  // Por exemplo, um endpoint para listar turmas de uma disciplinaOfertada:
  // @Get('/por-oferta/:idDisciplinaOfertada')
  // async findAllByOferta(...) {}
}
