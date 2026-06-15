import { Router } from "express";
import { queryAll, queryOne, execute } from "../db.js";
import { authenticate, authorize, Policies } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

// GET /api/pessoa
router.get("/", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll("SELECT * FROM tb_pessoa ORDER BY cadastro DESC");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar pessoas:", err);
    res.status(500).json({ message: "Erro ao listar pessoas" });
  }
});

// GET /api/pessoa/:codigo
router.get("/:codigo", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const row = await queryOne("SELECT * FROM tb_pessoa WHERE codigo = ?", [req.params.codigo]);
    if (!row) return res.status(404).json({ message: "Pessoa não encontrada" });
    res.json(row);
  } catch (err) {
    console.error("Erro ao buscar pessoa:", err);
    res.status(500).json({ message: "Erro ao buscar pessoa" });
  }
});

// GET /api/pessoa/search?termo=
router.get("/search", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const termo = req.query.termo;
    if (!termo) return res.status(400).json({ message: "Termo de busca não pode ser vazio" });

    const searchTerm = `%${termo}%`;
    const rows = await queryAll(
      `SELECT p.* FROM tb_pessoa p
       LEFT JOIN tb_pessoa_fisica pf ON p.codigo = pf.pessoa
       LEFT JOIN tb_pessoa_juridica pj ON p.codigo = pj.Pessoa
       WHERE p.nome LIKE ? OR pf.cpf LIKE ? OR pj.cnpj LIKE ?
       ORDER BY p.cadastro DESC`,
      [searchTerm, searchTerm, searchTerm]
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao pesquisar pessoas:", err);
    res.status(500).json({ message: "Erro ao pesquisar pessoas" });
  }
});

// DELETE /api/pessoa/:codigo
router.delete("/:codigo", authorize(...Policies.ApenasAdministrador), async (req, res) => {
  try {
    const pessoa = await queryOne("SELECT * FROM tb_pessoa WHERE codigo = ?", [req.params.codigo]);
    if (!pessoa) return res.status(404).json({ message: "Pessoa não encontrada" });

    await execute("DELETE FROM tb_pessoa_endereco_eletronico WHERE pessoa = ?", [req.params.codigo]);
    await execute("DELETE FROM tb_pessoa_telefone WHERE pessoa = ?", [req.params.codigo]);

    if (pessoa.tipo === "F") {
      await execute("DELETE FROM tb_pessoa_fisica WHERE pessoa = ?", [req.params.codigo]);
    } else if (pessoa.tipo === "J") {
      await execute("DELETE FROM tb_pessoa_juridica WHERE Pessoa = ?", [req.params.codigo]);
    }

    await execute("DELETE FROM tb_pessoa WHERE codigo = ?", [req.params.codigo]);
    res.json({ message: "Pessoa excluída com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir pessoa:", err);
    res.status(500).json({ message: "Erro ao excluir pessoa" });
  }
});

export default router;
