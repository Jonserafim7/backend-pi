import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common"
import { CreatePeriodoLetivoDto } from "./dto/create-periodo-letivo.dto"
import { UpdatePeriodoLetivoDto } from "./dto/update-periodo-letivo.dto"
import { FindPeriodoLetivoDto } from "./dto/find-periodo-letivo.dto"
import { PeriodoLetivoResponseDto } from "./dto/periodo-letivo-response.dto"
import { PrismaService } from "../core/prisma/prisma.service"
import { Prisma, PeriodoLetivo as PeriodoLetivoEntity } from "@prisma/client"

/**
 * @class PeriodosLetivosService
 * @description Serviço responsável pela lógica de negócios dos períodos letivos.
 */
@Injectable()
export class PeriodosLetivosService {
  /**
   * @constructor
   * @param {PrismaService} prisma - Instância do PrismaService para interação com o banco de dados.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @method create
   * @description Cria um novo período letivo.
   * @param {CreatePeriodoLetivoDto} createPeriodoLetivoDto - Dados para criar o período letivo.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo criado.
   */
  async create(
    createPeriodoLetivoDto: CreatePeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto> {
    const { ano, semestre } = createPeriodoLetivoDto

    // Verifica se já existe um período letivo com o mesmo ano e semestre
    const existingPeriodo = await this.prisma.periodoLetivo.findFirst({
      where: {
        ano,
        semestre,
      },
    })

    if (existingPeriodo) {
      throw new ConflictException(
        `Já existe um período letivo para o ano ${ano} e semestre ${semestre}.`,
      )
    }

    const dataParaCriacao: Prisma.PeriodoLetivoCreateInput = {
      ano: createPeriodoLetivoDto.ano,
      semestre: createPeriodoLetivoDto.semestre,
      ativo: createPeriodoLetivoDto.ativo ?? false,
      dataInicio:
        createPeriodoLetivoDto.dataInicio ?
          new Date(createPeriodoLetivoDto.dataInicio)
        : null,
      dataFim:
        createPeriodoLetivoDto.dataFim ?
          new Date(createPeriodoLetivoDto.dataFim)
        : null,
    }

    const periodoLetivo: PeriodoLetivoEntity =
      await this.prisma.periodoLetivo.create({ data: dataParaCriacao })
    return PeriodoLetivoResponseDto.fromEntity(periodoLetivo)
  }

  /**
   * @method findAll
   * @description Retorna uma lista de períodos letivos com base nos filtros e paginação.
   * @param {FindPeriodoLetivoDto} params - Parâmetros de filtro e paginação.
   * @returns {Promise<{ data: PeriodoLetivoResponseDto[]; count: number }>} Lista de períodos letivos e a contagem total.
   */
  async findAll(
    params: FindPeriodoLetivoDto,
  ): Promise<{ data: PeriodoLetivoResponseDto[]; count: number }> {
    const { ano, semestre, ativo, pagina = 1, limite = 10 } = params
    const skip = (pagina - 1) * limite

    const where: Prisma.PeriodoLetivoWhereInput = {}
    if (ano !== undefined) {
      where.ano = ano
    }
    if (semestre !== undefined) {
      where.semestre = semestre
    }
    if (ativo !== undefined) {
      where.ativo = ativo
    }

    const [periodosLetivos, total] = await this.prisma.$transaction([
      this.prisma.periodoLetivo.findMany({
        where,
        skip,
        take: Number(limite),
        orderBy: [{ ano: "desc" }, { semestre: "desc" }],
      }),
      this.prisma.periodoLetivo.count({ where }),
    ])

    return {
      data: periodosLetivos.map((pl: PeriodoLetivoEntity) =>
        PeriodoLetivoResponseDto.fromEntity(pl),
      ),
      count: total,
    }
  }

  /**
   * @method findOne
   * @description Retorna um período letivo específico pelo ID.
   * @param {string} id - ID do período letivo.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo encontrado.
   * @throws {NotFoundException} Se o período letivo não for encontrado.
   */
  async findOne(id: string): Promise<PeriodoLetivoResponseDto> {
    const periodoLetivo: PeriodoLetivoEntity | null =
      await this.prisma.periodoLetivo.findUnique({ where: { id } })
    if (!periodoLetivo) {
      throw new NotFoundException(`Período letivo com ID "${id}" não encontrado.`)
    }
    return PeriodoLetivoResponseDto.fromEntity(periodoLetivo)
  }

  /**
   * @method update
   * @description Atualiza um período letivo existente.
   * @param {string} id - ID do período letivo a ser atualizado.
   * @param {UpdatePeriodoLetivoDto} updatePeriodoLetivoDto - Dados para atualizar o período letivo.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo atualizado.
   * @throws {NotFoundException} Se o período letivo não for encontrado.
   */
  async update(
    id: string,
    updatePeriodoLetivoDto: UpdatePeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto> {
    const { ano, semestre, ativo, dataInicio, dataFim } = updatePeriodoLetivoDto

    // Primeiro, verifica se o período letivo que estamos tentando atualizar existe
    const periodoExistente = await this.prisma.periodoLetivo.findUnique({
      where: { id },
    })

    if (!periodoExistente) {
      throw new NotFoundException(
        `Período letivo com ID "${id}" não encontrado para atualização.`,
      )
    }

    // Se ano ou semestre estão sendo atualizados, verifica duplicidade
    if (ano !== undefined || semestre !== undefined) {
      const anoParaVerificacao = ano !== undefined ? ano : periodoExistente.ano
      const semestreParaVerificacao =
        semestre !== undefined ? semestre : periodoExistente.semestre

      const criterioBuscaDuplicidade: Prisma.PeriodoLetivoWhereInput = {
        ano: anoParaVerificacao,
        semestre: semestreParaVerificacao,
        NOT: {
          id: id, // Exclui o próprio registro da verificação de duplicidade
        },
      }

      const periodoComMesmoAnoSemestre =
        await this.prisma.periodoLetivo.findFirst({
          where: criterioBuscaDuplicidade,
        })

      if (periodoComMesmoAnoSemestre) {
        throw new ConflictException(
          `Já existe outro período letivo para o ano ${anoParaVerificacao} e semestre ${semestreParaVerificacao}.`,
        )
      }
    }

    const dataToUpdate: Prisma.PeriodoLetivoUpdateInput = {}
    if (ano !== undefined) dataToUpdate.ano = ano
    if (semestre !== undefined) dataToUpdate.semestre = semestre
    if (ativo !== undefined) dataToUpdate.ativo = ativo

    if (
      Object.prototype.hasOwnProperty.call(updatePeriodoLetivoDto, "dataInicio")
    ) {
      dataToUpdate.dataInicio = dataInicio ? new Date(dataInicio) : null
    }

    if (Object.prototype.hasOwnProperty.call(updatePeriodoLetivoDto, "dataFim")) {
      dataToUpdate.dataFim = dataFim ? new Date(dataFim) : null
    }

    try {
      const periodoLetivo: PeriodoLetivoEntity =
        await this.prisma.periodoLetivo.update({
          where: { id },
          data: dataToUpdate,
        })
      return PeriodoLetivoResponseDto.fromEntity(periodoLetivo)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(
          `Período letivo com ID "${id}" não encontrado para atualização.`,
        )
      }
      throw error
    }
  }

  /**
   * @method remove
   * @description Remove um período letivo.
   * @param {string} id - ID do período letivo a ser removido.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo removido.
   * @throws {NotFoundException} Se o período letivo não for encontrado.
   */
  async remove(id: string): Promise<PeriodoLetivoResponseDto> {
    try {
      const periodoLetivo: PeriodoLetivoEntity =
        await this.prisma.periodoLetivo.delete({ where: { id } })
      return PeriodoLetivoResponseDto.fromEntity(periodoLetivo)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(
          `Período letivo com ID "${id}" não encontrado para remoção.`,
        )
      }
      throw error
    }
  }

  /**
   * @method activate
   * @description Ativa um período letivo, definindo seu campo 'ativo' como true.
   * @param {string} id - ID do período letivo a ser ativado.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo ativado.
   * @throws {NotFoundException} Se o período letivo não for encontrado.
   */
  async activate(id: string): Promise<PeriodoLetivoResponseDto> {
    // 1. Verifica se o período letivo existe
    const periodoLetivoExistente = await this.prisma.periodoLetivo.findUnique({
      where: { id },
    })

    if (!periodoLetivoExistente) {
      throw new NotFoundException(
        `Período letivo com ID "${id}" não encontrado para ativação.`,
      )
    }

    // 2. Verifica se o período já está ativo (opcional)
    // Se já estiver ativo, poderíamos retornar imediatamente.
    // Por agora, vamos permitir que a operação continue (será idempotente).

    // 3. Procede com a ativação
    try {
      const periodoLetivo = await this.prisma.periodoLetivo.update({
        where: { id },
        data: { ativo: true },
      })
      return PeriodoLetivoResponseDto.fromEntity(periodoLetivo)
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025" // Aspas duplas para o código de erro
      ) {
        // Este erro ocorreria se o registro fosse deletado entre o findUnique e o update.
        throw new NotFoundException(
          `Período letivo com ID "${id}" não encontrado para ativação.`,
        )
      }
      let errorMessage = `Erro ao ativar o período letivo com ID "${id}".`
      if (error instanceof Error && error.message) {
        errorMessage += `: ${error.message}`
      }
      throw new InternalServerErrorException(errorMessage)
    }
  }

  /**
   * @method deactivate
   * @description Desativa um período letivo, definindo seu campo 'ativo' como false.
   * @param {string} id - ID do período letivo a ser desativado.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo desativado.
   * @throws {NotFoundException} Se o período letivo não for encontrado.
   */
  async deactivate(id: string): Promise<PeriodoLetivoResponseDto> {
    // 1. Verifica se o período letivo existe
    const periodoLetivoExistente = await this.prisma.periodoLetivo.findUnique({
      where: { id },
    })

    if (!periodoLetivoExistente) {
      throw new NotFoundException(
        `Período letivo com ID "${id}" não encontrado para desativação.`,
      )
    }

    // 2. Verifica se o período já está inativo (opcional)
    // Se já estiver inativo, poderíamos retornar imediatamente ou permitir a operação idempotente.
    // Por agora, vamos permitir que a operação continue.

    // 3. Verifica se existem ofertas de disciplina vinculadas a este período letivo
    // Presumindo que a entidade no Prisma se chama 'disciplinaOfertada' (camelCase) e tem um campo 'idPeriodoLetivo'
    const ofertasVinculadas = await this.prisma.disciplinaOfertada.count({
      where: { idPeriodoLetivo: id },
    })

    if (ofertasVinculadas > 0) {
      throw new ConflictException(
        `O período letivo com ID "${id}" não pode ser desativado pois possui ${ofertasVinculadas} oferta(s) de disciplina(s) vinculada(s).`,
      )
    }

    // 4. Procede com a desativação
    try {
      const periodoLetivo = await this.prisma.periodoLetivo.update({
        where: { id },
        data: { ativo: false },
      })
      return PeriodoLetivoResponseDto.fromEntity(periodoLetivo)
    } catch (error: any) {
      // O erro P2025 (Record to update not found) é teoricamente coberto pela verificação inicial,
      // mas pode ocorrer em condições de concorrência. Manter um tratamento genérico é bom.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025" // Aspas duplas para o código de erro
      ) {
        throw new NotFoundException(
          `Período letivo com ID "${id}" não encontrado para desativação.`,
        )
      }
      let errorMessage = `Erro ao desativar o período letivo com ID "${id}"`
      if (error instanceof Error && error.message) {
        errorMessage += `: ${error.message}`
      }
      // Re-lançar como um erro mais específico do NestJS se apropriado
      throw new InternalServerErrorException(errorMessage)
    }
  }
}
