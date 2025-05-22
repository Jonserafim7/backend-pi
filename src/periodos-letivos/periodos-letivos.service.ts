import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common"
import {
  CreatePeriodoLetivoDto,
  UpdatePeriodoLetivoDto,
  PeriodoLetivoResponseDto,
  FindPeriodoLetivoDto,
  ChangeStatusPeriodoLetivoDto,
} from "./dto"
import { PrismaService } from "../core/prisma/prisma.service"
import {
  Prisma,
  PeriodoLetivo as PeriodoLetivoEntity,
  StatusPeriodoLetivo,
} from "@prisma/client"

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
   * @param {CreatePeriodoLetivoDto} createPeriodoLetivoDto - Dados para criação do período letivo.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo criado.
   * @throws {ConflictException} Se já existir um período letivo com o mesmo ano e semestre.
   * @throws {BadRequestException} Se a data de fim for anterior à data de início.
   */
  async create(
    createPeriodoLetivoDto: CreatePeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto> {
    const {
      ano,
      semestre,
      status = StatusPeriodoLetivo.INATIVO,
      dataInicio,
      dataFim,
    } = createPeriodoLetivoDto

    // Validar datas
    const dataInicioDate = new Date(dataInicio)
    const dataFimDate = new Date(dataFim)

    if (dataFimDate <= dataInicioDate) {
      throw new BadRequestException(
        "A data de fim deve ser posterior à data de início.",
      )
    }

    // Verificar se já existe um período com o mesmo ano e semestre
    const periodoExistente = await this.prisma.periodoLetivo.findFirst({
      where: {
        ano,
        semestre,
      },
    })

    if (periodoExistente) {
      throw new ConflictException(
        `Já existe um período letivo para o ano ${ano} e semestre ${semestre}.`,
      )
    }

    // Se o status for ATIVO, verificar se já existe outro período ativo
    if (status === StatusPeriodoLetivo.ATIVO) {
      await this.validateUnicoPeriodoAtivo()
    }

    try {
      const periodoLetivo = await this.prisma.periodoLetivo.create({
        data: {
          ano,
          semestre,
          status,
          dataInicio: dataInicioDate,
          dataFim: dataFimDate,
        },
      })
      return PeriodoLetivoResponseDto.fromEntity(periodoLetivo)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException(
            `Já existe um período letivo para o ano ${ano} e semestre ${semestre}.`,
          )
        }
      }
      throw new InternalServerErrorException(
        `Erro ao criar período letivo: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * @method findAll
   * @description Retorna uma lista de períodos letivos com base nos filtros.
   * @param {FindPeriodoLetivoDto} params - Parâmetros de filtro.
   * @returns {Promise<PeriodoLetivoResponseDto[]>} Lista de períodos letivos.
   */
  async findAll(
    params: FindPeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto[]> {
    const whereClause: Prisma.PeriodoLetivoWhereInput = {}

    // Aplicar filtros
    if (params.id) whereClause.id = params.id
    if (params.ano) whereClause.ano = params.ano
    if (params.semestre) whereClause.semestre = params.semestre
    if (params.status) whereClause.status = params.status

    // Filtros de data
    if (params.dataInicioGte || params.dataInicioLte) {
      whereClause.dataInicio = {}
      if (params.dataInicioGte)
        whereClause.dataInicio.gte = new Date(params.dataInicioGte)
      if (params.dataInicioLte)
        whereClause.dataInicio.lte = new Date(params.dataInicioLte)
    }

    if (params.dataFimGte || params.dataFimLte) {
      whereClause.dataFim = {}
      if (params.dataFimGte) whereClause.dataFim.gte = new Date(params.dataFimGte)
      if (params.dataFimLte) whereClause.dataFim.lte = new Date(params.dataFimLte)
    }

    const periodosLetivos = await this.prisma.periodoLetivo.findMany({
      where: whereClause,
      orderBy: [{ ano: "desc" }, { semestre: "desc" }],
    })

    return periodosLetivos.map((pl: PeriodoLetivoEntity) =>
      PeriodoLetivoResponseDto.fromEntity(pl),
    )
  }

  /**
   * @method findOne
   * @description Retorna um período letivo específico pelo ID.
   * @param {string} id - ID do período letivo.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo encontrado.
   * @throws {NotFoundException} Se o período letivo não for encontrado.
   */
  async findOne(id: string): Promise<PeriodoLetivoResponseDto> {
    const periodoLetivo = await this.prisma.periodoLetivo.findUnique({
      where: { id },
    })
    if (!periodoLetivo) {
      throw new NotFoundException(`Período letivo com ID "${id}" não encontrado.`)
    }
    return PeriodoLetivoResponseDto.fromEntity(periodoLetivo)
  }

  /**
   * @method findPeriodoAtivo
   * @description Retorna o período letivo ativo atual.
   * @returns {Promise<PeriodoLetivoResponseDto | null>} O período letivo ativo ou null se não houver.
   */
  async findPeriodoAtivo(): Promise<PeriodoLetivoResponseDto | null> {
    const periodoAtivo = await this.prisma.periodoLetivo.findFirst({
      where: { status: StatusPeriodoLetivo.ATIVO },
    })

    return periodoAtivo ? PeriodoLetivoResponseDto.fromEntity(periodoAtivo) : null
  }

  /**
   * @method update
   * @description Atualiza um período letivo existente.
   * @param {string} id - ID do período letivo a ser atualizado.
   * @param {UpdatePeriodoLetivoDto} updatePeriodoLetivoDto - Dados para atualizar o período letivo.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo atualizado.
   * @throws {NotFoundException} Se o período letivo não for encontrado.
   * @throws {ConflictException} Se houver conflito de ano/semestre ou período ativo.
   * @throws {BadRequestException} Se a data de fim for anterior à data de início.
   */
  async update(
    id: string,
    updatePeriodoLetivoDto: UpdatePeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto> {
    const { ano, semestre, status, dataInicio, dataFim } = updatePeriodoLetivoDto

    // Verificar se o período letivo existe
    const periodoExistente = await this.prisma.periodoLetivo.findUnique({
      where: { id },
    })

    if (!periodoExistente) {
      throw new NotFoundException(
        `Período letivo com ID "${id}" não encontrado para atualização.`,
      )
    }

    // Validar datas se fornecidas
    const dataInicioDate =
      dataInicio ? new Date(dataInicio) : periodoExistente.dataInicio
    const dataFimDate = dataFim ? new Date(dataFim) : periodoExistente.dataFim

    if (dataFimDate <= dataInicioDate) {
      throw new BadRequestException(
        "A data de fim deve ser posterior à data de início.",
      )
    }

    // Verificar duplicidade de ano/semestre se estão sendo atualizados
    if (ano !== undefined || semestre !== undefined) {
      const anoParaVerificacao = ano !== undefined ? ano : periodoExistente.ano
      const semestreParaVerificacao =
        semestre !== undefined ? semestre : periodoExistente.semestre

      const periodoComMesmoAnoSemestre =
        await this.prisma.periodoLetivo.findFirst({
          where: {
            ano: anoParaVerificacao,
            semestre: semestreParaVerificacao,
            NOT: { id },
          },
        })

      if (periodoComMesmoAnoSemestre) {
        throw new ConflictException(
          `Já existe outro período letivo para o ano ${anoParaVerificacao} e semestre ${semestreParaVerificacao}.`,
        )
      }
    }

    // Se o status está sendo alterado para ATIVO, verificar unicidade
    if (
      status === StatusPeriodoLetivo.ATIVO &&
      periodoExistente.status !== StatusPeriodoLetivo.ATIVO
    ) {
      await this.validateUnicoPeriodoAtivo(id)
    }

    const dataToUpdate: Prisma.PeriodoLetivoUpdateInput = {}
    if (ano !== undefined) dataToUpdate.ano = ano
    if (semestre !== undefined) dataToUpdate.semestre = semestre
    if (status !== undefined) dataToUpdate.status = status
    if (dataInicio !== undefined) dataToUpdate.dataInicio = dataInicioDate
    if (dataFim !== undefined) dataToUpdate.dataFim = dataFimDate

    try {
      const periodoLetivo = await this.prisma.periodoLetivo.update({
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
   * @method changeStatus
   * @description Altera o status de um período letivo.
   * @param {string} id - ID do período letivo.
   * @param {ChangeStatusPeriodoLetivoDto} changeStatusDto - Novo status.
   * @returns {Promise<PeriodoLetivoResponseDto>} O período letivo atualizado.
   * @throws {NotFoundException} Se o período letivo não for encontrado.
   * @throws {ConflictException} Se tentar ativar quando já existe outro período ativo.
   */
  async changeStatus(
    id: string,
    changeStatusDto: ChangeStatusPeriodoLetivoDto,
  ): Promise<PeriodoLetivoResponseDto> {
    const { status } = changeStatusDto

    const periodoExistente = await this.prisma.periodoLetivo.findUnique({
      where: { id },
    })

    if (!periodoExistente) {
      throw new NotFoundException(`Período letivo com ID "${id}" não encontrado.`)
    }

    // Se está tentando ativar e o período não está ativo atualmente
    if (
      status === StatusPeriodoLetivo.ATIVO &&
      periodoExistente.status !== StatusPeriodoLetivo.ATIVO
    ) {
      await this.validateUnicoPeriodoAtivo(id)
    }

    try {
      const periodoLetivo = await this.prisma.periodoLetivo.update({
        where: { id },
        data: { status },
      })
      return PeriodoLetivoResponseDto.fromEntity(periodoLetivo)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(
          `Período letivo com ID "${id}" não encontrado.`,
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
      const periodoLetivo = await this.prisma.periodoLetivo.delete({
        where: { id },
      })
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
   * @method validateUnicoPeriodoAtivo
   * @description Valida se já existe um período ativo (para garantir unicidade).
   * @param {string} [excludeId] - ID do período a ser excluído da verificação.
   * @throws {ConflictException} Se já existir um período ativo.
   * @private
   */
  private async validateUnicoPeriodoAtivo(excludeId?: string): Promise<void> {
    const whereClause: Prisma.PeriodoLetivoWhereInput = {
      status: StatusPeriodoLetivo.ATIVO,
    }

    if (excludeId) {
      whereClause.NOT = { id: excludeId }
    }

    const periodoAtivoExistente = await this.prisma.periodoLetivo.findFirst({
      where: whereClause,
    })

    if (periodoAtivoExistente) {
      throw new ConflictException(
        `Já existe um período letivo ativo (${periodoAtivoExistente.ano}/${periodoAtivoExistente.semestre}). Desative-o antes de ativar outro período.`,
      )
    }
  }
}
