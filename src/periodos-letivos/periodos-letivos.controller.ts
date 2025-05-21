import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger"
import { UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { PeriodosLetivosService } from "./periodos-letivos.service"
import { CreatePeriodoLetivoDto } from "./dto/create-periodo-letivo.dto"
import { UpdatePeriodoLetivoDto } from "./dto/update-periodo-letivo.dto"
import { FindPeriodoLetivoDto } from "./dto/find-periodo-letivo.dto"
import { PeriodoLetivoResponseDto } from "./dto/periodo-letivo-response.dto"
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
@Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
@Controller("periodos-letivos")
export class PeriodosLetivosController {
  /**
   * @constructor
   * @param {PeriodosLetivosService} periodosLetivosService - Instância do serviço de períodos letivos.
   */
  constructor(private readonly periodosLetivosService: PeriodosLetivosService) {}

  /**
   * @method create
   * @description Cria um novo período letivo.
   * @param {CreatePeriodoLetivoDto} createPeriodoLetivoDto - Dados para criar o período letivo.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo criado.
   * @ApiOperation Resumo da operação para o Swagger.
   * @ApiResponse Status 201: Período letivo criado com sucesso.
   * @ApiResponse Status 400: Requisição inválida.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Cria um novo período letivo" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Período letivo criado com sucesso.",
    type: PeriodoLetivoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos para criação do período letivo.",
  })
  async create(
    @Body() createPeriodoLetivoDto: CreatePeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto> {
    return this.periodosLetivosService.create(createPeriodoLetivoDto)
  }

  /**
   * @method findAll
   * @description Retorna uma lista de períodos letivos com base nos filtros e paginação.
   * @param {FindPeriodoLetivoDto} findPeriodoLetivoDto - Parâmetros de filtro e paginação.
   * @returns {Promise<{ data: PeriodoLetivoResponseDto[]; count: number }>} Lista de períodos letivos e a contagem total.
   * @ApiOperation Resumo da operação para o Swagger.
   * @ApiResponse Status 200: Lista de períodos letivos retornada com sucesso.
   */
  @Get()
  @ApiOperation({
    summary: "Lista todos os períodos letivos com filtros e paginação",
  })
  @ApiQuery({
    name: "ano",
    required: false,
    type: Number,
    description: "Filtra por ano do período letivo",
  })
  @ApiQuery({
    name: "semestre",
    required: false,
    type: Number,
    description: "Filtra por semestre do período letivo",
  })
  @ApiQuery({
    name: "ativo",
    required: false,
    type: Boolean,
    description: "Filtra por períodos letivos ativos ou inativos",
  })
  @ApiQuery({
    name: "pagina",
    required: false,
    type: Number,
    description: "Número da página para paginação",
    example: 1,
  })
  @ApiQuery({
    name: "limite",
    required: false,
    type: Number,
    description: "Número de itens por página",
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de períodos letivos retornada com sucesso.",
    type: [PeriodoLetivoResponseDto], // Idealmente, um DTO de paginação que envolva isso
  })
  async findAll(
    @Query() findPeriodoLetivoDto: FindPeriodoLetivoDto,
  ): Promise<{ data: PeriodoLetivoResponseDto[]; count: number }> {
    return this.periodosLetivosService.findAll(findPeriodoLetivoDto)
  }

  /**
   * @method findOne
   * @description Retorna um período letivo específico pelo ID.
   * @param {string} id - ID do período letivo (UUID).
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo encontrado.
   * @ApiOperation Resumo da operação para o Swagger.
   * @ApiResponse Status 200: Período letivo encontrado.
   * @ApiResponse Status 404: Período letivo não encontrado.
   */
  @Get(":id")
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

  /**
   * @method update
   * @description Atualiza um período letivo existente.
   * @param {string} id - ID do período letivo a ser atualizado (UUID).
   * @param {UpdatePeriodoLetivoDto} updatePeriodoLetivoDto - Dados para atualizar o período letivo.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo atualizado.
   * @ApiOperation Resumo da operação para o Swagger.
   * @ApiResponse Status 200: Período letivo atualizado com sucesso.
   * @ApiResponse Status 404: Período letivo não encontrado.
   * @ApiResponse Status 400: Requisição inválida.
   */
  @Patch(":id")
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
    description: "Período letivo não encontrado para atualização.",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos para atualização do período letivo.",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updatePeriodoLetivoDto: UpdatePeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto> {
    return this.periodosLetivosService.update(id, updatePeriodoLetivoDto)
  }

  /**
   * @method remove
   * @description Remove um período letivo.
   * @param {string} id - ID do período letivo a ser removido (UUID).
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo removido.
   * @ApiOperation Resumo da operação para o Swagger.
   * @ApiResponse Status 204: Período letivo removido com sucesso.
   * @ApiResponse Status 404: Período letivo não encontrado.
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 em vez do objeto removido
  @ApiOperation({ summary: "Remove um período letivo" })
  @ApiParam({
    name: "id",
    type: String,
    description: "ID do período letivo a ser removido (UUID)",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Período letivo removido com sucesso.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Período letivo não encontrado para remoção.",
  })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    // Mudado para Promise<void>
    await this.periodosLetivosService.remove(id) // O serviço retorna o DTO, mas o controller não precisa
  }

  /**
   * @method activate
   * @description Ativa um período letivo.
   * @param {string} id - ID do período letivo a ser ativado (UUID).
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo ativado.
   * @ApiOperation Resumo da operação para o Swagger.
   * @ApiResponse Status 200: Período letivo ativado com sucesso.
   * @ApiResponse Status 404: Período letivo não encontrado.
   */
  @Patch(":id/ativar")
  @ApiOperation({ summary: "Ativa um período letivo" })
  @ApiParam({
    name: "id",
    type: String,
    description: "ID do período letivo a ser ativado (UUID)",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Período letivo ativado com sucesso.",
    type: PeriodoLetivoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Período letivo não encontrado para ativação.",
  })
  async activate(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<PeriodoLetivoResponseDto> {
    return this.periodosLetivosService.activate(id)
  }

  /**
   * @method deactivate
   * @description Desativa um período letivo.
   * @param {string} id - ID do período letivo a ser desativado (UUID).
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo desativado.
   * @ApiOperation Resumo da operação para o Swagger.
   * @ApiResponse Status 200: Período letivo desativado com sucesso.
   * @ApiResponse Status 404: Período letivo não encontrado.
   */
  @Patch(":id/desativar")
  @ApiOperation({ summary: "Desativa um período letivo" })
  @ApiParam({
    name: "id",
    type: String,
    description: "ID do período letivo a ser desativado (UUID)",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Período letivo desativado com sucesso.",
    type: PeriodoLetivoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Período letivo não encontrado para desativação.",
  })
  async deactivate(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<PeriodoLetivoResponseDto> {
    return this.periodosLetivosService.deactivate(id)
  }
}
