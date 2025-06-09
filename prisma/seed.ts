import {
  PrismaClient,
  PapelUsuario,
  DiaSemana,
  StatusDisponibilidade,
  PropostaHorarioStatus,
  StatusPeriodoLetivo,
} from "@prisma/client"
import * as bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

async function main() {
  console.log("🌱 Iniciando seed da base de dados...")

  // Limpar todos os dados existentes (opcional - remover em produção)
  await prisma.$transaction([
    prisma.alocacaoHorario.deleteMany(),
    prisma.turma.deleteMany(),
    prisma.disciplinaOfertada.deleteMany(),
    prisma.disponibilidadeProfessor.deleteMany(),
    prisma.matrizDisciplina.deleteMany(),
    prisma.disciplina.deleteMany(),
    prisma.matrizCurricular.deleteMany(),
    prisma.propostaHorario.deleteMany(),
    prisma.curso.deleteMany(),
    prisma.configuracaoHorario.deleteMany(),
    prisma.periodoLetivo.deleteMany(),
    prisma.usuario.deleteMany(),
  ])

  // 1. Criar usuários
  const hashSenhaAdmin = await hashPassword("admin123")

  // Criar administrador
  await prisma.usuario.create({
    data: {
      nome: "Admin Sistema",
      email: "admin@escola.edu",
      hashSenha: hashSenhaAdmin,
      papel: PapelUsuario.ADMIN,
    },
  })

  console.log(
    "✅ Usuário Admin criado (email: admin@escola.edu, senha: admin123)",
  )
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
