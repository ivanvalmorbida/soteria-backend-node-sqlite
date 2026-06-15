import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/auth.js";
import pessoaRoutes from "./routes/pessoa.js";
import pessoaFisicaRoutes from "./routes/pessoaFisica.js";
import pessoaJuridicaRoutes from "./routes/pessoaJuridica.js";
import auxiliaresRoutes from "./routes/auxiliares.js";
import centroCustoRoutes from "./routes/centroCusto.js";
import historicoContabilRoutes from "./routes/historicoContabil.js";
import lanctoContabilRoutes from "./routes/lanctoContabil.js";
import planoContaRoutes from "./routes/planoConta.js";
import hospedagemRoutes from "./routes/hospedagem.js";
import { errorHandler } from "./utils/helpers.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/pessoa", pessoaRoutes);
app.use("/api/pessoafisica", pessoaFisicaRoutes);
app.use("/api/pessoajuridica", pessoaJuridicaRoutes);
app.use("/api", auxiliaresRoutes);
app.use("/api/centrocusto", centroCustoRoutes);
app.use("/api/historicocontabil", historicoContabilRoutes);
app.use("/api/lanctocontabil", lanctoContabilRoutes);
app.use("/api/planoconta", planoContaRoutes);
app.use("/api/hospedagem", hospedagemRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Soteria API - Node.js + Turso" });
});

app.use(errorHandler);

export default app;
