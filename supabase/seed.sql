-- Seed: categorías iniciales
INSERT INTO public.categories (name, slug, description, icon, color, sort_order) VALUES
  ('Ĝenerala',   'generala',    'Ĝenerala diskutado',             '💬', '#1B7A4A', 1),
  ('Lernado',    'lernado',     'Lernado de Esperanto',           '📚', '#0369a1', 2),
  ('Kulturo',    'kulturo',     'Kulturo, libroj, muziko, filmo', '🎭', '#7c3aed', 3),
  ('Novaĵoj',   'novajoj',     'Novaĵoj de la Esperanto-mondo',  '📰', '#b45309', 4),
  ('Teknologio', 'teknologio',  'Teknologio kaj scienco',         '💻', '#0f766e', 5),
  ('Vojaĝoj',   'vojagoj',     'Vojaĝoj kaj renkontiĝoj',        '✈️', '#0891b2', 6),
  ('Helpo',      'helpo',       'Helpo kaj demandoj',             '🤝', '#16a34a', 7),
  ('Ludoj',      'ludoj',       'Ludoj kaj amuzaĵoj',             '🎮', '#dc2626', 8);
