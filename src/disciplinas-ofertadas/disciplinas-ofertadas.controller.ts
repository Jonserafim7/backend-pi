import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
  ForbiddenException,
} from "@nestjs/common"
import { DisciplinasOfertadasService } from "./disciplinas-ofertadas.service"
import { CreateDisciplinaOfertadaDto } from "./dto/create-disciplina-ofertada.dto"
import { CreateDisciplinaOfertadaSimplificadaDto } from "./dto/create-disciplina-ofertada-simplificada.dto"
import { UpdateDisciplinaOfertadaDto } from "./dto/update-disciplina-ofertada.dto"
import { DisciplinaOfertadaResponseDto } from "./dto/disciplina-ofertada-response.dto"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { PapelUsuario } from "@prisma/client"
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"

interface FindAllDisciplinasOfertadasFilters {
  periodoId?: string
  cursoId?: string
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PapelUsuario.COORDENADOR, PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
@ApiTags("Disciplinas Ofertadas")
@Controller("disciplinas-ofertadas")
export class DisciplinasOfertadasController {
  constructor(
    private readonly disciplinasOfertadasService: DisciplinasOfertadasService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Criar uma nova oferta de disciplina (Admin, Diretor, Coordenador)",
  })
  @ApiResponse({
    status: 201,
    description: "A oferta da disciplina foi criada com sucesso.",
    type: DisciplinaOfertadaResponseDto,
  })
  @ApiResponse({ status: 400, description: "Parâmetros inválidos." })
  @ApiResponse({ status: 403, description: "Acesso negado." })
  async create(
    @Body() createDisciplinaOfertadaDto: CreateDisciplinaOfertadaDto,
    @Req() request: RequestWithUser,
  ): Promise<DisciplinaOfertadaResponseDto> {
    const user = request.user

    // Permitir ADMIN, DIRETOR e COORDENADOR
    if (
      user.papel !== PapelUsuario.ADMIN &&
      user.papel !== PapelUsuario.DIRETOR &&
      user.papel !== PapelUsuario.COORDENADOR
    ) {
      throw new ForbiddenException(
        "Apenas administradores, diretores e coordenadores podem criar ofertas de disciplinas.",
      )
    }

    return this.disciplinasOfertadasService.create(
      createDisciplinaOfertadaDto,
      user.id,
      user.papel,
    )
  }

  @Post("periodo-ativo")
  @ApiOperation({
    summary: "Criar oferta de disciplina no período letivo ativo (Coordenador)",
  })
  @ApiResponse({
    status: 201,
    description:
      "A oferta da disciplina foi criada com sucesso no período ativo.",
    type: DisciplinaOfertadaResponseDto,
  })
  @ApiResponse({ status: 400, description: "Parâmetros inválidos." })
  @ApiResponse({ status: 403, description: "Acesso negado." })
  @ApiResponse({
    status: 404,
    description: "Nenhum período letivo ativo encontrado.",
  })
  @Roles(PapelUsuario.COORDENADOR)
  async createComPeriodoAtivo(
    @Body() createDto: CreateDisciplinaOfertadaSimplificadaDto,
    @Req() request: RequestWithUser,
  ): Promise<DisciplinaOfertadaResponseDto> {
    const user = request.user

    return this.disciplinasOfertadasService.createComPeriodoAtivo(
      createDto.idDisciplina,
      createDto.quantidadeTurmas,
      user.id,
      user.papel,
    )
  }

  @Get()
  @ApiOperation({
    summary: "Listar disciplinas ofertadas (Admin, Diretor, Coordenador)",
  })
  @ApiQuery({
    name: "periodoId",
    required: false,
    type: String,
    description: "ID do período letivo para filtrar (UUID)",
  })
  @ApiQuery({
    name: "cursoId",
    required: false,
    type: String,
    description: "ID do curso para filtrar (UUID)",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de disciplinas ofertadas.",
    type: [DisciplinaOfertadaResponseDto],
  })
  @ApiResponse({ status: 403, description: "Acesso negado." })
  async findAll(
    @Req() request: RequestWithUser,
    @Query("periodoId") periodoId?: string,
    @Query("cursoId") cursoId?: string,
  ): Promise<DisciplinaOfertadaResponseDto[]> {
    const user = request.user

    // Permitir ADMIN, DIRETOR e COORDENADOR
    if (
      user.papel !== PapelUsuario.ADMIN &&
      user.papel !== PapelUsuario.DIRETOR &&
      user.papel !== PapelUsuario.COORDENADOR
    ) {
      throw new ForbiddenException(
        "Acesso negado para listar ofertas de disciplinas.",
      )
    }

    const filters: FindAllDisciplinasOfertadasFilters = {}
    if (periodoId) filters.periodoId = periodoId
    if (cursoId) filters.cursoId = cursoId

    return this.disciplinasOfertadasService.findAll(filters)
  }

  @Get(":id")
  @ApiOperation({
    summary:
      "Obter detalhes de uma oferta de disciplina específica (Admin, Diretor, Coordenador)",
  })
  @ApiParam({
    name: "id",
    description: "ID da oferta da disciplina (UUID)",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Detalhes da oferta da disciplina.",
    type: DisciplinaOfertadaResponseDto,
  })
  @ApiResponse({ status: 403, description: "Acesso negado." })
  @ApiResponse({
    status: 404,
    description: "Oferta da disciplina não encontrada.",
  })
  async findOne(
    @Param("id", new ParseUUIDPipe({ optional: false })) id: string,
    @Req() request: RequestWithUser,
  ): Promise<DisciplinaOfertadaResponseDto> {
    const user = request.user

    // Permitir ADMIN, DIRETOR e COORDENADOR
    if (
      user.papel !== PapelUsuario.ADMIN &&
      user.papel !== PapelUsuario.DIRETOR &&
      user.papel !== PapelUsuario.COORDENADOR
    ) {
      throw new ForbiddenException("Acesso negado para ver detalhes da oferta.")
    }

    return this.disciplinasOfertadasService.findOne(id)
  }

  @Patch(":id")
  @ApiOperation({
    summary:
      "Atualizar dados de uma oferta de disciplina (Admin, Diretor, Coordenador)",
  })
  @ApiParam({
    name: "id",
    description: "ID da oferta da disciplina (UUID)",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Oferta da disciplina atualizada com sucesso.",
    type: DisciplinaOfertadaResponseDto,
  })
  @ApiResponse({ status: 403, description: "Acesso negado." })
  @ApiResponse({
    status: 404,
    description: "Oferta da disciplina não encontrada.",
  })
  async update(
    @Param("id", new ParseUUIDPipe({ optional: false })) id: string,
    @Body() updateDisciplinaOfertadaDto: UpdateDisciplinaOfertadaDto,
    @Req() request: RequestWithUser,
  ): Promise<DisciplinaOfertadaResponseDto> {
    const user = request.user

    // Permitir ADMIN, DIRETOR e COORDENADOR
    if (
      user.papel !== PapelUsuario.ADMIN &&
      user.papel !== PapelUsuario.DIRETOR &&
      user.papel !== PapelUsuario.COORDENADOR
    ) {
      throw new ForbiddenException(
        "Apenas administradores, diretores e coordenadores podem atualizar ofertas de disciplinas.",
      )
    }

    return this.disciplinasOfertadasService.update(
      id,
      updateDisciplinaOfertadaDto,
      user.id,
      user.papel,
    )
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Cancelar uma oferta de disciplina (Admin, Diretor, Coordenador)",
  })
  @ApiParam({
    name: "id",
    description: "ID da oferta da disciplina (UUID)",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Oferta da disciplina cancelada com sucesso.",
  })
  @ApiResponse({ status: 403, description: "Acesso negado." })
  @ApiResponse({
    status: 404,
    description: "Oferta da disciplina não encontrada.",
  })
  async remove(
    @Param("id", new ParseUUIDPipe({ optional: false })) id: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    const user = request.user

    // Permitir ADMIN, DIRETOR e COORDENADOR
    if (
      user.papel !== PapelUsuario.ADMIN &&
      user.papel !== PapelUsuario.DIRETOR &&
      user.papel !== PapelUsuario.COORDENADOR
    ) {
      throw new ForbiddenException(
        "Apenas administradores, diretores e coordenadores podem remover ofertas de disciplinas.",
      )
    }

    return this.disciplinasOfertadasService.remove(id, user.id, user.papel)
  }
}
