const TABELA_SERPRO = {
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  A: 17, B: 18, C: 19, D: 20, E: 21, F: 22, G: 23, H: 24, I: 25,
  J: 26, K: 27, L: 28, M: 29, N: 30, O: 31, P: 32, Q: 33, R: 34,
  S: 35, T: 36, U: 37, V: 38, W: 39, X: 40, Y: 41, Z: 42,
};

function obterValor(caractere) {
  const c = caractere.toUpperCase();
  return TABELA_SERPRO[c] ?? -1;
}

const PESOS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function calcularDigito(cnpj, pesos) {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) {
    const valor = obterValor(cnpj[i]);
    if (valor === -1) return -1;
    soma += valor * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCnpj(cnpj) {
  if (!cnpj) return false;

  const limpo = cnpj.replace(/[.\-\/]/g, "").toUpperCase();
  if (limpo.length !== 14) return false;

  const primeiros12 = limpo.substring(0, 12);
  for (const c of primeiros12) {
    if (obterValor(c) === -1) return false;
  }

  const dv1 = parseInt(limpo[12], 10);
  const dv2 = parseInt(limpo[13], 10);

  if (isNaN(dv1) || isNaN(dv2)) return false;

  const digito1 = calcularDigito(limpo, PESOS_1);
  const digito2 = calcularDigito(limpo, PESOS_2);

  return digito1 === dv1 && digito2 === dv2;
}

export function limparCnpj(cnpj) {
  return cnpj.replace(/[.\-\/]/g, "").toUpperCase();
}
