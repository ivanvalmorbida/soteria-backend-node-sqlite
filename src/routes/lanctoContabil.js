import { Router } from "express";
import { queryAll, queryOne, execute } from "../db.js";
import { authenticate, authorize, Policies } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll("SELECT Codigo, Pessoa, CentroCusto, Credito, Debito, Valor, Data, HC, Descricao FROM tb_lancto_contabil ORDER BY Data DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar lançamentos contábeis" });
  }
});

router.get("/:codigo", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const row = await queryOne("SELECT Codigo, Pessoa, CentroCusto, Credito, Debito, Valor, Data, HC, Descricao FROM tb_lancto_contabil WHERE Codigo = ?", [req.params.codigo]);
    if (!row) return res.status(404).json({ message: "Lançamento contábil não encontrado" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar lançamento contábil" });
  }
});

router.post("/", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const { pessoa, centroCusto, credito, debito, valor, data, hc, descricao } = req.body;
    if (!descricao?.trim()) return res.status(400).json({ message: "A descrição do lançamento contábil é obrigatória." });
    if (valor <= 0) return res.status(400).json({ message: "O valor deve ser maior que zero." });

    const result = await execute(
      `INSERT INTO tb_lancto_contabil (Pessoa, CentroCusto, Credito, Debito, Valor, Data, HC, Descricao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pessoa, centroCusto, credito, debito, valor, data, hc, descricao.trim()]
    );
    res.status(201).json({ codigo: Number(result.lastInsertRowid), message: "Lançamento contábil criado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar lançamento contábil" });
  }
});

router.put("/:codigo", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const codigo = parseInt(req.params.codigo);
    const { codigo: bodyCodigo, pessoa, centroCusto, credito, debito, valor, data, hc, descricao } = req.body;
    if (codigo !== bodyCodigo) return res.status(400).json({ message: "Código informado não corresponde ao código da URL" });

    const result = await execute(
      `UPDATE tb_lancto_contabil SET Pessoa = ?, CentroCusto = ?, Credito = ?, Debito = ?, Valor = ?, Data = ?, HC = ?, Descricao = ? WHERE Codigo = ?`,
      [pessoa, centroCusto, credito, debito, valor, data, hc, descricao.trim(), codigo]
    );
    if (result.rowsAffected === 0) return res.status(404).json({ message: "Lançamento contábil não encontrado" });
    res.json({ message: "Lançamento contábil atualizado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar lançamento contábil" });
  }
});

router.delete("/:codigo", authorize(...Policies.ApenasAdministrador), async (req, res) => {
  try {
    const result = await execute("DELETE FROM tb_lancto_contabil WHERE Codigo = ?", [req.params.codigo]);
    if (result.rowsAffected === 0) return res.status(404).json({ message: "Lançamento contábil não encontrado" });
    res.json({ message: "Lançamento contábil excluído com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao excluir lançamento contábil" });
  }
});

export default router;
