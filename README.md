# Sistema de Agendamento Acadêmico - Backend

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

## Descrição

Este repositório contém o backend do Sistema de Agendamento Acadêmico, uma aplicação web desenvolvida para ajudar instituições educacionais a gerenciar cronogramas de aulas e atribuições de cursos de forma eficiente. 

O sistema automatiza o processo de criação de horários acadêmicos, garantindo a alocação ideal de professores e prevenindo conflitos de agendamento.

## Tecnologias Utilizadas

- **Framework**: NestJS (Node.js)
- **Banco de Dados**: Prisma ORM com SQLite (desenvolvimento)
- **Autenticação**: JWT com Passport.js
- **Documentação da API**: Swagger/OpenAPI
- **Testes**: Jest para testes unitários e e2e

## Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (v16 ou superior)
- [PNPM](https://pnpm.io/) (v7 ou superior)
- [Git](https://git-scm.com/)

## Como Clonar o Projeto

```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]

# Entre no diretório do projeto
cd backend-pi
```

## Configuração do Ambiente

1. Crie um arquivo `.env` na raiz do projeto:

```bash
# Configurações do banco de dados
DATABASE_URL="file:./dev.db"

# Configurações de autenticação
JWT_SECRET="sua_chave_secreta_para_jwt"
JWT_EXPIRATION="1d"

# Outras configurações
PORT=3000
```

## Instalação de Dependências

```bash
# Instale as dependências
pnpm install
```

## Inicialização do Banco de Dados

```bash
# Gere o cliente Prisma
pnpm prisma generate

# Execute as migrações do banco de dados
pnpm prisma migrate dev

# (Opcional) Para visualizar o banco de dados
pnpm prisma studio
```

## Compilação e Execução do Projeto

```bash
# Modo de desenvolvimento
pnpm run start:dev

# Compilação
pnpm run build

# Modo de produção
pnpm run start:prod
```

## Rodando Testes

```bash
# Testes unitários
pnpm run test

# Testes e2e
pnpm run test:e2e

# Cobertura de testes
pnpm run test:cov
```

## Acessando a Documentação da API

Após iniciar o servidor, acesse a documentação Swagger da API em:

```
http://localhost:3000/api
```

## Estrutura do Projeto

```
backend-pi/
├── prisma/                # Definições do Prisma ORM
├── src/
│   ├── auth/              # Autenticação e autorização
│   ├── common/            # Código compartilhado
│   ├── config/            # Configurações da aplicação
│   ├── modules/           # Módulos da aplicação
│   │   ├── users/         # Gerenciamento de usuários
│   │   ├── courses/       # Gerenciamento de cursos
│   │   ├── schedules/     # Gerenciamento de horários
│   │   └── ...            # Outros módulos
│   ├── app.module.ts      # Módulo principal
│   └── main.ts            # Ponto de entrada da aplicação
├── test/                  # Testes
└── README.md              # Este arquivo
```

## Papéis e Permissões do Sistema

O sistema possui três papéis principais:

1. **Diretor**
   - Gerencia cursos e coordenadores
   - Aprova horários finais
   - Define configurações globais de agendamento

2. **Coordenador**
   - Gerencia currículos e disciplinas
   - Cria e submete propostas de horários
   - Gerencia atribuições de professores para seus cursos

3. **Professor**
   - Atualiza disponibilidade para lecionar
   - Visualiza seu cronograma pessoal de aulas

## Suporte

Para suporte ou dúvidas sobre o projeto, entre em contato com a equipe de desenvolvimento.
