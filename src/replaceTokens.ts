export type TokenCollection = Record<string, unknown>;

export function replaceTokens(str: string, ...all: TokenCollection[]): string {
  const tokens = all.length === 1 ? all[0] : Object.assign({}, ...all);

  for (const token in tokens) {
    let value: any;
    if (typeof tokens[token] === 'function') {
      value = tokens[token](tokens);
    } else {
      value = tokens[token].toString();
    }
    str = str.replace(new RegExp(`:${token}(:|\\b)`, 'g'), value);
  }
  return str;
}
