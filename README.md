# QueroForms

QueroForms é um motor de diagnósticos orientado à conversão, inspirado em experiências de quiz/assessment: uma pergunta por tela, telas de contexto, score, captura de lead, resultado personalizado e oferta final.

## Stack

- GitHub
- GitHub Pages
- React + Vite
- Supabase

## Rotas

- `/` — painel
- `/builder/gp-ia` — editor do diagnóstico GP com IA
- `/d/gp-ia` — diagnóstico público
- `/contacts` — contatos
- `/responses` — respostas
- `/analytics` — análises
- `/workflows` — workflows
- `/settings` — configurações

## Supabase

O frontend grava respostas em `public.submissions` usando a chave anon pública e RLS. Rode o SQL de `supabase/schema.sql` no SQL Editor do Supabase.

## GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` publica automaticamente a branch `main` no GitHub Pages.

Domínio configurado em `public/CNAME`:

`forms.trentim.com`

No DNS do domínio, configure um CNAME:

- Nome: `forms`
- Destino: `keisse.github.io`
