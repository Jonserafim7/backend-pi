import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
import { CreateDisciplinaDto } from "./dto/create-disciplina.dto"
import { UpdateDisciplinaDto } from "./dto/update-disciplina.dto"
import { DisciplinaResponseDto } from "./dto/disciplina-response.dto"
import { Prisma } from "@prisma/client"

/**
 * Serviço responsável por gerenciar operações relacionadas a disciplinas
 */
@Injectable()
export class DisciplinasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova disciplina no sistema
   * @param createDisciplinaDto Dados para criação da disciplina
   * @returns A nova disciplina criada
   * @throws ConflictException Se já existir uma disciplina com o mesmo código
   */
  async create(
    createDisciplinaDto: CreateDisciplinaDto,
  ): Promise<DisciplinaResponseDto> {
    try {
      const disciplina = await this.prisma.disciplina.create({
        data: createDisciplinaDto,
      })

      return DisciplinaResponseDto.fromEntity(disciplina)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "Já existe uma disciplina com este código. O código da disciplina deve ser único.",
        )
      }
      throw error
    }
  }

  /**
   * Lista todas as disciplinas cadastradas no sistema
   * @param nome Filtro opcional por nome da disciplina
   * @param codigo Filtro opcional por código da disciplina
   * @returns Lista de disciplinas que atendem aos critérios
   */
  async findAll(
    nome?: string,
    codigo?: string,
  ): Promise<DisciplinaResponseDto[]> {
    const where: Prisma.DisciplinaWhereInput = {}

    if (nome) {
      where.nome = {
        contains: nome,
      }
    }

    if (codigo) {
      where.codigo = {
        contains: codigo,
      }
    }

    const disciplinas = await this.prisma.disciplina.findMany({
      where,
      orderBy: { nome: "asc" },
    })

    return disciplinas.map((disciplina) =>
      DisciplinaResponseDto.fromEntity(disciplina),
    )
  }

  /**
   * Busca uma disciplina específica pelo ID
   * @param id ID da disciplina a ser buscada
   * @returns A disciplina encontrada
   * @throws NotFoundException Se a disciplina não for encontrada
   */
  async findOne(id: string): Promise<DisciplinaResponseDto> {
    const disciplina = await this.prisma.disciplina.findUnique({
      where: { id },
      include: {
        matrizesOndeAparece: {
          include: {
            matrizCurricular: true,
          },
        },
        ofertasDaDisciplina: true,
      },
    })

    if (!disciplina) {
      throw new NotFoundException(`Disciplina com ID ${id} não encontrada`)
    }

    return DisciplinaResponseDto.fromEntity(disciplina)
  }

  /**
   * Atualiza os dados de uma disciplina existente
   * @param id ID da disciplina a ser atualizada
   * @param updateDisciplinaDto Dados para atualização da disciplina
   * @returns A disciplina atualizada
   * @throws NotFoundException Se a disciplina não for encontrada
   * @throws ConflictException Se o novo código já estiver em uso por outra disciplina
   */
  async update(
    id: string,
    updateDisciplinaDto: UpdateDisciplinaDto,
  ): Promise<DisciplinaResponseDto> {
    // Verifica se a disciplina existe
    await this.findOne(id)

    try {
      const updatedDisciplina = await this.prisma.disciplina.update({
        where: { id },
        data: updateDisciplinaDto,
      })

      return DisciplinaResponseDto.fromEntity(updatedDisciplina)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "O código informado já está sendo utilizado por outra disciplina",
        )
      }
      throw error
    }
  }

  /**
   * Remove uma disciplina do sistema
   * @param id ID da disciplina a ser removida
   * @returns A disciplina removida
   * @throws NotFoundException Se a disciplina não for encontrada
   * @throws ConflictException Se a disciplina estiver associada a matrizes curriculares ou ofertas
   */
  async remove(id: string): Promise<DisciplinaResponseDto> {
    // Verifica se a disciplina existe e busca suas relações
    const disciplina = await this.prisma.disciplina.findUnique({
      where: { id },
      include: {
        matrizesOndeAparece: true,
        ofertasDaDisciplina: true,
      },
    })

    if (!disciplina) {
      throw new NotFoundException(`Disciplina com ID ${id} não encontrada`)
    }

    // Verifica se a disciplina tem associações que impedem sua exclusão
    if (disciplina.matrizesOndeAparece.length > 0) {
      throw new ConflictException(
        "Esta disciplina não pode ser excluída porque está associada a matrizes curriculares",
      )
    }

    if (disciplina.ofertasDaDisciplina.length > 0) {
      throw new ConflictException(
        "Esta disciplina não pode ser excluída porque possui ofertas em períodos letivos",
      )
    }

    // Remove a disciplina
    const removedDisciplina = await this.prisma.disciplina.delete({
      where: { id },
    })

    return DisciplinaResponseDto.fromEntity(removedDisciplina)
  }

  /**
   * Lista disciplinas das matrizes curriculares dos cursos que o coordenador coordena
   *
   * @param coordenadorId - ID do coordenador logado
   * @returns Lista de disciplinas das matrizes curriculares dos cursos que coordena
   * @throws BadRequestException se o coordenador não coordena nenhum curso
   */
  async findDisciplinasDoCoordenador(
    coordenadorId: string,
  ): Promise<DisciplinaResponseDto[]> {
    // Buscar os cursos que o coordenador coordena
    const cursosCoordenados = await this.prisma.curso.findMany({
      where: { idCoordenador: coordenadorId },
      select: { id: true, nome: true },
    })

    if (!cursosCoordenados || cursosCoordenados.length === 0) {
      throw new BadRequestException(
        "Coordenador não está associado a nenhum curso",
      )
    }

    const idsCursosCoordenados = cursosCoordenados.map((curso) => curso.id)

    // Buscar matrizes curriculares dos cursos coordenados
    const matrizesCurriculares = await this.prisma.matrizCurricular.findMany({
      where: {
        idCurso: { in: idsCursosCoordenados },
      },
      select: { id: true },
    })

    if (!matrizesCurriculares || matrizesCurriculares.length === 0) {
      // Retorna array vazio se não há matrizes curriculares
      return []
    }

    const idsMatrizesCurriculares = matrizesCurriculares.map(
      (matriz) => matriz.id,
    )

    // Buscar disciplinas que fazem parte das matrizes curriculares
    const disciplinasDasMatrizes = await this.prisma.matrizDisciplina.findMany({
      where: {
        idMatrizCurricular: { in: idsMatrizesCurriculares },
      },
      include: {
        disciplina: true,
      },
      orderBy: {
        disciplina: { nome: "asc" },
      },
    })

    // Remover duplicatas (uma disciplina pode estar em múltiplas matrizes)
    const disciplinasUnicas = new Map<string, any>()
    disciplinasDasMatrizes.forEach((matrizDisciplina) => {
      const disciplina = matrizDisciplina.disciplina
      if (!disciplinasUnicas.has(disciplina.id)) {
        disciplinasUnicas.set(disciplina.id, disciplina)
      }
    })

    // Mapear para o formato de resposta
    return Array.from(disciplinasUnicas.values()).map((disciplina) =>
      DisciplinaResponseDto.fromEntity(disciplina),
    )
  }
}
