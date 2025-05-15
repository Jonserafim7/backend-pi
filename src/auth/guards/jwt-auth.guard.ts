import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { AuthGuard } from "@nestjs/passport"
import { Observable } from "rxjs"
import { IS_PUBLIC_KEY } from "../decorators/public.decorator" // Corrigido o caminho

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    // Adiciona log para depuração, caso necessário
    // console.log('JwtAuthGuard: Checking token...');

    return super.canActivate(context)
  }

  // Opcional: Customizar o tratamento da resposta de erro
  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      // console.error('JwtAuthGuard Error:', info?.message || err?.message);
      throw err || new UnauthorizedException("Token JWT inválido ou expirado.")
    }
    return user
  }
}
