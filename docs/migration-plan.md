# Plano Inicial de Migracao

## Fase 1

- Inicializar o repositorio git e conectar ao GitHub
- Remover do versionamento dependencias, logs, bancos e segredos locais
- Padronizar configuracao por variaveis de ambiente

## Fase 2

- Publicar o frontend na Vercel
- Criar ambiente de preview por branch
- Definir URL da API por ambiente

## Fase 3

- Introduzir Postgres hospedado via Supabase
- Adaptar o backend para usar `DATABASE_URL`
- Migrar schema e dados do SQLite em lotes pequenos

## Fase 4

- Separar arquivos e integracoes externas por servico
- Revisar jobs locais que ainda dependem da maquina
- Transformar rotinas criticas em processos hospedados

## Observacoes

- O projeto ainda contem scripts e fluxos locais que referenciam caminhos absolutos.
- A migracao para Supabase deve ser gradual, com compatibilidade temporaria com SQLite enquanto estabilizamos o deploy.

