import { Router } from "express";
import { queryAll, queryOne, execute } from "../db.js";
import { authenticate, authorize, Policies } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

const STATUS_VALIDOS = ["Ativa", "Finalizada", "Cancelada", "Reserva"];

router.get("/", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT h.Codigo, h.Pessoa, p.Nome AS pessoaNome, h.Quarto, h.Checkin, h.Checkout,
              h.Diaria, h.Total, h.Status, h.Observacoes, h.Cadastrado
       FROM tb_hospedagens h
       LEFT JOIN tb_pessoa p ON p.Codigo = h.Pessoa
       ORDER BY h.Checkin DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar hospedagens" });
  }
});

router.get("/:codigo", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const row = await queryOne(
      `SELECT h.Codigo, h.Pessoa, p.Nome AS pessoaNome, h.Quarto, h.Checkin, h.Checkout,
              h.Diaria, h.Total, h.Status, h.Observacoes, h.Cadastrado
       FROM tb_hospedagens h
       LEFT JOIN tb_pessoa p ON p.Codigo = h.Pessoa
       WHERE h.Codigo = ?`,
      [req.params.codigo]
    );
    if (!row) return res.status(404).json({ message: "Hospedagem não encontrada" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar hospedagem" });
  }
});

router.get("/pessoa/:pessoaId", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT h.Codigo, h.Pessoa, p.Nome AS pessoaNome, h.Quarto, h.Checkin, h.Checkout,
              h.Diaria, h.Total, h.Status, h.Observacoes, h.Cadastrado
       FROM tb_hospedagens h
       LEFT JOIN tb_pessoa p ON p.Codigo = h.Pessoa
       WHERE h.Pessoa = ? ORDER BY h.Checkin DESC`,
      [req.params.pessoaId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar hospedagens" });
  }
});

router.get("/status/:status", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT h.Codigo, h.Pessoa, p.Nome AS pessoaNome, h.Quarto, h.Checkin, h.Checkout,
              h.Diaria, h.Total, h.Status, h.Observacoes, h.Cadastrado
       FROM tb_hospedagens h
       LEFT JOIN tb_pessoa p ON p.Codigo = h.Pessoa
       WHERE h.Status = ? ORDER BY h.Checkin DESC`,
      [req.params.status]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar hospedagens" });
  }
});

router.post("/", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const { pessoa, quarto, checkin, checkout, diaria, total, status, observacoes } = req.body;

    if (!quarto?.trim()) return res.status(400).json({ message: "O número do quarto é obrigatório." });
    if (quarto.trim().length > 10) return res.status(400).json({ message: "O número do quarto deve ter no máximo 10 caracteres." });
    if (diaria <= 0) return res.status(400).json({ message: "O valor da diária deve ser maior que zero." });

    const statusFinal = STATUS_VALIDOS.includes(status?.trim()) ? status.trim() : "Ativa";

    const result = await execute(
      `INSERT INTO tb_hospedagens (Pessoa, Quarto, Checkin, Checkout, Diaria, Total, Status, Observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pessoa, quarto.trim(), checkin, checkout || null, diaria, total || null, statusFinal, observacoes?.trim() || null]
    );
    res.status(201).json({ codigo: Number(result.lastInsertRowid), message: "Hospedagem criada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar hospedagem" });
  }
});

router.put("/:codigo", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const codigo = parseInt(req.params.codigo);
    const { codigo: bodyCodigo, pessoa, quarto, checkin, checkout, diaria, total, status, observacoes } = req.body;
    if (codigo !== bodyCodigo) return res.status(400).json({ message: "Código informado não corresponde ao código da URL" });

    if (!quarto?.trim()) return res.status(400).json({ message: "O número do quarto é obrigatório." });
    if (diaria <= 0) return res.status(400).json({ message: "O valor da diária deve ser maior que zero." });

    const statusFinal = STATUS_VALIDOS.includes(status?.trim()) ? status.trim() : "Ativa";

    const result = await execute(
      `UPDATE tb_hospedagens SET Pessoa = ?, Quarto = ?, Checkin = ?, Checkout = ?, Diaria = ?, Total = ?, Status = ?, Observacoes = ? WHERE Codigo = ?`,
      [pessoa, quarto.trim(), checkin, checkout || null, diaria, total || null, statusFinal, observacoes?.trim() || null, codigo]
    );
    if (result.rowsAffected === 0) return res.status(404).json({ message: "Hospedagem não encontrada" });
    res.json({ message: "Hospedagem atualizada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar hospedagem" });
  }
});

router.delete("/:codigo", authorize(...Policies.ApenasAdministrador), async (req, res) => {
  try {
    const result = await execute("DELETE FROM tb_hospedagens WHERE Codigo = ?", [req.params.codigo]);
    if (result.rowsAffected === 0) return res.status(404).json({ message: "Hospedagem não encontrada" });
    res.json({ message: "Hospedagem excluída com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao excluir hospedagem" });
  }
});

export default router;
