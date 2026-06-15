import { Router } from "express";
import { queryAll, queryOne } from "../db.js";

const router = Router();

// ---- Estado ----
router.get("/estado", async (req, res) => {
  const rows = await queryAll("SELECT * FROM tb_estado ORDER BY nome");
  res.json(rows);
});

router.get("/estado/:codigo", async (req, res) => {
  const row = await queryOne("SELECT * FROM tb_estado WHERE codigo = ?", [req.params.codigo]);
  if (!row) return res.status(404).json({ message: "Estado não encontrado" });
  res.json(row);
});

// ---- Cidade ----
router.get("/cidade", async (req, res) => {
  const rows = await queryAll("SELECT * FROM tb_cidade ORDER BY nome");
  res.json(rows);
});

router.get("/cidade/:codigo", async (req, res) => {
  const row = await queryOne("SELECT * FROM tb_cidade WHERE codigo = ?", [req.params.codigo]);
  if (!row) return res.status(404).json({ message: "Cidade não encontrada" });
  res.json(row);
});

router.get("/cidade/estado/:estadoId", async (req, res) => {
  const rows = await queryAll(
    "SELECT * FROM tb_cidade WHERE codigo IN (SELECT DISTINCT cidade FROM tb_cep WHERE estado = ?) ORDER BY nome",
    [req.params.estadoId]
  );
  res.json(rows);
});

// ---- Bairro ----
router.get("/bairro/nome/:nome", async (req, res) => {
  const rows = await queryAll("SELECT * FROM tb_bairro WHERE nome LIKE '%' || ? || '%'", [req.params.nome]);
  res.json(rows);
});

// ---- Endereco ----
router.get("/endereco/nome/:nome", async (req, res) => {
  const rows = await queryAll("SELECT * FROM tb_endereco WHERE nome LIKE '%' || ? || '%'", [req.params.nome]);
  res.json(rows);
});

// ---- CEP ----
router.get("/cep/:cep", async (req, res) => {
  const cep = req.params.cep.replace(/[.-]/g, "");
  const row = await queryOne(
    `SELECT c.cep AS cepCodigo, c.complemento, c.endereco, e.Nome AS enderecoNome,
            c.bairro, b.Nome AS bairroNome, c.cidade, c.estado
     FROM tb_cep c
     LEFT JOIN tb_endereco e ON e.Codigo = c.endereco
     LEFT JOIN tb_bairro b ON b.Codigo = c.bairro
     WHERE c.cep = ?`,
    [cep]
  );
  if (!row) return res.status(404).json({ message: "CEP não encontrado" });
  res.json(row);
});

// ---- CBO ----
router.get("/cbo", async (req, res) => {
  const rows = await queryAll("SELECT CBO AS codigo, Descricao FROM tb_cbo ORDER BY Descricao");
  res.json(rows);
});

router.get("/cbo/:codigo", async (req, res) => {
  const row = await queryOne("SELECT CBO AS codigo, Descricao FROM tb_cbo WHERE CBO = ?", [req.params.codigo]);
  if (!row) return res.status(404).json({ message: "CBO não encontrado" });
  res.json(row);
});

router.get("/cbo/descricao/:descricao", async (req, res) => {
  const rows = await queryAll(
    "SELECT CBO AS codigo, Descricao FROM tb_cbo WHERE Descricao LIKE '%' || ? || '%' ORDER BY Descricao",
    [req.params.descricao]
  );
  res.json(rows);
});

// ---- Nacionalidade ----
router.get("/nacionalidade", async (req, res) => {
  const rows = await queryAll("SELECT * FROM tb_nacionalidade ORDER BY pais");
  res.json(rows);
});

router.get("/nacionalidade/:codigo", async (req, res) => {
  const row = await queryOne("SELECT * FROM tb_nacionalidade WHERE codigo = ?", [req.params.codigo]);
  if (!row) return res.status(404).json({ message: "Nacionalidade não encontrada" });
  res.json(row);
});

// ---- Atividade Econômica ----
router.get("/atividadeeconomica", async (req, res) => {
  const rows = await queryAll("SELECT * FROM tb_atividade_economica ORDER BY descricao");
  res.json(rows);
});

router.get("/atividadeeconomica/:codigo", async (req, res) => {
  const row = await queryOne("SELECT * FROM tb_atividade_economica WHERE codigo = ?", [req.params.codigo]);
  if (!row) return res.status(404).json({ message: "Atividade econômica não encontrada" });
  res.json(row);
});

router.get("/atividadeeconomica/setor/:setor", async (req, res) => {
  const rows = await queryAll("SELECT * FROM tb_atividade_economica WHERE setor = ? ORDER BY descricao", [req.params.setor]);
  res.json(rows);
});

router.get("/atividadeeconomica/descricao/:descricao", async (req, res) => {
  const rows = await queryAll(
    "SELECT * FROM tb_atividade_economica WHERE descricao LIKE '%' || ? || '%' ORDER BY descricao",
    [req.params.descricao]
  );
  res.json(rows);
});

// ---- Atividade Econômica Subsetor ----
router.get("/atividadeeconomicasubsetor", async (req, res) => {
  const rows = await queryAll("SELECT * FROM tb_atividade_economica_subsetor ORDER BY subsetor");
  res.json(rows);
});

router.get("/atividadeeconomicasubsetor/:codigo", async (req, res) => {
  const row = await queryOne("SELECT * FROM tb_atividade_economica_subsetor WHERE codigo = ?", [req.params.codigo]);
  if (!row) return res.status(404).json({ message: "Subsetor não encontrado" });
  res.json(row);
});

router.get("/atividadeeconomicasubsetor/setor/:setor", async (req, res) => {
  const rows = await queryAll("SELECT * FROM tb_atividade_economica_subsetor WHERE setor = ? ORDER BY descricao", [req.params.setor]);
  res.json(rows);
});

router.get("/atividadeeconomicasubsetor/subsetor/:subsetor", async (req, res) => {
  const rows = await queryAll(
    "SELECT * FROM tb_atividade_economica_subsetor WHERE subsetor LIKE '%' || ? || '%' ORDER BY subsetor",
    [req.params.subsetor]
  );
  res.json(rows);
});

// ---- Estado Civil ----
router.get("/estadocivil", async (req, res) => {
  const rows = await queryAll("SELECT * FROM tb_estado_civil ORDER BY Descricao");
  res.json(rows);
});

router.get("/estadocivil/:codigo", async (req, res) => {
  const row = await queryOne("SELECT * FROM tb_estado_civil WHERE codigo = ?", [req.params.codigo]);
  if (!row) return res.status(404).json({ message: "Estado civil não encontrado" });
  res.json(row);
});

router.get("/tipotelefone", async (req, res) => {
  res.json([{ codigo: 1, descricao: "Celular", icone: "📱" },
  { codigo: 2, descricao: "Fixo", icone: "☎️" },
  { codigo: 3, descricao: "WhatsApp", icone: "💬" },
  { codigo: 4, descricao: "Telegram", icone: "✈️" },
  { codigo: 5, descricao: "Comercial", icone: "🏢" },
  { codigo: 6, descricao: "Residencial", icone: "🏠" },
  { codigo: 7, descricao: "Recado", icone: "📞" },
  { codigo: 8, descricao: "Fax", icone: "📠" },
  { codigo: 99, descricao: "Outro", icone: "📞" }]);
});

router.get("/tipoenderecoeletronico", async (req, res) => {
  res.json([{ codigo: 1, descricao: "E-mail", icone: "📧" },
  { codigo: 2, descricao: "Website", icone: "🌐" },
  { codigo: 3, descricao: "WhatsApp", icone: "💬" },
  { codigo: 4, descricao: "Telegram", icone: "✈️" },
  { codigo: 5, descricao: "Comercial", icone: "🏢" },
  { codigo: 6, descricao: "Residencial", icone: "🏠" },
  { codigo: 7, descricao: "Recado", icone: "📞" },
  { codigo: 8, descricao: "Fax", icone: "📠" },
  { codigo: 99, descricao: "Outro", icone: "📞" }]);
});

export default router;
