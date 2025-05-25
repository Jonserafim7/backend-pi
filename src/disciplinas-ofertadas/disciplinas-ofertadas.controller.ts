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

interface FindAllDisciplinasOfertadasFilters {
  periodoId?: string
  cursoId?: string
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags("Disciplinas Ofertadas")
@Controller("disciplinas-ofertadas")
export class DisciplinasOfertadasController {
  constructor(
    private readonly disciplinasOfertadasService: DisciplinasOfertadasService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Criar uma nova oferta de disciplina (Coordenador)" })
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
    if (user.papel !== PapelUsuario.COORDENADOR) {
      throw new ForbiddenException(
        "Apenas coordenadores podem criar ofertas de disciplinas.",
      )
    }
    // Extrair o ID do coordenador do JWT
    return this.disciplinasOfertadasService.create(
      createDisciplinaOfertadaDto,
      user.id, // Passar o ID do coordenador logado
    )
  }

  @Get()
  @ApiOperation({
    summary: "Listar disciplinas ofertadas (Coordenador, Diretor)",
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
    // Allowing COORDENADOR and DIRETOR to list. Adjust if needed.
    if (
      user.papel !== PapelUsuario.COORDENADOR &&
      user.papel !== PapelUsuario.DIRETOR
    ) {
      throw new ForbiddenException(
        "Acesso negado para listar ofertas de disciplinas.",
      )
    }

    const filters: FindAllDisciplinasOfertadasFilters = {}
    if (periodoId) filters.periodoId = periodoId
    // If the user is a COORDENADOR, we might want to automatically filter by their cursoId(s)
    // unless they are also a DIRETOR or an admin (not handled here) or if a cursoId is explicitly provided.
    // For now, if cursoId is provided, it's used. Otherwise, it's open if allowed by role.
    if (cursoId) filters.cursoId = cursoId

    return this.disciplinasOfertadasService.findAll(filters)
  }

  @Get(":id")
  @ApiOperation({
    summary:
      "Obter detalhes de uma oferta de disciplina específica (Coordenador, Diretor)",
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
    if (
      user.papel !== PapelUsuario.COORDENADOR &&
      user.papel !== PapelUsuario.DIRETOR
    ) {
      throw new ForbiddenException("Acesso negado para ver detalhes da oferta.")
    }
    // For findOne, further authorization (is this user's oferta?) might happen in the service or based on returned data.
    return this.disciplinasOfertadasService.findOne(id)
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Atualizar dados de uma oferta de disciplina (Coordenador)",
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
    if (user.papel !== PapelUsuario.COORDENADOR) {
      throw new ForbiddenException(
        "Apenas coordenadores podem atualizar ofertas de disciplinas.",
      )
    }
    return this.disciplinasOfertadasService.update(
      id,
      updateDisciplinaOfertadaDto,
      user.id, // Passar o ID do coordenador solicitante para verificação de propriedade
    )
  }

  @Delete(":id")
  @ApiOperation({ summary: "Cancelar uma oferta de disciplina (Coordenador)" })
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
    if (user.papel !== PapelUsuario.COORDENADOR) {
      throw new ForbiddenException(
        "Apenas coordenadores podem remover ofertas de disciplinas.",
      )
    }
    return this.disciplinasOfertadasService.remove(id, user.id) // Passar o ID do coordenador solicitante
  }
}
