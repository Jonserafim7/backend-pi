import { BadRequestException, Injectable, Logger } from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
import { UpsertConfiguracaoHorarioDto } from "./dto/upsert-configuracao-horario.dto"
import { ConfiguracaoHorarioDto } from "./dto/configuracao-horario.dto" // Importar o DTO de resposta
import { ConfiguracaoHorario as ConfiguracaoHorarioPrisma } from "@prisma/client"
import { parse, addMinutes, format, isValid } from "date-fns" // Importar de date-fns

interface AulaCalculada {
  inicio: string
  fim: string
}

/**
 * Serviço responsável pela lógica de negócios das configurações de horário.
 */
@Injectable()
export class ConfiguracoesHorarioService {
  private readonly logger = new Logger(ConfiguracoesHorarioService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida os horários de início dos turnos no DTO.
   * Lança BadRequestException se algum horário for inválido.
   * @param dto Dados da configuração de horário para validar.
   */
  private validateHorariosInput(dto: UpsertConfiguracaoHorarioDto): void {
    this.logger.log(
      `Validando horários de input para DTO: ${JSON.stringify(dto)}`,
    )
    const referenceDate = new Date() // Usar a mesma data de referência para todos os parses

    const horariosParaValidar: Array<{ nome: string; valor: string }> = []
    if (dto.inicioTurnoManha) {
      horariosParaValidar.push({
        nome: "início Manhã",
        valor: dto.inicioTurnoManha,
      })
    }
    if (dto.inicioTurnoTarde) {
      horariosParaValidar.push({
        nome: "início Tarde",
        valor: dto.inicioTurnoTarde,
      })
    }
    if (dto.inicioTurnoNoite) {
      horariosParaValidar.push({
        nome: "início Noite",
        valor: dto.inicioTurnoNoite,
      })
    }

    for (const horario of horariosParaValidar) {
      const parsedTime = parse(horario.valor, "HH:mm", referenceDate)
      if (!isValid(parsedTime)) {
        this.logger.warn(
          `Validação falhou: horário de ${horario.nome} (${horario.valor}) é inválido.`,
        )
        throw new BadRequestException(
          `O horário de ${horario.nome} (${horario.valor}) deve estar no formato HH:mm válido.`,
        )
      }
    }
    this.logger.log("Validação de horários de input bem-sucedida.")
  }

  /**
   * Calcula os horários das aulas e o horário de fim para um turno específico.
   * @param inicioTurnoStr String do horário de início do turno (HH:mm).
   * @param duracaoAulaMinutos Duração de cada aula em minutos.
   * @param numeroAulasPorTurno Número de aulas no turno.
   * @returns Um objeto contendo a lista de aulas calculadas e o horário de fim do turno.
   */
  private calcularHorariosTurno(
    inicioTurnoStr: string,
    duracaoAulaMinutos: number,
    numeroAulasPorTurno: number,
  ): { aulas: AulaCalculada[]; fimTurnoCalculado: string } {
    const aulas: AulaCalculada[] = []
    const referenceDate = new Date(2000, 0, 1) // Data de referência fixa para os cálculos
    let aulaAtualInicio = parse(inicioTurnoStr, "HH:mm", referenceDate)

    if (!isValid(aulaAtualInicio)) {
      // Isso não deveria acontecer se validateHorariosInput for chamado antes
      this.logger.error(
        `Horário de início do turno inválido fornecido para cálculo: ${inicioTurnoStr}`,
      )
      throw new Error(
        `Formato de horário de início do turno inválido: ${inicioTurnoStr}. Utilize HH:mm.`,
      )
    }

    for (let i = 0; i < numeroAulasPorTurno; i++) {
      const aulaAtualFim = addMinutes(aulaAtualInicio, duracaoAulaMinutos)
      aulas.push({
        inicio: format(aulaAtualInicio, "HH:mm"),
        fim: format(aulaAtualFim, "HH:mm"),
      })
      aulaAtualInicio = aulaAtualFim // A próxima aula começa onde a anterior terminou
    }

    const fimTurnoCalculado =
      aulas.length > 0 ? aulas[aulas.length - 1].fim : inicioTurnoStr

    return { aulas, fimTurnoCalculado }
  }

  /**
   * Obtém a configuração de horário global existente com todos os horários calculados.
   * @returns A configuração de horário formatada ou null se não existir.
   */
  async get(): Promise<ConfiguracaoHorarioDto | null> {
    this.logger.log("Tentando obter configuração de horário global.")
    try {
      const configPrisma = await this.prisma.configuracaoHorario.findFirst()

      if (!configPrisma) {
        this.logger.log("Nenhuma configuração de horário encontrada.")
        return null
      }
      this.logger.log(
        `Configuração Prisma encontrada: ${JSON.stringify(configPrisma)}`,
      )

      const { duracaoAulaMinutos, numeroAulasPorTurno } = configPrisma

      const manha = this.calcularHorariosTurno(
        configPrisma.inicioTurnoManha,
        duracaoAulaMinutos,
        numeroAulasPorTurno,
      )
      const tarde = this.calcularHorariosTurno(
        configPrisma.inicioTurnoTarde,
        duracaoAulaMinutos,
        numeroAulasPorTurno,
      )
      const noite = this.calcularHorariosTurno(
        configPrisma.inicioTurnoNoite,
        duracaoAulaMinutos,
        numeroAulasPorTurno,
      )

      const configDto: ConfiguracaoHorarioDto = {
        ...configPrisma,
        fimTurnoManhaCalculado: manha.fimTurnoCalculado,
        fimTurnoTardeCalculado: tarde.fimTurnoCalculado,
        fimTurnoNoiteCalculado: noite.fimTurnoCalculado,
        aulasTurnoManha: manha.aulas,
        aulasTurnoTarde: tarde.aulas,
        aulasTurnoNoite: noite.aulas,
      }

      this.logger.log(
        `Configuração DTO com cálculos: ${JSON.stringify(configDto)}`,
      )
      return configDto
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido"
      this.logger.error(
        `Erro ao obter configuração de horário: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      )
      throw error
    }
  }

  /**
   * Cria uma nova configuração de horário se não existir, ou atualiza a existente.
   * Os campos `numeroAulasPorTurno` e `duracaoAulaMinutos` devem ser positivos.
   * @param dto Dados para criar ou atualizar a configuração.
   * @returns A configuração de horário salva (sem os campos calculados, conforme armazenado).
   */
  async upsert(
    dto: UpsertConfiguracaoHorarioDto,
  ): Promise<ConfiguracaoHorarioPrisma> {
    this.logger.log(
      `Tentando operação upsert para configuração de horário com DTO: ${JSON.stringify(
        dto,
      )}`,
    )
    this.validateHorariosInput(dto) // Validar formato dos horários de início, se fornecidos

    if (dto.duracaoAulaMinutos !== undefined && dto.duracaoAulaMinutos <= 0) {
      this.logger.warn(
        `Validação falhou: duracaoAulaMinutos (${dto.duracaoAulaMinutos}) deve ser positiva.`,
      )
      throw new BadRequestException(
        "A duração da aula deve ser um número positivo.",
      )
    }
    if (dto.numeroAulasPorTurno !== undefined && dto.numeroAulasPorTurno <= 0) {
      this.logger.warn(
        `Validação falhou: numeroAulasPorTurno (${dto.numeroAulasPorTurno}) deve ser positivo.`,
      )
      throw new BadRequestException(
        "O número de aulas por turno deve ser um número positivo.",
      )
    }

    try {
      const existingConfig = await this.prisma.configuracaoHorario.findFirst()

      if (existingConfig) {
        this.logger.log(
          `Configuração existente encontrada (ID: ${existingConfig.id}). Atualizando com DTO: ${JSON.stringify(dto)}`,
        )

        // Mergeia o DTO com a configuração existente. Apenas os campos definidos no DTO serão atualizados.
        const dataToUpdate = {
          ...(dto.duracaoAulaMinutos !== undefined && {
            duracaoAulaMinutos: dto.duracaoAulaMinutos,
          }),
          ...(dto.numeroAulasPorTurno !== undefined && {
            numeroAulasPorTurno: dto.numeroAulasPorTurno,
          }),
          ...(dto.inicioTurnoManha && { inicioTurnoManha: dto.inicioTurnoManha }),
          ...(dto.inicioTurnoTarde && { inicioTurnoTarde: dto.inicioTurnoTarde }),
          ...(dto.inicioTurnoNoite && { inicioTurnoNoite: dto.inicioTurnoNoite }),
        }

        // Se não houver nada para atualizar, retorna a configuração existente
        if (Object.keys(dataToUpdate).length === 0) {
          this.logger.log(
            "Nenhum campo para atualizar. Retornando configuração existente.",
          )
          return existingConfig
        }

        const updatedConfig = await this.prisma.configuracaoHorario.update({
          where: { id: existingConfig.id },
          data: dataToUpdate,
        })
        this.logger.log(
          `Configuração atualizada com sucesso: ${JSON.stringify(updatedConfig)}`,
        )
        return updatedConfig
      } else {
        this.logger.log("Nenhuma configuração existente. Tentando criar nova...")
        // Para criar uma nova, todos os campos são necessários
        if (
          dto.duracaoAulaMinutos === undefined ||
          dto.numeroAulasPorTurno === undefined ||
          !dto.inicioTurnoManha ||
          !dto.inicioTurnoTarde ||
          !dto.inicioTurnoNoite
        ) {
          this.logger.warn(
            `Tentativa de criar configuração sem todos os campos obrigatórios. DTO: ${JSON.stringify(dto)}`,
          )
          throw new BadRequestException(
            "Para criar uma nova configuração de horário, todos os campos são obrigatórios: duracaoAulaMinutos, numeroAulasPorTurno, inicioTurnoManha, inicioTurnoTarde, inicioTurnoNoite.",
          )
        }

        const dataToCreate = {
          duracaoAulaMinutos: dto.duracaoAulaMinutos,
          numeroAulasPorTurno: dto.numeroAulasPorTurno,
          inicioTurnoManha: dto.inicioTurnoManha,
          inicioTurnoTarde: dto.inicioTurnoTarde,
          inicioTurnoNoite: dto.inicioTurnoNoite,
        }

        const createdConfig = await this.prisma.configuracaoHorario.create({
          data: dataToCreate,
        })
        this.logger.log(
          `Configuração criada com sucesso: ${JSON.stringify(createdConfig)}`,
        )
        return createdConfig
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido"
      this.logger.error(
        `Erro na operação upsert de configuração de horário: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      )
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException(
        `Erro ao salvar configuração de horário: ${errorMessage}`,
      )
    }
  }
}
