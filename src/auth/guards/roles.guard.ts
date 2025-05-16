import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { PapelUsuario } from "@prisma/client"
import { ROLES_KEY } from "../decorators/roles.decorator"
import { RequestWithUser } from "../interfaces/request-with-user.interface"

/**
 * Guard para verificar se o usuário possui o papel necessário para acessar um recurso
 *
 * Funciona em conjunto com o decorator @Roles() para proteger rotas com base nos papéis de usuário
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name)

  constructor(private reflector: Reflector) {}

  /**
   * Verifica se o usuário tem permissão para acessar o recurso
   *
   * @param context - Contexto de execução da requisição
   * @returns true se o usuário tem permissão, false caso contrário
   */
  canActivate(context: ExecutionContext): boolean {
    // Obtém os papéis necessários do metadata (via decorator @Roles)
    const requiredRoles = this.reflector.getAllAndOverride<PapelUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )

    // Se não há papéis requeridos, permite o acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    // Obtém o usuário da requisição (do JWT payload)
    const { user } = context.switchToHttp().getRequest<RequestWithUser>()

    // Se não há usuário ou não há papel, rejeita o acesso
    if (!user || !user.papel) {
      this.logger.warn(
        "Acesso negado: usuário não autenticado ou sem papel definido",
      )
      throw new ForbiddenException(
        "Você não tem permissão para acessar este recurso",
      )
    }

    // Verifica se o usuário tem um dos papéis requeridos
    const hasRole = requiredRoles.some((papel) => user.papel === papel)

    if (!hasRole) {
      this.logger.warn(
        `Acesso negado: usuário com papel ${user.papel} tentou acessar recurso restrito a ${requiredRoles.join(", ")}`,
      )
      throw new ForbiddenException(
        "Você não tem permissão para acessar este recurso",
      )
    }

    return true
  }
}
