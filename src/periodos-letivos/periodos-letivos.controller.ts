import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger"
import { UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { PeriodosLetivosService } from "./periodos-letivos.service"
import {
  CreatePeriodoLetivoDto,
  UpdatePeriodoLetivoDto,
  PeriodoLetivoResponseDto,
  FindPeriodoLetivoDto,
  ChangeStatusPeriodoLetivoDto,
} from "./dto"
import { PapelUsuario } from "@prisma/client"
import { Roles } from "../auth/decorators/roles.decorator"

/**
 * @class PeriodosLetivosController
 * @description Controller responsável pelos endpoints de Períodos Letivos.
 * @ApiTags Períodos Letivos - Agrupa os endpoints relacionados a períodos letivos no Swagger.
 */
@ApiTags("Períodos Letivos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("periodos-letivos")
export class PeriodosLetivosController {
  /**
   * @constructor
   * @param {PeriodosLetivosService} periodosLetivosService - Instância do serviço de períodos letivos.
   */
  constructor(private readonly periodosLetivosService: PeriodosLetivosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Cria um novo período letivo" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Período letivo criado com sucesso.",
    type: PeriodoLetivoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos ou data de fim anterior à data de início.",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      "Já existe um período letivo para o ano e semestre informados ou já existe um período ativo.",
  })
  async create(
    @Body() createPeriodoLetivoDto: CreatePeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto> {
    return this.periodosLetivosService.create(createPeriodoLetivoDto)
  }

  @Get()
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN, PapelUsuario.COORDENADOR)
  @ApiOperation({
    summary: "Lista todos os períodos letivos com filtros opcionais",
  })
  @ApiQuery({
    name: "ano",
    required: false,
    description: "Filtrar por ano",
    example: 2025,
  })
  @ApiQuery({
    name: "semestre",
    required: false,
    description: "Filtrar por semestre (1 ou 2)",
    example: 1,
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filtrar por status",
    enum: ["ATIVO", "INATIVO"],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de períodos letivos retornada com sucesso.",
    type: [PeriodoLetivoResponseDto],
  })
  async findAll(
    @Query() params: FindPeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto[]> {
    return this.periodosLetivosService.findAll(params)
  }

  @Get("ativo")
  @Roles(
    PapelUsuario.DIRETOR,
    PapelUsuario.ADMIN,
    PapelUsuario.COORDENADOR,
    PapelUsuario.PROFESSOR,
  )
  @ApiOperation({ summary: "Busca o período letivo ativo atual" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Período letivo ativo encontrado.",
    type: PeriodoLetivoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Nenhum período letivo ativo encontrado.",
  })
  async findPeriodoAtivo(): Promise<PeriodoLetivoResponseDto | null> {
    return this.periodosLetivosService.findPeriodoAtivo()
  }

  @Get(":id")
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN, PapelUsuario.COORDENADOR)
  @ApiOperation({ summary: "Busca um período letivo pelo ID" })
  @ApiParam({
    name: "id",
    type: String,
    description: "ID do período letivo (UUID)",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Período letivo encontrado.",
    type: PeriodoLetivoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Período letivo não encontrado.",
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<PeriodoLetivoResponseDto> {
    return this.periodosLetivosService.findOne(id)
  }

  @Patch(":id")
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Atualiza um período letivo existente" })
  @ApiParam({
    name: "id",
    type: String,
    description: "ID do período letivo a ser atualizado (UUID)",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Período letivo atualizado com sucesso.",
    type: PeriodoLetivoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Período letivo não encontrado.",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos ou data de fim anterior à data de início.",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Conflito de ano/semestre ou período ativo já existente.",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updatePeriodoLetivoDto: UpdatePeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto> {
    return this.periodosLetivosService.update(id, updatePeriodoLetivoDto)
  }

  @Patch(":id/status")
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Altera o status de um período letivo" })
  @ApiParam({
    name: "id",
    type: String,
    description: "ID do período letivo (UUID)",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Status do período letivo alterado com sucesso.",
    type: PeriodoLetivoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Período letivo não encontrado.",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Já existe um período letivo ativo.",
  })
  async changeStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeStatusPeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto> {
    return this.periodosLetivosService.changeStatus(id, changeStatusDto)
  }

  @Delete(":id")
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Remove um período letivo" })
  @ApiParam({
    name: "id",
    type: String,
    description: "ID do período letivo a ser removido (UUID)",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Período letivo removido com sucesso.",
    type: PeriodoLetivoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Período letivo não encontrado.",
  })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<PeriodoLetivoResponseDto> {
    return this.periodosLetivosService.remove(id)
  }
}
