import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const dirsToCopy = ["src"];
const filesToCopy = ["package.json", "package-lock.json", ".env", "server.cjs"];

if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true });
}

fs.mkdirSync(dist, { recursive: true });

for (const dir of dirsToCopy) {
  const src = path.join(root, dir);
  const dest = path.join(dist, dir);
  fs.cpSync(src, dest, { recursive: true });
}

for (const file of filesToCopy) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) {
    fs.cpSync(src, path.join(dist, file));
  }
}

console.log("Arquivos copiados para dist/");

const webConfig = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.cjs" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeApp">
          <match url=".*" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="server.cjs" />
        </rule>
      </rules>
    </rewrite>
    <iisnode nodeProcessCommandLine="C:\\Program Files\\nodejs\\node.exe" loggingEnabled="false" devErrorsEnabled="false" />
    <security>
      <requestFiltering>
        <hiddenSegments>
          <add segment="node_modules" />
        </hiddenSegments>
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>`;

fs.writeFileSync(path.join(dist, "web.config"), webConfig);
console.log("web.config gerado para IIS com iisnode");

console.log("Instalando dependências de produção...");
execSync("npm install --production", { cwd: dist, stdio: "inherit" });

console.log("\nBuild concluído! dist/ pronto para deploy.");
