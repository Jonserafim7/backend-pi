import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
  // ForbiddenException, // Comentado pois não está sendo usado no momento
} from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { PrismaService } from "../core/prisma/prisma.service"
import { SignInDto, AuthResponseDto } from "./dto"
import * as bcrypt from "bcrypt"
import { CreateUsuarioDto, UsuarioResponseDto } from "../usuarios/dto"
import { JwtPayload } from "./jwt.strategy"

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly saltRounds = 10

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Autentica um usuário com e-mail e senha
   * @param signInDto Dados de login (e-mail e senha)
   * @returns Objeto com token de acesso e dados do usuário
   */
  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    const { email, senha } = signInDto
    this.logger.log(`Tentativa de login para o e-mail: ${email}`)

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    })

    if (!usuario) {
      this.logger.warn(`Usuário não encontrado para o e-mail: ${email}`)
      throw new UnauthorizedException("Credenciais inválidas.")
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.hashSenha)

    if (!senhaCorreta) {
      this.logger.warn(
        `Tentativa de login com senha incorreta para o e-mail: ${email}`,
      )
      throw new UnauthorizedException("Credenciais inválidas.")
    }

    // Verificamos se o usuário está ativo apenas se tivermos esse campo no modelo
    // Por padrão, consideramos todos os usuários como ativos
    // Se implementarmos o campo 'ativo' no futuro, podemos descomentar esta verificação
    /*
    if (usuario.papel === "ADMIN" && usuario.ativo === false) {
      this.logger.warn(`Usuário inativo para o e-mail: ${email}`)
      throw new ForbiddenException("Usuário inativo.")
    }
    */

    this.logger.log(`Login bem-sucedido para o e-mail: ${email}`)

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
    }

    const accessToken = this.jwtService.sign(payload)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashSenha, ...dadosUsuario } = usuario

    return {
      accessToken,
      usuario: dadosUsuario as UsuarioResponseDto,
    }
  }

  /**
   * Cadastra um novo usuário no sistema
   * @param createUsuarioDto Dados do usuário a ser cadastrado
   * @returns Dados do usuário cadastrado sem a senha
   */
  async cadastrarUsuario(
    createUsuarioDto: CreateUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    const { email, nome, senha, papel } = createUsuarioDto
    this.logger.log(`Tentativa de cadastro para o e-mail: ${email}`)

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email },
    })

    if (usuarioExistente) {
      this.logger.warn(`E-mail já cadastrado: ${email}`)
      throw new ConflictException("Este e-mail já está em uso.")
    }

    const hashSenha = await bcrypt.hash(senha, this.saltRounds)

    const novoUsuario = await this.prisma.usuario.create({
      data: {
        email,
        nome,
        hashSenha,
        papel,
      },
    })

    this.logger.log(
      `Usuário cadastrado com sucesso: ${email} (ID: ${novoUsuario.id})`,
    )

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashSenha: _, ...dadosRetorno } = novoUsuario
    return dadosRetorno as UsuarioResponseDto
  }
}
