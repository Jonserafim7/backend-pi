import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service" // Assuming PrismaService path
import { Prisma } from "@prisma/client" // Import Prisma namespace
import { CreateDisciplinaOfertadaDto } from "./dto/create-disciplina-ofertada.dto"
import { UpdateDisciplinaOfertadaDto } from "./dto/update-disciplina-ofertada.dto"
import { DisciplinaOfertadaResponseDto } from "./dto/disciplina-ofertada-response.dto"
import { TurmasService } from "../turmas/turmas.service" // To be used for auto-creating turmas
import { PeriodoLetivoResponseDto } from "../periodos-letivos/dto"

interface FindAllDisciplinasOfertadasServiceFilters {
  periodoId?: string
  cursoId?: string
  // Add other potential filters here, e.g., coordenadorId, etc.
}

@Injectable()
export class DisciplinasOfertadasService {
  private readonly logger = new Logger(DisciplinasOfertadasService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly turmasService: TurmasService, // Inject TurmasService
  ) {}

  async create(
    createDisciplinaOfertadaDto: CreateDisciplinaOfertadaDto,
    userId: string,
    userRole?: string, // Adicionar papel do usuário
  ): Promise<DisciplinaOfertadaResponseDto> {
    const { idDisciplina, idPeriodoLetivo, quantidadeTurmas } =
      createDisciplinaOfertadaDto

    // 1. Validar se a disciplina existe
    const disciplina = await this.prisma.disciplina.findUnique({
      where: { id: idDisciplina },
    })
    if (!disciplina) {
      throw new NotFoundException(
        `Disciplina com ID "${idDisciplina}" não encontrada.`,
      )
    }

    // 2. Validar se o período letivo existe
    const periodoLetivo = await this.prisma.periodoLetivo.findUnique({
      where: { id: idPeriodoLetivo },
    })
    if (!periodoLetivo) {
      throw new NotFoundException(
        `Período Letivo com ID "${idPeriodoLetivo}" não encontrado.`,
      )
    }

    // Validar que o período letivo está ativo
    if (periodoLetivo.status !== "ATIVO") {
      throw new BadRequestException(
        `O Período Letivo "${periodoLetivo.ano}/${periodoLetivo.semestre}" não está ativo.`,
      )
    }

    // 3. Authorization: Para COORDENADOR, validar que a disciplina pertence a uma matriz de um curso que coordena
    // Para ADMIN e DIRETOR, permitir acesso total
    if (userRole === "COORDENADOR") {
      const cursosCoordenados = await this.prisma.curso.findMany({
        where: { idCoordenador: userId },
        select: { id: true },
      })
      if (!cursosCoordenados || cursosCoordenados.length === 0) {
        throw new ForbiddenException(
          "Você não coordena nenhum curso para ofertar disciplinas.",
        )
      }
      const idsCursosCoordenados = cursosCoordenados.map((c) => c.id)

      const matrizesDosCursosCoordenados =
        await this.prisma.matrizCurricular.findMany({
          where: { idCurso: { in: idsCursosCoordenados } },
          select: { id: true },
        })
      if (
        !matrizesDosCursosCoordenados ||
        matrizesDosCursosCoordenados.length === 0
      ) {
        throw new ForbiddenException(
          "Nenhuma matriz curricular encontrada para os cursos que você coordena.",
        )
      }
      const idsMatrizesDosCursosCoordenados = matrizesDosCursosCoordenados.map(
        (m) => m.id,
      )

      const disciplinaNaMatrizCoordenada =
        await this.prisma.matrizDisciplina.findFirst({
          where: {
            idMatrizCurricular: { in: idsMatrizesDosCursosCoordenados },
            idDisciplina: idDisciplina,
          },
        })

      if (!disciplinaNaMatrizCoordenada) {
        throw new ForbiddenException(
          `A disciplina "${disciplina.nome}" não pertence a nenhuma matriz curricular dos cursos que você coordena.`,
        )
      }
    }
    // ADMIN e DIRETOR podem ofertar qualquer disciplina

    // 4. Validar que a disciplina não foi ofertada no mesmo período letivo
    const existingOferta = await this.prisma.disciplinaOfertada.findFirst({
      where: {
        idDisciplina: idDisciplina,
        idPeriodoLetivo: idPeriodoLetivo,
      },
    })

    if (existingOferta) {
      throw new BadRequestException(
        `Disciplina "${disciplina.nome}" (${disciplina.codigo}) já ofertada no período letivo ${periodoLetivo.ano}/${periodoLetivo.semestre}.`,
      )
    }

    // 5. Criar a oferta da disciplina
    const novaDisciplinaOfertada = await this.prisma.disciplinaOfertada.create({
      data: {
        disciplina: { connect: { id: idDisciplina } },
        periodoLetivo: { connect: { id: idPeriodoLetivo } },
        quantidadeTurmas,
        coordenadorQueOfertou: { connect: { id: userId } },
      },
      include: {
        disciplina: true,
        periodoLetivo: true,
      },
    })

    // 6. Criar turmas automaticamente
    if (
      novaDisciplinaOfertada.quantidadeTurmas > 0 &&
      novaDisciplinaOfertada.id
    ) {
      try {
        await this.turmasService.createTurmasForDisciplinaOfertada(
          novaDisciplinaOfertada.id,
          novaDisciplinaOfertada.quantidadeTurmas,
        )
      } catch (error) {
        const e = error as Error
        console.error(
          `Falha ao criar turmas para a oferta ${novaDisciplinaOfertada.id}: ${e.message}`,
        )
      }
    }

    // Mapear para o DTO de resposta
    return {
      id: novaDisciplinaOfertada.id,
      idDisciplina: novaDisciplinaOfertada.idDisciplina,
      idPeriodoLetivo: novaDisciplinaOfertada.idPeriodoLetivo,
      quantidadeTurmas: novaDisciplinaOfertada.quantidadeTurmas,
      disciplina:
        novaDisciplinaOfertada.disciplina ?
          {
            id: novaDisciplinaOfertada.disciplina.id,
            nome: novaDisciplinaOfertada.disciplina.nome,
            codigo: novaDisciplinaOfertada.disciplina.codigo ?? undefined,
            cargaHoraria: novaDisciplinaOfertada.disciplina.cargaHoraria,
            dataCriacao: novaDisciplinaOfertada.disciplina.dataCriacao,
            dataAtualizacao: novaDisciplinaOfertada.disciplina.dataAtualizacao,
          }
        : undefined,
      periodoLetivo:
        novaDisciplinaOfertada.periodoLetivo ?
          PeriodoLetivoResponseDto.fromEntity(
            novaDisciplinaOfertada.periodoLetivo,
          )
        : undefined,
      createdAt: novaDisciplinaOfertada.dataCriacao,
      updatedAt: novaDisciplinaOfertada.dataAtualizacao,
    }
  }

  /**
   * Cria uma disciplina ofertada usando o período letivo ativo automaticamente
   *
   * @param idDisciplina - ID da disciplina a ser ofertada
   * @param quantidadeTurmas - Quantidade de turmas para a disciplina
   * @param userId - ID do usuário que está criando a oferta
   * @param userRole - Papel do usuário
   * @returns Disciplina ofertada criada
   * @throws NotFoundException se não houver período letivo ativo
   */
  async createComPeriodoAtivo(
    idDisciplina: string,
    quantidadeTurmas: number,
    userId: string,
    userRole?: string,
  ): Promise<DisciplinaOfertadaResponseDto> {
    // Buscar o período letivo ativo
    const periodoAtivo = await this.prisma.periodoLetivo.findFirst({
      where: { status: "ATIVO" },
    })

    if (!periodoAtivo) {
      throw new NotFoundException(
        "Não há período letivo ativo para ofertar disciplinas.",
      )
    }

    // Usar o método create existente com o período ativo
    return this.create(
      {
        idDisciplina,
        idPeriodoLetivo: periodoAtivo.id,
        quantidadeTurmas,
      },
      userId,
      userRole,
    )
  }

  async findAll(
    filters: FindAllDisciplinasOfertadasServiceFilters,
  ): Promise<DisciplinaOfertadaResponseDto[]> {
    const whereClause: Prisma.DisciplinaOfertadaWhereInput = {}

    if (filters.periodoId) {
      whereClause.idPeriodoLetivo = filters.periodoId
    }

    if (filters.cursoId) {
      const matrizesDoCurso = await this.prisma.matrizCurricular.findMany({
        where: { idCurso: filters.cursoId },
        select: { id: true },
      })
      const idsMatrizesDoCurso = matrizesDoCurso.map((m) => m.id)

      if (idsMatrizesDoCurso.length > 0) {
        const disciplinasDaMatriz = await this.prisma.matrizDisciplina.findMany({
          where: { idMatrizCurricular: { in: idsMatrizesDoCurso } },
          select: { idDisciplina: true },
        })
        const idsDisciplinasDoCurso = disciplinasDaMatriz
          .map((md) => md.idDisciplina)
          .filter((value, index, self) => self.indexOf(value) === index)

        if (idsDisciplinasDoCurso.length > 0) {
          whereClause.idDisciplina = { in: idsDisciplinasDoCurso }
        } else {
          return []
        }
      } else {
        return []
      }
    }

    const ofertas = await this.prisma.disciplinaOfertada.findMany({
      where: whereClause,
      include: {
        disciplina: true,
        periodoLetivo: true,
      },
      orderBy: [
        { periodoLetivo: { ano: "desc" } },
        { periodoLetivo: { semestre: "desc" } },
        { disciplina: { nome: "asc" } },
      ],
    })

    return ofertas.map((oferta) => ({
      id: oferta.id,
      idDisciplina: oferta.idDisciplina,
      idPeriodoLetivo: oferta.idPeriodoLetivo,
      quantidadeTurmas: oferta.quantidadeTurmas,
      disciplina:
        oferta.disciplina ?
          {
            id: oferta.disciplina.id,
            nome: oferta.disciplina.nome,
            codigo: oferta.disciplina.codigo ?? undefined,
            cargaHoraria: oferta.disciplina.cargaHoraria,
            dataCriacao: oferta.disciplina.dataCriacao,
            dataAtualizacao: oferta.disciplina.dataAtualizacao,
          }
        : undefined,
      periodoLetivo:
        oferta.periodoLetivo ?
          PeriodoLetivoResponseDto.fromEntity(oferta.periodoLetivo)
        : undefined,
      createdAt: oferta.dataCriacao,
      updatedAt: oferta.dataAtualizacao,
    }))
  }

  async findOne(id: string): Promise<DisciplinaOfertadaResponseDto> {
    console.log("Find ID (service):", id)
    const oferta = await this.prisma.disciplinaOfertada.findUnique({
      where: { id },
      include: {
        disciplina: true,
        periodoLetivo: true,
        coordenadorQueOfertou: true,
      },
    })

    if (!oferta) {
      throw new NotFoundException(
        `Oferta de disciplina com ID "${id}" não encontrada.`,
      )
    }

    return {
      id: oferta.id,
      idDisciplina: oferta.idDisciplina,
      idPeriodoLetivo: oferta.idPeriodoLetivo,
      quantidadeTurmas: oferta.quantidadeTurmas,
      disciplina:
        oferta.disciplina ?
          {
            id: oferta.disciplina.id,
            nome: oferta.disciplina.nome,
            codigo: oferta.disciplina.codigo ?? undefined,
            cargaHoraria: oferta.disciplina.cargaHoraria,
            dataCriacao: oferta.disciplina.dataCriacao,
            dataAtualizacao: oferta.disciplina.dataAtualizacao,
          }
        : undefined,
      periodoLetivo:
        oferta.periodoLetivo ?
          PeriodoLetivoResponseDto.fromEntity(oferta.periodoLetivo)
        : undefined,
      createdAt: oferta.dataCriacao,
      updatedAt: oferta.dataAtualizacao,
    }
  }

  async update(
    id: string,
    updateDisciplinaOfertadaDto: UpdateDisciplinaOfertadaDto,
    solicitanteId: string,
    userRole?: string, // Adicionar papel do usuário
  ): Promise<DisciplinaOfertadaResponseDto> {
    console.log("Update ID (service):", id, "DTO:", updateDisciplinaOfertadaDto)

    // First, check if the disciplinaOfertada exists
    const existingOferta = await this.prisma.disciplinaOfertada.findUnique({
      where: { id },
    })

    if (!existingOferta) {
      throw new NotFoundException(
        `Oferta de disciplina com ID "${id}" não encontrada para atualização.`,
      )
    }

    // Authorization check: ADMIN e DIRETOR podem atualizar qualquer oferta
    // COORDENADOR só pode atualizar ofertas que criou
    if (
      userRole === "COORDENADOR" &&
      existingOferta.idCoordenador !== solicitanteId
    ) {
      throw new ForbiddenException(
        "Você não tem permissão para atualizar esta oferta de disciplina.",
      )
    }

    // Prepare data for update, only including fields that are present in the DTO
    const dataToUpdate: Prisma.DisciplinaOfertadaUpdateInput = {} // Typed correctly
    if (updateDisciplinaOfertadaDto.quantidadeTurmas !== undefined) {
      dataToUpdate.quantidadeTurmas = updateDisciplinaOfertadaDto.quantidadeTurmas
    }
    if (updateDisciplinaOfertadaDto.idDisciplina) {
      // Validar se a nova disciplina existe
      const disciplina = await this.prisma.disciplina.findUnique({
        where: { id: updateDisciplinaOfertadaDto.idDisciplina },
      })
      if (!disciplina)
        throw new NotFoundException(
          `Nova disciplina com ID "${updateDisciplinaOfertadaDto.idDisciplina}" não encontrada.`,
        )

      // Validação adicional para coordenadores: a nova disciplina deve pertencer às suas matrizes
      if (userRole === "COORDENADOR") {
        const cursosCoordenados = await this.prisma.curso.findMany({
          where: { idCoordenador: solicitanteId },
          select: { id: true },
        })
        if (!cursosCoordenados || cursosCoordenados.length === 0) {
          throw new ForbiddenException(
            "Você não coordena nenhum curso para alterar disciplinas ofertadas.",
          )
        }
        const idsCursosCoordenados = cursosCoordenados.map((c) => c.id)

        const matrizesDosCursosCoordenados =
          await this.prisma.matrizCurricular.findMany({
            where: { idCurso: { in: idsCursosCoordenados } },
            select: { id: true },
          })
        const idsMatrizesDosCursosCoordenados = matrizesDosCursosCoordenados.map(
          (m) => m.id,
        )

        const disciplinaNaMatrizCoordenada =
          await this.prisma.matrizDisciplina.findFirst({
            where: {
              idMatrizCurricular: { in: idsMatrizesDosCursosCoordenados },
              idDisciplina: updateDisciplinaOfertadaDto.idDisciplina,
            },
          })

        if (!disciplinaNaMatrizCoordenada) {
          throw new ForbiddenException(
            `A disciplina "${disciplina.nome}" não pertence a nenhuma matriz curricular dos cursos que você coordena.`,
          )
        }
      }

      dataToUpdate.disciplina = {
        connect: { id: updateDisciplinaOfertadaDto.idDisciplina },
      }
    }
    if (updateDisciplinaOfertadaDto.idPeriodoLetivo) {
      // Potentially validate new idPeriodoLetivo before setting
      const periodoLetivo = await this.prisma.periodoLetivo.findUnique({
        where: { id: updateDisciplinaOfertadaDto.idPeriodoLetivo },
      })
      if (!periodoLetivo)
        throw new NotFoundException(
          `Novo período letivo com ID "${updateDisciplinaOfertadaDto.idPeriodoLetivo}" não encontrado.`,
        )
      // TODO: Validate new (disciplina, periodoLetivo) combination is unique if changed, check existingOferta.idDisciplina and existingOferta.idPeriodoLetivo

      // Validar que o novo período letivo está ativo
      const hoje = new Date()
      if (periodoLetivo.dataInicio && periodoLetivo.dataInicio > hoje) {
        throw new BadRequestException(
          `O novo Período Letivo "${periodoLetivo.ano}/${periodoLetivo.semestre}" ainda não começou. Início em: ${periodoLetivo.dataInicio.toLocaleDateString()}.`,
        )
      }
      if (periodoLetivo.dataFim && periodoLetivo.dataFim < hoje) {
        throw new BadRequestException(
          `O novo Período Letivo "${periodoLetivo.ano}/${periodoLetivo.semestre}" já terminou em: ${periodoLetivo.dataFim.toLocaleDateString()}.`,
        )
      }

      dataToUpdate.periodoLetivo = {
        connect: { id: updateDisciplinaOfertadaDto.idPeriodoLetivo },
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      throw new BadRequestException(
        "Nenhum dado válido fornecido para atualização ou os dados não alteram o registro existente.",
      )
    }

    const updatedOferta = await this.prisma.disciplinaOfertada.update({
      where: { id },
      data: dataToUpdate,
      include: { disciplina: true, periodoLetivo: true },
    })

    // Adjust turmas if quantidadeTurmas was changed
    if (
      updateDisciplinaOfertadaDto.quantidadeTurmas !== undefined &&
      updateDisciplinaOfertadaDto.quantidadeTurmas !==
        existingOferta.quantidadeTurmas
    ) {
      this.logger.log(
        `Quantidade de turmas alterada para oferta ${updatedOferta.id}. Ajustando turmas.`,
      )
      try {
        await this.turmasService.adjustTurmasForDisciplinaOfertada(
          updatedOferta.id,
          updatedOferta.quantidadeTurmas, // Use the already updated quantidadeTurmas
          // We might need a default for numeroVagas if not specified, or make it part of UpdateDisciplinaOfertadaDto
        )
      } catch (error) {
        const e = error as Error
        this.logger.error(
          `Falha ao ajustar turmas para a oferta ${updatedOferta.id} durante a atualização: ${e.message}`,
          e.stack,
        )
        // Non-critical error for now, don't fail the whole update
      }
    }

    return {
      id: updatedOferta.id,
      idDisciplina: updatedOferta.idDisciplina,
      idPeriodoLetivo: updatedOferta.idPeriodoLetivo,
      quantidadeTurmas: updatedOferta.quantidadeTurmas,
      disciplina:
        updatedOferta.disciplina ?
          {
            id: updatedOferta.disciplina.id,
            nome: updatedOferta.disciplina.nome,
            codigo: updatedOferta.disciplina.codigo ?? undefined,
            cargaHoraria: updatedOferta.disciplina.cargaHoraria,
            dataCriacao: updatedOferta.disciplina.dataCriacao,
            dataAtualizacao: updatedOferta.disciplina.dataAtualizacao,
          }
        : undefined,
      periodoLetivo:
        updatedOferta.periodoLetivo ?
          PeriodoLetivoResponseDto.fromEntity(updatedOferta.periodoLetivo)
        : undefined,
      createdAt: updatedOferta.dataCriacao,
      updatedAt: updatedOferta.dataAtualizacao,
    }
  }

  async remove(
    id: string,
    solicitanteId: string,
    userRole?: string, // Adicionar papel do usuário
  ): Promise<void> {
    console.log("Remove ID (service):", id)

    const existingOferta = await this.prisma.disciplinaOfertada.findUnique({
      where: { id },
    })

    if (!existingOferta) {
      throw new NotFoundException(
        `Oferta de disciplina com ID "${id}" não encontrada para remoção.`,
      )
    }

    // Authorization check: ADMIN e DIRETOR podem remover qualquer oferta
    // COORDENADOR só pode remover ofertas que criou
    if (
      userRole === "COORDENADOR" &&
      existingOferta.idCoordenador !== solicitanteId
    ) {
      throw new ForbiddenException(
        "Você não tem permissão para remover esta oferta de disciplina.",
      )
    }

    // TODO: Implementar lógica para remover turmas associadas    // Atualmente, o Prisma irá lidar com as constraint automaticamente

    await this.prisma.disciplinaOfertada.delete({
      where: { id },
    })
    return
  }

  /**
   * Lista disciplinas ofertadas dos cursos que o coordenador coordena
   *
   * @param coordenadorId - ID do coordenador logado
   * @returns Lista de disciplinas ofertadas dos cursos que coordena
   * @throws BadRequestException se o coordenador não coordena nenhum curso
   */
  async findOfertasDoCoordenador(
    coordenadorId: string,
  ): Promise<DisciplinaOfertadaResponseDto[]> {
    // Buscar os cursos que o coordenador coordena
    const cursosCoordenados = await this.prisma.curso.findMany({
      where: { idCoordenador: coordenadorId },
      select: { id: true, nome: true },
    })

    if (!cursosCoordenados || cursosCoordenados.length === 0) {
      // Se não coordena nenhum curso, retorna array vazio
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
      // Se não há matrizes curriculares, retorna array vazio
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
      // Se não há disciplinas nas matrizes, retorna array vazio
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
      include: {
        disciplina: true,
        periodoLetivo: true,
      },
      orderBy: [
        { periodoLetivo: { ano: "desc" } },
        { periodoLetivo: { semestre: "desc" } },
        { disciplina: { nome: "asc" } },
      ],
    })

    // Mapear para o formato de resposta
    return disciplinasOfertadas.map((oferta) => ({
      id: oferta.id,
      idDisciplina: oferta.idDisciplina,
      idPeriodoLetivo: oferta.idPeriodoLetivo,
      quantidadeTurmas: oferta.quantidadeTurmas,
      disciplina:
        oferta.disciplina ?
          {
            id: oferta.disciplina.id,
            nome: oferta.disciplina.nome,
            codigo: oferta.disciplina.codigo ?? undefined,
            cargaHoraria: oferta.disciplina.cargaHoraria,
            dataCriacao: oferta.disciplina.dataCriacao,
            dataAtualizacao: oferta.disciplina.dataAtualizacao,
          }
        : undefined,
      periodoLetivo:
        oferta.periodoLetivo ?
          PeriodoLetivoResponseDto.fromEntity(oferta.periodoLetivo)
        : undefined,
      createdAt: oferta.dataCriacao,
      updatedAt: oferta.dataAtualizacao,
    }))
  }
}
