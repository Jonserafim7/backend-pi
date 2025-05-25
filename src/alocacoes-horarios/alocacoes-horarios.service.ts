import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
import {
  CreateAlocacaoHorarioDto,
  AlocacaoHorarioResponseDto,
  AlocacaoHorarioQueryDto,
  ValidateAlocacaoDto,
  ValidateAlocacaoResponseDto,
} from "./dto"
import { DiaSemana, StatusDisponibilidade } from "@prisma/client"

@Injectable()
export class AlocacoesHorariosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova alocação de horário após validação
   */
  async create(
    dto: CreateAlocacaoHorarioDto,
  ): Promise<AlocacaoHorarioResponseDto> {
    // 1. Validar a alocação antes de criar
    const validation = await this.validateAlocacao(dto)
    if (!validation.valid) {
      throw new BadRequestException(validation.error)
    }

    // 2. Criar a alocação
    const alocacao = await this.prisma.alocacaoHorario.create({
      data: {
        idTurma: dto.idTurma,
        diaDaSemana: dto.diaDaSemana,
        horaInicio: dto.horaInicio,
        horaFim: dto.horaFim,
      },
      include: {
        turma: {
          include: {
            disciplinaOfertada: {
              include: {
                disciplina: true,
              },
            },
            professorAlocado: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return this.mapToResponseDto(alocacao)
  }

  /**
   * Busca alocações por turma
   */
  async findByTurma(idTurma: string): Promise<AlocacaoHorarioResponseDto[]> {
    const alocacoes = await this.prisma.alocacaoHorario.findMany({
      where: { idTurma },
      include: {
        turma: {
          include: {
            disciplinaOfertada: {
              include: {
                disciplina: true,
              },
            },
            professorAlocado: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ diaDaSemana: "asc" }, { horaInicio: "asc" }],
    })

    return alocacoes.map(this.mapToResponseDto)
  }

  /**
   * Busca alocações por professor
   */
  async findByProfessor(
    idProfessor: string,
  ): Promise<AlocacaoHorarioResponseDto[]> {
    const alocacoes = await this.prisma.alocacaoHorario.findMany({
      where: {
        turma: {
          idUsuarioProfessor: idProfessor,
        },
      },
      include: {
        turma: {
          include: {
            disciplinaOfertada: {
              include: {
                disciplina: true,
              },
            },
            professorAlocado: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ diaDaSemana: "asc" }, { horaInicio: "asc" }],
    })

    return alocacoes.map(this.mapToResponseDto)
  }

  /**
   * Busca alocações com filtros
   */
  async findMany(
    query: AlocacaoHorarioQueryDto,
  ): Promise<AlocacaoHorarioResponseDto[]> {
    const where: any = {}

    if (query.idTurma) {
      where.idTurma = query.idTurma
    }

    if (query.idProfessor) {
      where.turma = {
        idUsuarioProfessor: query.idProfessor,
      }
    }

    if (query.idPeriodoLetivo) {
      where.turma = {
        ...where.turma,
        disciplinaOfertada: {
          idPeriodoLetivo: query.idPeriodoLetivo,
        },
      }
    }

    if (query.diaDaSemana) {
      where.diaDaSemana = query.diaDaSemana
    }

    const alocacoes = await this.prisma.alocacaoHorario.findMany({
      where,
      include: {
        turma: {
          include: {
            disciplinaOfertada: {
              include: {
                disciplina: true,
              },
            },
            professorAlocado: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ diaDaSemana: "asc" }, { horaInicio: "asc" }],
    })

    return alocacoes.map(this.mapToResponseDto)
  }

  /**
   * Remove uma alocação
   */
  async delete(id: string): Promise<void> {
    const alocacao = await this.prisma.alocacaoHorario.findUnique({
      where: { id },
    })

    if (!alocacao) {
      throw new NotFoundException("Alocação não encontrada")
    }

    await this.prisma.alocacaoHorario.delete({
      where: { id },
    })
  }

  /**
   * Valida se uma alocação pode ser criada
   */
  async validateAlocacao(
    dto: ValidateAlocacaoDto,
  ): Promise<ValidateAlocacaoResponseDto> {
    try {
      // 1. Verificar se a turma existe e tem professor alocado
      const turma = await this.prisma.turma.findUnique({
        where: { id: dto.idTurma },
        include: {
          professorAlocado: true,
          disciplinaOfertada: {
            include: {
              periodoLetivo: true,
            },
          },
        },
      })

      if (!turma) {
        return {
          valid: false,
          error: "Turma não encontrada",
        }
      }

      if (!turma.professorAlocado) {
        return {
          valid: false,
          error: "Turma não possui professor alocado",
        }
      }

      const professorId = turma.professorAlocado.id
      const periodoLetivoId = turma.disciplinaOfertada.idPeriodoLetivo

      // 2. Verificar se o professor está disponível no horário
      const disponibilidade =
        await this.prisma.disponibilidadeProfessor.findFirst({
          where: {
            idUsuarioProfessor: professorId,
            idPeriodoLetivo: periodoLetivoId,
            diaDaSemana: dto.diaDaSemana,
            horaInicio: { lte: dto.horaInicio },
            horaFim: { gte: dto.horaFim },
            status: StatusDisponibilidade.DISPONIVEL,
          },
        })

      if (!disponibilidade) {
        return {
          valid: false,
          error: "Professor não está disponível neste horário",
          details: {
            professorDisponivel: false,
            conflitosDetectados: [],
            horarioValido: true,
          },
        }
      }

      // 3. Verificar conflitos - professor já tem aula no mesmo horário
      const conflitos = await this.prisma.alocacaoHorario.findMany({
        where: {
          turma: {
            idUsuarioProfessor: professorId,
            disciplinaOfertada: {
              idPeriodoLetivo: periodoLetivoId,
            },
          },
          diaDaSemana: dto.diaDaSemana,
          OR: [
            // Horário de início está dentro de uma aula existente
            {
              horaInicio: { lte: dto.horaInicio },
              horaFim: { gt: dto.horaInicio },
            },
            // Horário de fim está dentro de uma aula existente
            {
              horaInicio: { lt: dto.horaFim },
              horaFim: { gte: dto.horaFim },
            },
            // Nova aula engloba uma aula existente
            {
              horaInicio: { gte: dto.horaInicio },
              horaFim: { lte: dto.horaFim },
            },
          ],
        },
        include: {
          turma: {
            include: {
              disciplinaOfertada: {
                include: {
                  disciplina: true,
                },
              },
            },
          },
        },
      })

      if (conflitos.length > 0) {
        const conflitosDetectados = conflitos.map(
          (c) =>
            `${c.turma.disciplinaOfertada.disciplina.nome} (${c.horaInicio}-${c.horaFim})`,
        )

        return {
          valid: false,
          error: `Professor já possui aula(s) neste horário: ${conflitosDetectados.join(", ")}`,
          details: {
            professorDisponivel: true,
            conflitosDetectados,
            horarioValido: true,
          },
        }
      }

      // 4. Verificar se não há alocação duplicada para a mesma turma
      const alocacaoExistente = await this.prisma.alocacaoHorario.findFirst({
        where: {
          idTurma: dto.idTurma,
          diaDaSemana: dto.diaDaSemana,
          horaInicio: dto.horaInicio,
          horaFim: dto.horaFim,
        },
      })

      if (alocacaoExistente) {
        return {
          valid: false,
          error: "Já existe uma alocação para esta turma neste horário",
        }
      }

      // Tudo válido!
      return {
        valid: true,
        details: {
          professorDisponivel: true,
          conflitosDetectados: [],
          horarioValido: true,
        },
      }
    } catch (error) {
      return {
        valid: false,
        error: "Erro interno na validação",
      }
    }
  }

  /**
   * Mapeia o resultado do Prisma para o DTO de resposta
   */
  private mapToResponseDto(alocacao: any): AlocacaoHorarioResponseDto {
    return {
      id: alocacao.id,
      idTurma: alocacao.idTurma,
      diaDaSemana: alocacao.diaDaSemana,
      horaInicio: alocacao.horaInicio,
      horaFim: alocacao.horaFim,
      dataCriacao: alocacao.dataCriacao,
      dataAtualizacao: alocacao.dataAtualizacao,
      turma: {
        id: alocacao.turma.id,
        codigoDaTurma: alocacao.turma.codigoDaTurma,
        disciplinaOfertada: {
          id: alocacao.turma.disciplinaOfertada.id,
          disciplina: {
            id: alocacao.turma.disciplinaOfertada.disciplina.id,
            nome: alocacao.turma.disciplinaOfertada.disciplina.nome,
            codigo: alocacao.turma.disciplinaOfertada.disciplina.codigo,
            cargaHoraria:
              alocacao.turma.disciplinaOfertada.disciplina.cargaHoraria,
          },
        },
        professorAlocado: alocacao.turma.professorAlocado,
      },
    }
  }
}
