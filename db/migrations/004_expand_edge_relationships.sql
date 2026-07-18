ALTER TABLE knowledge_edges DROP CONSTRAINT IF EXISTS knowledge_edges_relationship_type_check;
ALTER TABLE knowledge_edges ADD CONSTRAINT knowledge_edges_relationship_type_check
  CHECK (relationship_type IN ('prerequisite', 'supporting', 'part_of', 'equivalent', 'related', 'next_skill'));
