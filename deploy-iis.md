# Deploy no IIS

## Pré-requisitos no servidor

- [Node.js](https://nodejs.org/) (v18+) instalado e no `PATH`
- IIS 10+ com função **URL Rewrite** instalada
- [iisnode](https://github.com/Azure/iisnode) v0.2.26+ instalado

### Instalar iisnode

```powershell
# Download e instalação silenciosa
$url = "https://github.com/Azure/iisnode/releases/download/v0.2.26/iisnode-full-v0.2.26-x64.msi"
$out = "$env:TEMP\iisnode.msi"
Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
Start-Process msiexec.exe -ArgumentList "/i `"$out`" /qn /norestart" -Wait
```

---

## Build

Na máquina de desenvolvimento ou no próprio servidor:

```bash
npm run build
```

Isso gera a pasta `dist/` com:

| Arquivo/Pasta | Descrição |
|---|---|
| `src/` | Código fonte (server.js, app.js, routes...) |
| `server.cjs` | Entry point CommonJS (carrega o ESM via `import()`) |
| `web.config` | Configuração IIS + iisnode + URL Rewrite |
| `package.json` | Metadados do projeto |
| `node_modules/` | Dependências de produção |
| `.env` | Variáveis de ambiente |

---

## Publicação no IIS

### 1. Copiar o build

Copie toda a pasta `dist/` para o diretório físico do site IIS.

Exemplo:

```powershell
Copy-Item -Path ".\dist\*" -Destination "C:\inetpub\wwwroot\soteria-api" -Recurse -Force
```

### 2. Criar Pool de Aplicações

```powershell
Import-Module WebAdministration -Force
New-WebAppPool -Name "SoteriaApi"
Set-ItemProperty -Path "IIS:\AppPools\SoteriaApi" -Name managedRuntimeVersion -Value ""
Set-ItemProperty -Path "IIS:\AppPools\SoteriaApi" -Name enable32BitAppOnWin64 -Value $false
Set-ItemProperty -Path "IIS:\AppPools\SoteriaApi" -Name processModel.idleTimeout -Value ([TimeSpan]::FromMinutes(0))
Set-ItemProperty -Path "IIS:\AppPools\SoteriaApi" -Name recycling.periodicRestart.time -Value ([TimeSpan]::FromMinutes(0))
```

### 3. Criar Site (porta própria — recomendado)

```powershell
New-WebSite -Name "SoteriaApi" `
  -Port 3000 `
  -PhysicalPath "C:\caminho\para\dist" `
  -ApplicationPool "SoteriaApi"
```

### 4. Ou criar como Sub-aplicação

```powershell
New-WebApplication -Name "soteria-api" `
  -Site "Default Web Site" `
  -PhysicalPath "C:\caminho\para\dist" `
  -ApplicationPool "SoteriaApi"
```

> **Nota**: como sub-aplicação, as rotas recebem o prefixo do caminho virtual (ex.: `/soteria-api/api/pessoa`). O `web.config` gerado trata isso, mas o health check (`GET /`) estará sob o caminho virtual. Prefira site próprio.

### 5. Permissões

```powershell
$distPath = "C:\caminho\para\dist"
icacls $distPath /grant "IIS_IUSRS:(OI)(CI)(RX)" /T /Q
icacls $distPath /grant "IIS AppPool\SoteriaApi:(OI)(CI)(M)" /T /Q
```

### 6. Aplicar e testar

```powershell
iisreset
Start-Sleep -Seconds 5
Invoke-RestMethod -Uri "http://localhost:3000/"
# Resposta esperada: {"message":"Soteria API - Node.js + Turso"}
```

---

## Reinício após novo build

```powershell
# 1. Parar o site
Stop-WebSite -Name "SoteriaApi"
# 2. Opcional: parar o pool para liberar locks
Stop-WebAppPool -Name "SoteriaApi"
# 3. Copiar novo build para o diretório físico
# 4. Iniciar
Start-WebSite -Name "SoteriaApi"
```

---

## Troubleshooting

### Erro: `iisnode was unable to read the configuration file`

Verifique se o `web.config` gerado está no diretório raiz da aplicação e se o schema do iisnode está correto em `%systemroot%\system32\inetsrv\config\schema\iisnode_schema.xml`.

### Erro: `Cannot find module 'src/server.js'`

O entry point CJS (`server.cjs`) usa `import()` para carregar o módulo ESM. Verifique se:

- `server.cjs` está na raiz do diretório físico
- `src/server.js` existe
- O `web.config` usa `path="server.cjs"` no handler e `url="server.cjs"` na rewrite

### Erro: `TURSO_DATABASE_URL não definida`

O `server.js` carrega o `.env` explicitamente a partir do diretório pai (`../.env` relativo ao `src/server.js`). Confirme que o `.env` existe na raiz do diretório físico com as variáveis corretas.

### Erro 404 em todas as rotas

Verifique se o site foi criado como site próprio (porta) em vez de sub-aplicação, ou ajuste as rotas do Express para considerar o prefixo do caminho virtual.

---

## Estrutura de referência

```
dist/
├── src/
│   ├── server.js
│   ├── app.js
│   ├── db.js
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── node_modules/
├── server.cjs          ← entry point CJS
├── web.config          ← configuração IIS/iisnode
├── package.json
├── package-lock.json
└── .env
```
