import { Router } from "express";
import { queryAll, queryOne, execute } from "../db.js";
import { authenticate, authorize, Policies } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll("SELECT Codigo, CodigoPai, Tipo, Rotulo, Descricao FROM tb_plano_conta ORDER BY Rotulo");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar planos de conta" });
  }
});

router.get("/:codigo", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const row = await queryOne("SELECT Codigo, CodigoPai, Tipo, Rotulo, Descricao FROM tb_plano_conta WHERE Codigo = ?", [req.params.codigo]);
    if (!row) return res.status(404).json({ message: "Plano de conta não encontrado" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar plano de conta" });
  }
});

router.get("/tipo/:tipo", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll("SELECT Codigo, CodigoPai, Tipo, Rotulo, Descricao FROM tb_plano_conta WHERE Tipo = ? ORDER BY Rotulo", [req.params.tipo]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar planos de conta" });
  }
});

router.get("/descricao/:descricao", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll(
      "SELECT Codigo, CodigoPai, Tipo, Rotulo, Descricao FROM tb_plano_conta WHERE Descricao LIKE '%' || ? || '%' ORDER BY Descricao",
      [req.params.descricao]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar planos de conta" });
  }
});

router.post("/", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const { codigoPai, tipo, rotulo, descricao } = req.body;
    if (!tipo?.trim()) return res.status(400).json({ message: "O tipo do plano de conta é obrigatório." });
    if (tipo.trim().length > 1) return res.status(400).json({ message: "O tipo deve ter exatamente 1 caractere." });
    if (!rotulo?.trim()) return res.status(400).json({ message: "O rótulo do plano de conta é obrigatório." });
    if (rotulo.trim().length > 30) return res.status(400).json({ message: "O rótulo deve ter no máximo 30 caracteres." });
    if (!descricao?.trim()) return res.status(400).json({ message: "A descrição do plano de conta é obrigatória." });

    const pai = codigoPai && codigoPai > 0 ? codigoPai : null;
    const result = await execute(
      "INSERT INTO tb_plano_conta (CodigoPai, Tipo, Rotulo, Descricao) VALUES (?, ?, ?, ?)",
      [pai, tipo.trim(), rotulo.trim(), descricao.trim()]
    );
    res.status(201).json({ codigo: Number(result.lastInsertRowid), message: "Plano de conta criado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar plano de conta" });
  }
});

router.put("/:codigo", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const codigo = parseInt(req.params.codigo);
    const { codigo: bodyCodigo, codigoPai, tipo, rotulo, descricao } = req.body;
    if (codigo !== bodyCodigo) return res.status(400).json({ message: "Código informado não corresponde ao código da URL" });

    const pai = codigoPai && codigoPai > 0 ? codigoPai : null;
    const result = await execute(
      "UPDATE tb_plano_conta SET CodigoPai = ?, Tipo = ?, Rotulo = ?, Descricao = ? WHERE Codigo = ?",
      [pai, tipo.trim(), rotulo.trim(), descricao.trim(), codigo]
    );
    if (result.rowsAffected === 0) return res.status(404).json({ message: "Plano de conta não encontrado" });
    res.json({ message: "Plano de conta atualizado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar plano de conta" });
  }
});

router.delete("/:codigo", authorize(...Policies.ApenasAdministrador), async (req, res) => {
  try {
    const result = await execute("DELETE FROM tb_plano_conta WHERE Codigo = ?", [req.params.codigo]);
    if (result.rowsAffected === 0) return res.status(404).json({ message: "Plano de conta não encontrado" });
    res.json({ message: "Plano de conta excluído com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao excluir plano de conta" });
  }
});

export default router;
