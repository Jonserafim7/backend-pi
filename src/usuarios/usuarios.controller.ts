import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  UseGuards,
} from "@nestjs/common"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger"
import { Roles } from "../auth/decorators/roles.decorator"
import { RolesGuard } from "../auth/guards/roles.guard"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { PapelUsuario } from "@prisma/client"
import { UsuariosService } from "./usuarios.service"
import { CreateUsuarioDto } from "./dto/create-usuario.dto"
import { FindUsersDto } from "./dto/find-users.dto"
import { UpdateUsuarioDto } from "./dto/update-usuario.dto"
import { UsuarioResponseDto } from "./dto/usuario.response.dto"

@ApiTags("Usuários")
@Controller("usuarios")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles(PapelUsuario.DIRETOR)
  @ApiOperation({ summary: "Cria um novo usuário" })
  @ApiResponse({
    status: 201,
    description: "Usuário criado com sucesso",
    type: UsuarioResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Dados inválidos ou erro na validação",
  })
  @ApiResponse({
    status: 409,
    description: "E-mail já está em uso",
  })
  @ApiResponse({
    status: 401,
    description: "Não autorizado",
  })
  @ApiResponse({
    status: 403,
    description: "Acesso negado",
  })
  async create(
    @Body() createUsuarioDto: CreateUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.create(createUsuarioDto)
  }

  @Get()
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.COORDENADOR)
  @ApiOperation({ summary: "Lista usuários com filtros e paginação" })
  @ApiQuery({
    name: "busca",
    required: false,
    description: "Termo para buscar por nome ou email",
    type: String,
  })
  @ApiQuery({
    name: "papel",
    required: false,
    description: "Filtrar por papel do usuário",
    enum: PapelUsuario,
  })
  @ApiQuery({
    name: "pagina",
    required: false,
    description: "Número da página (padrão: 1)",
    type: Number,
  })
  @ApiQuery({
    name: "limite",
    required: false,
    description: "Número de itens por página (padrão: 10, máximo: 100)",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Lista de usuários retornada com sucesso",
    schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: { $ref: "#/components/schemas/UsuarioResponseDto" },
        },
        total: { type: "number", example: 100 },
        paginas: { type: "number", example: 10 },
        pagina: { type: "number", example: 1 },
        limite: { type: "number", example: 10 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Não autorizado",
  })
  @ApiResponse({
    status: 403,
    description: "Acesso negado",
  })
  async findAll(
    @Query() findUsersDto: FindUsersDto,
    @Query("pagina", new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query("limite", new DefaultValuePipe(10), ParseIntPipe) limite: number,
  ) {
    // Limita o número máximo de itens por página para 100
    if (limite > 100) {
      limite = 100
    } else if (limite < 1) {
      throw new BadRequestException("O limite deve ser maior que zero.")
    }

    if (pagina < 1) {
      throw new BadRequestException("O número da página deve ser maior que zero.")
    }

    return this.usuariosService.findAll(findUsersDto, pagina, limite)
  }

  @Get(":id")
  @Roles(PapelUsuario.DIRETOR, PapelUsuario.COORDENADOR, PapelUsuario.PROFESSOR)
  @ApiOperation({ summary: "Obtém um usuário pelo ID" })
  @ApiParam({
    name: "id",
    required: true,
    description: "ID do usuário",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Usuário encontrado",
    type: UsuarioResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Usuário não encontrado",
  })
  @ApiResponse({
    status: 401,
    description: "Não autorizado",
  })
  @ApiResponse({
    status: 403,
    description: "Acesso negado",
  })
  async findOne(@Param("id") id: string): Promise<UsuarioResponseDto> {
    return this.usuariosService.findOne(id)
  }

  @Patch(":id")
  @Roles(PapelUsuario.DIRETOR)
  @ApiOperation({ summary: "Atualiza um usuário" })
  @ApiParam({
    name: "id",
    required: true,
    description: "ID do usuário",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Usuário atualizado com sucesso",
    type: UsuarioResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Dados inválidos ou erro na validação",
  })
  @ApiResponse({
    status: 404,
    description: "Usuário não encontrado",
  })
  @ApiResponse({
    status: 401,
    description: "Não autorizado",
  })
  @ApiResponse({
    status: 403,
    description: "Acesso negado",
  })
  async update(
    @Param("id") id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.update(id, updateUsuarioDto)
  }

  @Delete(":id")
  @Roles(PapelUsuario.DIRETOR)
  @ApiOperation({ summary: "Remove um usuário" })
  @ApiParam({
    name: "id",
    required: true,
    description: "ID do usuário",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Usuário removido com sucesso",
  })
  @ApiResponse({
    status: 400,
    description:
      "Não é possível remover o usuário devido a restrições de integridade",
  })
  @ApiResponse({
    status: 404,
    description: "Usuário não encontrado",
  })
  @ApiResponse({
    status: 401,
    description: "Não autorizado",
  })
  @ApiResponse({
    status: 403,
    description: "Acesso negado",
  })
  async remove(@Param("id") id: string): Promise<void> {
    await this.usuariosService.remove(id)
  }
}
