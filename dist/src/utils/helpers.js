import crypto from "node:crypto";

export function hashSenha(senha) {
  return crypto.createHash("sha256").update(senha, "utf-8").digest("base64");
}

export function verificarSenha(senha, hash) {
  return hashSenha(senha) === hash;
}

export const TipoTelefone = {
  Celular: 1,
  Fixo: 2,
  Comercial: 3,
  Recado: 4,
  WhatsApp: 5,

  parseTelefone(numero) {
    return numero.replace(/\D/g, "");
  },

  formatarTelefone(numero) {
    if (!numero) return "";
    const digits = numero.replace(/\D/g, "");
    if (digits.length === 11) {
      return `(${digits[0]}${digits[1]}) ${digits[2]}${digits[3]}${digits[4]}${digits[5]}-${digits[6]}${digits[7]}${digits[8]}${digits[9]}${digits[10]}`;
    }
    if (digits.length === 10) {
      return `(${digits[0]}${digits[1]}) ${digits[2]}${digits[3]}${digits[4]}-${digits[5]}${digits[6]}${digits[7]}${digits[8]}${digits[9]}`;
    }
    return digits;
  },

  obterDescricao(tipo) {
    const map = { 1: "Celular", 2: "Fixo", 3: "Comercial", 4: "Recado", 5: "WhatsApp" };
    return map[tipo] || null;
  },
};

export const TipoEnderecoEletronico = {
  Email: 1,
  Site: 2,
  Instagram: 3,
  Facebook: 4,
  LinkedIn: 5,
  TikTok: 6,
  YouTube: 7,
  Outro: 99,

  obterDescricao(tipo) {
    const map = {
      1: "E-mail", 2: "Site", 3: "Instagram", 4: "Facebook",
      5: "LinkedIn", 6: "TikTok", 7: "YouTube", 99: "Outro",
    };
    return map[tipo] || null;
  },
};

export function wrapAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err, req, res, _next) {
  console.error("Erro:", err.message);
  if (err.message?.startsWith("Descricao") || err.message?.includes("obrigatório")) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: "Erro interno do servidor" });
}
