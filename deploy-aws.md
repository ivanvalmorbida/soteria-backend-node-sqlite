# Deploy na AWS - Elastic Beanstalk + CloudFront

## 1. Instalar a CLI do EB

```bash
pip install awsebcli
```

Ou alternativamente, usar o AWS Console (sem CLI).

## 2. Inicializar o ambiente EB

```bash
eb init
```

- Selecione a região (ex: us-east-1)
- Dê um nome à aplicação (ex: soteria-api)
- Platform: **Node.js** (selecione a versão mais recente, ex: Node.js 20)
- SSH: opcional

## 3. Criar o ambiente

```bash
eb create soteria-api-prod --single
```

- `--single` = instância única (sem LB) — ideal para API de baixo custo
- Sem `--single` = cria com Load Balancer (recomendado para produção com alta disponibilidade)

Durante a criação, defina as variáveis de ambiente:

```
TURSO_DATABASE_URL=libsql://seu-banco-seu-org.turso.io
TURSO_AUTH_TOKEN=seu-token-aqui
JWT_SECRET=SuaChaveSecretaSuperSeguraComPeloMenos32Caracteres
JWT_EXPIRATION_HOURS=8
```

## 4. Deploy

```bash
eb deploy
```

## 5. Verificar

```bash
eb open
```

## 6. Adicionar CloudFront (CDN)

1. No Console AWS, vá em **CloudFront > Create Distribution**
2. **Origin domain**: selecione o ELB do Elastic Beanstalk (ou a instância EC2)
3. **Protocol**: HTTPS only
4. **Cache policies**: se for API, use **CachingDisabled** (ou crie uma policy customizada)
5. **Price Class**: escolha conforme seu orçamento
6. **Alternate domain (CNAME)**: opcional — seu domínio personalizado
7. **SSL Certificate**: se usar domínio próprio, solicite um certificado no ACM
8. Clique em **Create Distribution**

> ⚠️ Para uma API REST, o CloudFront deve ter cache **desabilitado** ou mínimo, para não servir respostas stale.

## Variáveis de ambiente

Pelo EB CLI:
```bash
eb setenv TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... JWT_SECRET=... JWT_EXPIRATION_HOURS=8
```

Pelo Console: **Elastic Beanstalk > Environments > [seu-env] > Configuration > Software > Environment properties**

## Comandos úteis

```bash
eb status              # Status do ambiente
eb logs                # Ver logs
eb ssh                 # SSH na instância
eb deploy              # Novo deploy
eb terminate           # Destruir ambiente
```
