import { Router } from "express";
import { queryAll, queryOne, execute } from "../db.js";
import { authenticate, authorize, Policies } from "../middleware/auth.js";
import { TipoTelefone, TipoEnderecoEletronico } from "../utils/helpers.js";
import { validarCnpj, limparCnpj } from "../utils/cnpj.js";

const router = Router();
router.use(authenticate);

// GET /api/pessoajuridica
router.get("/", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const pessoas = await queryAll("SELECT * FROM tb_pessoa WHERE tipo = 'J' ORDER BY cadastro DESC");
    const result = [];
    for (const p of pessoas) {
      const dto = await montarDto(p.codigo);
      if (dto) result.push(dto);
    }
    res.json(result);
  } catch (err) {
    console.error("Erro ao listar pessoas jurídicas:", err);
    res.status(500).json({ message: "Erro ao listar pessoas jurídicas" });
  }
});

// GET /api/pessoajuridica/:codigo
router.get("/:codigo", authorize(...Policies.QualquerAutenticado), async (req, res) => {
  try {
    const dto = await montarDto(req.params.codigo);
    if (!dto) return res.status(404).json({ message: "Pessoa jurídica não encontrada" });
    res.json(dto);
  } catch (err) {
    console.error("Erro ao buscar pessoa jurídica:", err);
    res.status(500).json({ message: "Erro ao buscar pessoa jurídica" });
  }
});

// POST /api/pessoajuridica
router.post("/", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const dto = req.body;

    if (dto.cnpj) {
      if (!validarCnpj(dto.cnpj)) {
        return res.status(400).json({ message: "CNPJ alfanumérico inválido. Verifique os dígitos verificadores." });
      }
      dto.cnpj = limparCnpj(dto.cnpj);
    }

    const insertPessoa = await execute(
      `INSERT INTO tb_pessoa (tipo, nome, cep, estado, cidade, bairro, endereco, numero, complemento, obs, cadastro)
       VALUES ('J', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [dto.nome, dto.cep, dto.estado, dto.cidade, dto.bairro, dto.endereco, dto.numero, dto.complemento, dto.obs]
    );
    const pessoaId = Number(insertPessoa.lastInsertRowid);

    await execute(
      `INSERT INTO tb_pessoa_juridica (Pessoa, razaosocial, cnpj, incricaoestadual, atividade, representante)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [pessoaId, dto.razaoSocial, dto.cnpj, dto.inscricaoEstadual, dto.atividade, dto.representante]
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

    res.status(201).json({ codigo: pessoaId, message: "Pessoa jurídica criada com sucesso" });
  } catch (err) {
    console.error("Erro ao criar pessoa jurídica:", err);
    res.status(500).json({ message: "Erro ao criar pessoa jurídica" });
  }
});

// PUT /api/pessoajuridica/:codigo
router.put("/:codigo", authorize(...Policies.UsuarioOuSuperior), async (req, res) => {
  try {
    const codigo = parseInt(req.params.codigo);
    const dto = req.body;
    if (codigo !== dto.codigo) {
      return res.status(400).json({ message: "Código informado não corresponde ao código da URL" });
    }

    if (dto.cnpj) {
      if (!validarCnpj(dto.cnpj)) {
        return res.status(400).json({ message: "CNPJ alfanumérico inválido. Verifique os dígitos verificadores." });
      }
      dto.cnpj = limparCnpj(dto.cnpj);
    }

    const pessoa = await queryOne("SELECT * FROM tb_pessoa WHERE codigo = ?", [codigo]);
    if (!pessoa) return res.status(404).json({ message: "Pessoa jurídica não encontrada" });

    await execute(
      `UPDATE tb_pessoa SET nome = ?, cep = ?, estado = ?, cidade = ?, bairro = ?, endereco = ?,
       numero = ?, complemento = ?, obs = ? WHERE codigo = ?`,
      [dto.nome, dto.cep, dto.estado, dto.cidade, dto.bairro, dto.endereco, dto.numero, dto.complemento, dto.obs, codigo]
    );

    await execute(
      `UPDATE tb_pessoa_juridica SET razaosocial = ?, cnpj = ?, incricaoestadual = ?, atividade = ?, representante = ?
       WHERE Pessoa = ?`,
      [dto.razaoSocial, dto.cnpj, dto.inscricaoEstadual, dto.atividade, dto.representante, codigo]
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

    res.json({ message: "Pessoa jurídica atualizada com sucesso" });
  } catch (err) {
    console.error("Erro ao atualizar pessoa jurídica:", err);
    res.status(500).json({ message: "Erro ao atualizar pessoa jurídica" });
  }
});

async function montarDto(codigo) {
  const pessoa = await queryOne("SELECT * FROM tb_pessoa WHERE codigo = ?", [codigo]);
  if (!pessoa || pessoa.tipo !== "J") return null;

  const pj = await queryOne("SELECT * FROM tb_pessoa_juridica WHERE Pessoa = ?", [codigo]);
  if (!pj) return null;

  const telefones = await queryAll("SELECT * FROM tb_pessoa_telefone WHERE pessoa = ? ORDER BY tipo, codigo", [codigo]);
  const endEletronicos = await queryAll("SELECT * FROM tb_pessoa_endereco_eletronico WHERE pessoa = ? ORDER BY tipo, codigo", [codigo]);

  let estadoNome = null, cidadeNome = null, bairroNome = null, enderecoNome = null, representanteNome = null;

  if (pessoa.estado) { const r = await queryOne("SELECT nome FROM tb_estado WHERE codigo = ?", [pessoa.estado]); estadoNome = r?.nome; }
  if (pessoa.cidade) { const r = await queryOne("SELECT nome FROM tb_cidade WHERE codigo = ?", [pessoa.cidade]); cidadeNome = r?.nome; }
  if (pessoa.bairro) { const r = await queryOne("SELECT nome FROM tb_bairro WHERE codigo = ?", [pessoa.bairro]); bairroNome = r?.nome; }
  if (pessoa.endereco) { const r = await queryOne("SELECT nome FROM tb_endereco WHERE codigo = ?", [pessoa.endereco]); enderecoNome = r?.nome; }
  if (pj.representante) { const r = await queryOne("SELECT nome FROM tb_pessoa WHERE codigo = ?", [pj.representante]); representanteNome = r?.nome; }

  return {
    codigo: pessoa.codigo, razaoSocial: pj.razaosocial, nome: pessoa.nome,
    cnpj: pj.cnpj, inscricaoEstadual: pj.incricaoestadual,
    atividade: pj.atividade, representante: pj.representante, representanteNome,
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
    obs: pessoa.obs, cadastro: pessoa.cadastro,
  };
}

export default router;
