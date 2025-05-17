import { BadRequestException, Injectable, Logger } from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
import { UpsertConfiguracaoHorarioDto } from "./dto/upsert-configuracao-horario.dto"
import { ConfiguracaoHorario } from "@prisma/client" // Importar o tipo do Prisma
import { parse, isAfter, isEqual } from "date-fns" // Importar de date-fns

/**
 * Serviço responsável pela lógica de negócios das configurações de horário.
 */
@Injectable()
export class ConfiguracoesHorarioService {
  private readonly logger = new Logger(ConfiguracoesHorarioService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida a consistência dos horários fornecidos no DTO usando date-fns.
   * Lança BadRequestException se alguma validação falhar.
   * @param dto Dados da configuração de horário para validar.
   */
  private validateHorarios(dto: UpsertConfiguracaoHorarioDto): void {
    this.logger.log(
      `Validando horários com date-fns para DTO: ${JSON.stringify(dto)}`,
    )
    const referenceDate = new Date() // Usar a mesma data de referência para todos os parses

    const inicioManha = parse(dto.inicioTurnoManha, "HH:mm", referenceDate)
    const fimManha = parse(dto.fimTurnoManha, "HH:mm", referenceDate)
    if (isAfter(inicioManha, fimManha) || isEqual(inicioManha, fimManha)) {
      this.logger.warn(
        `Validação falhou: início manhã (${dto.inicioTurnoManha}) deve ser antes do fim manhã (${dto.fimTurnoManha})`,
      )
      throw new BadRequestException(
        "O horário de término do turno da manhã deve ser após o horário de início.",
      )
    }

    const inicioTarde = parse(dto.inicioTurnoTarde, "HH:mm", referenceDate)
    const fimTarde = parse(dto.fimTurnoTarde, "HH:mm", referenceDate)
    if (isAfter(inicioTarde, fimTarde) || isEqual(inicioTarde, fimTarde)) {
      this.logger.warn(
        `Validação falhou: início tarde (${dto.inicioTurnoTarde}) deve ser antes do fim tarde (${dto.fimTurnoTarde})`,
      )
      throw new BadRequestException(
        "O horário de término do turno da tarde deve ser após o horário de início.",
      )
    }

    if (isAfter(fimManha, inicioTarde)) {
      this.logger.warn(
        `Validação falhou: fim manhã (${dto.fimTurnoManha}) não pode ser após início tarde (${dto.inicioTurnoTarde})`,
      )
      throw new BadRequestException(
        "O início do turno da tarde não pode ser antes do término do turno da manhã.",
      )
    }

    const inicioNoite = parse(dto.inicioTurnoNoite, "HH:mm", referenceDate)
    const fimNoite = parse(dto.fimTurnoNoite, "HH:mm", referenceDate)
    if (isAfter(inicioNoite, fimNoite) || isEqual(inicioNoite, fimNoite)) {
      this.logger.warn(
        `Validação falhou: início noite (${dto.inicioTurnoNoite}) deve ser antes do fim noite (${dto.fimTurnoNoite})`,
      )
      throw new BadRequestException(
        "O horário de término do turno da noite deve ser após o horário de início.",
      )
    }

    if (isAfter(fimTarde, inicioNoite)) {
      this.logger.warn(
        `Validação falhou: fim tarde (${dto.fimTurnoTarde}) não pode ser após início noite (${dto.inicioTurnoNoite})`,
      )
      throw new BadRequestException(
        "O início do turno da noite não pode ser antes do término do turno da tarde.",
      )
    }
    this.logger.log("Validação de horários com date-fns bem-sucedida.")
  }

  /**
   * Obtém a configuração de horário global existente.
   * @returns A configuração de horário encontrada ou null se não existir.
   */
  async get(): Promise<ConfiguracaoHorario | null> {
    this.logger.log("Tentando obter configuração de horário global.")
    try {
      const config = await this.prisma.configuracaoHorario.findFirst()
      if (config) {
        this.logger.log(`Configuração encontrada: ${JSON.stringify(config)}`)
      } else {
        this.logger.log("Nenhuma configuração de horário encontrada.")
      }
      return config
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido"
      this.logger.error(
        `Erro ao obter configuração de horário: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      )
      throw error // Re-lança o erro para ser tratado pelo controller ou filtro de exceção
    }
  }

  /**
   * Cria uma nova configuração de horário se não existir, ou atualiza a existente.
   * @param dto Dados para criar ou atualizar a configuração.
   * @returns A configuração de horário salva.
   */
  async upsert(dto: UpsertConfiguracaoHorarioDto): Promise<ConfiguracaoHorario> {
    this.logger.log(
      `Tentando operação upsert para configuração de horário com DTO: ${JSON.stringify(
        dto,
      )}`,
    )
    this.validateHorarios(dto) // Validações primeiro

    try {
      const existingConfig = await this.prisma.configuracaoHorario.findFirst()

      if (existingConfig) {
        this.logger.log(
          `Configuração existente encontrada (ID: ${existingConfig.id}). Atualizando...`,
        )
        const updatedConfig = await this.prisma.configuracaoHorario.update({
          where: { id: existingConfig.id },
          data: dto,
        })
        this.logger.log(
          `Configuração atualizada com sucesso: ${JSON.stringify(updatedConfig)}`,
        )
        return updatedConfig
      } else {
        this.logger.log("Nenhuma configuração existente. Criando nova...")
        const createdConfig = await this.prisma.configuracaoHorario.create({
          data: dto,
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
      if (error instanceof BadRequestException) throw error // Re-lança as exceções de validação de horário
      throw new BadRequestException(
        `Erro ao salvar configuração de horário: ${errorMessage}`,
      ) // Ou um erro mais genérico
    }
  }
}
