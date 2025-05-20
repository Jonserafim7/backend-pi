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
import { Prisma } from "@prisma/client"

/**
 * Serviço para gerenciamento de Matrizes Curriculares
 *
 * Implementa a lógica de negócio para criação, consulta, atualização e
 * remoção de matrizes curriculares, incluindo a gestão de suas disciplinas.
 */
@Injectable()
export class MatrizesCurricularesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova matriz curricular
   *
   * @param createMatrizCurricularDto - Dados para criação da matriz curricular
   * @returns Promise com a matriz curricular criada e suas disciplinas
   * @throws BadRequestException se o curso não existir
   * @throws BadRequestException se alguma disciplina não existir
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
    if (disciplinasIds.length > 0) {
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
      const matrizCurricular = await tx.matrizCurricular.create({
        data: {
          nome,
          idCurso,
        },
      })

      // Criar as associações com disciplinas
      if (disciplinasIds.length > 0) {
        await tx.matrizDisciplina.createMany({
          data: disciplinasIds.map((idDisciplina) => ({
            idMatrizCurricular: matrizCurricular.id,
            idDisciplina,
          })),
        })
      }

      // Buscar a matriz curricular criada com suas associações
      return this.findOneWithTransaction(matrizCurricular.id, tx)
    })
  }

  /**
   * Lista todas as matrizes curriculares
   *
   * @param idCurso - Opcional, filtra por curso específico
   * @returns Promise com array de matrizes curriculares
   */
  async findAll(idCurso?: string): Promise<MatrizCurricularResponseDto[]> {
    const whereClause: Prisma.MatrizCurricularWhereInput =
      idCurso ? { idCurso } : {}

    const matrizesCurriculares = await this.prisma.matrizCurricular.findMany({
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
        nome: "asc",
      },
    })

    return matrizesCurriculares.map((matriz) => this.mapToResponse(matriz))
  }

  /**
   * Busca uma matriz curricular pelo ID
   *
   * @param id - ID da matriz curricular
   * @returns Promise com os dados da matriz curricular
   * @throws NotFoundException se a matriz não for encontrada
   */
  async findOne(id: string): Promise<MatrizCurricularResponseDto> {
    const matrizCurricular = await this.prisma.matrizCurricular.findUnique({
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

    if (!matrizCurricular) {
      throw new NotFoundException(`Matriz curricular com ID ${id} não encontrada`)
    }

    return this.mapToResponse(matrizCurricular)
  }

  /**
   * Método interno para buscar uma matriz curricular usando uma transação
   *
   * @param id - ID da matriz curricular
   * @param tx - Transação Prisma
   * @returns Promise com os dados da matriz curricular
   * @throws NotFoundException se a matriz não for encontrada
   */
  private async findOneWithTransaction(
    id: string,
    tx: Prisma.TransactionClient,
  ): Promise<MatrizCurricularResponseDto> {
    const matrizCurricular = await tx.matrizCurricular.findUnique({
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

    if (!matrizCurricular) {
      throw new NotFoundException(`Matriz curricular com ID ${id} não encontrada`)
    }

    return this.mapToResponse(matrizCurricular)
  }

  /**
   * Atualiza uma matriz curricular
   *
   * @param id - ID da matriz curricular
   * @param updateMatrizCurricularDto - Dados para atualização
   * @returns Promise com a matriz curricular atualizada
   * @throws NotFoundException se a matriz não for encontrada
   * @throws BadRequestException se o curso não existir
   * @throws BadRequestException se alguma disciplina não existir
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
      disciplinas: matriz.disciplinasDaMatriz.map((md) => ({
        id: md.disciplina.id,
        nome: md.disciplina.nome,
        codigo: md.disciplina.codigo || "",
        cargaHoraria: md.disciplina.cargaHoraria,
      })),
    }
  }
}
