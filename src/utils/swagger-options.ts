import { Options } from 'swagger-jsdoc';
import path from "path";

export const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-commerce API",
      version: "1.0.0",
      description:
        "Esta aplicação é um projeto de backend para um sistema de e-commerce, \
        desenvolvido como parte de uma avaliação (N3) para um cenário fictício onde os desenvo\
        lvedores trabalham para uma startup. \n\nO objetivo é implementar uma API Rest que atenda \
        aos requisitos fornecidos pelo cliente, para posterior implantação no servidor do cliente. O \
        projeto é colaborativo, com tarefas divididas entre os membros da equipe, cada um \
        responsável por diferentes aspectos do sistema, incluindo modelos de dados como \
        User, Permissions, Product, Order, Payment_method, e Payment_status, além de end\
        points para CRUD (Create, Read, Update, Delete) desses modelos e funcionalidades \
        específicas como controle de acesso baseado em Permissions, integração de métodos \
        de pagamento, e desenvolvimento de endpoints de relatórios.\n\nOs critérios de avaliação \
        para o projeto incluem funcionalidade (todos os endpoints devem estar funcionando), \
        validação (controle de exceção para erros 400 e validação de campos obrigatórios), arquitetura \
        (uso das camadas de Routers, Controllers, Services, e Models, com persistência no banco de dados \
        relacional via Prisma), e qualidade do código (organização, otimização e documentação).Além disso, \
        o projeto também envolve a implementação de Docker para desenvolvimento, supervisão e logging \
        de atividades nos endpoints, e a escrita de testes unitários para garantir a cobertura de testes para \
        todos os endpoints, configurando um ambiente de testes e integração contínua.\n\nA divisão de tarefas \
        entre os integrantes da equipe é detalhada, com responsabilidades específicas atribuídas a cada membro, \
        incluindo a implementação de modelos e endpoints específicos, desenvolvimento de testes unitários, e \
        supervisão geral dos endpoints.",
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [path.join(__dirname, "../**/*.router.js")],
};