-- Atualiza a tela PMBOK 8a edicao (insight-1) no diagnostico gp-ia.
-- Remove a descricao e substitui as tres linhas anteriores pelas sete competencias numeradas.

with updated as (
  select slug,
    (
      select jsonb_agg(
        case when elem->>'id' = 'insight-1' then
          jsonb_set(
            jsonb_set(elem, '{body}', to_jsonb(''::text), true),
            '{icons}',
            '[
              {"emoji":"1.","text":"Alfabetizacao e consciencia de dados"},
              {"emoji":"2.","text":"Pensamento critico e resolucao de problemas"},
              {"emoji":"3.","text":"Praticas confiaveis de IA"},
              {"emoji":"4.","text":"Comunicacao entre equipes tecnicas e de negocios"},
              {"emoji":"5.","text":"Entrega agil e iterativa para projetos de IA"},
              {"emoji":"6.","text":"Compreensao das tecnologias de IA e seu ciclo de vida"},
              {"emoji":"7.","text":"Dominio de ferramentas e gestao pratica de projetos"}
            ]'::jsonb,
            true
          )
        else elem end
        order by ordinality
      )
      from jsonb_array_elements(config->'steps') with ordinality t(elem, ordinality)
    ) as new_steps,
    (
      select jsonb_agg(
        case when elem->>'id' = 'insight-1' then
          jsonb_set(
            jsonb_set(elem, '{body}', to_jsonb(''::text), true),
            '{icons}',
            '[
              {"emoji":"1.","text":"Alfabetizacao e consciencia de dados"},
              {"emoji":"2.","text":"Pensamento critico e resolucao de problemas"},
              {"emoji":"3.","text":"Praticas confiaveis de IA"},
              {"emoji":"4.","text":"Comunicacao entre equipes tecnicas e de negocios"},
              {"emoji":"5.","text":"Entrega agil e iterativa para projetos de IA"},
              {"emoji":"6.","text":"Compreensao das tecnologias de IA e seu ciclo de vida"},
              {"emoji":"7.","text":"Dominio de ferramentas e gestao pratica de projetos"}
            ]'::jsonb,
            true
          )
        else elem end
        order by ordinality
      )
      from jsonb_array_elements(coalesce(config->'draft_steps', config->'steps')) with ordinality t(elem, ordinality)
    ) as new_draft_steps
  from public.surveys
  where slug='gp-ia'
)
update public.surveys s
set config = jsonb_set(jsonb_set(s.config,'{steps}',u.new_steps,true),'{draft_steps}',u.new_draft_steps,true),
    updated_at = now()
from updated u
where s.slug=u.slug;
