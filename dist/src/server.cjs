const path = require("path");
const { pathToFileURL } = require("url");
process.chdir(__dirname);
import(pathToFileURL(path.resolve(__dirname, "src/server.js"))).catch((err) => {
  console.error("Falha ao iniciar o servidor:", err);
  process.exit(1);
});
