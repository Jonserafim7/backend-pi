import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
import { CreateMatrizCurricularDto } from "./dto/create-matriz-curricular.dto"
import { UpdateMatrizCurricularDto } from "./dto/update-matriz-curricular.dto"
import { MatrizCurricularResponseDto } from "./dto/matriz-curricular-response.dto"
import { DisciplinaResponseDto } from "../disciplinas/dto/disciplina-response.dto"
import { Prisma } from "@prisma/client"

/**
 * Service responsável por gerenciar as operações de Matrizes Curriculares
 *
 * Implementa CRUD completo e validações de regras de negócio
 */
@Injectable()
export class MatrizesCurricularesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova matriz curricular
   *
   * @param createMatrizCurricularDto - Dados para criação da matriz
   * @returns Matriz curricular criada
   * @throws BadRequestException se o curso não for encontrado ou disciplinas não existirem
   */
  async create(
    createMatrizCurricularDto: CreateMatrizCurricularDto,
  ): Promise<MatrizCurricularResponseDto> {
    const { nome, idCurso, disciplinasIds } = createMatrizCurricularDto

    // Verificar se o curso existe
    const cursoExiste = await this.prisma.curso.findUnique({
      where: { id: idCurso },
    })

    if (!cursoExiste) {
      throw new BadRequestException(`Curso com ID ${idCurso} não encontrado`)
    }

    // Verificar se todas as disciplinas existem
    if (disciplinasIds && disciplinasIds.length > 0) {
      const disciplinasExistentes = await this.prisma.disciplina.findMany({
        where: { id: { in: disciplinasIds } },
        select: { id: true },
      })

      if (disciplinasExistentes.length !== disciplinasIds.length) {
        const disciplinasEncontradas = disciplinasExistentes.map((d) => d.id)
        const disciplinasNaoEncontradas = disciplinasIds.filter(
          (id) => !disciplinasEncontradas.includes(id),
        )
        throw new BadRequestException(
          `Disciplinas não encontradas: ${disciplinasNaoEncontradas.join(", ")}`,
        )
      }
    }

    // Usar transação para garantir atomicidade
    return this.prisma.$transaction(async (tx) => {
      // Criar a matriz curricular
      const novaMatriz = await tx.matrizCurricular.create({
        data: {
          nome,
          idCurso,
        },
      })

      // Associar disciplinas se fornecidas
      if (disciplinasIds && disciplinasIds.length > 0) {
        await tx.matrizDisciplina.createMany({
          data: disciplinasIds.map((idDisciplina) => ({
            idMatrizCurricular: novaMatriz.id,
            idDisciplina,
          })),
        })
      }

      // Buscar e retornar a matriz com todas as informações
      return this.findOneWithTransaction(novaMatriz.id, tx)
    })
  }

  /**
   * Lista todas as matrizes curriculares
   *
   * @param idCurso - Filtro opcional por curso
   * @returns Lista de matrizes curriculares
   */
  async findAll(idCurso?: string): Promise<MatrizCurricularResponseDto[]> {
    const whereClause: Prisma.MatrizCurricularWhereInput = {}

    if (idCurso) {
      whereClause.idCurso = idCurso
    }

    const matrizes = await this.prisma.matrizCurricular.findMany({
      where: whereClause,
      include: {
        curso: {
          select: {
            nome: true,
          },
        },
        disciplinasDaMatriz: {
          include: {
            disciplina: true,
          },
        },
      },
      orderBy: {
        dataCriacao: "desc",
      },
    })

    return matrizes.map((matriz) => this.mapToResponse(matriz))
  }

  /**
   * Busca uma matriz curricular específica
   *
   * @param id - ID da matriz curricular
   * @returns Matriz curricular encontrada
   * @throws NotFoundException se a matriz não for encontrada
   */
  async findOne(id: string): Promise<MatrizCurricularResponseDto> {
    const matriz = await this.prisma.matrizCurricular.findUnique({
      where: { id },
      include: {
        curso: {
          select: {
            nome: true,
          },
        },
        disciplinasDaMatriz: {
          include: {
            disciplina: true,
          },
        },
      },
    })

    if (!matriz) {
      throw new NotFoundException(`Matriz curricular com ID ${id} não encontrada`)
    }

    return this.mapToResponse(matriz)
  }

  /**
   * Busca uma matriz curricular específica usando uma transação
   * (método auxiliar para operações internas)
   *
   * @param id - ID da matriz curricular
   * @param tx - Cliente da transação
   * @returns Matriz curricular encontrada
   */
  private async findOneWithTransaction(
    id: string,
    tx: Prisma.TransactionClient,
  ): Promise<MatrizCurricularResponseDto> {
    const matriz = await tx.matrizCurricular.findUniqueOrThrow({
      where: { id },
      include: {
        curso: {
          select: {
            nome: true,
          },
        },
        disciplinasDaMatriz: {
          include: {
            disciplina: true,
          },
        },
      },
    })

    return this.mapToResponse(matriz)
  }

  /**
   * Atualiza uma matriz curricular
   *
   * @param id - ID da matriz curricular
   * @param updateMatrizCurricularDto - Dados para atualização
   * @returns Matriz curricular atualizada
   * @throws NotFoundException se a matriz não for encontrada
   * @throws BadRequestException se dados inválidos forem fornecidos
   */
  async update(
    id: string,
    updateMatrizCurricularDto: UpdateMatrizCurricularDto,
  ): Promise<MatrizCurricularResponseDto> {
    // Verificar se a matriz existe
    const matrizExiste = await this.prisma.matrizCurricular.findUnique({
      where: { id },
    })

    if (!matrizExiste) {
      throw new NotFoundException(`Matriz curricular com ID ${id} não encontrada`)
    }

    const {
      nome,
      idCurso,
      disciplinasIds,
      disciplinasParaAdicionar,
      disciplinasParaRemover,
    } = updateMatrizCurricularDto

    // Verificar se o curso existe, se informado
    if (idCurso) {
      const cursoExiste = await this.prisma.curso.findUnique({
        where: { id: idCurso },
      })

      if (!cursoExiste) {
        throw new BadRequestException(`Curso com ID ${idCurso} não encontrado`)
      }
    }

    // Verificar disciplinas a adicionar, se informadas
    if (disciplinasParaAdicionar && disciplinasParaAdicionar.length > 0) {
      const disciplinasExistentes = await this.prisma.disciplina.findMany({
        where: { id: { in: disciplinasParaAdicionar } },
        select: { id: true },
      })

      if (disciplinasExistentes.length !== disciplinasParaAdicionar.length) {
        const disciplinasEncontradas = disciplinasExistentes.map((d) => d.id)
        const disciplinasNaoEncontradas = disciplinasParaAdicionar.filter(
          (id) => !disciplinasEncontradas.includes(id),
        )
        throw new BadRequestException(
          `Disciplinas não encontradas: ${disciplinasNaoEncontradas.join(", ")}`,
        )
      }
    }

    // Usar transação para garantir atomicidade
    return this.prisma.$transaction(async (tx) => {
      // Atualizar dados básicos da matriz curricular
      if (nome || idCurso) {
        await tx.matrizCurricular.update({
          where: { id },
          data: {
            ...(nome && { nome }),
            ...(idCurso && { idCurso }),
          },
        })
      }

      // Se foi fornecida uma lista completa de disciplinas, recriar todas as associações
      if (disciplinasIds) {
        // Remover todas as associações existentes
        await tx.matrizDisciplina.deleteMany({
          where: { idMatrizCurricular: id },
        })

        // Criar novas associações
        if (disciplinasIds.length > 0) {
          await tx.matrizDisciplina.createMany({
            data: disciplinasIds.map((idDisciplina) => ({
              idMatrizCurricular: id,
              idDisciplina,
            })),
          })
        }
      } else {
        // Adicionar novas disciplinas
        if (disciplinasParaAdicionar && disciplinasParaAdicionar.length > 0) {
          // Buscar associações existentes para evitar duplicatas
          const associacoesExistentes = await tx.matrizDisciplina.findMany({
            where: {
              idMatrizCurricular: id,
              idDisciplina: { in: disciplinasParaAdicionar },
            },
            select: { idDisciplina: true },
          })

          const disciplinasJaAssociadas = associacoesExistentes.map(
            (a) => a.idDisciplina,
          )
          const disciplinasParaInserir = disciplinasParaAdicionar.filter(
            (idDisciplina) => !disciplinasJaAssociadas.includes(idDisciplina),
          )

          if (disciplinasParaInserir.length > 0) {
            await tx.matrizDisciplina.createMany({
              data: disciplinasParaInserir.map((idDisciplina) => ({
                idMatrizCurricular: id,
                idDisciplina,
              })),
            })
          }
        }

        // Remover disciplinas
        if (disciplinasParaRemover && disciplinasParaRemover.length > 0) {
          await tx.matrizDisciplina.deleteMany({
            where: {
              idMatrizCurricular: id,
              idDisciplina: { in: disciplinasParaRemover },
            },
          })
        }
      }

      // Buscar a matriz curricular atualizada
      return this.findOneWithTransaction(id, tx)
    })
  }

  /**
   * Remove uma matriz curricular
   *
   * @param id - ID da matriz curricular
   * @throws NotFoundException se a matriz não for encontrada
   * @throws ConflictException se a matriz estiver em uso
   */
  async remove(id: string): Promise<void> {
    // Verificar se a matriz existe
    const matrizExiste = await this.prisma.matrizCurricular.findUnique({
      where: { id },
    })

    if (!matrizExiste) {
      throw new NotFoundException(`Matriz curricular com ID ${id} não encontrada`)
    }

    // Verificar se a matriz está sendo utilizada por disciplinas ofertadas
    const disciplinasOferecidasUsandoMatriz =
      await this.prisma.disciplinaOfertada.count({
        where: {
          disciplina: {
            matrizesOndeAparece: {
              some: {
                idMatrizCurricular: id,
              },
            },
          },
        },
      })

    if (disciplinasOferecidasUsandoMatriz > 0) {
      throw new ConflictException(
        `Não é possível remover a matriz curricular pois está sendo utilizada por ${disciplinasOferecidasUsandoMatriz} disciplina(s) ofertada(s)`,
      )
    }

    // Usar transação para garantir atomicidade
    await this.prisma.$transaction(async (tx) => {
      // Remover todas as associações com disciplinas
      await tx.matrizDisciplina.deleteMany({
        where: { idMatrizCurricular: id },
      })

      // Remover a matriz curricular
      await tx.matrizCurricular.delete({
        where: { id },
      })
    })
  }

  /**
   * Mapeia os dados do Prisma para o formato de resposta
   *
   * @param matriz - Dados da matriz curricular do Prisma
   * @returns Objeto no formato padronizado de resposta
   */
  private mapToResponse(
    matriz: Prisma.MatrizCurricularGetPayload<{
      include: {
        curso: { select: { nome: true } }
        disciplinasDaMatriz: { include: { disciplina: true } }
      }
    }>,
  ): MatrizCurricularResponseDto {
    return {
      id: matriz.id,
      nome: matriz.nome,
      idCurso: matriz.idCurso,
      nomeCurso: matriz.curso.nome,
      createdAt: matriz.dataCriacao,
      updatedAt: matriz.dataAtualizacao,
      disciplinas: matriz.disciplinasDaMatriz.map((md) =>
        DisciplinaResponseDto.fromEntity(md.disciplina),
      ),
    }
  }
}
