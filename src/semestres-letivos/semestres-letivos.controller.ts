import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { SemestresLetivosService } from "./semestres-letivos.service";
import { CreateSemestreLetivoDto } from "./dto/create-semestre-letivo.dto";
import { UpdateSemestreLetivoDto } from "./dto/update-semestre-letivo.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { SemestreLetivoResponseDto } from "./dto/semestre-letivo-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { PapelUsuario } from "@prisma/client";

@ApiTags("semestres-letivos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("semestres-letivos")
export class SemestresLetivosController {
  constructor(
    private readonly semestresLetivosService: SemestresLetivosService,
  ) {}

  @ApiOperation({ summary: "Criar novo semestre letivo" })
  @ApiResponse({
    status: 201,
    description: "Semestre letivo criado com sucesso",
    type: SemestreLetivoResponseDto,
  })
  @ApiResponse({ status: 400, description: "Requisição inválida" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 403, description: "Acesso proibido" })
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @Post()
  create(
    @Body() createSemestreLetivoDto: CreateSemestreLetivoDto,
  ): Promise<SemestreLetivoResponseDto> {
    return this.semestresLetivosService.create(createSemestreLetivoDto);
  }

  @ApiOperation({ summary: "Listar todos os semestres letivos" })
  @ApiResponse({
    status: 200,
    description: "Lista de semestres letivos",
    type: [SemestreLetivoResponseDto],
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN, PapelUsuario.DIRETOR)
  @Get()
  findAll(): Promise<SemestreLetivoResponseDto[]> {
    return this.semestresLetivosService.findAll();
  }

  @ApiOperation({ summary: "Buscar semestre letivo por ID" })
  @ApiResponse({
    status: 200,
    description: "Semestre letivo encontrado",
    type: SemestreLetivoResponseDto,
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 404, description: "Semestre letivo não encontrado" })
  @ApiParam({
    name: "id",
    description: "ID do semestre letivo",
  })
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN, PapelUsuario.DIRETOR)
  @Get(":id")
  findOne(@Param("id") id: string): Promise<SemestreLetivoResponseDto> {
    return this.semestresLetivosService.findOne(id);
  }

  @ApiOperation({ summary: "Atualizar semestre letivo" })
  @ApiResponse({
    status: 200,
    description: "Semestre letivo atualizado com sucesso",
    type: SemestreLetivoResponseDto,
  })
  @ApiResponse({ status: 400, description: "Requisição inválida" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 403, description: "Acesso proibido" })
  @ApiResponse({ status: 404, description: "Semestre letivo não encontrado" })
  @ApiParam({
    name: "id",
    description: "ID do semestre letivo",
  })
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateSemestreLetivoDto: UpdateSemestreLetivoDto,
  ): Promise<SemestreLetivoResponseDto> {
    return this.semestresLetivosService.update(id, updateSemestreLetivoDto);
  }

  @ApiOperation({ summary: "Remover semestre letivo" })
  @ApiResponse({
    status: 204,
    description: "Semestre letivo removido com sucesso",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 403, description: "Acesso proibido" })
  @ApiResponse({ status: 404, description: "Semestre letivo não encontrado" })
  @ApiParam({
    name: "id",
    description: "ID do semestre letivo",
  })
  @Roles(PapelUsuario.COORDENADOR, PapelUsuario.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string): Promise<void> {
    return this.semestresLetivosService.remove(id);
  }
}
