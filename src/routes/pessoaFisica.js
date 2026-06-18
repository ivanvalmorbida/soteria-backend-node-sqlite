import { Router } from "express";
import { queryAll, queryOne, execute } from "../db.js";
import { authenticate, authorize, Policies } from "../middleware/auth.js";
import { TipoTelefone, TipoEnderecoEletronico } from "../utils/helpers.js";

const router = Router();
router.use(authenticate);

// GET /api/pessoafisica
router.get("/", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const pessoas = await queryAll("SELECT * FROM tb_pessoa WHERE tipo = 'F' ORDER BY cadastro DESC");
    const result = [];
    for (const p of pessoas) {
      const dto = await montarDto(p.codigo);
      if (dto) result.push(dto);
    }
    res.json(result);
  } catch (err) {
    console.error("Erro ao listar pessoas físicas:", err);
    res.status(500).json({ message: "Erro ao listar pessoas físicas" });
  }
});

// GET /api/pessoafisica/:codigo
router.get("/:codigo", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const dto = await montarDto(req.params.codigo);
    if (!dto) return res.status(404).json({ message: "Pessoa física não encontrada" });
    res.json(dto);
  } catch (err) {
    console.error("Erro ao buscar pessoa física:", err);
    res.status(500).json({ message: "Erro ao buscar pessoa física" });
  }
});

// GET /api/pessoafisica/nome/:nome
router.get("/nome/:nome", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT p.* FROM tb_pessoa p
       INNER JOIN tb_pessoa_fisica pf ON pf.pessoa = p.codigo
       WHERE p.tipo = 'F' AND p.nome LIKE '%' || ? || '%'
       ORDER BY p.nome`,
      [req.params.nome]
    );
    const result = [];
    for (const p of rows) {
      const dto = await montarDto(p.codigo);
      if (dto) result.push(dto);
    }
    res.json(result);
  } catch (err) {
    console.error("Erro ao buscar pessoas físicas por nome:", err);
    res.status(500).json({ message: "Erro ao buscar pessoas físicas" });
  }
});

// POST /api/pessoafisica
router.post("/", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const dto = req.body;

    const insertPessoa = await execute(
      `INSERT INTO tb_pessoa (tipo, nome, cep, estado, cidade, bairro, endereco, numero, complemento, obs, cadastro)
       VALUES ('F', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [dto.nome, dto.cep, dto.estado, dto.cidade, dto.bairro, dto.endereco, dto.numero, dto.complemento, dto.obs]
    );
    const pessoaId = Number(insertPessoa.lastInsertRowid);

    await execute(
      `INSERT INTO tb_pessoa_fisica (pessoa, nascimento, cidadenasc, ufnasc, nacionalidade, sexo, cpf, estadocivil, conjuge, profissao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pessoaId, dto.nascimento, dto.cidadeNasc, dto.ufNasc, dto.nacionalidade, dto.sexo, dto.cpf, dto.estadoCivil, dto.conjuge, dto.profissao]
    );

    if (dto.telefones?.length) {
      for (const tel of dto.telefones) {
        const numero = tel.telefone?.replace(/\D/g, "");
        if (numero) {
          await execute(
            "INSERT INTO tb_pessoa_telefone (pessoa, tipo, telefone, descricao) VALUES (?, ?, ?, ?)",
            [pessoaId, tel.tipo || TipoTelefone.Celular, numero, tel.descricao]
          );
        }
      }
    }

    if (dto.enderecosEletronicos?.length) {
      for (const end of dto.enderecosEletronicos) {
        if (end.endereco) {
          await execute(
            "INSERT INTO tb_pessoa_endereco_eletronico (pessoa, endereco, tipo, descricao) VALUES (?, ?, ?, ?)",
            [pessoaId, end.endereco, end.tipo || TipoEnderecoEletronico.Email, end.descricao]
          );
        }
      }
    }

    res.status(201).json({ codigo: pessoaId, message: "Pessoa física criada com sucesso" });
  } catch (err) {
    console.error("Erro ao criar pessoa física:", err);
    res.status(500).json({ message: "Erro ao criar pessoa física" });
  }
});

// PUT /api/pessoafisica/:codigo
router.put("/:codigo", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const codigo = parseInt(req.params.codigo);
    const dto = req.body;
    if (Number(codigo) !== Number(dto.codigo)) {
      return res.status(400).json({ message: "Código informado não corresponde ao código da URL" });
    }

    const pessoa = await queryOne("SELECT * FROM tb_pessoa WHERE codigo = ?", [codigo]);
    if (!pessoa) return res.status(404).json({ message: "Pessoa física não encontrada" });

    await execute(
      `UPDATE tb_pessoa SET nome = ?, cep = ?, estado = ?, cidade = ?, bairro = ?, endereco = ?,
       numero = ?, complemento = ?, obs = ? WHERE codigo = ?`,
      [dto.nome, dto.cep, dto.estado, dto.cidade, dto.bairro, dto.endereco, dto.numero, dto.complemento, dto.obs, codigo]
    );

    await execute(
      `UPDATE tb_pessoa_fisica SET nascimento = ?, cidadenasc = ?, ufnasc = ?, nacionalidade = ?,
       sexo = ?, cpf = ?, estadocivil = ?, conjuge = ?, profissao = ? WHERE pessoa = ?`,
      [dto.nascimento, dto.cidadeNasc, dto.ufNasc, dto.nacionalidade, dto.sexo, dto.cpf, dto.estadoCivil, dto.conjuge, dto.profissao, codigo]
    );

    await execute("DELETE FROM tb_pessoa_telefone WHERE pessoa = ?", [codigo]);
    if (dto.telefones?.length) {
      for (const tel of dto.telefones) {
        const numero = tel.telefone?.replace(/\D/g, "");
        if (numero) {
          await execute(
            "INSERT INTO tb_pessoa_telefone (pessoa, tipo, telefone, descricao) VALUES (?, ?, ?, ?)",
            [codigo, tel.tipo || TipoTelefone.Celular, numero, tel.descricao]
          );
        }
      }
    }

    await execute("DELETE FROM tb_pessoa_endereco_eletronico WHERE pessoa = ?", [codigo]);
    if (dto.enderecosEletronicos?.length) {
      for (const end of dto.enderecosEletronicos) {
        if (end.endereco) {
          await execute(
            "INSERT INTO tb_pessoa_endereco_eletronico (pessoa, endereco, tipo, descricao) VALUES (?, ?, ?, ?)",
            [codigo, end.endereco, end.tipo || TipoEnderecoEletronico.Email, end.descricao]
          );
        }
      }
    }

    res.json({ message: "Pessoa física atualizada com sucesso" });
  } catch (err) {
    console.error("Erro ao atualizar pessoa física:", err);
    res.status(500).json({ message: "Erro ao atualizar pessoa física" });
  }
});

async function montarDto(codigo) {
  const pessoa = await queryOne("SELECT * FROM tb_pessoa WHERE codigo = ?", [codigo]);
  if (!pessoa || pessoa.tipo !== "F") return null;

  const pf = await queryOne("SELECT * FROM tb_pessoa_fisica WHERE pessoa = ?", [codigo]);
  if (!pf) return null;

  const telefones = await queryAll("SELECT * FROM tb_pessoa_telefone WHERE pessoa = ? ORDER BY tipo, codigo", [codigo]);
  const endEletronicos = await queryAll("SELECT * FROM tb_pessoa_endereco_eletronico WHERE pessoa = ? ORDER BY tipo, codigo", [codigo]);

  let estadoNome = null, cidadeNome = null, bairroNome = null, enderecoNome = null, profissaoDesc = null;

  if (pessoa.estado) { const r = await queryOne("SELECT nome FROM tb_estado WHERE codigo = ?", [pessoa.estado]); estadoNome = r?.nome; }
  if (pessoa.cidade) { const r = await queryOne("SELECT nome FROM tb_cidade WHERE codigo = ?", [pessoa.cidade]); cidadeNome = r?.nome; }
  if (pessoa.bairro) { const r = await queryOne("SELECT nome FROM tb_bairro WHERE codigo = ?", [pessoa.bairro]); bairroNome = r?.nome; }
  if (pessoa.endereco) { const r = await queryOne("SELECT nome FROM tb_endereco WHERE codigo = ?", [pessoa.endereco]); enderecoNome = r?.nome; }
  if (pf.profissao) { const r = await queryOne("SELECT Descricao FROM tb_cbo WHERE CBO = ?", [String(pf.profissao)]); profissaoDesc = r?.descricao; }

  return {
    codigo: pessoa.codigo, nome: pessoa.nome, cpf: pf.cpf, nascimento: pf.nascimento,
    sexo: pf.sexo, estadoCivil: pf.estadocivil, nacionalidade: pf.nacionalidade,
    profissao: pf.profissao, profissaoDescricao: profissaoDesc,
    cidadeNasc: pf.cidadenasc, ufNasc: pf.ufnasc,
    cep: pessoa.cep, estado: pessoa.estado, estadoNome, cidade: pessoa.cidade, cidadeNome,
    bairro: pessoa.bairro, bairroNome, endereco: pessoa.endereco, enderecoNome,
    numero: pessoa.numero, complemento: pessoa.complemento,
    telefones: telefones.map(t => ({
      codigo: t.codigo, telefone: TipoTelefone.formatarTelefone(t.telefone),
      tipo: t.tipo, tipoDescricao: TipoTelefone.obterDescricao(t.tipo), descricao: t.descricao,
    })),
    enderecosEletronicos: endEletronicos.map(e => ({
      codigo: e.codigo, endereco: e.endereco, tipo: e.tipo,
      tipoDescricao: e.tipo ? TipoEnderecoEletronico.obterDescricao(e.tipo) : null, descricao: e.descricao,
    })),
    conjuge: pf.conjuge, obs: pessoa.obs, cadastro: pessoa.cadastro,
  };
}

export default router;
