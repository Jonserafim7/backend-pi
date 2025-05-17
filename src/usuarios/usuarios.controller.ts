import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Query,
  Logger,
  Req,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger"
import { RolesGuard } from "../auth/guards/roles.guard"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { UsuariosService } from "./usuarios.service"
import { CreateUsuarioDto } from "./dto/create-usuario.dto"
import { UpdateUsuarioDto } from "./dto/update-usuario.dto"
import { UsuarioResponseDto } from "./dto/usuario.response.dto"
import { FindUsuariosByRoleQueryDto } from "./dto/find-usuarios-by-role-query-dto"
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface"
import { PapelUsuario } from "@prisma/client"

@ApiTags("Usuarios")
@Controller("usuarios")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsuariosController {
  private readonly logger = new Logger(UsuariosController.name)
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @ApiOperation({ summary: "Cria um novo usuário" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Usuário criado com sucesso",
    type: UsuarioResponseDto,
  })
  async create(
    @Body() createUsuarioDto: CreateUsuarioDto,
    @Req() req: RequestWithUser,
  ): Promise<UsuarioResponseDto> {
    this.logger.log(
      `Tentativa de criação de usuário: ${JSON.stringify(createUsuarioDto)} pelo usuário ${req.user.email} (${req.user.papel})`,
    )

    const papelUsuarioLogado = req.user.papel
    const papelNovoUsuario = createUsuarioDto.papel

    // Lógica de permissão
    switch (papelUsuarioLogado) {
      case PapelUsuario.ADMIN:
        // Admin pode criar qualquer tipo de usuário
        this.logger.log(
          `Usuário ADMIN ${req.user.email} criando usuário com papel ${papelNovoUsuario}`,
        )
        break
      case PapelUsuario.DIRETOR:
        if (
          papelNovoUsuario !== PapelUsuario.COORDENADOR &&
          papelNovoUsuario !== PapelUsuario.PROFESSOR
        ) {
          this.logger.warn(
            `Usuário DIRETOR ${req.user.email} tentou criar usuário com papel ${papelNovoUsuario}. Permissão negada.`,
          )
          throw new ForbiddenException(
            "Diretores só podem criar usuários Coordenadores ou Professores.",
          )
        }
        this.logger.log(
          `Usuário DIRETOR ${req.user.email} criando usuário com papel ${papelNovoUsuario}`,
        )
        break
      case PapelUsuario.COORDENADOR:
        if (papelNovoUsuario !== PapelUsuario.PROFESSOR) {
          this.logger.warn(
            `Usuário COORDENADOR ${req.user.email} tentou criar usuário com papel ${papelNovoUsuario}. Permissão negada.`,
          )
          throw new ForbiddenException(
            "Coordenadores só podem criar usuários Professores.",
          )
        }
        this.logger.log(
          `Usuário COORDENADOR ${req.user.email} criando usuário com papel ${papelNovoUsuario}`,
        )
        break
      case PapelUsuario.PROFESSOR:
        this.logger.warn(
          `Usuário PROFESSOR ${req.user.email} tentou criar usuário. Permissão negada.`,
        )
        throw new ForbiddenException("Professores não podem criar usuários.")
      default:
        // Papel desconhecido ou não tem permissão
        this.logger.warn(
          `Usuário ${req.user.email} com papel '${String(papelUsuarioLogado)}' tentou criar usuário. Permissão negada por papel não reconhecido ou sem permissão explícita.`,
        )
        throw new ForbiddenException(
          "Você não tem permissão para criar usuários.",
        )
    }

    this.logger.log(
      `Permissão concedida. Criando novo usuário: ${JSON.stringify(createUsuarioDto)}`,
    )
    const usuario = await this.usuariosService.create(createUsuarioDto)
    return new UsuarioResponseDto(usuario)
  }

  @Get()
  @ApiOperation({ summary: "Lista usuários" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de usuários retornada com sucesso",
    type: [UsuarioResponseDto],
  })
  async findAll(
    @Query() query: FindUsuariosByRoleQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<UsuarioResponseDto[]> {
    const papelUsuarioLogado = req.user.papel
    const emailUsuarioLogado = req.user.email
    const papelQuery = query.papel

    this.logger.log(
      `Usuário ${emailUsuarioLogado} (${papelUsuarioLogado}) solicitou listagem de usuários. Filtro de papel da query: ${papelQuery || "Nenhum"}`,
    )

    let usuariosEncontrados: any[] = []

    switch (papelUsuarioLogado) {
      case PapelUsuario.ADMIN: {
        this.logger.log(
          `Admin ${emailUsuarioLogado} listando usuários. Filtro de query: ${papelQuery || "Todos"}`,
        )
        usuariosEncontrados = await this.usuariosService.findAll(
          papelQuery ? { papel: papelQuery } : undefined,
        )
        break
      }
      case PapelUsuario.DIRETOR: {
        const papeisVisiveisDiretor = [
          PapelUsuario.COORDENADOR,
          PapelUsuario.PROFESSOR,
        ]
        if (papelQuery && !papeisVisiveisDiretor.some((p) => p === papelQuery)) {
          this.logger.warn(
            `Diretor ${emailUsuarioLogado} tentou filtrar por papel não permitido: ${papelQuery}`,
          )
          throw new ForbiddenException(
            "Diretores só podem filtrar por usuários Coordenadores ou Professores.",
          )
        }

        if (papelQuery) {
          this.logger.log(
            `Diretor ${emailUsuarioLogado} listando usuários. Filtro aplicado: ${papelQuery}`,
          )
          usuariosEncontrados = await this.usuariosService.findAll({
            papel: papelQuery,
          })
        } else {
          this.logger.log(
            `Diretor ${emailUsuarioLogado} listando Coordenadores e Professores.`,
          )
          usuariosEncontrados = await this.usuariosService.findAll({
            papeis: papeisVisiveisDiretor,
          })
        }
        break
      }
      case PapelUsuario.COORDENADOR: {
        const papeisVisiveisCoordenador = [PapelUsuario.PROFESSOR]
        if (
          papelQuery &&
          !papeisVisiveisCoordenador.some((p) => p === papelQuery)
        ) {
          this.logger.warn(
            `Coordenador ${emailUsuarioLogado} tentou filtrar por papel não permitido: ${papelQuery}`,
          )
          throw new ForbiddenException(
            "Coordenadores só podem filtrar por usuários Professores.",
          )
        }

        if (papelQuery) {
          this.logger.log(
            `Coordenador ${emailUsuarioLogado} listando usuários. Filtro aplicado: ${papelQuery}`,
          )
          usuariosEncontrados = await this.usuariosService.findAll({
            papel: papelQuery,
          })
        } else {
          this.logger.log(
            `Coordenador ${emailUsuarioLogado} listando Professores.`,
          )
          usuariosEncontrados = await this.usuariosService.findAll({
            papeis: papeisVisiveisCoordenador,
          })
        }
        break
      }
      case PapelUsuario.PROFESSOR: {
        this.logger.warn(
          `Professor ${emailUsuarioLogado} tentou listar usuários. Permissão negada.`,
        )
        throw new ForbiddenException("Professores não podem listar usuários.")
      }
      default: {
        this.logger.warn(
          `Tentativa de listagem por usuário ${emailUsuarioLogado} com papel '${String(papelUsuarioLogado)}' não permitido. Permissão negada.`,
        )
        throw new ForbiddenException(
          "Você não tem permissão para listar usuários.",
        )
      }
    }

    if (!Array.isArray(usuariosEncontrados)) {
      this.logger.error(
        "O serviço findAll retornou um valor não array inesperado:",
        usuariosEncontrados,
      )
      return []
    }

    return usuariosEncontrados.map((usuario) => new UsuarioResponseDto(usuario))
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtém um usuário pelo ID" })
  @ApiParam({
    name: "id",
    required: true,
    description: "ID do usuário",
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Usuário encontrado",
    type: UsuarioResponseDto,
  })
  async findOne(
    @Param("id") idSolicitado: string,
    @Req() req: RequestWithUser,
  ): Promise<UsuarioResponseDto> {
    const idUsuarioLogado = req.user.sub
    const papelUsuarioLogado = req.user.papel
    const emailUsuarioLogado = req.user.email

    this.logger.log(
      `Usuário ${emailUsuarioLogado} (${papelUsuarioLogado}, ID: ${idUsuarioLogado}) solicitou dados do usuário ID: ${idSolicitado}`,
    )

    const usuarioAlvo = await this.usuariosService.findOne(idSolicitado)

    if (idUsuarioLogado === idSolicitado) {
      this.logger.log(
        `Usuário ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) acessando seu próprio perfil (ID: ${idSolicitado}). Permitido.`,
      )
      return new UsuarioResponseDto(usuarioAlvo)
    }

    switch (papelUsuarioLogado) {
      case PapelUsuario.ADMIN: {
        this.logger.log(
          `Admin ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) acessando perfil (ID: ${idSolicitado}). Permitido.`,
        )
        return new UsuarioResponseDto(usuarioAlvo)
      }
      case PapelUsuario.DIRETOR: {
        if (
          usuarioAlvo.papel === PapelUsuario.COORDENADOR ||
          usuarioAlvo.papel === PapelUsuario.PROFESSOR
        ) {
          this.logger.log(
            `Diretor ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) acessando perfil de ${usuarioAlvo.papel} (ID: ${idSolicitado}). Permitido.`,
          )
          return new UsuarioResponseDto(usuarioAlvo)
        } else {
          this.logger.warn(
            `Diretor ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) tentou acessar perfil de ${usuarioAlvo.papel} (ID: ${idSolicitado}). Permissão negada.`,
          )
          throw new ForbiddenException(
            "Diretores só podem visualizar perfis de Coordenadores e Professores.",
          )
        }
      }
      case PapelUsuario.COORDENADOR: {
        if (usuarioAlvo.papel === PapelUsuario.PROFESSOR) {
          this.logger.log(
            `Coordenador ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) acessando perfil de PROFESSOR (ID: ${idSolicitado}). Permitido.`,
          )
          return new UsuarioResponseDto(usuarioAlvo)
        } else {
          this.logger.warn(
            `Coordenador ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) tentou acessar perfil de ${usuarioAlvo.papel} (ID: ${idSolicitado}). Permissão negada.`,
          )
          throw new ForbiddenException(
            "Coordenadores só podem visualizar perfis de Professores.",
          )
        }
      }
      case PapelUsuario.PROFESSOR: {
        this.logger.warn(
          `Professor ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) tentou acessar perfil de outro usuário (ID: ${idSolicitado}). Permissão negada.`,
        )
        throw new ForbiddenException(
          "Você não tem permissão para visualizar este perfil.",
        )
      }
      default: {
        this.logger.warn(
          `Usuário ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) com papel '${String(papelUsuarioLogado)}' tentou acessar perfil (ID: ${idSolicitado}). Permissão negada.`,
        )
        throw new ForbiddenException(
          "Você não tem permissão para visualizar este perfil.",
        )
      }
    }
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualiza um usuário" })
  @ApiParam({
    name: "id",
    required: true,
    description: "ID do usuário",
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Usuário atualizado com sucesso",
    type: UsuarioResponseDto,
  })
  async update(
    @Param("id") idSolicitado: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @Req() req: RequestWithUser,
  ): Promise<UsuarioResponseDto> {
    const idUsuarioLogado = req.user.sub
    const papelUsuarioLogado = req.user.papel
    const emailUsuarioLogado = req.user.email

    this.logger.log(
      `Usuário ${emailUsuarioLogado} (${papelUsuarioLogado}, ID: ${idUsuarioLogado}) tentando atualizar usuário ID: ${idSolicitado} com dados: ${JSON.stringify(updateUsuarioDto)}`,
    )

    // Buscar o usuário alvo para verificar seu papel atual e existência
    const usuarioAlvo = await this.usuariosService.findOne(idSolicitado)
    // Se não encontrado, findOne já lança NotFoundException

    const novoPapelDefinido = updateUsuarioDto.papel // Papel que está sendo tentado definir

    // Caso 1: Auto-atualização
    if (idUsuarioLogado === idSolicitado) {
      this.logger.log(
        `Usuário ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) tentando atualizar seu próprio perfil.`,
      )
      // Restrição: Não permitir auto-alteração de papel (exceto talvez para Admin no futuro)
      if (novoPapelDefinido && novoPapelDefinido !== usuarioAlvo.papel) {
        this.logger.warn(
          `Usuário ${emailUsuarioLogado} tentou alterar seu próprio papel de ${usuarioAlvo.papel} para ${novoPapelDefinido}. Permissão negada.`,
        )
        throw new ForbiddenException("Você não pode alterar seu próprio papel.")
      }
      // Permite outras auto-atualizações
      const usuarioAtualizado = await this.usuariosService.update(
        idSolicitado,
        updateUsuarioDto,
      )
      this.logger.log(
        `Usuário ${emailUsuarioLogado} atualizou seu próprio perfil com sucesso.`,
      )
      return new UsuarioResponseDto(usuarioAtualizado)
    }

    // Caso 2: Atualização de outro usuário - lógica baseada no papel do requisitante
    switch (papelUsuarioLogado) {
      case PapelUsuario.ADMIN: {
        this.logger.log(
          `Admin ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) atualizando usuário ID: ${idSolicitado}. Permitido.`,
        )
        // Admin pode fazer qualquer alteração em qualquer usuário
        const usuarioAtualizado = await this.usuariosService.update(
          idSolicitado,
          updateUsuarioDto,
        )
        return new UsuarioResponseDto(usuarioAtualizado)
      }
      case PapelUsuario.DIRETOR: {
        // Diretor pode modificar Coordenadores ou Professores
        if (
          usuarioAlvo.papel !== PapelUsuario.COORDENADOR &&
          usuarioAlvo.papel !== PapelUsuario.PROFESSOR
        ) {
          this.logger.warn(
            `Diretor ${emailUsuarioLogado} tentou modificar usuário (ID: ${idSolicitado}) com papel ${usuarioAlvo.papel}. Permissão negada.`,
          )
          throw new ForbiddenException(
            "Diretores só podem modificar usuários Coordenadores ou Professores.",
          )
        }
        // Se Diretor está tentando mudar o papel do alvo
        if (novoPapelDefinido) {
          if (
            novoPapelDefinido !== PapelUsuario.COORDENADOR &&
            novoPapelDefinido !== PapelUsuario.PROFESSOR
          ) {
            this.logger.warn(
              `Diretor ${emailUsuarioLogado} tentou definir papel ${novoPapelDefinido} para usuário (ID: ${idSolicitado}). Permissão negada.`,
            )
            throw new ForbiddenException(
              "Diretores só podem definir papéis como Coordenador ou Professor.",
            )
          }
        }
        this.logger.log(
          `Diretor ${emailUsuarioLogado} atualizando usuário ${usuarioAlvo.papel} (ID: ${idSolicitado}). Permitido.`,
        )
        const usuarioAtualizado = await this.usuariosService.update(
          idSolicitado,
          updateUsuarioDto,
        )
        return new UsuarioResponseDto(usuarioAtualizado)
      }
      case PapelUsuario.COORDENADOR: {
        // Coordenador pode modificar Professores
        if (usuarioAlvo.papel !== PapelUsuario.PROFESSOR) {
          this.logger.warn(
            `Coordenador ${emailUsuarioLogado} tentou modificar usuário (ID: ${idSolicitado}) com papel ${usuarioAlvo.papel}. Permissão negada.`,
          )
          throw new ForbiddenException(
            "Coordenadores só podem modificar usuários Professores.",
          )
        }
        // Se Coordenador está tentando mudar o papel do alvo
        if (novoPapelDefinido) {
          if (novoPapelDefinido !== PapelUsuario.PROFESSOR) {
            this.logger.warn(
              `Coordenador ${emailUsuarioLogado} tentou definir papel ${novoPapelDefinido} para usuário (ID: ${idSolicitado}). Permissão negada.`,
            )
            throw new ForbiddenException(
              "Coordenadores só podem definir papéis como Professor.",
            )
          }
        }
        this.logger.log(
          `Coordenador ${emailUsuarioLogado} atualizando usuário PROFESSOR (ID: ${idSolicitado}). Permitido.`,
        )
        const usuarioAtualizado = await this.usuariosService.update(
          idSolicitado,
          updateUsuarioDto,
        )
        return new UsuarioResponseDto(usuarioAtualizado)
      }
      case PapelUsuario.PROFESSOR: {
        // Professor só pode se auto-atualizar (já tratado)
        this.logger.warn(
          `Professor ${emailUsuarioLogado} tentou modificar outro usuário (ID: ${idSolicitado}). Permissão negada.`,
        )
        throw new ForbiddenException(
          "Você não tem permissão para modificar este usuário.",
        )
      }
      default: {
        this.logger.warn(
          `Usuário ${emailUsuarioLogado} com papel '${String(papelUsuarioLogado)}' (ID: ${idUsuarioLogado}) tentou modificar usuário (ID: ${idSolicitado}). Permissão negada.`,
        )
        throw new ForbiddenException(
          "Você não tem permissão para modificar este usuário.",
        )
      }
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove um usuário" })
  @ApiParam({
    name: "id",
    required: true,
    description: "ID do usuário",
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Usuário removido com sucesso",
    type: UsuarioResponseDto,
  })
  async remove(
    @Param("id") idSolicitado: string,
    @Req() req: RequestWithUser,
  ): Promise<UsuarioResponseDto> {
    const idUsuarioLogado = req.user.sub
    const papelUsuarioLogado = req.user.papel
    const emailUsuarioLogado = req.user.email

    this.logger.log(
      `Usuário ${emailUsuarioLogado} (${papelUsuarioLogado}, ID: ${idUsuarioLogado}) tentando deletar usuário ID: ${idSolicitado}`,
    )

    // 1. Proibir auto-deleção
    if (idUsuarioLogado === idSolicitado) {
      this.logger.warn(
        `Usuário ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) tentou se auto-deletar. Operação proibida.`,
      )
      throw new BadRequestException("Você não pode deletar sua própria conta.")
    }

    // 2. Buscar o usuário alvo para verificar seu papel e existência
    const usuarioAlvo = await this.usuariosService.findOne(idSolicitado)
    // Se não encontrado, findOne já lança NotFoundException

    // 3. Lógica de permissão baseada no papel do requisitante
    switch (papelUsuarioLogado) {
      case PapelUsuario.ADMIN: {
        this.logger.log(
          `Admin ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) deletando usuário (ID: ${idSolicitado}, Papel: ${usuarioAlvo.papel}). Permitido.`,
        )
        // Admin pode deletar qualquer outro usuário
        const usuarioRemovido = await this.usuariosService.remove(idSolicitado)
        return new UsuarioResponseDto(usuarioRemovido)
      }
      case PapelUsuario.DIRETOR: {
        // Diretor pode deletar Coordenadores ou Professores
        if (
          usuarioAlvo.papel === PapelUsuario.COORDENADOR ||
          usuarioAlvo.papel === PapelUsuario.PROFESSOR
        ) {
          this.logger.log(
            `Diretor ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) deletando usuário ${usuarioAlvo.papel} (ID: ${idSolicitado}). Permitido.`,
          )
          const usuarioRemovido = await this.usuariosService.remove(idSolicitado)
          return new UsuarioResponseDto(usuarioRemovido)
        } else {
          this.logger.warn(
            `Diretor ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) tentou deletar usuário (ID: ${idSolicitado}) com papel ${usuarioAlvo.papel}. Permissão negada.`,
          )
          throw new ForbiddenException(
            "Diretores só podem deletar usuários Coordenadores ou Professores.",
          )
        }
      }
      case PapelUsuario.COORDENADOR: {
        // Coordenador pode deletar Professores
        if (usuarioAlvo.papel === PapelUsuario.PROFESSOR) {
          this.logger.log(
            `Coordenador ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) deletando usuário PROFESSOR (ID: ${idSolicitado}). Permitido.`,
          )
          const usuarioRemovido = await this.usuariosService.remove(idSolicitado)
          return new UsuarioResponseDto(usuarioRemovido)
        } else {
          this.logger.warn(
            `Coordenador ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) tentou deletar usuário (ID: ${idSolicitado}) com papel ${usuarioAlvo.papel}. Permissão negada.`,
          )
          throw new ForbiddenException(
            "Coordenadores só podem deletar usuários Professores.",
          )
        }
      }
      case PapelUsuario.PROFESSOR: {
        this.logger.warn(
          `Professor ${emailUsuarioLogado} (ID: ${idUsuarioLogado}) tentou deletar usuário (ID: ${idSolicitado}). Permissão negada.`,
        )
        throw new ForbiddenException("Professores não podem deletar usuários.")
      }
      default: {
        this.logger.warn(
          `Usuário ${emailUsuarioLogado} com papel '${String(papelUsuarioLogado)}' (ID: ${idUsuarioLogado}) tentou deletar usuário (ID: ${idSolicitado}). Permissão negada.`,
        )
        throw new ForbiddenException(
          "Você não tem permissão para deletar usuários.",
        )
      }
    }
  }
}
