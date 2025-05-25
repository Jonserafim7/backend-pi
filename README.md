# Sistema de Horários Acadêmicos - Backend

**Projeto Integrador - Análise e Desenvolvimento de Sistemas**

## 🎯 **Contexto do Projeto**

Este é um **projeto universitário** que automatiza a criação de horários acadêmicos, substituindo o processo manual feito por coordenadores. Desenvolvido para demonstrar aplicação prática dos conhecimentos do curso de ADS.

### Problema Resolvido

- Coordenadores criam horários manualmente (planilhas, papel)
- Processo demorado e propenso a erros
- Conflitos de professores detectados tardiamente
- Falta de validação automática

### Solução

Sistema web que automatiza todo o fluxo de criação, validação e aprovação de horários acadêmicos.

## 👥 **Usuários do Sistema**

| Usuário            | Responsabilidades                                         |
| ------------------ | --------------------------------------------------------- |
| **👨‍💼 Diretor**     | Configurar horários globais, aprovar propostas            |
| **👨‍🏫 Coordenador** | Ofertar disciplinas, criar horários, atribuir professores |
| **👨‍🎓 Professor**   | Informar disponibilidade de horários                      |
| **⚙️ Admin**       | Gerenciar usuários e sistema                              |

## 🏗️ **Tecnologias (Stack)**

### Backend (Este projeto)

- **NestJS** - Framework Node.js estruturado
- **Prisma** - ORM para banco de dados
- **SQLite** - Banco de dados simples
- **JWT** - Autenticação
- **Swagger** - Documentação API automática

### Frontend (Projeto irmão)

- **React + TypeScript** - Interface moderna
- **TanStack Query** - Estado server
- **Shadcn UI** - Componentes prontos
- **Orval** - Geração automática de APIs

## 📊 **Entidades Principais**

```
ConfiguracaoHorario  (configurações globais - turnos, duração aulas)
      ↓
PeriodoLetivo        (semestres acadêmicos)
      ↓
DisponibilidadeProfessor  (quando professores podem lecionar)
      ↓
DisciplinaOfertada   (disciplinas que serão oferecidas no semestre)
      ↓
Turma               (instâncias específicas das disciplinas)
      ↓
AlocacaoHorario     (horário específico de cada turma)
      ↓
PropostaHorario     (proposta completa para aprovação)
```

## 🔄 **Fluxo Principal do Sistema**

### 1. **Configuração (Diretor)**

- Define horários globais (ex: manhã 07:30-11:10, tarde 13:30-17:10)
- Cria períodos letivos (ex: 2025/1)
- Cadastra cursos e coordenadores

### 2. **Preparação (Coordenador)**

- Define disciplinas que serão oferecidas
- Especifica quantas turmas por disciplina
- Cadastra professores no sistema

### 3. **Disponibilidade (Professor)**

- Informa horários disponíveis para lecionar
- **IMPORTANTE**: Só pode informar horários nos slots configurados pelo diretor

### 4. **Criação de Horários (Coordenador)**

- Atribui professores às turmas
- Cria alocações de horário (manual ou automático)
- Sistema valida conflitos automaticamente
- Submete proposta para aprovação

### 5. **Aprovação (Diretor)**

- Revisa proposta completa
- Aprova ou rejeita com justificativa
- Horários aprovados ficam disponíveis

## 🚨 **Validações Críticas**

- **Slots válidos**: Horários só podem ser nos turnos configurados
- **Disponibilidade**: Professor deve estar disponível no horário
- **Conflitos**: Mesmo professor não pode ter 2 aulas simultâneas
- **Integridade**: Todas as alocações devem ter professor atribuído

## 📁 **Estrutura do Código**

```
src/
├── auth/                    # Sistema de autenticação JWT ✅
├── configuracoes-horario/   # Configurações globais (CORE) ✅
├── periodos-letivos/        # Semestres acadêmicos ✅
├── disponibilidade-professores/  # Disponibilidade informada ✅
├── disciplinas-ofertadas/   # Disciplinas do semestre ✅
├── turmas/                  # Turmas específicas ✅
├── usuarios/               # Gestão de usuários ✅
├── cursos/                 # Cursos de graduação ✅
├── disciplinas/            # Catálogo de disciplinas ✅
├── matrizes-curriculares/  # Matrizes curriculares ✅
├── alocacoes-horarios/     # Horários das turmas (Sprint 3)
├── propostas-horario/      # Propostas para aprovação (Sprint 4)
└── common/                 # Utilitários compartilhados ✅
```

## ⚡ **Performance e Integração**

### Sistema Otimizado (Sprint 2.4 - ✅ Concluída)

- `ConfiguracoesHorarioService` usa cache simples (95% melhoria performance)
- Slots de horário pré-calculados
- Validações rápidas

### Integração Central (Sprint 2.5 - ✅ Concluída)

- Todos os módulos validam contra `ConfiguracaoHorario`
- Validações centralizadas implementadas
- Sistema integrado e consistente

## 🎯 **Status Atual do Projeto (Janeiro 2025)**

### ✅ **Módulos Concluídos - SISTEMA BASE COMPLETO**

- ✅ **Autenticação e autorização** - JWT, guards, roles, decorators completos
- ✅ **Períodos letivos** - CRUD completo + mudança de status + validações
- ✅ **Configurações de horário** - Otimizado (95% melhoria performance) + cache
- ✅ **Cursos** - CRUD completo + validação de coordenadores + associações
- ✅ **Disciplinas** - CRUD completo + códigos únicos + filtros + validações
- ✅ **Disciplinas ofertadas** - Sistema completo + relações + gestão de turmas
- ✅ **Turmas** - CRUD completo + atribuição de professores + validações
- ✅ **Usuários** - Sistema completo + roles + validações + gestão de perfis
- ✅ **Matrizes curriculares** - CRUD completo + gestão de disciplinas + associações
- ✅ **Disponibilidade de professores** - Sistema completo + integração com configurações

### 🚀 **Próxima Fase - PRONTO PARA IMPLEMENTAR**

- 🎯 **Alocações de horário** - Sistema base sólido estabelecido, pronto para Sprint 3
- 🎯 **Validações de conflitos** - Configurações otimizadas prontas para uso
- 🎯 **Editor visual de horários** - Base de dados e APIs completas

### ❌ **Ainda Não Implementados (Próximas Sprints)**

- Alocações de horário (Sprint 3) - **DESBLOQUEADA**
- Propostas de horário (Sprint 4) - Depende de alocações
- Workflow de aprovação (Sprint 4) - Depende de propostas
- Interface visual de horários (Sprint 3) - **DESBLOQUEADA**

## 🎉 **Sistema Base Estabelecido com Sucesso**

**Status**: ✅ **TODOS OS MÓDULOS BASE CONCLUÍDOS**  
**Performance**: ✅ **OTIMIZADA** (ConfiguracoesHorarioService com 95% melhoria)  
**Integração**: ✅ **SISTEMA INTEGRADO** (Validações centralizadas funcionando)  
**Próximo Passo**: 🚀 **SPRINT 3 - ALOCAÇÕES DE HORÁRIO** pode iniciar imediatamente

### **Conquistas Importantes**

- 🏆 **Sistema robusto**: Autenticação, autorização e validações completas
- 🏆 **Performance otimizada**: Cache implementado, operações reduzidas de ~50 para ~3
- 🏆 **Arquitetura sólida**: Todos os módulos base integrados e funcionando
- 🏆 **Qualidade de código**: Validações, tratamento de erros, documentação completa
- 🏆 **Pronto para produção**: APIs completas, Swagger documentation, estrutura escalável

## 🚀 **Próximos Passos - Sprint 3**

**Sistema Base Concluído**: ✅ Todos os 10 módulos fundamentais implementados  
**Performance Otimizada**: ✅ ConfiguracoesHorarioService com cache eficiente  
**Validações Centralizadas**: ✅ Integração entre módulos funcionando

### **Sprint 3: Alocações de Horário**

- Implementar sistema de alocação manual e automática
- Editor visual de grade de horários
- Algoritmos de detecção de conflitos
- Validação em tempo real baseada nas configurações

### **Sprint 4: Propostas e Workflow**

- Sistema de propostas de horário
- Workflow de aprovação/rejeição
- Notificações e histórico de mudanças

## 📋 **Para Desenvolvedores**

### Setup Local

```bash
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

### Comandos Importantes

```bash
npm run start:dev     # Servidor desenvolvimento
npx prisma studio     # Interface do banco
npm run build         # Build para produção
```

### Swagger Documentation

- Acesse: `http://localhost:3000/api`
- Documentação automática de todas as APIs

## 🎓 **Características Acadêmicas**

- **Simplicidade**: Código didático e bem documentado
- **Gradual**: Implementação por sprints
- **Real**: Soluciona problema real de instituições de ensino
- **Completo**: Demonstra conceitos full-stack

---

**Objetivo**: Criar sistema funcional que atenda requisitos mínimos do projeto integrador, demonstrando conhecimentos práticos de desenvolvimento web, banco de dados, APIs REST e integração frontend-backend.

**Foco**: Automatizar processo manual, reduzir erros, validar conflitos automaticamente e fornecer interface intuitiva para usuários finais.

**Status Atual**: ✅ **SISTEMA BASE COMPLETO** - Pronto para Sprint 3 (Alocações de Horário)
