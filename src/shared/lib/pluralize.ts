interface PluralForms {
  /** 2–4, 22–24 … («события») */
  few: string;
  /** 0, 5–20, 25–30 … («событий») */
  many: string;
  /** 1, 21, 31 … («событие») */
  one: string;
}

const pluralRules = new Intl.PluralRules('ru');
const numberFormat = new Intl.NumberFormat('ru');

function pluralize(count: number, forms: PluralForms) {
  const rule = pluralRules.select(count);
  if (rule === 'one') return forms.one;
  if (rule === 'few') return forms.few;
  return forms.many;
}

function formatCount(count: number, forms: PluralForms) {
  return `${numberFormat.format(count)} ${pluralize(count, forms)}`;
}

export {formatCount, pluralize};
