import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  NotFoundException,
} from "@nestjs/common"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger"
import { TurmasService } from "./turmas.service"
import { TurmaResponseDto } from "./dto/turma-response.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
// import { RolesGuard } from "../auth/guards/roles.guard"; // If needed for specific roles
// import { Roles } from "../auth/decorators/roles.decorator"; // If needed
// import { PapelUsuario } from "@prisma/client"; // If using Roles

@ApiTags("Turmas")
@Controller("turmas")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Apply auth to all routes in this controller
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

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

  // Outros endpoints para listar, criar, atualizar turmas podem ser adicionados aqui.
  // Por exemplo, um endpoint para listar turmas de uma disciplinaOfertada:
  // @Get('/por-oferta/:idDisciplinaOfertada')
  // async findAllByOferta(...) {}
}
