import { Router } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { queryOne, execute } from "../db.js";
import { hashSenha, verificarSenha } from "../utils/helpers.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const secret = process.env.JWT_SECRET || "fallback-secret";
const expirationHours = parseInt(process.env.JWT_EXPIRATION_HOURS || "8");

function gerarToken(usuarioId, usuario, tipo) {
  return jwt.sign(
    {
      nameid: usuarioId.toString(),
      unique_name: usuario,
      role: tipo.toString(),
    },
    secret,
    {
      expiresIn: `${expirationHours}h`,
      issuer: "SistemaCadastro",
      audience: "SistemaCadastroAPI",
    }
  );
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    if (!usuario || !senha) {
      return res.status(400).json({ success: false, message: "Usuário e senha obrigatórios" });
    }

    const user = await queryOne(
      "SELECT codigo, usuario AS usuarioLogin, senha, tipo, pessoa, cadastro FROM tb_usuario WHERE usuario = ?",
      [usuario]
    );

    if (!user || !verificarSenha(senha, user.senha)) {
      return res.status(401).json({ success: false, message: "Usuário ou senha inválidos" });
    }

    let nomePessoa = null;
    if (user.pessoa) {
      const p = await queryOne("SELECT nome FROM tb_pessoa WHERE codigo = ?", [user.pessoa]);
      nomePessoa = p?.nome || null;
    }

    const token = gerarToken(user.codigo, user.usuarioLogin, user.tipo);

    res.json({
      success: true,
      message: "Login realizado com sucesso",
      token,
      usuario: {
        codigo: user.codigo,
        usuario: user.usuarioLogin,
        tipo: user.tipo,
        pessoa: user.pessoa,
        nomePessoa,
        cadastro: user.cadastro,
      },
    });
  } catch (err) {
    console.error("Erro ao realizar login:", err);
    res.status(500).json({ success: false, message: "Erro ao realizar login" });
  }
});

// POST /api/auth/registrar
router.post("/registrar", async (req, res) => {
  try {
    const { usuario, senha, confirmarSenha, tipo, pessoa } = req.body;

    if (senha !== confirmarSenha) {
      return res.status(400).json({ success: false, message: "As senhas não coincidem" });
    }

    const existente = await queryOne("SELECT codigo FROM tb_usuario WHERE usuario = ?", [usuario]);
    if (existente) {
      return res.status(400).json({ success: false, message: "Este usuário já está cadastrado" });
    }

    const senhaHash = hashSenha(senha);
    const result = await execute(
      "INSERT INTO tb_usuario (usuario, senha, tipo, pessoa, cadastro) VALUES (?, ?, ?, ?, datetime('now'))",
      [usuario, senhaHash, tipo || 2, pessoa || null]
    );

    const codigo = Number(result.lastInsertRowid);
    const token = gerarToken(codigo, usuario, tipo || 2);

    res.status(201).json({
      success: true,
      message: "Usuário registrado com sucesso",
      token,
      usuario: { codigo, usuario, tipo: tipo || 2, pessoa: pessoa || null, cadastro: new Date().toISOString() },
    });
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    res.status(500).json({ success: false, message: "Erro ao registrar usuário" });
  }
});

// POST /api/auth/alterar-senha
router.post("/alterar-senha", authenticate, async (req, res) => {
  try {
    const usuarioId = parseInt(req.user.nameid);
    const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body;

    if (novaSenha !== confirmarNovaSenha) {
      return res.status(400).json({ message: "As novas senhas não coincidem" });
    }

    const user = await queryOne("SELECT senha FROM tb_usuario WHERE codigo = ?", [usuarioId]);
    if (!user || !verificarSenha(senhaAtual, user.senha)) {
      return res.status(400).json({ message: "Não foi possível alterar a senha. Verifique se a senha atual está correta." });
    }

    const novaHash = hashSenha(novaSenha);
    await execute("UPDATE tb_usuario SET senha = ? WHERE codigo = ?", [novaHash, usuarioId]);

    res.json({ message: "Senha alterada com sucesso" });
  } catch (err) {
    console.error("Erro ao alterar senha:", err);
    res.status(500).json({ message: "Erro ao alterar senha" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const usuarioId = parseInt(req.user.nameid);
    const user = await queryOne(
      "SELECT codigo, usuario AS usuarioLogin, tipo, pessoa, cadastro FROM tb_usuario WHERE codigo = ?",
      [usuarioId]
    );

    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    let nomePessoa = null;
    if (user.pessoa) {
      const p = await queryOne("SELECT nome FROM tb_pessoa WHERE codigo = ?", [user.pessoa]);
      nomePessoa = p?.nome || null;
    }

    res.json({
      codigo: user.codigo,
      usuario: user.usuarioLogin,
      tipo: user.tipo,
      pessoa: user.pessoa,
      nomePessoa,
      cadastro: user.cadastro,
    });
  } catch (err) {
    console.error("Erro ao buscar usuário:", err);
    res.status(500).json({ message: "Erro ao buscar usuário" });
  }
});

// GET /api/auth/validar-token
router.get("/validar-token", authenticate, (req, res) => {
  res.json({ valid: true, message: "Token válido" });
});

export default router;
