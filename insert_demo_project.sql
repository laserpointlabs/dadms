INSERT INTO projects (id, name, description, owner_id, status, knowledge_domain, settings, decision_context, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Demo Project',
  'Demo project with decision context',
  (SELECT id FROM users WHERE email = 'admin@dadms.com' LIMIT 1),
  'active',
  'demo_domain',
  '{"default_llm": "openai/gpt-4", "personas": [], "tools_enabled": ["rag_search", "web_search"]}'::jsonb,
  'This is a demo decision context for testing.',
  NOW(),
  NOW()
); 