import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  NotFoundException,
  Req,
  Logger,
  HttpStatus,
} from "@nestjs/common"
import { ConfiguracoesHorarioService } from "./configuracoes-horario.service"
import { UpsertConfiguracaoHorarioDto } from "./dto/upsert-configuracao-horario.dto"
import { ConfiguracaoHorarioDto } from "./dto/configuracao-horario.dto"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { PapelUsuario } from "@prisma/client"
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface"

/**
 * Controller responsável pelos endpoints de configurações de horário.
 * Acesso restrito a Diretores.
 */
@ApiTags("Configurações de Horário")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("configuracoes-horario")
export class ConfiguracoesHorarioController {
  private readonly logger = new Logger(ConfiguracoesHorarioController.name)

  constructor(
    private readonly configuracoesHorarioService: ConfiguracoesHorarioService,
  ) {}

  /**
   * Obtém a configuração de horário global.
   * Apenas Diretores podem acessar este endpoint.
   * @param req Objeto da requisição, usado para logging.
   * @returns A configuração de horário global.
   * @throws NotFoundException se nenhuma configuração for encontrada.
   * @throws ForbiddenException se o usuário não for Diretor.
   */
  @Get()
  @Roles(PapelUsuario.DIRETOR)
  @ApiOperation({ summary: "Obtém a configuração de horário global" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Configuração de horário retornada com sucesso.",
    type: ConfiguracaoHorarioDto,
  })
  async get(@Req() req: RequestWithUser): Promise<ConfiguracaoHorarioDto> {
    const usuarioLogado = req.user
    this.logger.log(
      `Usuário ${usuarioLogado.email} (Papel: ${usuarioLogado.papel}) solicitou GET /configuracoes-horario`,
    )

    try {
      const config = await this.configuracoesHorarioService.get()
      if (!config) {
        this.logger.warn(
          `Nenhuma configuração de horário encontrada para solicitação de ${usuarioLogado.email}`,
        )
        throw new NotFoundException("Nenhuma configuração de horário encontrada.")
      }
      this.logger.log(
        `Configuração de horário retornada com sucesso para ${usuarioLogado.email}: ${JSON.stringify(config)}`,
      )
      return config
    } catch (error) {
      this.logger.error(
        `Erro ao processar GET /configuracoes-horario para ${usuarioLogado.email}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      )
      if (error instanceof NotFoundException) throw error
      // Outras exceções serão tratadas pelo filtro global ou se tornarão 500
      throw error
    }
  }

  /**
   * Cria ou atualiza a configuração de horário global.
   * Apenas Diretores podem acessar este endpoint.
   * @param req Objeto da requisição, usado para logging.
   * @param dto Dados para criar/atualizar a configuração.
   * @returns A configuração de horário salva.
   * @throws ForbiddenException se o usuário não for Diretor.
   * @throws BadRequestException se os dados forem inválidos.
   */
  @Put()
  @Roles(PapelUsuario.DIRETOR)
  @ApiOperation({ summary: "Cria ou atualiza a configuração de horário global" })
  @ApiBody({ type: UpsertConfiguracaoHorarioDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Configuração de horário salva com sucesso.",
    type: ConfiguracaoHorarioDto,
  })
  async upsert(
    @Req() req: RequestWithUser,
    @Body() dto: UpsertConfiguracaoHorarioDto,
  ): Promise<ConfiguracaoHorarioDto> {
    const usuarioLogado = req.user
    this.logger.log(
      `Usuário ${usuarioLogado.email} (Papel: ${usuarioLogado.papel}) solicitou PUT /configuracoes-horario com DTO: ${JSON.stringify(dto)}`,
    )

    try {
      const result = await this.configuracoesHorarioService.upsert(dto)
      this.logger.log(
        `Configuração de horário salva com sucesso para ${usuarioLogado.email}: ${JSON.stringify(result)}`,
      )
      return result
    } catch (error) {
      this.logger.error(
        `Erro ao processar PUT /configuracoes-horario para ${usuarioLogado.email} com DTO: ${JSON.stringify(dto)}. Erro: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      )
      // Se o erro for de validação (BadRequestException) do service, ele será re-lançado.
      // Outras exceções do service ou do Prisma podem ser encapsuladas ou re-lançadas.
      throw error
    }
  }
}
