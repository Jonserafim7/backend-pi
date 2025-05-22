import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
// import { CreateTurmaDto } from "./dto/create-turma.dto" // Not directly used here for batch creation
import { TurmaResponseDto } from "./dto/turma-response.dto"
import { Prisma } from "@prisma/client"
import { PeriodoLetivoResponseDto } from "../periodos-letivos/dto"

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

  // Basic CRUD methods (can be expanded)
  async findOne(id: string): Promise<TurmaResponseDto | null> {
    const turma = await this.prisma.turma.findUnique({
      where: { id },
      include: {
        disciplinaOfertada: {
          include: { disciplina: true, periodoLetivo: true },
        },
      },
    })
    if (!turma) return null
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

  // Add findAll, update, remove as needed
}
