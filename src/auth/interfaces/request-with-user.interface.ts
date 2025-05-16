import { Request } from "express"
import { PapelUsuario } from "@prisma/client"

/**
 * Interface que estende a interface Request do Express
 * para incluir o usuário autenticado
 */
export interface RequestWithUser extends Request {
  user: {
    id: string
    email: string
    papel: PapelUsuario
    [key: string]: any // Para outras propriedades que possam existir
  }
}
