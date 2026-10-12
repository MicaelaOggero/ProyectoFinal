const ALIAS_GROUPS = [
  ["javascript", "js", "javascript ecmascript"],
  ["typescript", "ts"],
  ["node.js", "node", "nodejs"],
  ["react", "react.js", "reactjs"],
  ["vue", "vue.js", "vuejs"],
  ["angular", "angular.js", "angularjs"],
  ["mongodb", "mongo", "mongo db"],
  ["postgresql", "postgres", "postgres sql"],
  ["mysql"],
  ["html", "html5"],
  ["css", "css3"],
  ["docker"],
  ["kubernetes", "k8s"],
  ["ci/cd", "ci cd", "cicd", "continuous integration", "continuous delivery"],
  ["machine learning", "ml"],
  ["artificial intelligence", "ai"]
];

const ALIAS_TO_CANONICAL = new Map(
  ALIAS_GROUPS.flatMap(([canonical, ...aliases]) =>
    [canonical, ...aliases].map((alias) => [alias, canonical])
  )
);

export function normalizarHabilidad(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");

  return ALIAS_TO_CANONICAL.get(normalized) || normalized;
}

export function normalizarListaHabilidades(values = []) {
  return [...new Set(
    values
      .map(normalizarHabilidad)
      .filter(Boolean)
  )];
}

