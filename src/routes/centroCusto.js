import { Router } from "express";
import { queryAll, queryOne, execute } from "../db.js";
import { authenticate, authorize, Policies } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll("SELECT Codigo, Descricao FROM tb_centro_custo ORDER BY Descricao");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar centros de custo" });
  }
});

router.get("/:codigo", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const row = await queryOne("SELECT Codigo, Descricao FROM tb_centro_custo WHERE Codigo = ?", [req.params.codigo]);
    if (!row) return res.status(404).json({ message: "Centro de custo não encontrado" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar centro de custo" });
  }
});

router.get("/descricao/:descricao", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll(
      "SELECT Codigo, Descricao FROM tb_centro_custo WHERE Descricao LIKE '%' || ? || '%' ORDER BY Descricao",
      [req.params.descricao]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar centros de custo" });
  }
});

router.post("/", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const { descricao } = req.body;
    if (!descricao?.trim()) return res.status(400).json({ message: "A descrição do centro de custo é obrigatória." });
    if (descricao.trim().length > 50) return res.status(400).json({ message: "A descrição deve ter no máximo 50 caracteres." });

    const result = await execute("INSERT INTO tb_centro_custo (Descricao) VALUES (?)", [descricao.trim()]);
    res.status(201).json({ codigo: Number(result.lastInsertRowid), message: "Centro de custo criado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar centro de custo" });
  }
});

router.put("/:codigo", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const codigo = parseInt(req.params.codigo);
    const { codigo: bodyCodigo, descricao } = req.body;
    if (codigo !== bodyCodigo) return res.status(400).json({ message: "Código informado não corresponde ao código da URL" });
    if (!descricao?.trim()) return res.status(400).json({ message: "A descrição do centro de custo é obrigatória." });

    const result = await execute("UPDATE tb_centro_custo SET Descricao = ? WHERE Codigo = ?", [descricao.trim(), codigo]);
    if (result.rowsAffected === 0) return res.status(404).json({ message: "Centro de custo não encontrado" });
    res.json({ message: "Centro de custo atualizado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar centro de custo" });
  }
});

router.delete("/:codigo", authorize(...Policies.ApenasAdministrador), async (req, res) => {
  try {
    const result = await execute("DELETE FROM tb_centro_custo WHERE Codigo = ?", [req.params.codigo]);
    if (result.rowsAffected === 0) return res.status(404).json({ message: "Centro de custo não encontrado" });
    res.json({ message: "Centro de custo excluído com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao excluir centro de custo" });
  }
});

export default router;
