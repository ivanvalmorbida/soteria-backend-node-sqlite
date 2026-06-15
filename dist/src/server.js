import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import { getDb } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config();

const PORT = process.env.PORT || 3000;

try {
  getDb();
  console.log("Conectado ao Turso/libSQL");
} catch (err) {
  console.error("Erro ao conectar ao banco:", err.message);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
