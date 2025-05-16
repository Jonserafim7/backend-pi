import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../core/prisma/prisma.service"
import { CreateUsuarioDto } from "./dto/create-usuario.dto"
import { FindUsersDto } from "./dto/find-users.dto"
import { UpdateUsuarioDto } from "./dto/update-usuario.dto"
import { UsuariosResponseDto } from "./dto/usuarios.response.dto"
import { UsuarioResponseDto } from "./dto/usuario.response.dto"
import * as bcrypt from "bcrypt"

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name)
  private readonly saltRounds = 10

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo usuário no sistema
   * @param createUsuarioDto Dados do usuário a ser criado
   * @param usuarioAtual Opcional: Usuário que está realizando a operação
   * @returns Usuário criado sem a senha
   */
  async create(
    createUsuarioDto: CreateUsuarioDto,
    usuarioAtual?: { id: string; papel: string },
  ): Promise<UsuarioResponseDto> {
    const { email, senha, papel, ...rest } = createUsuarioDto

    // Verificações de segurança para o papel Admin
    if (papel === "ADMIN" && usuarioAtual && usuarioAtual.papel !== "ADMIN") {
      this.logger.warn(
        `Tentativa de criar usuário Admin por usuário não autorizado: ${usuarioAtual.id}`,
      )
      throw new BadRequestException(
        "Apenas administradores podem criar outros administradores.",
      )
    }

    // Verifica se o e-mail já está em uso
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email },
    })

    if (usuarioExistente) {
      this.logger.warn(`Tentativa de cadastro com e-mail já existente: ${email}`)
      throw new ConflictException("Este e-mail já está em uso.")
    }

    // Hash da senha
    const hashSenha = await bcrypt.hash(senha, this.saltRounds)

    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          ...rest,
          email,
          papel,
          hashSenha,
        },
      })

      this.logger.log(`Usuário criado com sucesso: ${usuario.id}`)

      // Remove a senha do objeto de retorno
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hashSenha: _, ...result } = usuario
      return result as UsuarioResponseDto
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido"
      const errorStack = error instanceof Error ? error.stack : ""

      this.logger.error(`Erro ao criar usuário: ${errorMessage}`, errorStack)
      throw new BadRequestException("Erro ao criar usuário.")
    }
  }

  /**
   * Busca usuários com filtros e paginação
   * @param findUsersDto Filtros para busca de usuários
   * @param pagina Número da página (começa em 1)
   * @param limite Número de itens por página
   * @returns Lista de usuários e metadados de paginação
   */
  async findAll(
    findUsersDto: FindUsersDto = {},
    pagina = 1,
    limite = 10,
  ): Promise<UsuariosResponseDto> {
    const { busca, papel } = findUsersDto
    const skip = (pagina - 1) * limite

    // Constrói o filtro baseado nos parâmetros fornecidos
    const where: Prisma.UsuarioWhereInput = {}

    if (busca) {
      const buscaLower = busca.toLowerCase()
      where.OR = [
        { nome: { contains: buscaLower } },
        { email: { contains: buscaLower } },
      ]
    }

    if (papel) {
      where.papel = papel
    }

    try {
      const [total, usuarios] = await Promise.all([
        this.prisma.usuario.count({ where }),
        this.prisma.usuario.findMany({
          where,
          skip,
          take: limite,
          orderBy: { nome: "asc" },
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
            dataCriacao: true,
            dataAtualizacao: true,
          },
        }),
      ])

      // Garante que temos um array, mesmo que vazio
      const safeUsuarios = Array.isArray(usuarios) ? usuarios : []

      return {
        meta: {
          total,
          paginas: Math.ceil(total / limite),
          pagina,
          limite,
        },
        data: safeUsuarios,
      }
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar usuários: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
        error instanceof Error ? error.stack : undefined,
      )
      return {
        meta: {
          total: 0,
          paginas: 0,
          pagina: 1,
          limite: 10,
        },
        data: [],
      }
    }
  }

  /**
   * Busca um usuário pelo ID
   * @param id ID do usuário
   * @returns Dados do usuário
   */
  async findOne(id: string): Promise<UsuarioResponseDto> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        dataCriacao: true,
        dataAtualizacao: true,
      },
    })

    if (!usuario) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`)
    }

    return usuario as UsuarioResponseDto
  }

  /**
   * Atualiza um usuário existente
   * @param id ID do usuário
   * @param updateUsuarioDto Dados para atualização
   * @param usuarioAtual Opcional: Usuário que está realizando a operação
   * @returns Usuário atualizado
   */
  async update(
    id: string,
    updateUsuarioDto: UpdateUsuarioDto,
    usuarioAtual?: { id: string; papel: string },
  ): Promise<UsuarioResponseDto> {
    const { email, senha, ...rest } = updateUsuarioDto

    // Verifica se o usuário existe
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { id },
    })

    if (!usuarioExistente) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`)
    }

    // Verificações de segurança para papéis protegidos
    if (usuarioAtual && usuarioAtual.papel !== "ADMIN") {
      // Apenas Admins podem modificar outros Admins ou Diretores
      if (
        usuarioExistente.papel === "ADMIN" ||
        usuarioExistente.papel === "DIRETOR"
      ) {
        this.logger.warn(
          `Tentativa de atualizar usuário ${usuarioExistente.papel} por usuário não autorizado: ${usuarioAtual.id}`,
        )
        throw new BadRequestException(
          `Apenas administradores podem modificar usuários ${usuarioExistente.papel}.`,
        )
      }
    }

    // Verifica se está tentando mudar o papel para ADMIN ou DIRETOR
    if (updateUsuarioDto.papel) {
      if (
        (updateUsuarioDto.papel === "ADMIN" ||
          updateUsuarioDto.papel === "DIRETOR") &&
        usuarioAtual &&
        usuarioAtual.papel !== "ADMIN"
      ) {
        this.logger.warn(
          `Tentativa de promover usuário para ${updateUsuarioDto.papel} por usuário não autorizado: ${usuarioAtual.id}`,
        )
        throw new BadRequestException(
          `Apenas administradores podem promover usuários para ${updateUsuarioDto.papel}.`,
        )
      }
    }

    // Se estiver tentando atualizar o e-mail, verifica se já existe outro com o mesmo e-mail
    if (email && email !== usuarioExistente.email) {
      const emailEmUso = await this.prisma.usuario.findUnique({
        where: { email },
      })

      if (emailEmUso) {
        throw new ConflictException(
          "Este e-mail já está em uso por outro usuário.",
        )
      }
    }

    // Se estiver atualizando a senha, faz o hash
    let dadosAtualizacao: Prisma.UsuarioUpdateInput = { ...rest }
    if (senha) {
      const hashSenha = await bcrypt.hash(senha, this.saltRounds)
      dadosAtualizacao = { ...dadosAtualizacao, hashSenha }
    }

    if (email) {
      dadosAtualizacao = { ...dadosAtualizacao, email }
    }

    try {
      const usuarioAtualizado = await this.prisma.usuario.update({
        where: { id },
        data: dadosAtualizacao,
        select: {
          id: true,
          nome: true,
          email: true,
          papel: true,
          dataCriacao: true,
          dataAtualizacao: true,
        },
      })

      this.logger.log(`Usuário atualizado: ${id}`)
      return usuarioAtualizado as UsuarioResponseDto
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido"
      const errorStack = error instanceof Error ? error.stack : ""

      this.logger.error(
        `Erro ao atualizar usuário ${id}: ${errorMessage}`,
        errorStack,
      )
      throw new BadRequestException("Erro ao atualizar usuário.")
    }
  }

  /**
   * Remove um usuário do sistema
   * @param id ID do usuário a ser removido
   * @param usuarioAtual Opcional: Usuário que está realizando a operação
   */
  async remove(
    id: string,
    usuarioAtual?: { id: string; papel: string },
  ): Promise<void> {
    // Verifica se o usuário existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    })

    if (!usuario) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`)
    }

    // Verificações de segurança para papéis protegidos
    if (usuarioAtual && usuarioAtual.papel !== "ADMIN") {
      // Apenas Admins podem remover outros Admins ou Diretores
      if (usuario.papel === "ADMIN" || usuario.papel === "DIRETOR") {
        this.logger.warn(
          `Tentativa de remover usuário ${usuario.papel} por usuário não autorizado: ${usuarioAtual.id}`,
        )
        throw new BadRequestException(
          `Apenas administradores podem remover usuários ${usuario.papel}.`,
        )
      }
    }

    try {
      await this.prisma.usuario.delete({
        where: { id },
      })
      this.logger.log(`Usuário removido: ${id}`)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido"
      const errorStack = error instanceof Error ? error.stack : ""

      this.logger.error(
        `Erro ao remover usuário ${id}: ${errorMessage}`,
        errorStack,
      )

      // Verifica se é um erro de restrição de chave estrangeira
      if (error instanceof Error && "code" in error && error.code === "P2003") {
        throw new BadRequestException(
          "Não é possível remover o usuário pois existem registros relacionados a ele.",
        )
      }

      throw new BadRequestException("Erro ao remover usuário.")
    }
  }
}
