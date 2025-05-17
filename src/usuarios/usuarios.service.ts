import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common"
import { Prisma, Usuario, PapelUsuario } from "@prisma/client"
import { PrismaService } from "../core/prisma/prisma.service"
import { CreateUsuarioDto } from "./dto/create-usuario.dto"
import { UpdateUsuarioDto } from "./dto/update-usuario.dto"
import * as bcrypt from "bcrypt"

// Nova interface para opções de filtro
export interface FindAllUsuariosOptions {
  papel?: PapelUsuario
  papeis?: PapelUsuario[]
  // TODO: Adicionar outras opções de filtro/paginaçāo se necessário no futuro
}

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
  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const { email, senha, papel, ...rest } = createUsuarioDto

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

      return usuario
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
   * @returns Lista de usuários e metadados de paginação
   */
  async findAll(options?: FindAllUsuariosOptions): Promise<Usuario[]> {
    const where: Prisma.UsuarioWhereInput = {}

    if (options?.papeis && options.papeis.length > 0) {
      where.papel = { in: options.papeis }
    } else if (options?.papel) {
      where.papel = options.papel
    }
    // Se nem options.papeis nem options.papel forem fornecidos, where.papel permanece undefined,
    // o que significa que não haverá filtro por papel, retornando todos os usuários (conforme comportamento Prisma).

    try {
      const usuarios = await this.prisma.usuario.findMany({
        where, // where dinâmico
        orderBy: {
          nome: "asc",
        },
      })

      return usuarios
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar usuários: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
        error instanceof Error ? error.stack : undefined,
      )
      return [] // Retorna array vazio em caso de erro, como antes
    }
  }

  /**
   * Busca um usuário pelo ID
   * @param id ID do usuário
   * @returns Dados do usuário
   */
  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    })

    if (!usuario) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`)
    }

    return usuario
  }

  /**
   * Atualiza um usuário existente
   * @param id ID do usuário
   * @param updateUsuarioDto Dados para atualização
   * @param usuarioAtual Opcional: Usuário que está realizando a operação
   * @returns Usuário atualizado
   */
  async update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
    const { email, senha, ...rest } = updateUsuarioDto

    // Verifica se o usuário existe
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { id },
    })

    if (!usuarioExistente) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`)
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
      })

      this.logger.log(`Usuário atualizado: ${id}`)
      return usuarioAtualizado
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
   */
  async remove(id: string): Promise<Usuario> {
    // Verifica se o usuário existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    })

    if (!usuario) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`)
    }

    try {
      const usuarioRemovido = await this.prisma.usuario.delete({
        where: { id },
      })
      this.logger.log(`Usuário removido: ${id}`)
      return usuarioRemovido
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
