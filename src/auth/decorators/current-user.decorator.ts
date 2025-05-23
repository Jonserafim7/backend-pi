import { createParamDecorator, ExecutionContext } from "@nestjs/common"

/**
 * Decorator para extrair os dados do usuário autenticado da request
 * Deve ser usado junto com JwtAuthGuard
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
