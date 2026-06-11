import jwt from "jsonwebtoken";
import "dotenv/config";

const secret = process.env.JWT_SECRET || "fallback-secret";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    const userRole = parseInt(req.user.role);
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: "Sem permissão para esta ação" });
    }
    next();
  };
}

export const Roles = {
  Administrador: 1,
  Usuario: 2,
  Convidado: 3,
};

export const Policies = {
  ApenasAdministrador: [Roles.Administrador],
  UsuarioOuSuperior: [Roles.Administrador, Roles.Usuario],
  QualquerAutenticado: [Roles.Administrador, Roles.Usuario, Roles.Convidado],
};
