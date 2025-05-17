import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common"
import { PrismaService } from "../core/prisma/prisma.service"
import { CreateCursoDto } from "./dto/create-curso.dto"
import { UpdateCursoDto } from "./dto/update-curso.dto"
import { CursoResponseDto } from "./dto/curso-response.dto"
import { Curso, PapelUsuario, Usuario } from "@prisma/client"

// Tipo estendido para incluir relacionamentos
type CursoWithCoordenador = Curso & {
  coordenadorPrincipal?: Usuario | null
}

@Injectable()
export class CursosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo curso
   * @param createCursoDto Dados para criação do curso
   * @returns Curso criado
   */
  async create(createCursoDto: CreateCursoDto): Promise<CursoResponseDto> {
    // Verifica se já existe um curso com o mesmo código
    const cursoExistente = await this.prisma.curso.findUnique({
      where: { codigo: createCursoDto.codigo },
    })

    if (cursoExistente) {
      throw new ConflictException("Já existe um curso com este código")
    }

    // Valida o coordenador, se informado
    if (createCursoDto.idCoordenador) {
      await this.validateCoordinator(createCursoDto.idCoordenador)
    }

    // No modelo Prisma, o campo idCoordenador é obrigatório
    // Se não temos um coordenador válido, não podemos criar o curso
    if (!createCursoDto.idCoordenador) {
      throw new BadRequestException(
        "O campo idCoordenador é obrigatório para a criação de um curso",
      )
    }

    // Cria o curso com o id do coordenador (abordagem imperativa, mais simples)
    const curso = await this.prisma.curso.create({
      data: {
        nome: createCursoDto.nome,
        codigo: createCursoDto.codigo,
        idCoordenador: createCursoDto.idCoordenador,
      },
    })

    // Retorna o curso criado (sem o coordenador associado)
    return this.mapToResponseDto(curso)
  }

  /**
   * Lista todos os cursos
   * @param includeCoordinator Se deve incluir os dados do coordenador
   * @returns Lista de cursos
   */
  async findAll(
    includeCoordinator: boolean = false,
  ): Promise<CursoResponseDto[]> {
    const cursos = await this.prisma.curso.findMany({
      include: {
        coordenadorPrincipal: includeCoordinator,
      },
    })

    return cursos.map((curso) => this.mapToResponseDto(curso, includeCoordinator))
  }

  /**
   * Busca um curso pelo ID
   * @param id ID do curso
   * @param includeCoordinator Se deve incluir os dados do coordenador
   * @returns Curso encontrado
   */
  async findOne(
    id: string,
    includeCoordinator: boolean = true,
  ): Promise<CursoResponseDto> {
    const curso = await this.prisma.curso.findUnique({
      where: { id },
      include: {
        coordenadorPrincipal: includeCoordinator,
      },
    })

    if (!curso) {
      throw new NotFoundException("Curso não encontrado")
    }

    return this.mapToResponseDto(curso, includeCoordinator)
  }

  /**
   * Atualiza um curso existente
   * @param id ID do curso
   * @param updateCursoDto Dados para atualização
   * @returns Curso atualizado
   */
  async update(
    id: string,
    updateCursoDto: UpdateCursoDto,
  ): Promise<CursoResponseDto> {
    // Verifica se o curso existe
    await this.findOne(id, false)

    // Verifica conflito de código, se houver alteração no código
    if (updateCursoDto.codigo) {
      const cursoCodigo = await this.prisma.curso.findFirst({
        where: {
          codigo: updateCursoDto.codigo,
          id: { not: id },
        },
      })

      if (cursoCodigo) {
        throw new ConflictException("Já existe outro curso com este código")
      }
    }

    // Valida o coordenador, se informado
    if (updateCursoDto.idCoordenador) {
      await this.validateCoordinator(updateCursoDto.idCoordenador)
    }

    // Atualiza o curso
    const curso = await this.prisma.curso.update({
      where: { id },
      data: updateCursoDto,
    })

    return this.mapToResponseDto(curso)
  }

  /**
   * Remove um curso existente
   * @param id ID do curso
   * @returns Curso removido
   */
  async remove(id: string): Promise<CursoResponseDto> {
    // Verifica se o curso existe
    await this.findOne(id, false)

    // Remove o curso
    const curso = await this.prisma.curso.delete({
      where: { id },
    })

    return this.mapToResponseDto(curso)
  }

  /**
   * Valida se o usuário informado é um coordenador válido
   * @param idCoordenador ID do coordenador
   */
  private async validateCoordinator(idCoordenador: string): Promise<void> {
    const coordenador = await this.prisma.usuario.findUnique({
      where: { id: idCoordenador },
    })

    if (!coordenador) {
      throw new NotFoundException("Coordenador não encontrado")
    }

    if (coordenador.papel !== PapelUsuario.COORDENADOR) {
      throw new BadRequestException("O usuário informado não é um coordenador")
    }
  }

  /**
   * Converte um objeto Curso do Prisma para o DTO de resposta
   * @param curso Objeto Curso do Prisma com possível relação de coordenador
   * @param includeCoordinator Se deve incluir os dados do coordenador
   * @returns DTO de resposta
   */
  private mapToResponseDto(
    curso: CursoWithCoordenador,
    includeCoordinator: boolean = true,
  ): CursoResponseDto {
    const responseDto = new CursoResponseDto()
    responseDto.id = curso.id
    responseDto.nome = curso.nome
    responseDto.codigo = curso.codigo ?? "" // Usar string vazia como fallback para valores nulos
    responseDto.dataCriacao = curso.dataCriacao
    responseDto.dataAtualizacao = curso.dataAtualizacao

    // Adiciona os dados do coordenador, se solicitado e disponível
    if (includeCoordinator && curso.coordenadorPrincipal) {
      responseDto.coordenador = {
        id: curso.coordenadorPrincipal.id,
        nome: curso.coordenadorPrincipal.nome,
        email: curso.coordenadorPrincipal.email,
      }
    }

    return responseDto
  }
}
