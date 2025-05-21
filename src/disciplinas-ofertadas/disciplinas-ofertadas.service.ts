import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service" // Assuming PrismaService path
import { Prisma } from "@prisma/client" // Import Prisma namespace
import { CreateDisciplinaOfertadaDto } from "./dto/create-disciplina-ofertada.dto"
import { UpdateDisciplinaOfertadaDto } from "./dto/update-disciplina-ofertada.dto"
import { DisciplinaOfertadaResponseDto } from "./dto/disciplina-ofertada-response.dto"
import { TurmasService } from "../turmas/turmas.service" // To be used for auto-creating turmas
import { Logger } from "@nestjs/common"

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
    coordenadorId: string, // Changed to string
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
    const hoje = new Date()
    if (periodoLetivo.dataInicio && periodoLetivo.dataInicio > hoje) {
      throw new BadRequestException(
        `O Período Letivo "${periodoLetivo.ano}/${periodoLetivo.semestre}" ainda não começou. Início em: ${periodoLetivo.dataInicio.toLocaleDateString()}.`,
      )
    }
    if (periodoLetivo.dataFim && periodoLetivo.dataFim < hoje) {
      throw new BadRequestException(
        `O Período Letivo "${periodoLetivo.ano}/${periodoLetivo.semestre}" já terminou em: ${periodoLetivo.dataFim.toLocaleDateString()}.`,
      )
    }
    // TODO: Validar que o período letivo está ativo (e.g., periodoLetivo.dataFim && new Date() > periodoLetivo.dataFim)

    // 3. Authorization: Validar que a disciplina pertence a uma matriz de um curso que o coordenador logado coordena
    const cursosCoordenados = await this.prisma.curso.findMany({
      where: { idCoordenador: coordenadorId },
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

    // 4. Validar que a disciplina não foi ofertada no mesmo período letivo (check moved after auth)
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
        coordenadorQueOfertou: { connect: { id: coordenadorId } }, // This confirms the creator
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
        // O número de vagas padrão pode vir do DTO, de uma configuração, ou ser fixo.
        // Por agora, não passarei um número de vagas padrão específico.
        await this.turmasService.createTurmasForDisciplinaOfertada(
          novaDisciplinaOfertada.id,
          novaDisciplinaOfertada.quantidadeTurmas,
        )
      } catch (error) {
        // Log o erro, mas não necessariamente reverta a criação da DisciplinaOfertada.
        // Ou decida por uma política de transação mais estrita se necessário.
        const e = error as Error
        console.error(
          `Falha ao criar turmas para a oferta ${novaDisciplinaOfertada.id}: ${e.message}`,
        )
        // Poderia-se lançar um erro customizado ou adicionar um alerta na resposta.
      }
    }

    // Mapear para o DTO de resposta.
    // Prisma retorna todos os campos, incluindo IDs de relacionamento.
    // O DisciplinaOfertadaResponseDto espera idDisciplina, idPeriodoLetivo, quantidadeTurmas, id, createdAt, updatedAt
    // e opcionalmente os objetos disciplina e periodoLetivo.
    // Por agora, retornaremos o objeto criado diretamente, assumindo que o Prisma o retorna de forma compatível.
    // Se precisarmos de mais controle ou dos objetos aninhados, faremos um select ou include e mapeamento manual.

    // Correção: Mapear explicitamente para DisciplinaOfertadaResponseDto
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
            codigo: novaDisciplinaOfertada.disciplina.codigo ?? undefined, // Garante undefined se null
            cargaHoraria: novaDisciplinaOfertada.disciplina.cargaHoraria,
            dataCriacao: novaDisciplinaOfertada.disciplina.dataCriacao,
            dataAtualizacao: novaDisciplinaOfertada.disciplina.dataAtualizacao,
          }
        : undefined,
      periodoLetivo:
        novaDisciplinaOfertada.periodoLetivo ?
          {
            id: novaDisciplinaOfertada.periodoLetivo.id,
            ano: novaDisciplinaOfertada.periodoLetivo.ano,
            semestre: novaDisciplinaOfertada.periodoLetivo.semestre,
            dataInicio: novaDisciplinaOfertada.periodoLetivo.dataInicio,
            dataFim: novaDisciplinaOfertada.periodoLetivo.dataFim,
            createdAt: novaDisciplinaOfertada.periodoLetivo.dataCriacao, // Mapeamento de nome
            updatedAt: novaDisciplinaOfertada.periodoLetivo.dataAtualizacao, // Mapeamento de nome
          }
        : undefined,
      createdAt: novaDisciplinaOfertada.dataCriacao,
      updatedAt: novaDisciplinaOfertada.dataAtualizacao,
    }
  }

  async findAll(
    filters: FindAllDisciplinasOfertadasServiceFilters,
  ): Promise<DisciplinaOfertadaResponseDto[]> {
    const whereClause: Prisma.DisciplinaOfertadaWhereInput = {}

    if (filters.periodoId) {
      whereClause.idPeriodoLetivo = filters.periodoId
    }

    if (filters.cursoId) {
      // To filter by cursoId, we need to find disciplinas that belong to matrizes of that curso
      // and then find ofertas for those disciplinas.
      // This is a bit more complex and might require a multi-step query or a raw query if performance is critical.
      // For now, let's add a placeholder or a simpler approach if possible.
      // One approach: Get all MatrizCurricular for the cursoId, then all MatrizDisciplina, then all Disciplina IDs.
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
          .filter((value, index, self) => self.indexOf(value) === index) // Unique IDs

        if (idsDisciplinasDoCurso.length > 0) {
          whereClause.idDisciplina = { in: idsDisciplinasDoCurso }
        } else {
          // No disciplines found for the given cursoId, so no ofertas will match
          return []
        }
      } else {
        // No matrizes found for the cursoId, so no ofertas will match
        return []
      }
    }

    const ofertas = await this.prisma.disciplinaOfertada.findMany({
      where: whereClause,
      include: {
        disciplina: true,
        periodoLetivo: true,
        // Not including coordenadorQueOfertou by default to keep payload smaller unless needed
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
          {
            id: oferta.periodoLetivo.id,
            ano: oferta.periodoLetivo.ano,
            semestre: oferta.periodoLetivo.semestre,
            dataInicio: oferta.periodoLetivo.dataInicio,
            dataFim: oferta.periodoLetivo.dataFim,
            createdAt: oferta.periodoLetivo.dataCriacao,
            updatedAt: oferta.periodoLetivo.dataAtualizacao,
          }
        : undefined,
      createdAt: oferta.dataCriacao,
      updatedAt: oferta.dataAtualizacao,
    }))
  }

  async findOne(id: string): Promise<DisciplinaOfertadaResponseDto> {
    console.log("Find ID (service):", id)
    // TODO: Implementar busca detalhada com disciplina e período letivo relacionados
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
          {
            id: oferta.periodoLetivo.id,
            ano: oferta.periodoLetivo.ano,
            semestre: oferta.periodoLetivo.semestre,
            dataInicio: oferta.periodoLetivo.dataInicio,
            dataFim: oferta.periodoLetivo.dataFim,
            createdAt: oferta.periodoLetivo.dataCriacao,
            updatedAt: oferta.periodoLetivo.dataAtualizacao,
          }
        : undefined,
      createdAt: oferta.dataCriacao,
      updatedAt: oferta.dataAtualizacao,
    }
  }

  async update(
    id: string,
    updateDisciplinaOfertadaDto: UpdateDisciplinaOfertadaDto,
    solicitanteId: string,
  ): Promise<DisciplinaOfertadaResponseDto> {
    console.log("Update ID (service):", id, "DTO:", updateDisciplinaOfertadaDto)
    // TODO: Validar se o coordenador é o responsável pela oferta antes de atualizar
    // TODO: Implementar lógica para lidar com a atualização da quantidade de turmas (e.g., criar/remover turmas associadas)

    // First, check if the disciplinaOfertada exists
    const existingOferta = await this.prisma.disciplinaOfertada.findUnique({
      where: { id },
    })

    if (!existingOferta) {
      throw new NotFoundException(
        `Oferta de disciplina com ID "${id}" não encontrada para atualização.`,
      )
    }

    // Authorization check
    if (existingOferta.idCoordenador !== solicitanteId) {
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
      // Potentially validate new idDisciplina before setting
      const disciplina = await this.prisma.disciplina.findUnique({
        where: { id: updateDisciplinaOfertadaDto.idDisciplina },
      })
      if (!disciplina)
        throw new NotFoundException(
          `Nova disciplina com ID "${updateDisciplinaOfertadaDto.idDisciplina}" não encontrada.`,
        )
      // Add similar authorization check for the new discipline if needed for update
      // For example, check if the new disciplina also belongs to one of the coordinator's courses
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
          {
            id: updatedOferta.periodoLetivo.id,
            ano: updatedOferta.periodoLetivo.ano,
            semestre: updatedOferta.periodoLetivo.semestre,
            dataInicio: updatedOferta.periodoLetivo.dataInicio,
            dataFim: updatedOferta.periodoLetivo.dataFim,
            createdAt: updatedOferta.periodoLetivo.dataCriacao,
            updatedAt: updatedOferta.periodoLetivo.dataAtualizacao,
          }
        : undefined,
      createdAt: updatedOferta.dataCriacao,
      updatedAt: updatedOferta.dataAtualizacao,
    }
  }

  async remove(id: string, solicitanteId: string): Promise<void> {
    console.log("Remove ID (service):", id)
    // TODO: Validar se o coordenador é o responsável pela oferta antes de remover
    // TODO: Verificar dependências com turmas (e.g., se existem turmas com alocações, impedir remoção ou tratar)

    const existingOferta = await this.prisma.disciplinaOfertada.findUnique({
      where: { id },
    })

    if (!existingOferta) {
      throw new NotFoundException(
        `Oferta de disciplina com ID "${id}" não encontrada para remoção.`,
      )
    }

    // Authorization check
    if (existingOferta.idCoordenador !== solicitanteId) {
      throw new ForbiddenException(
        "Você não tem permissão para remover esta oferta de disciplina.",
      )
    }

    // Consider soft delete or more complex logic if turmas depend on this
    await this.prisma.disciplinaOfertada.delete({
      where: { id },
    })
    return
  }
}
