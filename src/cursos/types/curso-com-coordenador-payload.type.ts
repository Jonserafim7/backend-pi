import { Prisma } from "@prisma/client"

export type CursoComCoordenadorPayload = Prisma.CursoGetPayload<{
  include: {
    coordenadorPrincipal: {
      select: {
        id: true
        nome: true
        email: true
      }
    }
  }
}>
