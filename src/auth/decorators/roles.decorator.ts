import { SetMetadata } from "@nestjs/common"
import { PapelUsuario } from "@prisma/client"

/**
 * Chave para armazenar os metadados de papéis
 */
export const ROLES_KEY = "roles"

/**
 * Decorator para definir os papéis de usuário que têm permissão para acessar um recurso
 *
 * @param roles - Array de papéis de usuário que têm permissão para acessar o recurso
 * @returns Metadata para ser usada pelo RolesGuard
 *
 * @example
 * ```typescript
 * @Roles(PapelUsuario.DIRETOR)
 * @Get('cursos')
 * getCursos() {
 *   // Somente diretores podem acessar esta rota
 * }
 * ```
 */
export const Roles = (...roles: PapelUsuario[]) => SetMetadata(ROLES_KEY, roles)
