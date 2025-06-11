import {
  PrismaClient,
  PapelUsuario,
  StatusPeriodoLetivo,
  Turma,
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

  console.log("🗑️ Dados existentes removidos")

  // 1. Criar usuários
  const hashSenhaComum = await hashPassword("12345678")

  // Criar administrador
  const admin = await prisma.usuario.create({
    data: {
      nome: "Admin Sistema",
      email: "admin@escola.edu",
      hashSenha: hashSenhaComum,
      papel: PapelUsuario.ADMIN,
    },
  })

  // Criar diretor
  const diretor = await prisma.usuario.create({
    data: {
      nome: "Dr. Carlos Silva",
      email: "diretor@escola.edu",
      hashSenha: hashSenhaComum,
      papel: PapelUsuario.DIRETOR,
    },
  })

  // Criar coordenadores
  const coordenadorADS = await prisma.usuario.create({
    data: {
      nome: "Prof. Ana Santos",
      email: "coord.ads@escola.edu",
      hashSenha: hashSenhaComum,
      papel: PapelUsuario.COORDENADOR,
    },
  })

  const coordenadorSI = await prisma.usuario.create({
    data: {
      nome: "Prof. Roberto Lima",
      email: "coord.si@escola.edu",
      hashSenha: hashSenhaComum,
      papel: PapelUsuario.COORDENADOR,
    },
  })

  // Criar professores
  const professores = await Promise.all([
    prisma.usuario.create({
      data: {
        nome: "Prof. Maria Oliveira",
        email: "maria.oliveira@escola.edu",
        hashSenha: hashSenhaComum,
        papel: PapelUsuario.PROFESSOR,
      },
    }),
    prisma.usuario.create({
      data: {
        nome: "Prof. João Santos",
        email: "joao.santos@escola.edu",
        hashSenha: hashSenhaComum,
        papel: PapelUsuario.PROFESSOR,
      },
    }),
    prisma.usuario.create({
      data: {
        nome: "Prof. Patricia Costa",
        email: "patricia.costa@escola.edu",
        hashSenha: hashSenhaComum,
        papel: PapelUsuario.PROFESSOR,
      },
    }),
    prisma.usuario.create({
      data: {
        nome: "Prof. Fernando Alves",
        email: "fernando.alves@escola.edu",
        hashSenha: hashSenhaComum,
        papel: PapelUsuario.PROFESSOR,
      },
    }),
    prisma.usuario.create({
      data: {
        nome: "Prof. Luciana Pereira",
        email: "luciana.pereira@escola.edu",
        hashSenha: hashSenhaComum,
        papel: PapelUsuario.PROFESSOR,
      },
    }),
    prisma.usuario.create({
      data: {
        nome: "Prof. Marcos Rodrigues",
        email: "marcos.rodrigues@escola.edu",
        hashSenha: hashSenhaComum,
        papel: PapelUsuario.PROFESSOR,
      },
    }),
  ])

  console.log("✅ Usuários criados")

  // 2. Criar configuração de horário
  await prisma.configuracaoHorario.create({
    data: {
      duracaoAulaMinutos: 50,
      inicioTurnoManha: "07:00",
      inicioTurnoTarde: "13:00",
      inicioTurnoNoite: "18:30",
      numeroAulasPorTurno: 6,
    },
  })

  console.log("✅ Configuração de horário criada")

  // 3. Criar cursos
  const cursoADS = await prisma.curso.create({
    data: {
      nome: "Análise e Desenvolvimento de Sistemas",
      codigo: "ADS",
      idCoordenador: coordenadorADS.id,
    },
  })

  const cursoSI = await prisma.curso.create({
    data: {
      nome: "Sistemas de Informação",
      codigo: "SI",
      idCoordenador: coordenadorSI.id,
    },
  })

  console.log("✅ Cursos criados")

  // 4. Criar período letivo
  const periodoAtual = await prisma.periodoLetivo.create({
    data: {
      ano: 2025,
      semestre: 1,
      dataInicio: new Date("2025-02-01"),
      dataFim: new Date("2025-06-30"),
      status: StatusPeriodoLetivo.ATIVO,
    },
  })

  const proximoPeriodo = await prisma.periodoLetivo.create({
    data: {
      ano: 2025,
      semestre: 2,
      dataInicio: new Date("2025-08-01"),
      dataFim: new Date("2025-12-15"),
      status: StatusPeriodoLetivo.INATIVO,
    },
  })

  console.log("✅ Períodos letivos criados")

  // 5. Criar disciplinas
  const disciplinas = await Promise.all([
    // Disciplinas para ADS
    prisma.disciplina.create({
      data: {
        nome: "Programação Orientada a Objetos",
        codigo: "POO",
        cargaHoraria: 80,
      },
    }),
    prisma.disciplina.create({
      data: {
        nome: "Banco de Dados",
        codigo: "BD",
        cargaHoraria: 80,
      },
    }),
    prisma.disciplina.create({
      data: {
        nome: "Engenharia de Software",
        codigo: "ES",
        cargaHoraria: 60,
      },
    }),
    prisma.disciplina.create({
      data: {
        nome: "Estrutura de Dados",
        codigo: "ED",
        cargaHoraria: 80,
      },
    }),
    prisma.disciplina.create({
      data: {
        nome: "Desenvolvimento Web",
        codigo: "DW",
        cargaHoraria: 80,
      },
    }),
    prisma.disciplina.create({
      data: {
        nome: "Análise e Projeto de Sistemas",
        codigo: "APS",
        cargaHoraria: 60,
      },
    }),
    // Disciplinas para SI
    prisma.disciplina.create({
      data: {
        nome: "Gestão de Projetos de TI",
        codigo: "GP",
        cargaHoraria: 60,
      },
    }),
    prisma.disciplina.create({
      data: {
        nome: "Sistemas Distribuídos",
        codigo: "SD",
        cargaHoraria: 80,
      },
    }),
    prisma.disciplina.create({
      data: {
        nome: "Segurança da Informação",
        codigo: "SEG",
        cargaHoraria: 60,
      },
    }),
    prisma.disciplina.create({
      data: {
        nome: "Inteligência Artificial",
        codigo: "IA",
        cargaHoraria: 80,
      },
    }),
  ])

  console.log("✅ Disciplinas criadas")

  // 6. Criar matrizes curriculares
  const matrizADS2025 = await prisma.matrizCurricular.create({
    data: {
      nome: "Matriz ADS 2025.1",
      idCurso: cursoADS.id,
    },
  })

  const matrizSI2025 = await prisma.matrizCurricular.create({
    data: {
      nome: "Matriz SI 2025.1",
      idCurso: cursoSI.id,
    },
  })

  console.log("✅ Matrizes curriculares criadas")

  // 7. Vincular disciplinas às matrizes curriculares
  // Disciplinas para ADS (primeiras 6 disciplinas)
  await Promise.all([
    prisma.matrizDisciplina.create({
      data: {
        idMatrizCurricular: matrizADS2025.id,
        idDisciplina: disciplinas[0].id, // POO
        numeroPeriodo: 2,
      },
    }),
    prisma.matrizDisciplina.create({
      data: {
        idMatrizCurricular: matrizADS2025.id,
        idDisciplina: disciplinas[1].id, // BD
        numeroPeriodo: 3,
      },
    }),
    prisma.matrizDisciplina.create({
      data: {
        idMatrizCurricular: matrizADS2025.id,
        idDisciplina: disciplinas[2].id, // ES
        numeroPeriodo: 4,
      },
    }),
    prisma.matrizDisciplina.create({
      data: {
        idMatrizCurricular: matrizADS2025.id,
        idDisciplina: disciplinas[3].id, // ED
        numeroPeriodo: 2,
      },
    }),
    prisma.matrizDisciplina.create({
      data: {
        idMatrizCurricular: matrizADS2025.id,
        idDisciplina: disciplinas[4].id, // DW
        numeroPeriodo: 3,
      },
    }),
    prisma.matrizDisciplina.create({
      data: {
        idMatrizCurricular: matrizADS2025.id,
        idDisciplina: disciplinas[5].id, // APS
        numeroPeriodo: 4,
      },
    }),
  ])

  // Disciplinas para SI (últimas 4 disciplinas + algumas compartilhadas)
  await Promise.all([
    prisma.matrizDisciplina.create({
      data: {
        idMatrizCurricular: matrizSI2025.id,
        idDisciplina: disciplinas[1].id, // BD (compartilhada)
        numeroPeriodo: 2,
      },
    }),
    prisma.matrizDisciplina.create({
      data: {
        idMatrizCurricular: matrizSI2025.id,
        idDisciplina: disciplinas[6].id, // GP
        numeroPeriodo: 3,
      },
    }),
    prisma.matrizDisciplina.create({
      data: {
        idMatrizCurricular: matrizSI2025.id,
        idDisciplina: disciplinas[7].id, // SD
        numeroPeriodo: 4,
      },
    }),
    prisma.matrizDisciplina.create({
      data: {
        idMatrizCurricular: matrizSI2025.id,
        idDisciplina: disciplinas[8].id, // SEG
        numeroPeriodo: 4,
      },
    }),
    prisma.matrizDisciplina.create({
      data: {
        idMatrizCurricular: matrizSI2025.id,
        idDisciplina: disciplinas[9].id, // IA
        numeroPeriodo: 5,
      },
    }),
  ])

  console.log("✅ Disciplinas vinculadas às matrizes")

  // 8. Criar disciplinas ofertadas
  const disciplinasOfertadas = await Promise.all([
    // Ofertas para ADS
    prisma.disciplinaOfertada.create({
      data: {
        idDisciplina: disciplinas[0].id, // POO
        idPeriodoLetivo: periodoAtual.id,
        quantidadeTurmas: 2,
        idCoordenador: coordenadorADS.id,
      },
    }),
    prisma.disciplinaOfertada.create({
      data: {
        idDisciplina: disciplinas[1].id, // BD
        idPeriodoLetivo: periodoAtual.id,
        quantidadeTurmas: 3,
        idCoordenador: coordenadorADS.id,
      },
    }),
    prisma.disciplinaOfertada.create({
      data: {
        idDisciplina: disciplinas[4].id, // DW
        idPeriodoLetivo: periodoAtual.id,
        quantidadeTurmas: 2,
        idCoordenador: coordenadorADS.id,
      },
    }),
    // Ofertas para SI
    prisma.disciplinaOfertada.create({
      data: {
        idDisciplina: disciplinas[6].id, // GP
        idPeriodoLetivo: periodoAtual.id,
        quantidadeTurmas: 1,
        idCoordenador: coordenadorSI.id,
      },
    }),
    prisma.disciplinaOfertada.create({
      data: {
        idDisciplina: disciplinas[8].id, // SEG
        idPeriodoLetivo: periodoAtual.id,
        quantidadeTurmas: 2,
        idCoordenador: coordenadorSI.id,
      },
    }),
  ])

  console.log("✅ Disciplinas ofertadas criadas")

  // 9. Criar turmas
  const turmas: Turma[] = []

  // Turmas para POO (ADS)
  turmas.push(
    await prisma.turma.create({
      data: {
        idDisciplinaOfertada: disciplinasOfertadas[0].id,
        codigoDaTurma: "POO-A",
        idUsuarioProfessor: professores[0].id,
      },
    }),
    await prisma.turma.create({
      data: {
        idDisciplinaOfertada: disciplinasOfertadas[0].id,
        codigoDaTurma: "POO-B",
        idUsuarioProfessor: professores[1].id,
      },
    }),
  )

  // Turmas para BD (ADS)
  turmas.push(
    await prisma.turma.create({
      data: {
        idDisciplinaOfertada: disciplinasOfertadas[1].id,
        codigoDaTurma: "BD-A",
        idUsuarioProfessor: professores[2].id,
      },
    }),
    await prisma.turma.create({
      data: {
        idDisciplinaOfertada: disciplinasOfertadas[1].id,
        codigoDaTurma: "BD-B",
        idUsuarioProfessor: professores[3].id,
      },
    }),
    await prisma.turma.create({
      data: {
        idDisciplinaOfertada: disciplinasOfertadas[1].id,
        codigoDaTurma: "BD-C",
        idUsuarioProfessor: professores[4].id,
      },
    }),
  )

  // Turmas para DW (ADS)
  turmas.push(
    await prisma.turma.create({
      data: {
        idDisciplinaOfertada: disciplinasOfertadas[2].id,
        codigoDaTurma: "DW-A",
        idUsuarioProfessor: professores[5].id,
      },
    }),
    await prisma.turma.create({
      data: {
        idDisciplinaOfertada: disciplinasOfertadas[2].id,
        codigoDaTurma: "DW-B",
        idUsuarioProfessor: professores[0].id,
      },
    }),
  )

  // Turmas para GP (SI)
  turmas.push(
    await prisma.turma.create({
      data: {
        idDisciplinaOfertada: disciplinasOfertadas[3].id,
        codigoDaTurma: "GP-A",
        idUsuarioProfessor: professores[1].id,
      },
    }),
  )

  // Turmas para SEG (SI)
  turmas.push(
    await prisma.turma.create({
      data: {
        idDisciplinaOfertada: disciplinasOfertadas[4].id,
        codigoDaTurma: "SEG-A",
        idUsuarioProfessor: professores[2].id,
      },
    }),
    await prisma.turma.create({
      data: {
        idDisciplinaOfertada: disciplinasOfertadas[4].id,
        codigoDaTurma: "SEG-B",
        idUsuarioProfessor: professores[3].id,
      },
    }),
  )

  console.log("✅ Turmas criadas")

  console.log("\n🎉 Seed concluído com sucesso!")
  console.log("\n📋 Resumo dos dados criados:")
  console.log("👥 Usuários: 1 admin, 1 diretor, 2 coordenadores, 6 professores")
  console.log("🎓 Cursos: 2 (ADS e SI)")
  console.log("📚 Disciplinas: 10")
  console.log("📋 Matrizes Curriculares: 2")
  console.log("📅 Períodos Letivos: 2")
  console.log("🏫 Disciplinas Ofertadas: 5")
  console.log("👨‍🏫 Turmas: 10")

  console.log("\n🔑 Credenciais de acesso:")
  console.log("Admin: admin@escola.edu / 12345678")
  console.log("Diretor: diretor@escola.edu / 12345678")
  console.log("Coord. ADS: coord.ads@escola.edu / 12345678")
  console.log("Coord. SI: coord.si@escola.edu / 12345678")
  console.log("Professores: {nome}@escola.edu / 12345678")
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
