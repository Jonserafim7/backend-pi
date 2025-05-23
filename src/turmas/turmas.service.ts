import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
import { CreateTurmaDto } from "./dto/create-turma.dto"
import { UpdateTurmaDto } from "./dto/update-turma.dto"
import { ListarTurmasQueryDto } from "./dto/listar-turmas-query.dto"
import { TurmaResponseDto } from "./dto/turma-response.dto"
import { Prisma } from "@prisma/client"
import { PeriodoLetivoResponseDto } from "../periodos-letivos/dto/periodo-letivo-response.dto"

@Injectable()
export class TurmasService {
  private readonly logger = new Logger(TurmasService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria múltiplas turmas para uma disciplina ofertada.
   * Gera códigos de turma sequenciais (T1, T2, ...).
   * @param idDisciplinaOfertada O ID da disciplina ofertada.
   * @param quantidadeTurmas O número de turmas a serem criadas.
   * @returns Uma lista das turmas criadas.
   */
  async createTurmasForDisciplinaOfertada(
    idDisciplinaOfertada: string,
    quantidadeTurmas: number,
  ): Promise<TurmaResponseDto[]> {
    this.logger.log(
      `Iniciando criação de ${quantidadeTurmas} turmas para a oferta ID: ${idDisciplinaOfertada}`,
    )

    const disciplinaOfertada = await this.prisma.disciplinaOfertada.findUnique({
      where: { id: idDisciplinaOfertada },
    })

    if (!disciplinaOfertada) {
      this.logger.error(
        `DisciplinaOfertada com ID "${idDisciplinaOfertada}" não encontrada.`,
      )
      throw new NotFoundException(
        `DisciplinaOfertada com ID "${idDisciplinaOfertada}" não encontrada.`,
      )
    }

    const turmasCriadasData: Prisma.TurmaCreateManyInput[] = []

    for (let i = 1; i <= quantidadeTurmas; i++) {
      const codigoTurma = `T${i}`
      turmasCriadasData.push({
        codigoDaTurma: codigoTurma,
        idDisciplinaOfertada: idDisciplinaOfertada,
      })
    }

    if (turmasCriadasData.length > 0) {
      try {
        const result = await this.prisma.turma.createMany({
          data: turmasCriadasData,
          skipDuplicates: true as never,
        })
        this.logger.log(
          `${result.count} turmas criadas com sucesso via createMany.`,
        )

        const codigosTurmasCriadas = turmasCriadasData.map(
          (op) => op.codigoDaTurma,
        )
        const fetchedTurmas = await this.prisma.turma.findMany({
          where: {
            idDisciplinaOfertada: idDisciplinaOfertada,
            codigoDaTurma: { in: codigosTurmasCriadas },
          },
          orderBy: { codigoDaTurma: "asc" },
        })

        return fetchedTurmas.map((turma) => ({
          id: turma.id,
          codigoDaTurma: turma.codigoDaTurma,
          idDisciplinaOfertada: turma.idDisciplinaOfertada,
          dataCriacao: turma.dataCriacao,
          dataAtualizacao: turma.dataAtualizacao,
        }))
      } catch (error) {
        const e = error as Error
        this.logger.error(
          `Erro ao criar turmas para DisciplinaOfertada ID "${idDisciplinaOfertada}": ${e.message}`,
          e.stack,
        )
        throw new InternalServerErrorException(
          "Ocorreu um erro ao criar as turmas.",
        )
      }
    }

    this.logger.log(
      `Total de ${turmasCriadasData.length} turmas processadas/retornadas para a oferta ID: ${idDisciplinaOfertada}`,
    )
    return [] // Should ideally not be reached if turmasCriadasData had items
  }

  /**
   * Ajusta o número de turmas para uma disciplina ofertada.
   * Atualmente, apenas cria turmas adicionais se a nova quantidade for maior.
   * A remoção de turmas precisa ser implementada com mais cuidado.
   * @param idDisciplinaOfertada O ID da disciplina ofertada.
   * @param novaQuantidadeTurmas A nova quantidade total de turmas desejada.
   * @returns Uma lista das turmas criadas nesta operação.
   */
  async adjustTurmasForDisciplinaOfertada(
    idDisciplinaOfertada: string,
    novaQuantidadeTurmas: number,
  ): Promise<TurmaResponseDto[]> {
    this.logger.log(
      `Ajustando turmas para oferta ID: ${idDisciplinaOfertada} para ${novaQuantidadeTurmas} turmas.`,
    )
    const turmasExistentes = await this.prisma.turma.findMany({
      where: { idDisciplinaOfertada },
      select: {
        id: true,
        codigoDaTurma: true,
        idDisciplinaOfertada: true,
        dataCriacao: true,
        dataAtualizacao: true,
      },
    })

    const quantidadeExistente = turmasExistentes.length
    const turmasProcessadasNestaOperacao: TurmaResponseDto[] = []

    if (novaQuantidadeTurmas > quantidadeExistente) {
      const quantidadeACriar = novaQuantidadeTurmas - quantidadeExistente
      this.logger.log(`Precisamos criar ${quantidadeACriar} turmas adicionais.`)

      const codigosTurmasExistentes = new Set(
        turmasExistentes.map((t) => t.codigoDaTurma),
      )
      const operacoesCriacao: Prisma.TurmaCreateManyInput[] = []

      let turmaIdx = 1
      let turmasAdicionadas = 0
      while (turmasAdicionadas < quantidadeACriar) {
        const codigoTurma = `T${turmaIdx}`
        if (!codigosTurmasExistentes.has(codigoTurma)) {
          operacoesCriacao.push({
            codigoDaTurma: codigoTurma,
            idDisciplinaOfertada: idDisciplinaOfertada,
          })
          turmasAdicionadas++
        }
        turmaIdx++
        if (turmaIdx > 200) {
          this.logger.warn(
            `Loop de nomeação de turma atingiu ${turmaIdx}, interrompendo criação adicional para oferta ${idDisciplinaOfertada}`,
          )
          break
        }
      }

      if (operacoesCriacao.length > 0) {
        try {
          const result = await this.prisma.turma.createMany({
            data: operacoesCriacao,
            skipDuplicates: true as never,
          })
          this.logger.log(
            `${result.count} turmas adicionais criadas com sucesso.`,
          )

          const codigosNovasTurmas = operacoesCriacao.map(
            (op) => op.codigoDaTurma,
          )
          const fetchedNovasTurmas = await this.prisma.turma.findMany({
            where: {
              idDisciplinaOfertada: idDisciplinaOfertada,
              codigoDaTurma: { in: codigosNovasTurmas },
            },
            orderBy: { codigoDaTurma: "asc" },
          })
          turmasProcessadasNestaOperacao.push(
            ...fetchedNovasTurmas.map((turma) => ({
              id: turma.id,
              codigoDaTurma: turma.codigoDaTurma,
              idDisciplinaOfertada: turma.idDisciplinaOfertada,
              dataCriacao: turma.dataCriacao,
              dataAtualizacao: turma.dataAtualizacao,
            })),
          )
        } catch (error) {
          const e = error as Error
          this.logger.error(
            `Erro ao criar turmas adicionais para oferta ID "${idDisciplinaOfertada}": ${e.message}`,
            e.stack,
          )
        }
      }
    } else if (novaQuantidadeTurmas < quantidadeExistente) {
      this.logger.warn(
        `Redução de turmas de ${quantidadeExistente} para ${novaQuantidadeTurmas} para oferta ID ${idDisciplinaOfertada}. A remoção automática de turmas não está implementada.`,
      )
    }
    return turmasProcessadasNestaOperacao
  }

  /**
   * Cria uma nova turma individual
   * @param createTurmaDto - Dados da turma a ser criada
   * @returns Promise com a turma criada
   */
  async create(createTurmaDto: CreateTurmaDto): Promise<TurmaResponseDto> {
    this.logger.log(
      `Criando nova turma para oferta ID: ${createTurmaDto.idDisciplinaOfertada}`,
    )

    // Verificar se a disciplina ofertada existe
    const disciplinaOfertada = await this.prisma.disciplinaOfertada.findUnique({
      where: { id: createTurmaDto.idDisciplinaOfertada },
    })

    if (!disciplinaOfertada) {
      throw new NotFoundException(
        `DisciplinaOfertada com ID "${createTurmaDto.idDisciplinaOfertada}" não encontrada.`,
      )
    }

    // Verificar se o código da turma já existe para esta oferta
    const turmaExistente = await this.prisma.turma.findFirst({
      where: {
        idDisciplinaOfertada: createTurmaDto.idDisciplinaOfertada,
        codigoDaTurma: createTurmaDto.codigoDaTurma,
      },
    })

    if (turmaExistente) {
      throw new Error(
        `Já existe uma turma com código "${createTurmaDto.codigoDaTurma}" para esta disciplina ofertada.`,
      )
    }

    const turma = await this.prisma.turma.create({
      data: {
        idDisciplinaOfertada: createTurmaDto.idDisciplinaOfertada,
        codigoDaTurma: createTurmaDto.codigoDaTurma,
      },
      include: {
        disciplinaOfertada: {
          include: { disciplina: true, periodoLetivo: true },
        },
      },
    })

    return this.mapToResponseDto(turma)
  }

  /**
   * Lista turmas com filtros opcionais
   * @param query - Filtros de busca
   * @returns Promise com array de turmas
   */
  async findAll(query: ListarTurmasQueryDto): Promise<TurmaResponseDto[]> {
    const where: Prisma.TurmaWhereInput = {}

    if (query.idDisciplinaOfertada) {
      where.idDisciplinaOfertada = query.idDisciplinaOfertada
    }

    if (query.idProfessor) {
      where.idUsuarioProfessor = query.idProfessor
    }

    if (query.idPeriodoLetivo) {
      where.disciplinaOfertada = {
        idPeriodoLetivo: query.idPeriodoLetivo,
      }
    }

    const turmas = await this.prisma.turma.findMany({
      where,
      include: {
        disciplinaOfertada: {
          include: { disciplina: true, periodoLetivo: true },
        },
        professorAlocado: true,
      },
      orderBy: [
        { disciplinaOfertada: { disciplina: { nome: "asc" } } },
        { codigoDaTurma: "asc" },
      ],
    })

    return turmas.map((turma) => this.mapToResponseDto(turma))
  }

  /**
   * Busca turmas por disciplina ofertada
   * @param idDisciplinaOfertada - ID da disciplina ofertada
   * @returns Promise com array de turmas
   */
  async findByDisciplinaOfertada(
    idDisciplinaOfertada: string,
  ): Promise<TurmaResponseDto[]> {
    const turmas = await this.prisma.turma.findMany({
      where: { idDisciplinaOfertada },
      include: {
        disciplinaOfertada: {
          include: { disciplina: true, periodoLetivo: true },
        },
        professorAlocado: true,
      },
      orderBy: { codigoDaTurma: "asc" },
    })

    return turmas.map((turma) => this.mapToResponseDto(turma))
  }

  /**
   * Busca turmas por professor
   * @param idProfessor - ID do professor
   * @returns Promise com array de turmas
   */
  async findByProfessor(idProfessor: string): Promise<TurmaResponseDto[]> {
    const turmas = await this.prisma.turma.findMany({
      where: { idUsuarioProfessor: idProfessor },
      include: {
        disciplinaOfertada: {
          include: { disciplina: true, periodoLetivo: true },
        },
        professorAlocado: true,
      },
      orderBy: [
        { disciplinaOfertada: { disciplina: { nome: "asc" } } },
        { codigoDaTurma: "asc" },
      ],
    })

    return turmas.map((turma) => this.mapToResponseDto(turma))
  }

  /**
   * Busca uma turma por ID
   * @param id - ID da turma
   * @returns Promise com a turma encontrada ou null
   */
  async findOne(id: string): Promise<TurmaResponseDto | null> {
    const turma = await this.prisma.turma.findUnique({
      where: { id },
      include: {
        disciplinaOfertada: {
          include: { disciplina: true, periodoLetivo: true },
        },
        professorAlocado: true,
      },
    })

    if (!turma) return null
    return this.mapToResponseDto(turma)
  }

  /**
   * Atualiza dados de uma turma
   * @param id - ID da turma
   * @param updateTurmaDto - Dados a serem atualizados
   * @returns Promise com a turma atualizada
   */
  async update(
    id: string,
    updateTurmaDto: UpdateTurmaDto,
  ): Promise<TurmaResponseDto> {
    // Verificar se a turma existe
    const turmaExistente = await this.prisma.turma.findUnique({
      where: { id },
    })

    if (!turmaExistente) {
      throw new NotFoundException(`Turma com ID "${id}" não encontrada.`)
    }

    // Se alterando código da turma, verificar duplicatas
    if (updateTurmaDto.codigoDaTurma) {
      const codigoExistente = await this.prisma.turma.findFirst({
        where: {
          id: { not: id }, // Excluir a turma atual
          idDisciplinaOfertada: turmaExistente.idDisciplinaOfertada,
          codigoDaTurma: updateTurmaDto.codigoDaTurma,
        },
      })

      if (codigoExistente) {
        throw new Error(
          `Já existe uma turma com código "${updateTurmaDto.codigoDaTurma}" para esta disciplina ofertada.`,
        )
      }
    }

    const turmaAtualizada = await this.prisma.turma.update({
      where: { id },
      data: updateTurmaDto,
      include: {
        disciplinaOfertada: {
          include: { disciplina: true, periodoLetivo: true },
        },
        professorAlocado: true,
      },
    })

    return this.mapToResponseDto(turmaAtualizada)
  }

  /**
   * Atribui professor à turma
   * @param id - ID da turma
   * @param idProfessor - ID do professor
   * @returns Promise com a turma atualizada
   */
  async atribuirProfessor(
    id: string,
    idProfessor: string,
  ): Promise<TurmaResponseDto> {
    // Verificar se a turma existe
    const turma = await this.prisma.turma.findUnique({
      where: { id },
    })

    if (!turma) {
      throw new NotFoundException(`Turma com ID "${id}" não encontrada.`)
    }

    // Verificar se o professor existe
    const professor = await this.prisma.usuario.findUnique({
      where: { id: idProfessor },
    })

    if (!professor) {
      throw new NotFoundException(
        `Professor com ID "${idProfessor}" não encontrado.`,
      )
    }

    const turmaAtualizada = await this.prisma.turma.update({
      where: { id },
      data: { idUsuarioProfessor: idProfessor },
      include: {
        disciplinaOfertada: {
          include: { disciplina: true, periodoLetivo: true },
        },
        professorAlocado: true,
      },
    })

    return this.mapToResponseDto(turmaAtualizada)
  }

  /**
   * Remove professor da turma
   * @param id - ID da turma
   * @returns Promise com a turma atualizada
   */
  async removerProfessor(id: string): Promise<TurmaResponseDto> {
    const turma = await this.prisma.turma.findUnique({
      where: { id },
    })

    if (!turma) {
      throw new NotFoundException(`Turma com ID "${id}" não encontrada.`)
    }

    const turmaAtualizada = await this.prisma.turma.update({
      where: { id },
      data: { idUsuarioProfessor: null },
      include: {
        disciplinaOfertada: {
          include: { disciplina: true, periodoLetivo: true },
        },
        professorAlocado: true,
      },
    })

    return this.mapToResponseDto(turmaAtualizada)
  }

  /**
   * Remove uma turma
   * @param id - ID da turma
   * @returns Promise void
   */
  async remove(id: string): Promise<void> {
    const turma = await this.prisma.turma.findUnique({
      where: { id },
    })

    if (!turma) {
      throw new NotFoundException(`Turma com ID "${id}" não encontrada.`)
    }

    await this.prisma.turma.delete({
      where: { id },
    })

    this.logger.log(`Turma ${turma.codigoDaTurma} removida com sucesso`)
  }

  /**
   * Método auxiliar para mapear entidade para DTO
   * @param turma - Entidade turma do Prisma
   * @returns TurmaResponseDto
   */
  private mapToResponseDto(turma: any): TurmaResponseDto {
    return {
      id: turma.id,
      codigoDaTurma: turma.codigoDaTurma,
      idDisciplinaOfertada: turma.idDisciplinaOfertada,
      disciplinaOfertada:
        turma.disciplinaOfertada ?
          {
            id: turma.disciplinaOfertada.id,
            idDisciplina: turma.disciplinaOfertada.idDisciplina,
            idPeriodoLetivo: turma.disciplinaOfertada.idPeriodoLetivo,
            quantidadeTurmas: turma.disciplinaOfertada.quantidadeTurmas,
            disciplina:
              turma.disciplinaOfertada.disciplina ?
                {
                  id: turma.disciplinaOfertada.disciplina.id,
                  nome: turma.disciplinaOfertada.disciplina.nome,
                  codigo: turma.disciplinaOfertada.disciplina.codigo ?? undefined,
                  cargaHoraria: turma.disciplinaOfertada.disciplina.cargaHoraria,
                  dataCriacao: turma.disciplinaOfertada.disciplina.dataCriacao,
                  dataAtualizacao:
                    turma.disciplinaOfertada.disciplina.dataAtualizacao,
                }
              : undefined,
            periodoLetivo:
              turma.disciplinaOfertada.periodoLetivo ?
                PeriodoLetivoResponseDto.fromEntity(
                  turma.disciplinaOfertada.periodoLetivo,
                )
              : undefined,
            createdAt: turma.disciplinaOfertada.dataCriacao,
            updatedAt: turma.disciplinaOfertada.dataAtualizacao,
          }
        : undefined,
      dataCriacao: turma.dataCriacao,
      dataAtualizacao: turma.dataAtualizacao,
    }
  }
}
