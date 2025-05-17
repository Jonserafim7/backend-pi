import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
import { CreateCursoDto } from "./dto/create-curso.dto"
import { UpdateCursoDto } from "./dto/update-curso.dto"
import { PapelUsuario } from "@prisma/client"
import { CursoComCoordenadorPayload } from "./types/curso-com-coordenador-payload.type"

@Injectable()
export class CursosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo curso
   * @param createCursoDto Dados para criação do curso
   * @returns Curso criado
   */
  async create(
    createCursoDto: CreateCursoDto,
  ): Promise<CursoComCoordenadorPayload> {
    const cursoExistente = await this.prisma.curso.findUnique({
      where: { codigo: createCursoDto.codigo },
    })

    if (cursoExistente) {
      throw new ConflictException("Já existe um curso com este código")
    }

    // Valida o coordenador. createCursoDto.idCoordenador é obrigatório pelo DTO.
    await this.validateCoordinator(createCursoDto.idCoordenador)

    const curso = await this.prisma.curso.create({
      data: {
        nome: createCursoDto.nome,
        codigo: createCursoDto.codigo,
        idCoordenador: createCursoDto.idCoordenador,
      },
      include: {
        coordenadorPrincipal: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })

    return curso
  }

  /**
   * Lista todos os cursos com dados selecionados diretamente do banco
   * @returns Lista de cursos com apenas os campos necessários
   */
  async findAll(): Promise<CursoComCoordenadorPayload[]> {
    const cursos = await this.prisma.curso.findMany({
      include: {
        coordenadorPrincipal: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })

    return cursos
  }

  /**
   * Busca um curso pelo ID
   * @param id ID do curso
   * @returns Curso encontrado
   */
  async findOne(id: string): Promise<CursoComCoordenadorPayload> {
    const curso = await this.prisma.curso.findUnique({
      where: { id },
      include: {
        coordenadorPrincipal: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })

    if (!curso) {
      throw new NotFoundException("Curso não encontrado")
    }

    return curso
  }

  /**
   * Atualiza um curso existente
   * @param id ID do curso
   * @param updateCursoDto Dados para atualização
   * @returns Curso atualizado
   */
  async update(
    id: string,
    updateCursoDto: UpdateCursoDto,
  ): Promise<CursoComCoordenadorPayload> {
    // Verifica se o curso existe
    await this.findOne(id)

    // Verifica conflito de código, se houver alteração no código
    if (updateCursoDto.codigo) {
      const cursoCodigo = await this.prisma.curso.findFirst({
        where: {
          codigo: updateCursoDto.codigo,
          id: { not: id },
        },
      })

      if (cursoCodigo) {
        throw new ConflictException("Já existe outro curso com este código")
      }
    }

    // Valida o coordenador, se informado
    if (updateCursoDto.idCoordenador) {
      await this.validateCoordinator(updateCursoDto.idCoordenador, id)
    }

    // Atualiza o curso
    const curso = await this.prisma.curso.update({
      where: { id },
      data: updateCursoDto,
      include: {
        coordenadorPrincipal: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })

    return curso
  }

  /**
   * Remove um curso existente
   * @param id ID do curso
   * @returns Curso removido
   */
  async remove(id: string): Promise<CursoComCoordenadorPayload> {
    // Verifica se o curso existe
    await this.findOne(id)

    // Remove o curso
    const curso = await this.prisma.curso.delete({
      where: { id },
      include: {
        coordenadorPrincipal: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })

    return curso
  }

  /**
   * Valida se o usuário informado é um coordenador válido e não está atribuído a outro curso
   * @param idCoordenador ID do coordenador
   * @param cursoId ID do curso atual (opcional, usado apenas em atualizações)
   */
  private async validateCoordinator(
    idCoordenador: string,
    cursoId?: string,
  ): Promise<void> {
    // Verifica se o usuário existe e é um coordenador
    const coordenador = await this.prisma.usuario.findUnique({
      where: { id: idCoordenador },
    })

    if (!coordenador) {
      throw new NotFoundException("Coordenador não encontrado")
    }

    if (coordenador.papel !== PapelUsuario.COORDENADOR) {
      throw new BadRequestException("O usuário informado não é um coordenador")
    }

    // Verifica se o coordenador já está atribuído a outro curso
    const cursoExistente = await this.prisma.curso.findFirst({
      where: {
        idCoordenador,
        id: { not: cursoId }, // Ignora o curso atual em caso de atualização
      },
    })

    if (cursoExistente) {
      throw new ConflictException(
        `Este coordenador já está atribuído ao curso ${cursoExistente.nome} (${cursoExistente.codigo})`,
      )
    }
  }
}
