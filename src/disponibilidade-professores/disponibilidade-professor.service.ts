import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
import {
  PapelUsuario,
  StatusPeriodoLetivo,
  StatusDisponibilidade,
  Prisma,
} from "@prisma/client"
import {
  CreateDisponibilidadeDto,
  UpdateDisponibilidadeDto,
  DisponibilidadeResponseDto,
  ListarDisponibilidadesQueryDto,
} from "./dto"

/**
 * Service responsável pela gestão de disponibilidade de professores
 * Contém todas as regras de negócio relacionadas às disponibilidades
 */
@Injectable()
export class DisponibilidadeProfessorService {
  private readonly logger = new Logger(DisponibilidadeProfessorService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova disponibilidade para um professor
   * @param createDto Dados para criação da disponibilidade
   * @param userContext Contexto do usuário que está fazendo a requisição
   * @returns Promise<DisponibilidadeResponseDto>
   */
  async create(
    createDto: CreateDisponibilidadeDto,
    userContext: { id: string; papel: PapelUsuario },
  ): Promise<DisponibilidadeResponseDto> {
    this.logger.log(
      `Criando disponibilidade para professor ${createDto.idUsuarioProfessor}`,
    )

    // Validar autorização - apenas o próprio professor ou admin pode criar
    this.validateUserPermission(userContext, createDto.idUsuarioProfessor)

    // Validar se o usuário é realmente um professor
    await this.validateProfessorExists(createDto.idUsuarioProfessor)

    // Validar se o período letivo está ativo
    await this.validatePeriodoLetivoAtivo(createDto.idPeriodoLetivo)

    // Validar horários (hora fim > hora início)
    this.validateHorarios(createDto.horaInicio, createDto.horaFim)

    // Verificar conflitos de horário
    await this.validateNoConflictingSchedule(
      createDto.idUsuarioProfessor,
      createDto.idPeriodoLetivo,
      createDto.diaDaSemana,
      createDto.horaInicio,
      createDto.horaFim,
    )

    try {
      const disponibilidade = await this.prisma.disponibilidadeProfessor.create({
        data: {
          ...createDto,
          status: createDto.status ?? StatusDisponibilidade.DISPONIVEL,
        },
        include: this.getIncludeOptions(),
      })

      this.logger.log(`Disponibilidade criada com sucesso: ${disponibilidade.id}`)
      return this.mapToResponseDto(disponibilidade)
    } catch (error) {
      this.logger.error("Erro ao criar disponibilidade", error)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Já existe uma disponibilidade para este professor no mesmo período, dia e horário",
        )
      }
      throw error
    }
  }

  /**
   * Atualiza uma disponibilidade existente
   * @param id ID da disponibilidade
   * @param updateDto Dados para atualização
   * @param userContext Contexto do usuário que está fazendo a requisição
   * @returns Promise<DisponibilidadeResponseDto>
   */
  async update(
    id: string,
    updateDto: UpdateDisponibilidadeDto,
    userContext: { id: string; papel: PapelUsuario },
  ): Promise<DisponibilidadeResponseDto> {
    this.logger.log(`Atualizando disponibilidade ${id}`)

    // Buscar disponibilidade existente
    const existingDisponibilidade = await this.findById(id)

    // Validar autorização
    this.validateUserPermission(
      userContext,
      existingDisponibilidade.usuarioProfessor.id,
    )

    // Validar horários se foram fornecidos
    if (updateDto.horaInicio || updateDto.horaFim) {
      const horaInicio =
        updateDto.horaInicio ?? existingDisponibilidade.horaInicio
      const horaFim = updateDto.horaFim ?? existingDisponibilidade.horaFim
      this.validateHorarios(horaInicio, horaFim)

      // Verificar conflitos apenas se horários ou dia da semana mudaram
      if (updateDto.horaInicio || updateDto.horaFim || updateDto.diaDaSemana) {
        await this.validateNoConflictingSchedule(
          existingDisponibilidade.usuarioProfessor.id,
          existingDisponibilidade.periodoLetivo.id,
          updateDto.diaDaSemana ?? existingDisponibilidade.diaDaSemana,
          horaInicio,
          horaFim,
          id, // Excluir a própria disponibilidade da verificação
        )
      }
    }

    try {
      const disponibilidade = await this.prisma.disponibilidadeProfessor.update({
        where: { id },
        data: updateDto,
        include: this.getIncludeOptions(),
      })

      this.logger.log(`Disponibilidade atualizada com sucesso: ${id}`)
      return this.mapToResponseDto(disponibilidade)
    } catch (error) {
      this.logger.error("Erro ao atualizar disponibilidade", error)
      throw error
    }
  }

  /**
   * Remove uma disponibilidade
   * @param id ID da disponibilidade
   * @param userContext Contexto do usuário que está fazendo a requisição
   */
  async remove(
    id: string,
    userContext: { id: string; papel: PapelUsuario },
  ): Promise<void> {
    this.logger.log(`Removendo disponibilidade ${id}`)

    // Buscar disponibilidade existente
    const existingDisponibilidade = await this.findById(id)

    // Validar autorização
    this.validateUserPermission(
      userContext,
      existingDisponibilidade.usuarioProfessor.id,
    )

    try {
      await this.prisma.disponibilidadeProfessor.delete({
        where: { id },
      })

      this.logger.log(`Disponibilidade removida com sucesso: ${id}`)
    } catch (error) {
      this.logger.error("Erro ao remover disponibilidade", error)
      throw error
    }
  }

  /**
   * Busca disponibilidade por ID
   * @param id ID da disponibilidade
   * @returns Promise<DisponibilidadeResponseDto>
   */
  async findById(id: string): Promise<DisponibilidadeResponseDto> {
    const disponibilidade = await this.prisma.disponibilidadeProfessor.findUnique(
      {
        where: { id },
        include: this.getIncludeOptions(),
      },
    )

    if (!disponibilidade) {
      throw new NotFoundException("Disponibilidade não encontrada")
    }

    return this.mapToResponseDto(disponibilidade)
  }

  /**
   * Lista disponibilidades de um professor específico
   * @param professorId ID do professor
   * @param query Parâmetros de filtro e paginação
   * @returns Promise de array de disponibilidades
   */
  async findByProfessor(
    professorId: string,
    query: ListarDisponibilidadesQueryDto = {},
  ): Promise<{
    data: DisponibilidadeResponseDto[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const {
      page = 1,
      limit = 10,
      orderBy = "diaDaSemana",
      orderDirection = "asc",
      ...filters
    } = query

    const where: Prisma.DisponibilidadeProfessorWhereInput = {
      idUsuarioProfessor: professorId,
      ...(filters.periodoLetivoId && {
        idPeriodoLetivo: filters.periodoLetivoId,
      }),
      ...(filters.diaSemana && { diaDaSemana: filters.diaSemana }),
      ...(filters.status && { status: filters.status }),
    }

    const [disponibilidades, total] = await Promise.all([
      this.prisma.disponibilidadeProfessor.findMany({
        where,
        include: this.getIncludeOptions(),
        orderBy: { [orderBy]: orderDirection },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.disponibilidadeProfessor.count({ where }),
    ])

    return {
      data: disponibilidades.map(this.mapToResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Lista disponibilidades de um período letivo
   * @param periodoId ID do período letivo
   * @param query Parâmetros de filtro e paginação
   * @returns Promise de array de disponibilidades
   */
  async findByPeriodo(
    periodoId: string,
    query: ListarDisponibilidadesQueryDto = {},
  ): Promise<{
    data: DisponibilidadeResponseDto[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const {
      page = 1,
      limit = 10,
      orderBy = "diaDaSemana",
      orderDirection = "asc",
      ...filters
    } = query

    const where: Prisma.DisponibilidadeProfessorWhereInput = {
      idPeriodoLetivo: periodoId,
      ...(filters.professorId && { idUsuarioProfessor: filters.professorId }),
      ...(filters.diaSemana && { diaDaSemana: filters.diaSemana }),
      ...(filters.status && { status: filters.status }),
    }

    const [disponibilidades, total] = await Promise.all([
      this.prisma.disponibilidadeProfessor.findMany({
        where,
        include: this.getIncludeOptions(),
        orderBy: { [orderBy]: orderDirection },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.disponibilidadeProfessor.count({ where }),
    ])

    return {
      data: disponibilidades.map(this.mapToResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Busca disponibilidades de um professor em um período específico
   * @param professorId ID do professor
   * @param periodoId ID do período letivo
   * @param query Parâmetros de filtro
   * @returns Promise de array de disponibilidades
   */
  async findByProfessorAndPeriodo(
    professorId: string,
    periodoId: string,
    query: Omit<
      ListarDisponibilidadesQueryDto,
      "professorId" | "periodoLetivoId"
    > = {},
  ): Promise<DisponibilidadeResponseDto[]> {
    const { orderBy = "diaDaSemana", orderDirection = "asc", ...filters } = query

    const disponibilidades = await this.prisma.disponibilidadeProfessor.findMany({
      where: {
        idUsuarioProfessor: professorId,
        idPeriodoLetivo: periodoId,
        ...(filters.diaSemana && { diaDaSemana: filters.diaSemana }),
        ...(filters.status && { status: filters.status }),
      },
      include: this.getIncludeOptions(),
      orderBy: { [orderBy]: orderDirection },
    })

    return disponibilidades.map(this.mapToResponseDto)
  }

  // ===== MÉTODOS PRIVADOS DE VALIDAÇÃO =====

  /**
   * Valida se o usuário tem permissão para acessar/modificar a disponibilidade
   */
  private validateUserPermission(
    userContext: { id: string; papel: PapelUsuario },
    professorId: string,
  ): void {
    const isAdmin = userContext.papel === PapelUsuario.ADMIN
    const isDiretor = userContext.papel === PapelUsuario.DIRETOR
    const isOwnProfessor = userContext.id === professorId

    if (!isAdmin && !isDiretor && !isOwnProfessor) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar esta disponibilidade",
      )
    }
  }

  /**
   * Valida se o usuário existe e é um professor
   */
  private async validateProfessorExists(professorId: string): Promise<void> {
    const professor = await this.prisma.usuario.findUnique({
      where: { id: professorId },
      select: { id: true, papel: true },
    })

    if (!professor) {
      throw new NotFoundException("Professor não encontrado")
    }

    if (professor.papel !== PapelUsuario.PROFESSOR) {
      throw new BadRequestException("O usuário informado não é um professor")
    }
  }

  /**
   * Valida se o período letivo existe e está ativo
   */
  private async validatePeriodoLetivoAtivo(periodoId: string): Promise<void> {
    const periodo = await this.prisma.periodoLetivo.findUnique({
      where: { id: periodoId },
      select: { id: true, status: true, ano: true, semestre: true },
    })

    if (!periodo) {
      throw new NotFoundException("Período letivo não encontrado")
    }

    if (periodo.status !== StatusPeriodoLetivo.ATIVO) {
      throw new BadRequestException(
        `Período letivo ${periodo.ano}/${periodo.semestre} não está ativo`,
      )
    }
  }

  /**
   * Valida se horário de fim é maior que horário de início
   */
  private validateHorarios(horaInicio: string, horaFim: string): void {
    const [horaIni, minIni] = horaInicio.split(":").map(Number)
    const [horaFin, minFin] = horaFim.split(":").map(Number)

    const inicioMinutos = horaIni * 60 + minIni
    const fimMinutos = horaFin * 60 + minFin

    if (fimMinutos <= inicioMinutos) {
      throw new BadRequestException(
        "Horário de fim deve ser maior que horário de início",
      )
    }
  }

  /**
   * Valida se não há conflitos de horário para o mesmo professor
   */
  private async validateNoConflictingSchedule(
    professorId: string,
    periodoId: string,
    diaSemana: any,
    horaInicio: string,
    horaFim: string,
    excludeId?: string,
  ): Promise<void> {
    const conflictingSchedule =
      await this.prisma.disponibilidadeProfessor.findFirst({
        where: {
          idUsuarioProfessor: professorId,
          idPeriodoLetivo: periodoId,
          diaDaSemana: diaSemana,
          ...(excludeId && { id: { not: excludeId } }),
          OR: [
            // Novo horário inicia durante um existente
            {
              horaInicio: { lte: horaInicio },
              horaFim: { gt: horaInicio },
            },
            // Novo horário termina durante um existente
            {
              horaInicio: { lt: horaFim },
              horaFim: { gte: horaFim },
            },
            // Novo horário engloba um existente
            {
              horaInicio: { gte: horaInicio },
              horaFim: { lte: horaFim },
            },
          ],
        },
      })

    if (conflictingSchedule) {
      throw new BadRequestException(
        `Já existe uma disponibilidade conflitante no ${diaSemana.toLowerCase()} das ${conflictingSchedule.horaInicio} às ${conflictingSchedule.horaFim}`,
      )
    }
  }

  /**
   * Opções de include para buscar dados relacionados
   */
  private getIncludeOptions() {
    return {
      usuarioProfessor: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
      periodoLetivo: {
        select: {
          id: true,
          ano: true,
          semestre: true,
          status: true,
        },
      },
    }
  }

  /**
   * Mapeia objeto Prisma para DTO de resposta
   */
  private mapToResponseDto(disponibilidade: any): DisponibilidadeResponseDto {
    return {
      id: disponibilidade.id,
      diaDaSemana: disponibilidade.diaDaSemana,
      horaInicio: disponibilidade.horaInicio,
      horaFim: disponibilidade.horaFim,
      status: disponibilidade.status,
      dataCriacao: disponibilidade.dataCriacao,
      dataAtualizacao: disponibilidade.dataAtualizacao,
      usuarioProfessor: {
        id: disponibilidade.usuarioProfessor.id,
        nome: disponibilidade.usuarioProfessor.nome,
        email: disponibilidade.usuarioProfessor.email,
      },
      periodoLetivo: {
        id: disponibilidade.periodoLetivo.id,
        ano: disponibilidade.periodoLetivo.ano,
        semestre: disponibilidade.periodoLetivo.semestre,
        status: disponibilidade.periodoLetivo.status,
      },
    }
  }
}
