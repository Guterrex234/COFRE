// Calculadora segura: interpreta expressões como "120+45,90×2" sem usar eval.
'use strict';

const Calc = (() => {
  const OPS = { '+': 1, '-': 1, '×': 2, '÷': 2 };

  function tokenize(expr) {
    const tokens = [];
    let num = '';
    for (const ch of expr) {
      if (/[0-9]/.test(ch)) num += ch;
      else if (ch === ',' || ch === '.') {
        if (num.includes('.')) return null;
        num += '.';
      } else if (ch in OPS) {
        if (num === '' || num === '.' || num === '-') {
          // sinal de negativo no início: "-50"
          if (ch === '-' && tokens.length === 0 && num === '') { num = '-'; continue; }
          return null;
        }
        tokens.push(parseFloat(num), ch);
        num = '';
      } else if (ch !== ' ') return null;
    }
    if (num === '' || num === '-' || num === '.') {
      // expressão terminando em operador: ignora o operador final ("100+" vale 100)
      if (tokens.length && typeof tokens[tokens.length - 1] === 'string') tokens.pop();
      else if (!tokens.length) return null;
    } else tokens.push(parseFloat(num));
    return tokens;
  }

  // Avalia respeitando precedência (× e ÷ antes de + e −).
  function evaluate(expr) {
    const t = tokenize(expr);
    if (!t || !t.length) return null;
    const terms = [t[0]];
    const signs = [];
    for (let i = 1; i < t.length; i += 2) {
      const op = t[i], n = t[i + 1];
      if (OPS[op] === 2) {
        const prev = terms.pop();
        if (op === '÷' && n === 0) return null;
        terms.push(op === '×' ? prev * n : prev / n);
      } else {
        signs.push(op);
        terms.push(n);
      }
    }
    let total = terms[0];
    for (let i = 0; i < signs.length; i++) total = signs[i] === '+' ? total + terms[i + 1] : total - terms[i + 1];
    if (!isFinite(total)) return null;
    return Math.round(total * 100); // em centavos
  }

  const hasOperator = (expr) => /[+×÷]|.-/.test(expr);

  return { evaluate, hasOperator };
})();
