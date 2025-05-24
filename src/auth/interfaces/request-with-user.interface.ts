import { Request } from "express"
import { JwtPayload } from "../jwt.strategy"

/**
 * Interface que estende a interface Request do Express
 * para incluir o usuário autenticado
 */
export interface RequestWithUser extends Request {
  user: Omit<JwtPayload, "sub"> & { id: string }
}
