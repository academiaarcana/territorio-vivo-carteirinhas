export const indicatorScopes = [
  { id: 'microarea', label: 'Minha microárea' },
  { id: 'team', label: 'Minha equipe' }
];

export const indicatorDefinitions = [
  { id: 'active_population', label: 'População ativa', group: 'population' },
  { id: 'families', label: 'Famílias', group: 'population' },
  { id: 'elderly', label: 'Pessoas idosas', group: 'population' },
  { id: 'pregnant', label: 'Gestantes', group: 'population' },
  { id: 'disability', label: 'Pessoas com deficiência', group: 'population' },
  { id: 'hypertension', label: 'Hipertensão', group: 'conditions' },
  { id: 'diabetes', label: 'Diabetes', group: 'conditions' },
  { id: 'smoking', label: 'Tabagismo', group: 'conditions' },
  { id: 'homebound', label: 'Domiciliados', group: 'care' },
  { id: 'bedridden', label: 'Acamados', group: 'care' },
  { id: 'mental_health', label: 'Saúde mental', group: 'care' },
  { id: 'updates_pending', label: 'Cadastros para atualizar', group: 'work' },
  { id: 'active_search_pending', label: 'Buscas ativas pendentes', group: 'work' }
];

export const indicatorGroups = {
  population: 'População',
  conditions: 'Condições acompanhadas',
  care: 'Necessidades de cuidado',
  work: 'Organização do trabalho'
};
