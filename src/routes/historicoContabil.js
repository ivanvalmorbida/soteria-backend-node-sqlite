import { Router } from "express";
import { queryAll, queryOne, execute } from "../db.js";
import { authenticate, authorize, Policies } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll("SELECT Codigo, Descricao FROM tb_historico_contabil ORDER BY Descricao");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar históricos contábeis" });
  }
});

router.get("/:codigo", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const row = await queryOne("SELECT Codigo, Descricao FROM tb_historico_contabil WHERE Codigo = ?", [req.params.codigo]);
    if (!row) return res.status(404).json({ message: "Histórico contábil não encontrado" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar histórico contábil" });
  }
});

router.get("/descricao/:descricao", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll(
      "SELECT Codigo, Descricao FROM tb_historico_contabil WHERE Descricao LIKE '%' || ? || '%' ORDER BY Descricao",
      [req.params.descricao]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar históricos contábeis" });
  }
});

router.post("/", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const { descricao } = req.body;
    if (!descricao?.trim()) return res.status(400).json({ message: "A descrição do histórico contábil é obrigatória." });
    if (descricao.trim().length > 50) return res.status(400).json({ message: "A descrição deve ter no máximo 50 caracteres." });

    const result = await execute("INSERT INTO tb_historico_contabil (Descricao) VALUES (?)", [descricao.trim()]);
    res.status(201).json({ codigo: Number(result.lastInsertRowid), message: "Histórico contábil criado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar histórico contábil" });
  }
});

router.put("/:codigo", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const codigo = parseInt(req.params.codigo);
    const { codigo: bodyCodigo, descricao } = req.body;
    if (codigo !== bodyCodigo) return res.status(400).json({ message: "Código informado não corresponde ao código da URL" });

    const result = await execute("UPDATE tb_historico_contabil SET Descricao = ? WHERE Codigo = ?", [descricao.trim(), codigo]);
    if (result.rowsAffected === 0) return res.status(404).json({ message: "Histórico contábil não encontrado" });
    res.json({ message: "Histórico contábil atualizado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar histórico contábil" });
  }
});

router.delete("/:codigo", authorize(...Policies.ApenasAdministrador), async (req, res) => {
  try {
    const result = await execute("DELETE FROM tb_historico_contabil WHERE Codigo = ?", [req.params.codigo]);
    if (result.rowsAffected === 0) return res.status(404).json({ message: "Histórico contábil não encontrado" });
    res.json({ message: "Histórico contábil excluído com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao excluir histórico contábil" });
  }
});

export default router;
