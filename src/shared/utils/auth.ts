function makeToken(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

export {makeToken};
