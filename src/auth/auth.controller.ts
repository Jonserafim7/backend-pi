import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common"
import { AuthService } from "./auth.service"
import { SignInDto, AuthResponseDto } from "./dto"
import { CreateUsuarioDto, UsuarioResponseDto } from "../usuarios/dto"
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger"
import { Public } from "./decorators/public.decorator"

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Autentica um usuário e retorna um token JWT",
    description: "Realiza o login do usuário com e-mail e senha.",
  })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      "Login bem-sucedido. Retorna o token de acesso e dados do usuário.",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Credenciais inválidas.",
  })
  /**
   * Autentica um usuário e retorna um token JWT
   * @param signInDto Dados de login (e-mail e senha)
   * @returns Objeto com token de acesso e dados do usuário
   */
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
    this.logger.log(`Requisição de login recebida para: ${signInDto.email}`)
    const response = await this.authService.signIn(signInDto)
    return response
  }

  @Public()
  @Post("registrar")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Registra um novo usuário no sistema",
    description:
      "Cria uma nova conta de usuário. O usuário criado não é logado automaticamente.",
  })
  @ApiBody({ type: CreateUsuarioDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      "Usuário registrado com sucesso. Retorna os dados do usuário criado.",
    type: UsuarioResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "E-mail já cadastrado.",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos fornecidos para o cadastro.",
  })
  /**
   * Registra um novo usuário no sistema
   * @param createUsuarioDto Dados do usuário a ser cadastrado
   * @returns Dados do usuário cadastrado sem a senha
   */
  async signUp(
    @Body() createUsuarioDto: CreateUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    this.logger.log(
      `Requisição de registro recebida para: ${createUsuarioDto.email}`,
    )
    const usuario = await this.authService.cadastrarUsuario(createUsuarioDto)
    return usuario
  }
}
