import {
  PrismaClient,
  PapelUsuario,
  DiaSemana,
  StatusDisponibilidade,
  PropostaHorarioStatus,
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
  const hashSenhaDiretor = await hashPassword("senha123")
  const hashSenhaCoordenador = await hashPassword("senha123")
  const hashSenhaProfessor1 = await hashPassword("senha123")
  const hashSenhaProfessor2 = await hashPassword("senha123")

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

  // Criar diretor
  await prisma.usuario.create({
    data: {
      nome: "Ana Diretora",
      email: "diretor@escola.edu",
      hashSenha: hashSenhaDiretor,
      papel: PapelUsuario.DIRETOR,
    },
  })

  const coordenador = await prisma.usuario.create({
    data: {
      nome: "Carlos Coordenador",
      email: "coordenador@escola.edu",
      hashSenha: hashSenhaCoordenador,
      papel: PapelUsuario.COORDENADOR,
    },
  })

  const professor1 = await prisma.usuario.create({
    data: {
      nome: "Pedro Professor",
      email: "professor1@escola.edu",
      hashSenha: hashSenhaProfessor1,
      papel: PapelUsuario.PROFESSOR,
    },
  })

  const professor2 = await prisma.usuario.create({
    data: {
      nome: "Maria Professora",
      email: "professor2@escola.edu",
      hashSenha: hashSenhaProfessor2,
      papel: PapelUsuario.PROFESSOR,
    },
  })

  console.log("✅ Usuários criados")

  // 2. Criar configuração de horário
  // Configuração de horário padrão para a instituição
  await prisma.configuracaoHorario.create({
    data: {
      duracaoAulaMinutos: 50,
      qtdAulasPorBloco: 2,
      inicioTurnoManha: "07:30",
      fimTurnoManha: "12:00",
      inicioTurnoTarde: "13:30",
      fimTurnoTarde: "18:00",
      inicioTurnoNoite: "19:00",
      fimTurnoNoite: "22:30",
    },
  })

  console.log("✅ Configuração de horário criada")

  // 3. Criar período letivo
  const periodoAtual = await prisma.periodoLetivo.create({
    data: {
      ano: 2025,
      semestre: 1,
      dataInicio: new Date("2025-02-10"),
      dataFim: new Date("2025-06-30"),
    },
  })

  console.log("✅ Período letivo criado")

  // 4. Criar curso
  const cursoCienciaComputacao = await prisma.curso.create({
    data: {
      nome: "Ciência da Computação",
      codigo: "CC-2025",
      idCoordenador: coordenador.id,
    },
  })

  console.log("✅ Curso criado")

  // 5. Criar matriz curricular
  const matrizCC = await prisma.matrizCurricular.create({
    data: {
      nome: "Matriz CC 2025",
      idCurso: cursoCienciaComputacao.id,
    },
  })

  console.log("✅ Matriz curricular criada")

  // 6. Criar disciplinas
  const disciplinaProgramacao = await prisma.disciplina.create({
    data: {
      nome: "Programação I",
      codigo: "PROG-1",
      cargaHoraria: 60,
      dataCriacao: new Date(),
    },
  })

  const disciplinaAlgoritmos = await prisma.disciplina.create({
    data: {
      nome: "Algoritmos e Estruturas de Dados",
      codigo: "AED-1",
      cargaHoraria: 60,
      dataCriacao: new Date(),
    },
  })

  const disciplinaBancoDados = await prisma.disciplina.create({
    data: {
      nome: "Banco de Dados",
      codigo: "BD-1",
      cargaHoraria: 60,
      dataCriacao: new Date(),
    },
  })

  console.log("✅ Disciplinas criadas")

  // 7. Adicionar disciplinas à matriz curricular
  await prisma.matrizDisciplina.create({
    data: {
      idMatrizCurricular: matrizCC.id,
      idDisciplina: disciplinaProgramacao.id,
      numeroPeriodo: 1,
    },
  })

  await prisma.matrizDisciplina.create({
    data: {
      idMatrizCurricular: matrizCC.id,
      idDisciplina: disciplinaAlgoritmos.id,
      numeroPeriodo: 2,
    },
  })

  await prisma.matrizDisciplina.create({
    data: {
      idMatrizCurricular: matrizCC.id,
      idDisciplina: disciplinaBancoDados.id,
      numeroPeriodo: 3,
    },
  })

  console.log("✅ Disciplinas adicionadas à matriz curricular")

  // 8. Criar disponibilidades para os professores
  await prisma.disponibilidadeProfessor.create({
    data: {
      idUsuarioProfessor: professor1.id,
      idPeriodoLetivo: periodoAtual.id,
      diaDaSemana: DiaSemana.SEGUNDA,
      horaInicio: "07:30",
      horaFim: "12:00",
      status: StatusDisponibilidade.DISPONIVEL,
    },
  })

  await prisma.disponibilidadeProfessor.create({
    data: {
      idUsuarioProfessor: professor1.id,
      idPeriodoLetivo: periodoAtual.id,
      diaDaSemana: DiaSemana.TERCA,
      horaInicio: "13:30",
      horaFim: "18:00",
      status: StatusDisponibilidade.DISPONIVEL,
    },
  })

  await prisma.disponibilidadeProfessor.create({
    data: {
      idUsuarioProfessor: professor2.id,
      idPeriodoLetivo: periodoAtual.id,
      diaDaSemana: DiaSemana.QUARTA,
      horaInicio: "07:30",
      horaFim: "12:00",
      status: StatusDisponibilidade.DISPONIVEL,
    },
  })

  await prisma.disponibilidadeProfessor.create({
    data: {
      idUsuarioProfessor: professor2.id,
      idPeriodoLetivo: periodoAtual.id,
      diaDaSemana: DiaSemana.QUINTA,
      horaInicio: "19:00",
      horaFim: "22:30",
      status: StatusDisponibilidade.DISPONIVEL,
    },
  })

  console.log("✅ Disponibilidades dos professores criadas")

  // 9. Criar disciplinas ofertadas para o período
  const disciplinaOfertada1 = await prisma.disciplinaOfertada.create({
    data: {
      idDisciplina: disciplinaProgramacao.id,
      idPeriodoLetivo: periodoAtual.id,
      quantidadeTurmas: 2,
      idCoordenador: coordenador.id,
    },
  })

  const disciplinaOfertada2 = await prisma.disciplinaOfertada.create({
    data: {
      idDisciplina: disciplinaAlgoritmos.id,
      idPeriodoLetivo: periodoAtual.id,
      quantidadeTurmas: 1,
      idCoordenador: coordenador.id,
    },
  })

  console.log("✅ Disciplinas ofertadas criadas")

  // 10. Criar turmas para as disciplinas ofertadas
  const turmaProgramacaoA = await prisma.turma.create({
    data: {
      idDisciplinaOfertada: disciplinaOfertada1.id,
      codigoDaTurma: "PROG-1-A",
      idUsuarioProfessor: professor1.id,
    },
  })

  const turmaProgramacaoB = await prisma.turma.create({
    data: {
      idDisciplinaOfertada: disciplinaOfertada1.id,
      codigoDaTurma: "PROG-1-B",
      idUsuarioProfessor: professor2.id,
    },
  })

  const turmaAlgoritmos = await prisma.turma.create({
    data: {
      idDisciplinaOfertada: disciplinaOfertada2.id,
      codigoDaTurma: "AED-1-A",
      idUsuarioProfessor: professor1.id,
    },
  })

  console.log("✅ Turmas criadas")

  // 11. Criar alocações de horário para as turmas
  const alocacaoHorario1 = await prisma.alocacaoHorario.create({
    data: {
      idTurma: turmaProgramacaoA.id,
      diaDaSemana: DiaSemana.SEGUNDA,
      horaInicio: "07:30",
      horaFim: "09:10",
    },
  })

  const alocacaoHorario2 = await prisma.alocacaoHorario.create({
    data: {
      idTurma: turmaProgramacaoB.id,
      diaDaSemana: DiaSemana.QUARTA,
      horaInicio: "07:30",
      horaFim: "09:10",
    },
  })

  const alocacaoHorario3 = await prisma.alocacaoHorario.create({
    data: {
      idTurma: turmaAlgoritmos.id,
      diaDaSemana: DiaSemana.TERCA,
      horaInicio: "13:30",
      horaFim: "15:10",
    },
  })

  console.log("✅ Alocações de horário criadas")

  // 12. Criar uma proposta de horário
  const propostaHorario = await prisma.propostaHorario.create({
    data: {
      idCurso: cursoCienciaComputacao.id,
      idPeriodoLetivo: periodoAtual.id,
      idCoordenadorSubmissao: coordenador.id,
      status: PropostaHorarioStatus.PENDENTE_APROVACAO,
      dataSubmissao: new Date(),
      observacoesCoordenador: "Proposta de horário para o semestre 2025.1",
    },
  })

  console.log("✅ Proposta de horário criada")

  // 13. Adicionar alocações à proposta de horário
  await prisma.alocacaoHorario.update({
    where: { id: alocacaoHorario1.id },
    data: {
      idPropostaHorario: propostaHorario.id,
    },
  })

  await prisma.alocacaoHorario.update({
    where: { id: alocacaoHorario2.id },
    data: {
      idPropostaHorario: propostaHorario.id,
    },
  })

  await prisma.alocacaoHorario.update({
    where: { id: alocacaoHorario3.id },
    data: {
      idPropostaHorario: propostaHorario.id,
    },
  })

  console.log("✅ Alocações adicionadas à proposta de horário")
  console.log("🎉 Seed finalizado com sucesso!")
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
