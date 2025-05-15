import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "../core/prisma/prisma.service"
import { PapelUsuario } from "@prisma/client"

// Definir um tipo para o payload do JWT para melhor tipagem
export interface JwtPayload {
  sub: string // ID do usuário
  email: string
  papel: PapelUsuario // Ou um enum PapelUsuario se preferir consistência total
  // Adicione outros campos que você incluir no payload do JWT ao gerá-lo
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>("JWT_SECRET")
    if (!jwtSecret) {
      // Isso deve idealmente ser pego na inicialização do módulo/aplicação
      throw new InternalServerErrorException("Segredo JWT não configurado.")
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    })
  }

  async validate(
    payload: JwtPayload,
  ): Promise<Omit<JwtPayload, "sub"> & { id: string }> {
    // O Passport primeiro verifica a assinatura do JWT e a expiração.
    // Se estiver tudo ok, este método validate é chamado com o payload decodificado.
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    })

    if (!usuario) {
      throw new UnauthorizedException("Token inválido ou usuário não encontrado.")
    }

    // O objeto retornado aqui será injetado no objeto Request como `req.user`
    // Você pode optar por retornar o objeto `usuario` completo ou uma versão simplificada.
    // Por segurança e para evitar expor dados desnecessários, é bom ser seletivo.
    // No entanto, para simplificar, vamos retornar os campos do payload que já são seguros.
    return { id: payload.sub, email: payload.email, papel: payload.papel }
  }
}
