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
  Req,
} from "@nestjs/common"
import { PropostasHorarioService } from "./propostas-horario.service"
import { CreatePropostaHorarioDto } from "./dto/create-proposta-horario.dto"
import { UpdatePropostaHorarioDto } from "./dto/update-proposta-horario.dto"
import { SubmitPropostaHorarioDto } from "./dto/submit-proposta-horario.dto"
import {
  ApprovePropostaDto,
  RejectPropostaDto,
} from "./dto/approve-reject-proposta.dto"
import { SendBackPropostaDto } from "./dto/send-back-proposta.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface"
import { PapelUsuario } from "@prisma/client"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiExtraModels,
} from "@nestjs/swagger"
import {
  PropostaHorarioResponseDto,
  CursoPropostaDto,
  PeriodoLetivoPropostaDto,
  CoordenadorPropostaDto,
} from "./dto/proposta-horario-response.dto"

@ApiTags("propostas-horario")
@ApiBearerAuth()
@ApiExtraModels(
  CursoPropostaDto,
  PeriodoLetivoPropostaDto,
  CoordenadorPropostaDto,
)
@Controller("propostas-horario")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropostasHorarioController {
  constructor(
    private readonly propostasHorarioService: PropostasHorarioService,
  ) {}

  /**
   * Cria uma nova proposta de horário
   */
  @Post()
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Criar uma nova proposta de horário" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Proposta de horário criada com sucesso",
    type: PropostaHorarioResponseDto,
  })
  async create(
    @Body() createPropostaDto: CreatePropostaHorarioDto,
    @Req() req: RequestWithUser,
  ): Promise<PropostaHorarioResponseDto> {
    const proposta = await this.propostasHorarioService.create(
      createPropostaDto,
      req.user.id,
    )
    return new PropostaHorarioResponseDto(proposta)
  }

  /**
   * Lista todas as propostas de horário
   */
  @Get()
  @ApiOperation({ summary: "Listar todas as propostas de horário" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de propostas retornada com sucesso",
    type: [PropostaHorarioResponseDto],
  })
  async findAll(
    @Req() req: RequestWithUser,
  ): Promise<PropostaHorarioResponseDto[]> {
    const propostas = await this.propostasHorarioService.findAll(
      req.user.id,
      req.user.papel,
    )
    return propostas.map((proposta) => new PropostaHorarioResponseDto(proposta))
  }

  /**
   * Busca uma proposta de horário pelo ID
   */
  @Get(":id")
  @ApiOperation({ summary: "Buscar uma proposta de horário pelo ID" })
  @ApiParam({
    name: "id",
    description: "ID da proposta de horário",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Proposta de horário encontrada",
    type: PropostaHorarioResponseDto,
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<PropostaHorarioResponseDto> {
    const proposta = await this.propostasHorarioService.findOne(
      id,
      req.user.id,
      req.user.papel,
    )
    return new PropostaHorarioResponseDto(proposta)
  }

  /**
   * Atualiza uma proposta de horário (apenas DRAFT)
   */
  @Patch(":id")
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Atualizar uma proposta de horário" })
  @ApiParam({
    name: "id",
    description: "ID da proposta de horário",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Proposta de horário atualizada com sucesso",
    type: PropostaHorarioResponseDto,
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updatePropostaDto: UpdatePropostaHorarioDto,
    @Req() req: RequestWithUser,
  ): Promise<PropostaHorarioResponseDto> {
    const proposta = await this.propostasHorarioService.update(
      id,
      updatePropostaDto,
      req.user.id,
    )
    return new PropostaHorarioResponseDto(proposta)
  }

  /**
   * Submete uma proposta para aprovação
   */
  @Patch(":id/submit")
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Submeter uma proposta de horário para aprovação" })
  @ApiParam({
    name: "id",
    description: "ID da proposta de horário",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Proposta submetida com sucesso",
    type: PropostaHorarioResponseDto,
  })
  async submit(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() submitDto: SubmitPropostaHorarioDto,
    @Req() req: RequestWithUser,
  ): Promise<PropostaHorarioResponseDto> {
    const proposta = await this.propostasHorarioService.submit(
      id,
      submitDto,
      req.user.id,
    )
    return new PropostaHorarioResponseDto(proposta)
  }

  /**
   * Aprova uma proposta de horário
   */
  @Patch(":id/approve")
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Aprovar uma proposta de horário" })
  @ApiParam({
    name: "id",
    description: "ID da proposta de horário",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Proposta aprovada com sucesso",
    type: PropostaHorarioResponseDto,
  })
  async approve(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() approveDto: ApprovePropostaDto,
  ): Promise<PropostaHorarioResponseDto> {
    const proposta = await this.propostasHorarioService.approve(id, approveDto)
    return new PropostaHorarioResponseDto(proposta)
  }

  /**
   * Rejeita uma proposta de horário
   */
  @Patch(":id/reject")
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Rejeitar uma proposta de horário" })
  @ApiParam({
    name: "id",
    description: "ID da proposta de horário",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Proposta rejeitada com sucesso",
    type: PropostaHorarioResponseDto,
  })
  async reject(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() rejectDto: RejectPropostaDto,
  ): Promise<PropostaHorarioResponseDto> {
    const proposta = await this.propostasHorarioService.reject(id, rejectDto)
    return new PropostaHorarioResponseDto(proposta)
  }

  /**
   * Reabre uma proposta rejeitada para edição
   */
  @Patch(":id/reopen")
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Reabrir uma proposta rejeitada para edição" })
  @ApiParam({
    name: "id",
    description: "ID da proposta de horário",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Proposta reaberta com sucesso",
    type: PropostaHorarioResponseDto,
  })
  async reopen(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<PropostaHorarioResponseDto> {
    const proposta = await this.propostasHorarioService.reopen(id, req.user.id)
    return new PropostaHorarioResponseDto(proposta)
  }

  /**
   * Devolve uma proposta aprovada para edição (diretor para coordenador)
   */
  @Patch(":id/send-back")
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Devolver uma proposta aprovada para edição" })
  @ApiParam({
    name: "id",
    description: "ID da proposta de horário",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Proposta devolvida para edição com sucesso",
    type: PropostaHorarioResponseDto,
  })
  async sendBack(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() sendBackDto: SendBackPropostaDto,
  ): Promise<PropostaHorarioResponseDto> {
    const proposta = await this.propostasHorarioService.sendBackToEdit(
      id,
      sendBackDto,
    )
    return new PropostaHorarioResponseDto(proposta)
  }

  /**
   * Remove uma proposta de horário (apenas DRAFT)
   */
  @Delete(":id")
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @ApiOperation({ summary: "Remover uma proposta de horário" })
  @ApiParam({
    name: "id",
    description: "ID da proposta de horário",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Proposta removida com sucesso",
    type: PropostaHorarioResponseDto,
  })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<PropostaHorarioResponseDto> {
    const proposta = await this.propostasHorarioService.remove(id, req.user.id)
    return new PropostaHorarioResponseDto(proposta)
  }
}
