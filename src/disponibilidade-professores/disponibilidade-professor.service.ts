import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
import { ConfiguracoesHorarioService } from "../configuracoes-horario/configuracoes-horario.service"
import {
  PapelUsuario,
  StatusPeriodoLetivo,
  StatusDisponibilidade,
  Prisma,
  DiaSemana,
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly configuracoesService: ConfiguracoesHorarioService,
  ) {}

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
    console.log("🔧 [Service.create] Método chamado!")
    console.log("🔧 [Service.create] DTO:", createDto)
    console.log("🔧 [Service.create] User context:", userContext)

    // Se o usuário é professor e não especificou um professor diferente,
    // automaticamente usa seu próprio ID
    let professorId = createDto.idUsuarioProfessor
    if (userContext.papel === PapelUsuario.PROFESSOR) {
      professorId = userContext.id
      console.log(
        "🔧 [Service.create] Professor criando para si mesmo, usando ID do contexto:",
        professorId,
      )
    }

    this.logger.log(`Criando disponibilidade para professor ${professorId}`)

    // Validar autorização - apenas o próprio professor ou admin pode criar
    console.log("🔧 [Service.create] Validando permissões...")
    try {
      this.validateUserPermission(userContext, professorId)
      console.log("✅ [Service.create] Permissões OK")
    } catch (error) {
      console.error("❌ [Service.create] Erro de permissão:", error)
      throw error
    }

    // Validar se o usuário é realmente um professor
    console.log("🔧 [Service.create] Validando se usuário é professor...")
    try {
      await this.validateProfessorExists(professorId)
      console.log("✅ [Service.create] Professor validado")
    } catch (error) {
      console.error("❌ [Service.create] Erro na validação do professor:", error)
      throw error
    }

    // Validar se o período letivo existe e está ativo
    console.log("🔧 [Service.create] Validando período letivo...")
    try {
      await this.validatePeriodoLetivoAtivo(createDto.idPeriodoLetivo)
      console.log("✅ [Service.create] Período letivo validado")
    } catch (error) {
      console.error(
        "❌ [Service.create] Erro na validação do período letivo:",
        error,
      )
      throw error
    }

    // Validar horários (hora fim > hora início)
    console.log("🔧 [Service.create] Validando horários...")
    try {
      this.validateHorarios(createDto.horaInicio, createDto.horaFim)
      console.log("✅ [Service.create] Horários validados")
    } catch (error) {
      console.error("❌ [Service.create] Erro na validação de horários:", error)
      throw error
    }

    // 🚨 NOVA VALIDAÇÃO CRÍTICA: Verificar se horário está nos slots configurados
    console.log(
      "🔧 [Service.create] Validando contra configurações de horário...",
    )
    try {
      await this.validateHorarioContraConfiguracoes(
        createDto.horaInicio,
        createDto.horaFim,
        createDto.diaDaSemana,
      )
      console.log("✅ [Service.create] Horário validado contra configurações")
    } catch (error) {
      console.error(
        "❌ [Service.create] Erro na validação contra configurações:",
        error,
      )
      throw error
    }

    // Verificar conflito de horários
    console.log("🔧 [Service.create] Verificando conflitos de horário...")
    try {
      await this.validateNoConflictingSchedule(
        professorId,
        createDto.idPeriodoLetivo,
        createDto.diaDaSemana,
        createDto.horaInicio,
        createDto.horaFim,
      )
      console.log("✅ [Service.create] Sem conflitos de horário")
    } catch (error) {
      console.error("❌ [Service.create] Erro de conflito de horário:", error)
      throw error
    }

    // Criar a disponibilidade
    console.log("🔧 [Service.create] Criando disponibilidade no banco...")
    try {
      const disponibilidade = await this.prisma.disponibilidadeProfessor.create({
        data: {
          idUsuarioProfessor: professorId,
          idPeriodoLetivo: createDto.idPeriodoLetivo,
          diaDaSemana: createDto.diaDaSemana,
          horaInicio: createDto.horaInicio,
          horaFim: createDto.horaFim,
          status: createDto.status || StatusDisponibilidade.DISPONIVEL,
        },
        include: this.getIncludeOptions(),
      })

      console.log("✅ [Service.create] Disponibilidade criada:", disponibilidade)

      this.logger.log(`Disponibilidade criada com sucesso: ${disponibilidade.id}`)

      const response = this.mapToResponseDto(disponibilidade)

      console.log("✅ [Service.create] Response DTO:", response)
      return response
    } catch (error) {
      console.error("❌ [Service.create] Erro ao criar no banco:", error)
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
    if (updateDto.horaInicio || updateDto.horaFim || updateDto.diaDaSemana) {
      const horaInicio =
        updateDto.horaInicio ?? existingDisponibilidade.horaInicio
      const horaFim = updateDto.horaFim ?? existingDisponibilidade.horaFim
      const diaDaSemana =
        updateDto.diaDaSemana ?? existingDisponibilidade.diaDaSemana

      this.validateHorarios(horaInicio, horaFim)

      // 🚨 NOVA VALIDAÇÃO CRÍTICA: Verificar se horário está nos slots configurados
      await this.validateHorarioContraConfiguracoes(
        horaInicio,
        horaFim,
        diaDaSemana,
      )

      // Verificar conflitos apenas se horários ou dia da semana mudaram
      await this.validateNoConflictingSchedule(
        existingDisponibilidade.usuarioProfessor.id,
        existingDisponibilidade.periodoLetivo.id,
        diaDaSemana,
        horaInicio,
        horaFim,
      )
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
  ): Promise<DisponibilidadeResponseDto> {
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
      return existingDisponibilidade
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
   * @param query Parâmetros de filtro
   * @returns Promise de array de disponibilidades
   */
  async findByProfessor(
    professorId: string,
    query: ListarDisponibilidadesQueryDto = {},
  ): Promise<DisponibilidadeResponseDto[]> {
    const where: Prisma.DisponibilidadeProfessorWhereInput = {
      idUsuarioProfessor: professorId,
      ...(query.periodoLetivoId && {
        idPeriodoLetivo: query.periodoLetivoId,
      }),
      ...(query.diaSemana && { diaDaSemana: query.diaSemana }),
      ...(query.status && { status: query.status }),
    }

    const disponibilidades = await this.prisma.disponibilidadeProfessor.findMany({
      where,
      include: this.getIncludeOptions(), // Inclui as relações necessárias
    })

    return disponibilidades
      .filter((d) => d && d.usuarioProfessor && d.periodoLetivo)
      .map(this.mapToResponseDto)
  }

  /**
   * Lista disponibilidades de um período letivo
   * @param periodoId ID do período letivo
   * @param query Parâmetros de filtro
   * @returns Promise de array de disponibilidades
   */
  async findByPeriodo(
    periodoId: string,
    query: ListarDisponibilidadesQueryDto = {},
  ): Promise<DisponibilidadeResponseDto[]> {
    const where: Prisma.DisponibilidadeProfessorWhereInput = {
      idPeriodoLetivo: periodoId,
      ...(query.professorId && { idUsuarioProfessor: query.professorId }),
      ...(query.diaSemana && { diaDaSemana: query.diaSemana }),
      ...(query.status && { status: query.status }),
    }

    const disponibilidades = await this.prisma.disponibilidadeProfessor.findMany({
      where,
      orderBy: { diaDaSemana: "asc" },
    })

    return disponibilidades.map(this.mapToResponseDto)
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

  /**
   * Retorna slots válidos para um período letivo (baseado nas configurações)
   * @param periodoId ID do período letivo
   * @returns Promise com array de slots válidos
   */
  async getSlotsValidosPorPeriodo(periodoId: string): Promise<{
    slots: { inicio: string; fim: string }[]
  }> {
    // Validar se período existe
    await this.validatePeriodoLetivoAtivo(periodoId)

    // Buscar configuração ativa
    const config = await this.configuracoesService.get()
    if (!config) {
      throw new BadRequestException("Configurações de horário não encontradas")
    }

    // Extrair todos os slots disponíveis (usa SEGUNDA como referência, pois são iguais para todos os dias)
    const slots = this.extrairSlotsParaDia(config, DiaSemana.SEGUNDA)

    return { slots }
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
   * 🚨 VALIDAÇÃO CRÍTICA: Verifica se o horário informado está nos slots configurados
   * Esta é a correção do problema fundamental do sistema
   */
  private async validateHorarioContraConfiguracoes(
    horaInicio: string,
    horaFim: string,
    diaDaSemana: DiaSemana,
  ): Promise<void> {
    // Buscar configuração ativa
    const config = await this.configuracoesService.get()
    if (!config) {
      throw new BadRequestException("Configurações de horário não encontradas")
    }

    // Extrair slots para o dia específico
    const slotsValidos = this.extrairSlotsParaDia(config, diaDaSemana)

    if (slotsValidos.length === 0) {
      throw new BadRequestException(
        `Não há slots configurados para ${diaDaSemana.toLowerCase()}`,
      )
    }

    // Validar se horário informado está dentro de algum slot válido
    const horarioValido = this.validarHorarioEmSlots(
      horaInicio,
      horaFim,
      slotsValidos,
    )

    if (!horarioValido) {
      const slotsDisponiveis = slotsValidos
        .map((slot) => `${slot.inicio}-${slot.fim}`)
        .join(", ")

      throw new BadRequestException(
        `Horário ${horaInicio}-${horaFim} não está nos slots válidos para ${diaDaSemana.toLowerCase()}: ${slotsDisponiveis}`,
      )
    }
  }

  /**
   * Extrai slots de aula para um dia específico da semana
   * Utiliza a estrutura otimizada do ConfiguracoesHorarioService
   */
  private extrairSlotsParaDia(
    config: any,
    dia: DiaSemana,
  ): { inicio: string; fim: string }[] {
    const slots: { inicio: string; fim: string }[] = []

    // A configuração já vem com as aulas calculadas para cada turno
    // Todos os dias da semana usam os mesmos horários (manhã, tarde, noite)

    // Adicionar slots do turno da manhã
    if (config.aulasTurnoManha && Array.isArray(config.aulasTurnoManha)) {
      config.aulasTurnoManha.forEach((aula: any) => {
        slots.push({
          inicio: aula.inicio,
          fim: aula.fim,
        })
      })
    }

    // Adicionar slots do turno da tarde
    if (config.aulasTurnoTarde && Array.isArray(config.aulasTurnoTarde)) {
      config.aulasTurnoTarde.forEach((aula: any) => {
        slots.push({
          inicio: aula.inicio,
          fim: aula.fim,
        })
      })
    }

    // Adicionar slots do turno da noite
    if (config.aulasTurnoNoite && Array.isArray(config.aulasTurnoNoite)) {
      config.aulasTurnoNoite.forEach((aula: any) => {
        slots.push({
          inicio: aula.inicio,
          fim: aula.fim,
        })
      })
    }

    return slots
  }

  /**
   * Verifica se horário informado está dentro dos slots válidos
   */
  private validarHorarioEmSlots(
    horaInicio: string,
    horaFim: string,
    slots: { inicio: string; fim: string }[],
  ): boolean {
    const [horaIni, minIni] = horaInicio.split(":").map(Number)
    const [horaFin, minFin] = horaFim.split(":").map(Number)

    const inicioMinutos = horaIni * 60 + minIni
    const fimMinutos = horaFin * 60 + minFin

    // Verificar se o horário informado está completamente dentro de algum slot ou conjunto de slots consecutivos
    for (const slot of slots) {
      const [slotIniH, slotIniM] = slot.inicio.split(":").map(Number)
      const [slotFimH, slotFimM] = slot.fim.split(":").map(Number)

      const slotInicioMinutos = slotIniH * 60 + slotIniM
      const slotFimMinutos = slotFimH * 60 + slotFimM

      // Verifica se o horário informado está completamente dentro de um slot
      if (inicioMinutos >= slotInicioMinutos && fimMinutos <= slotFimMinutos) {
        return true
      }
    }

    // TODO: Implementar validação para slots consecutivos (professor pode estar disponível em 2+ slots seguidos)
    return false
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
  ): Promise<void> {
    const conflictingSchedule =
      await this.prisma.disponibilidadeProfessor.findFirst({
        where: {
          idUsuarioProfessor: professorId,
          idPeriodoLetivo: periodoId,
          diaDaSemana: diaSemana,
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
    if (!disponibilidade) {
      throw new Error("Disponibilidade indefinida ao mapear para DTO")
    }
    if (!disponibilidade.usuarioProfessor) {
      throw new Error("usuarioProfessor indefinido ao mapear para DTO")
    }
    if (!disponibilidade.periodoLetivo) {
      throw new Error("periodoLetivo indefinido ao mapear para DTO")
    }
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
