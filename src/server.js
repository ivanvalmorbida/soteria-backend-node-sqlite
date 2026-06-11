import "dotenv/config";
import app from "./app.js";
import { getDb } from "./db.js";

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
