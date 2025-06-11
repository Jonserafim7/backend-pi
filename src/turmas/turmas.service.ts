import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
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

  // Constante mantida apenas para validações gerais (não utilizada na criação de turmas)
  // O limite real é definido no campo quantidadeTurmas da disciplina ofertada
  private readonly MAX_TURMAS_POR_OFERTA = 10

  // Constante para o limite máximo de turmas por professor por período
  private readonly MAX_TURMAS_POR_PROFESSOR_POR_PERIODO = 10

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova turma individual
   * Valida se o limite de turmas definido na disciplina ofertada não foi excedido
   * @param createTurmaDto - Dados da turma a ser criada
   * @returns Promise com a turma criada
   * @throws BadRequestException se exceder o limite de turmas da disciplina ofertada
   * @throws NotFoundException se a disciplina ofertada não existir
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

    // Verificar limite de turmas baseado na quantidade definida na disciplina ofertada
    const turmasExistentes = await this.prisma.turma.count({
      where: { idDisciplinaOfertada: createTurmaDto.idDisciplinaOfertada },
    })

    if (turmasExistentes >= disciplinaOfertada.quantidadeTurmas) {
      throw new BadRequestException(
        `Esta disciplina ofertada já atingiu o limite máximo de ${disciplinaOfertada.quantidadeTurmas} turma(s) definido na oferta. ` +
          `Atualmente existem ${turmasExistentes} turma(s) criadas.`,
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
      throw new BadRequestException(
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
      include: {
        disciplinaOfertada: {
          include: { disciplina: true, periodoLetivo: true },
        },
      },
    })

    if (!turma) {
      throw new NotFoundException(`Turma com ID "${id}" não encontrada.`)
    }

    // Verificar se o professor existe e é realmente professor
    const professor = await this.prisma.usuario.findUnique({
      where: { id: idProfessor },
    })

    if (!professor) {
      throw new NotFoundException(
        `Professor com ID "${idProfessor}" não encontrado.`,
      )
    }

    if (professor.papel !== "PROFESSOR") {
      throw new BadRequestException(
        "O usuário selecionado não possui papel de professor.",
      )
    }

    // NOVA VALIDAÇÃO 1: Verificar se professor tem disponibilidade no período
    const temDisponibilidade =
      await this.prisma.disponibilidadeProfessor.findFirst({
        where: {
          idUsuarioProfessor: idProfessor,
          idPeriodoLetivo: turma.disciplinaOfertada.idPeriodoLetivo,
          status: "DISPONIVEL",
        },
      })

    if (!temDisponibilidade) {
      throw new BadRequestException(
        `Professor "${professor.nome}" não possui disponibilidade cadastrada para o período ${turma.disciplinaOfertada.periodoLetivo.ano}/${turma.disciplinaOfertada.periodoLetivo.semestre}º semestre.`,
      )
    }

    // NOVA VALIDAÇÃO 2: Verificar se professor já não está sobrecarregado no período
    const turmasDoFuturo = await this.prisma.turma.count({
      where: {
        idUsuarioProfessor: idProfessor,
        disciplinaOfertada: {
          idPeriodoLetivo: turma.disciplinaOfertada.idPeriodoLetivo,
        },
      },
    })

    if (turmasDoFuturo >= this.MAX_TURMAS_POR_PROFESSOR_POR_PERIODO) {
      throw new BadRequestException(
        `Professor "${professor.nome}" já possui ${turmasDoFuturo} turmas neste período. Limite máximo: ${this.MAX_TURMAS_POR_PROFESSOR_POR_PERIODO} turmas.`,
      )
    }

    // NOVA VALIDAÇÃO 3: Verificar se turma já tem professor
    if (turma.idUsuarioProfessor) {
      const professorAtual = await this.prisma.usuario.findUnique({
        where: { id: turma.idUsuarioProfessor },
      })

      if (professorAtual && professorAtual.id === idProfessor) {
        throw new BadRequestException(
          `Professor "${professor.nome}" já está atribuído a esta turma.`,
        )
      }
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

    this.logger.log(
      `Professor "${professor.nome}" atribuído à turma "${turma.codigoDaTurma}" da disciplina "${turma.disciplinaOfertada.disciplina.nome}"`,
    )

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
      // CORREÇÃO: Mapear informações do professor
      idUsuarioProfessor: turma.idUsuarioProfessor,
      professorAlocado:
        turma.professorAlocado ?
          {
            id: turma.professorAlocado.id,
            nome: turma.professorAlocado.nome,
            email: turma.professorAlocado.email,
            papel: turma.professorAlocado.papel,
            dataCriacao: turma.professorAlocado.dataCriacao,
            dataAtualizacao: turma.professorAlocado.dataAtualizacao,
          }
        : null,
      dataCriacao: turma.dataCriacao,
      dataAtualizacao: turma.dataAtualizacao,
    }
  }

  /**
   * Lista turmas dos cursos que o coordenador coordena
   *
   * @param coordenadorId - ID do coordenador logado
   * @param query - Filtros opcionais de query
   * @returns Lista de turmas dos cursos que coordena
   */
  async findTurmasDoCoordenador(
    coordenadorId: string,
    query?: ListarTurmasQueryDto,
  ): Promise<TurmaResponseDto[]> {
    this.logger.log(`Buscando turmas para o coordenador ID: ${coordenadorId}`)

    // Buscar os cursos que o coordenador coordena
    const cursosCoordenados = await this.prisma.curso.findMany({
      where: { idCoordenador: coordenadorId },
      select: { id: true, nome: true },
    })

    if (!cursosCoordenados || cursosCoordenados.length === 0) {
      this.logger.log(`Coordenador ${coordenadorId} não coordena nenhum curso`)
      return []
    }

    const idsCursosCoordenados = cursosCoordenados.map((curso) => curso.id)

    // Buscar matrizes curriculares dos cursos coordenados
    const matrizesCurriculares = await this.prisma.matrizCurricular.findMany({
      where: {
        idCurso: { in: idsCursosCoordenados },
      },
      select: { id: true },
    })

    if (!matrizesCurriculares || matrizesCurriculares.length === 0) {
      this.logger.log(
        `Nenhuma matriz curricular encontrada para os cursos coordenados`,
      )
      return []
    }

    const idsMatrizesCurriculares = matrizesCurriculares.map(
      (matriz) => matriz.id,
    )

    // Buscar disciplinas que fazem parte das matrizes curriculares
    const disciplinasDasMatrizes = await this.prisma.matrizDisciplina.findMany({
      where: {
        idMatrizCurricular: { in: idsMatrizesCurriculares },
      },
      select: { idDisciplina: true },
    })

    if (!disciplinasDasMatrizes || disciplinasDasMatrizes.length === 0) {
      this.logger.log(`Nenhuma disciplina encontrada nas matrizes curriculares`)
      return []
    }

    const idsDisciplinasDasMatrizes = disciplinasDasMatrizes.map(
      (item) => item.idDisciplina,
    )

    // Buscar disciplinas ofertadas que correspondem às disciplinas das matrizes
    const disciplinasOfertadas = await this.prisma.disciplinaOfertada.findMany({
      where: {
        idDisciplina: { in: idsDisciplinasDasMatrizes },
      },
      select: { id: true },
    })

    if (!disciplinasOfertadas || disciplinasOfertadas.length === 0) {
      this.logger.log(`Nenhuma disciplina ofertada encontrada`)
      return []
    }

    const idsOfertasDasMatrizes = disciplinasOfertadas.map((oferta) => oferta.id)

    // Construir where clause combinando filtros do coordenador e query params
    const whereClause: any = {
      idDisciplinaOfertada: { in: idsOfertasDasMatrizes },
    }

    // Aplicar filtros adicionais da query se fornecidos
    if (query?.idDisciplinaOfertada) {
      whereClause.idDisciplinaOfertada = query.idDisciplinaOfertada
    }
    if (query?.idProfessor) {
      whereClause.idUsuarioProfessor = query.idProfessor
    }
    if (query?.idPeriodoLetivo) {
      whereClause.disciplinaOfertada = {
        periodoLetivo: { id: query.idPeriodoLetivo },
      }
    }

    // Buscar turmas que pertencem às disciplinas ofertadas das matrizes do coordenador
    const turmas = await this.prisma.turma.findMany({
      where: whereClause,
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

    this.logger.log(
      `Encontradas ${turmas.length} turmas para o coordenador ${coordenadorId}`,
    )

    return turmas.map((turma) => this.mapToResponseDto(turma))
  }

  /**
   * Lista turmas que o professor leciona
   *
   * @param professorId - ID do professor logado
   * @param query - Filtros opcionais de query
   * @returns Lista de turmas que o professor leciona
   */
  async findTurmasDoProfessor(
    professorId: string,
    query?: ListarTurmasQueryDto,
  ): Promise<TurmaResponseDto[]> {
    this.logger.log(`Buscando turmas para o professor ID: ${professorId}`)

    // Construir where clause para turmas do professor
    const whereClause: any = {
      idUsuarioProfessor: professorId,
    }

    // Aplicar filtros adicionais da query se fornecidos
    if (query?.idDisciplinaOfertada) {
      whereClause.idDisciplinaOfertada = query.idDisciplinaOfertada
    }
    if (query?.idPeriodoLetivo) {
      whereClause.disciplinaOfertada = {
        periodoLetivo: { id: query.idPeriodoLetivo },
      }
    }

    // Buscar turmas que o professor leciona
    const turmas = await this.prisma.turma.findMany({
      where: whereClause,
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

    this.logger.log(
      `Encontradas ${turmas.length} turmas para o professor ${professorId}`,
    )

    return turmas.map((turma) => this.mapToResponseDto(turma))
  }
}
