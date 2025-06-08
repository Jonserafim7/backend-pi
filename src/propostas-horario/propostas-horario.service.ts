import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
import { CreatePropostaHorarioDto } from "./dto/create-proposta-horario.dto"
import { UpdatePropostaHorarioDto } from "./dto/update-proposta-horario.dto"
import { SubmitPropostaHorarioDto } from "./dto/submit-proposta-horario.dto"
import {
  ApprovePropostaDto,
  RejectPropostaDto,
} from "./dto/approve-reject-proposta.dto"
import { SendBackPropostaDto } from "./dto/send-back-proposta.dto"
import { PropostaHorarioComRelacionamentos } from "./types/proposta-horario-com-relacionamentos.type"
import {
  PropostaHorarioStatus,
  PapelUsuario,
  StatusPeriodoLetivo,
} from "@prisma/client"

@Injectable()
export class PropostasHorarioService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova proposta de horário
   * @param createPropostaDto Dados para criação da proposta
   * @param idCoordenador ID do coordenador que está criando a proposta
   * @returns Proposta criada
   */
  async create(
    createPropostaDto: CreatePropostaHorarioDto,
    idCoordenador: string,
  ): Promise<PropostaHorarioComRelacionamentos> {
    // Valida se o período letivo existe e está ativo
    await this.validatePeriodoLetivo(createPropostaDto.idPeriodoLetivo)

    // Valida se o curso existe
    await this.validateCurso(createPropostaDto.idCurso)

    // Valida se o coordenador é responsável pelo curso
    await this.validateCoordenadorCurso(idCoordenador, createPropostaDto.idCurso)

    // Verifica se já existe uma proposta para este curso e período
    const propostaExistente = await this.prisma.propostaHorario.findFirst({
      where: {
        idCurso: createPropostaDto.idCurso,
        idPeriodoLetivo: createPropostaDto.idPeriodoLetivo,
        status: {
          in: [
            PropostaHorarioStatus.DRAFT,
            PropostaHorarioStatus.PENDENTE_APROVACAO,
          ],
        },
      },
    })

    if (propostaExistente) {
      throw new ConflictException(
        "Já existe uma proposta em elaboração ou pendente de aprovação para este curso e período letivo",
      )
    }

    const proposta = await this.prisma.propostaHorario.create({
      data: {
        idCurso: createPropostaDto.idCurso,
        idPeriodoLetivo: createPropostaDto.idPeriodoLetivo,
        idCoordenadorSubmissao: idCoordenador,
        observacoesCoordenador: createPropostaDto.observacoesCoordenador,
        status: PropostaHorarioStatus.DRAFT,
      },
      include: this.getIncludeRelacionamentos(),
    })

    return proposta
  }

  /**
   * Lista todas as propostas de horário
   * @param idUsuario ID do usuário que está fazendo a consulta
   * @param papelUsuario Papel do usuário
   * @returns Lista de propostas
   */
  async findAll(
    idUsuario: string,
    papelUsuario: PapelUsuario,
  ): Promise<PropostaHorarioComRelacionamentos[]> {
    let whereClause = {}

    // Coordenadores só veem suas próprias propostas
    if (papelUsuario === PapelUsuario.COORDENADOR) {
      whereClause = { idCoordenadorSubmissao: idUsuario }
    }
    // Diretores e Admins veem todas as propostas

    const propostas = await this.prisma.propostaHorario.findMany({
      where: whereClause,
      include: this.getIncludeRelacionamentos(),
      orderBy: [{ status: "asc" }, { dataAtualizacao: "desc" }],
    })

    return propostas
  }

  /**
   * Busca uma proposta específica pelo ID
   * @param id ID da proposta
   * @param idUsuario ID do usuário que está fazendo a consulta
   * @param papelUsuario Papel do usuário
   * @returns Proposta encontrada
   */
  async findOne(
    id: string,
    idUsuario: string,
    papelUsuario: PapelUsuario,
  ): Promise<PropostaHorarioComRelacionamentos> {
    const proposta = await this.prisma.propostaHorario.findUnique({
      where: { id },
      include: this.getIncludeRelacionamentos(),
    })

    if (!proposta) {
      throw new NotFoundException("Proposta de horário não encontrada")
    }

    // Coordenadores só podem ver suas próprias propostas
    if (
      papelUsuario === PapelUsuario.COORDENADOR &&
      proposta.idCoordenadorSubmissao !== idUsuario
    ) {
      throw new ForbiddenException(
        "Você não tem permissão para ver esta proposta",
      )
    }

    return proposta
  }

  /**
   * Atualiza uma proposta de horário (apenas no status DRAFT)
   * @param id ID da proposta
   * @param updatePropostaDto Dados para atualização
   * @param idCoordenador ID do coordenador
   * @returns Proposta atualizada
   */
  async update(
    id: string,
    updatePropostaDto: UpdatePropostaHorarioDto,
    idCoordenador: string,
  ): Promise<PropostaHorarioComRelacionamentos> {
    const proposta = await this.findOne(
      id,
      idCoordenador,
      PapelUsuario.COORDENADOR,
    )

    // Só permite atualização se estiver em DRAFT
    if (proposta.status !== PropostaHorarioStatus.DRAFT) {
      throw new BadRequestException(
        "Só é possível atualizar propostas que ainda estão em elaboração (DRAFT)",
      )
    }

    // Se está alterando curso ou período, faz as validações
    if (updatePropostaDto.idCurso) {
      await this.validateCurso(updatePropostaDto.idCurso)
      await this.validateCoordenadorCurso(
        idCoordenador,
        updatePropostaDto.idCurso,
      )
    }

    if (updatePropostaDto.idPeriodoLetivo) {
      await this.validatePeriodoLetivo(updatePropostaDto.idPeriodoLetivo)
    }

    const propostaAtualizada = await this.prisma.propostaHorario.update({
      where: { id },
      data: updatePropostaDto,
      include: this.getIncludeRelacionamentos(),
    })

    return propostaAtualizada
  }

  /**
   * Submete uma proposta para aprovação
   * @param id ID da proposta
   * @param submitDto Dados da submissão
   * @param idCoordenador ID do coordenador
   * @returns Proposta submetida
   */
  async submit(
    id: string,
    submitDto: SubmitPropostaHorarioDto,
    idCoordenador: string,
  ): Promise<PropostaHorarioComRelacionamentos> {
    const proposta = await this.findOne(
      id,
      idCoordenador,
      PapelUsuario.COORDENADOR,
    )

    // Só permite submissão se estiver em DRAFT
    if (proposta.status !== PropostaHorarioStatus.DRAFT) {
      throw new BadRequestException(
        "Só é possível submeter propostas que estão em elaboração (DRAFT)",
      )
    }

    // Verifica se a proposta tem alocações
    const quantidadeAlocacoes = await this.prisma.alocacaoHorario.count({
      where: { idPropostaHorario: id },
    })

    if (quantidadeAlocacoes === 0) {
      throw new BadRequestException(
        "Não é possível submeter uma proposta sem alocações de horário",
      )
    }

    const propostaSubmetida = await this.prisma.propostaHorario.update({
      where: { id },
      data: {
        status: PropostaHorarioStatus.PENDENTE_APROVACAO,
        dataSubmissao: new Date(),
        observacoesCoordenador:
          submitDto.observacoesCoordenador || proposta.observacoesCoordenador,
      },
      include: this.getIncludeRelacionamentos(),
    })

    return propostaSubmetida
  }

  /**
   * Aprova uma proposta de horário
   * @param id ID da proposta
   * @param approveDto Dados da aprovação
   * @returns Proposta aprovada
   */
  async approve(
    id: string,
    approveDto: ApprovePropostaDto,
  ): Promise<PropostaHorarioComRelacionamentos> {
    const proposta = await this.prisma.propostaHorario.findUnique({
      where: { id },
      include: this.getIncludeRelacionamentos(),
    })

    if (!proposta) {
      throw new NotFoundException("Proposta de horário não encontrada")
    }

    if (proposta.status !== PropostaHorarioStatus.PENDENTE_APROVACAO) {
      throw new BadRequestException(
        "Só é possível aprovar propostas que estão pendentes de aprovação",
      )
    }

    const propostaAprovada = await this.prisma.propostaHorario.update({
      where: { id },
      data: {
        status: PropostaHorarioStatus.APROVADA,
        dataAprovacaoRejeicao: new Date(),
        observacoesDiretor: approveDto.observacoesDiretor,
      },
      include: this.getIncludeRelacionamentos(),
    })

    return propostaAprovada
  }

  /**
   * Rejeita uma proposta de horário
   * @param id ID da proposta
   * @param rejectDto Dados da rejeição
   * @returns Proposta rejeitada
   */
  async reject(
    id: string,
    rejectDto: RejectPropostaDto,
  ): Promise<PropostaHorarioComRelacionamentos> {
    const proposta = await this.prisma.propostaHorario.findUnique({
      where: { id },
      include: this.getIncludeRelacionamentos(),
    })

    if (!proposta) {
      throw new NotFoundException("Proposta de horário não encontrada")
    }

    if (proposta.status !== PropostaHorarioStatus.PENDENTE_APROVACAO) {
      throw new BadRequestException(
        "Só é possível rejeitar propostas que estão pendentes de aprovação",
      )
    }

    const propostaRejeitada = await this.prisma.propostaHorario.update({
      where: { id },
      data: {
        status: PropostaHorarioStatus.REJEITADA,
        dataAprovacaoRejeicao: new Date(),
        justificativaRejeicao: rejectDto.justificativaRejeicao,
        observacoesDiretor: rejectDto.observacoesDiretor,
      },
      include: this.getIncludeRelacionamentos(),
    })

    return propostaRejeitada
  }

  /**
   * Remove uma proposta de horário (apenas em DRAFT)
   * @param id ID da proposta
   * @param idCoordenador ID do coordenador
   * @returns Proposta removida
   */
  async remove(
    id: string,
    idCoordenador: string,
  ): Promise<PropostaHorarioComRelacionamentos> {
    const proposta = await this.findOne(
      id,
      idCoordenador,
      PapelUsuario.COORDENADOR,
    )

    // Só permite remoção se estiver em DRAFT
    if (proposta.status !== PropostaHorarioStatus.DRAFT) {
      throw new BadRequestException(
        "Só é possível remover propostas que ainda estão em elaboração (DRAFT)",
      )
    }

    const propostaRemovida = await this.prisma.propostaHorario.delete({
      where: { id },
      include: this.getIncludeRelacionamentos(),
    })

    return propostaRemovida
  }

  /**
   * Retorna para DRAFT uma proposta rejeitada (permite nova submissão)
   * @param id ID da proposta
   * @param idCoordenador ID do coordenador
   * @returns Proposta reaberta para edição
   */
  async reopen(
    id: string,
    idCoordenador: string,
  ): Promise<PropostaHorarioComRelacionamentos> {
    const proposta = await this.findOne(
      id,
      idCoordenador,
      PapelUsuario.COORDENADOR,
    )

    if (proposta.status !== PropostaHorarioStatus.REJEITADA) {
      throw new BadRequestException(
        "Só é possível reabrir propostas que foram rejeitadas",
      )
    }

    const propostaReaberta = await this.prisma.propostaHorario.update({
      where: { id },
      data: {
        status: PropostaHorarioStatus.DRAFT,
        dataSubmissao: null,
        dataAprovacaoRejeicao: null,
        justificativaRejeicao: null,
        observacoesDiretor: null,
      },
      include: this.getIncludeRelacionamentos(),
    })

    return propostaReaberta
  }

  /**
   * Devolve uma proposta aprovada para edição (diretor para coordenador)
   * @param id ID da proposta
   * @param sendBackDto Dados da devolução
   * @returns Proposta devolvida para edição
   */
  async sendBackToEdit(
    id: string,
    sendBackDto: SendBackPropostaDto,
  ): Promise<PropostaHorarioComRelacionamentos> {
    const proposta = await this.prisma.propostaHorario.findUnique({
      where: { id },
      include: this.getIncludeRelacionamentos(),
    })

    if (!proposta) {
      throw new NotFoundException("Proposta de horário não encontrada")
    }

    if (proposta.status !== PropostaHorarioStatus.APROVADA) {
      throw new BadRequestException(
        "Só é possível devolver propostas que estão aprovadas",
      )
    }

    const propostaDevolvida = await this.prisma.propostaHorario.update({
      where: { id },
      data: {
        status: PropostaHorarioStatus.DRAFT,
        dataSubmissao: null,
        dataAprovacaoRejeicao: null,
        observacoesDiretor: sendBackDto.motivoDevolucao,
      },
      include: this.getIncludeRelacionamentos(),
    })

    return propostaDevolvida
  }

  /**
   * Valida se o período letivo existe e está ativo
   */
  private async validatePeriodoLetivo(idPeriodoLetivo: string): Promise<void> {
    const periodo = await this.prisma.periodoLetivo.findUnique({
      where: { id: idPeriodoLetivo },
    })

    if (!periodo) {
      throw new NotFoundException("Período letivo não encontrado")
    }

    if (periodo.status !== StatusPeriodoLetivo.ATIVO) {
      throw new BadRequestException(
        "Só é possível criar propostas para períodos letivos ativos",
      )
    }
  }

  /**
   * Valida se o curso existe
   */
  private async validateCurso(idCurso: string): Promise<void> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: idCurso },
    })

    if (!curso) {
      throw new NotFoundException("Curso não encontrado")
    }
  }

  /**
   * Valida se o coordenador é responsável pelo curso
   */
  private async validateCoordenadorCurso(
    idCoordenador: string,
    idCurso: string,
  ): Promise<void> {
    const curso = await this.prisma.curso.findFirst({
      where: {
        id: idCurso,
        idCoordenador: idCoordenador,
      },
    })

    if (!curso) {
      throw new ForbiddenException(
        "Você não tem permissão para criar propostas para este curso",
      )
    }
  }

  /**
   * Define os relacionamentos a serem incluídos nas consultas
   */
  private getIncludeRelacionamentos() {
    return {
      curso: {
        select: {
          id: true,
          nome: true,
          codigo: true,
        },
      },
      periodoLetivo: {
        select: {
          id: true,
          ano: true,
          semestre: true,
          dataInicio: true,
          dataFim: true,
        },
      },
      coordenadorQueSubmeteu: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
      alocacoesPropostas: true,
    }
  }
}
