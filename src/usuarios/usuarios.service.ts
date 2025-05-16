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
   * @returns Usuário criado sem a senha
   */
  async create(createUsuarioDto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    const { email, senha, ...rest } = createUsuarioDto

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
  ): Promise<{
    data: UsuarioResponseDto[]
    total: number
    paginas: number
    pagina: number
    limite: number
  }> {
    const { busca, papel } = findUsersDto
    const skip = (pagina - 1) * limite

    // Constrói o filtro baseado nos parâmetros fornecidos
    const where: Prisma.UsuarioWhereInput = {}

    if (busca) {
      where.OR = [{ nome: { contains: busca } }, { email: { contains: busca } }]
    }

    if (papel) {
      where.papel = papel
    }

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

    return {
      data: usuarios as UsuarioResponseDto[],
      total,
      paginas: Math.ceil(total / limite),
      pagina,
      limite,
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
   * @returns Usuário atualizado
   */
  async update(
    id: string,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<UsuarioResponseDto> {
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
   */
  async remove(id: string): Promise<void> {
    // Verifica se o usuário existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    })

    if (!usuario) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`)
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
