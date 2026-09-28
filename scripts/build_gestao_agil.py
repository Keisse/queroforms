"""Generate the Builder seed for Gestão Ágil sem Bagunça."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
likert = [dict(label=label, value=str(i), score=i-1) for i, label in enumerate([
    'Discordo totalmente', 'Discordo', 'Nem concordo nem discordo',
    'Concordo', 'Concordo totalmente'], 1)]

def question(n, title, dimension, options=None):
    if options is None:
        return dict(id=f'agile-q{n}', kind='question', title=title, input='scale', dimension=dimension, options=likert)
    return dict(id=f'agile-q{n}', kind='question', title=title, input='single', dimension=dimension,
                options=[dict(label=label, value=str(i), score=i) for i, label in enumerate(options)])

def context(n, title, body, source, visual='sparkle', **extra):
    return dict(id=f'agile-context-{n}', kind='insight', eyebrow='PMI | Guia de práticas ágeis',
                title=title, body=body, source=source, visual=visual, **extra)

steps = [
    dict(id='intro', kind='intro', title='Seu trabalho é ágil ou só parece ágil? 👀',
         body='Reuniões, post-its e tarefas em um quadro podem até parecer agilidade. Mas o que acontece quando as prioridades mudam, o trabalho trava ou chega a hora de entregar?\n\nEm poucos minutos, descubra como você lida com essas situações — e onde pode trocar a correria por resultados.\n[[QF_INTRO_IMAGE:https://forms.trentim.com/books/gestao-agil-sem-bagunca-cover.webp]]',
         cta='Começar diagnóstico', art='hero'),
    dict(id='agile-start-response', kind='branch', variants={
        'sim':dict(title='Vamos ver o que acontece na prática.', body='Agilidade de verdade aparece nas decisões do dia a dia. Responda pensando em como você costuma agir, não em como gostaria de agir.'),
        'nao':dict(title='Vamos começar por onde você está.', body='Você não precisa conhecer Scrum ou Kanban para responder. Pense no que faz quando precisa organizar, entregar e ajustar seu trabalho.')}),
    question(1,'Quando tudo parece urgente, consigo escolher o que gera mais valor.','foco_valor'),
    question(2,'Antes de começar uma tarefa, procuro entender para quem ela será útil.','foco_valor'),
    question(3,'Evito começar muitas coisas ao mesmo tempo.','fluxo_entrega'),
    question(4,'Consigo transformar trabalho em entregas pequenas e concluídas.','fluxo_entrega'),
    question(5,'Quando algo trava, converso com as pessoas envolvidas para encontrar uma saída.','colaboracao_autonomia'),
    question(6,'Uso o feedback para mudar meu plano quando necessário.','adaptacao_aprendizado'),
    context(1,'Ter um quadro cheio não significa avançar.','O que importa é fazer o trabalho fluir até uma entrega útil. Ao limitar tarefas simultâneas, você enxerga melhor os bloqueios e abre espaço para concluir.',
            'PMI, Guia de práticas ágeis, 2ª edição, seção 5.5, pp. 80–82',visual='chart',
            icons=[dict(emoji='1',text='Visualize o trabalho'),dict(emoji='2',text='Limite o que está em andamento'),dict(emoji='3',text='Conclua e aprenda')]),
    question(7,'Sua semana começou com mais pedidos do que cabe na agenda. O que você faz?','foco_valor',[
        'Começo pelo pedido que chegou primeiro.','Tento avançar um pouco em todos.',
        'Escolho os mais urgentes e adio o restante.',
        'Alinho o que gera mais valor, escolho o que cabe e deixo claras as trocas.']),
    question(8,'Você percebe que há muitas tarefas em andamento e poucas concluídas. Qual é sua reação?','fluxo_entrega',[
        'Abro novas tarefas para não deixar ninguém parado.','Peço atualizações sobre tudo que está aberto.',
        'Escolho algumas tarefas para concluir primeiro.',
        'Identifico onde o fluxo travou, limito o trabalho simultâneo e ajudo a concluir.']),
    question(9,'Uma pessoa da equipe está bloqueada e precisa da sua ajuda. O que você faz?','colaboracao_autonomia',[
        'Aguardo a próxima reunião para tratar do assunto.','Peço que ela registre o bloqueio no quadro.',
        'Converso com ela e tento encontrar uma solução.',
        'Entendo a causa com ela, envolvo quem pode decidir e combino como evitar a mesma trava.']),
    context(2,'Entregue algo útil. Ouça. Ajuste.','Quando ainda há incerteza, uma entrega pequena permite descobrir cedo se a solução ajuda quem vai usá-la. O retorno orienta o próximo passo antes de investir na direção errada.',
            'PMI, Guia de práticas ágeis, 2ª edição, seção 2.1, pp. 9–10',visual='sparkle',
            icons=[dict(emoji='1',text='Entregue'),dict(emoji='2',text='Ouça'),dict(emoji='3',text='Ajuste')]),
    question(10,'Você tem uma ideia promissora, mas ainda não sabe se ela será útil para quem vai usá-la. Como começa?','foco_valor',[
        'Desenvolvo a solução completa antes de mostrar.','Planejo todos os detalhes para reduzir as dúvidas.',
        'Preparo uma primeira versão pequena para apresentar.',
        'Defino o que preciso aprender, testo uma versão pequena e uso o retorno para decidir o próximo passo.']),
    question(11,'No meio do trabalho, surge uma nova prioridade. O que você faz?','adaptacao_aprendizado',[
        'Acrescento a demanda à lista sem mudar o plano.','Interrompo tudo e começo a nova demanda.',
        'Comparo a nova prioridade com as tarefas atuais.',
        'Confirmo seu valor e urgência, negocio o que sai ou espera e ajusto o plano com os envolvidos.']),
    question(12,'Você precisa mostrar progresso em um projeto. O que apresenta?','fluxo_entrega',[
        'Quantas tarefas foram iniciadas.','O percentual estimado de conclusão.',
        'O que foi concluído e o que falta entregar.',
        'O que já funciona, o retorno recebido e o que será ajustado a seguir.']),
    context(3,'Autonomia precisa de clareza.','Saber quem decide, quem contribui e quem remove obstáculos ajuda as pessoas a agir com liberdade e responsabilidade. A clareza deve facilitar a entrega, sem virar mais uma camada de burocracia.',
            'PMI, Guia de práticas ágeis, 2ª edição, seção 4.5, pp. 57–58',visual='people'),
    question(13,'Uma reunião recorrente ocupa muito tempo e raramente muda alguma decisão. O que você faz?','colaboracao_autonomia',[
        'Continuo participando para não perder informações.','Peço que a reunião seja mais curta.',
        'Proponho uma pauta e uma decisão esperada.',
        'Verifico se ela ainda é necessária e proponho o formato mais simples que resolva seu propósito.']),
    question(14,'Alguém aponta um problema em uma entrega sua. Como você reage?','adaptacao_aprendizado',[
        'Explico por que segui o plano combinado.','Anoto o comentário para uma revisão futura.',
        'Pergunto o que não funcionou e faço a correção.',
        'Entendo o impacto para quem usa, ajusto a entrega e aplico o aprendizado no próximo ciclo.']),
    question(15,'Sua equipe repete o mesmo problema a cada entrega. Qual é seu próximo passo?','colaboracao_autonomia',[
        'Reforço que todos precisam ter mais atenção.','Crio uma regra para evitar o erro.',
        'Reúno a equipe para discutir o que aconteceu.',
        'Investigo a causa com a equipe, testo uma mudança pequena e verifico se ela resolveu o problema.']),
    context(4,'Mais velocidade não garante mais valor.','Um número maior de tarefas ou pontos concluídos pode esconder desperdício. Observe o que foi entregue, quanto tempo o trabalho levou e se produziu o resultado esperado.',
            'PMI, Guia de práticas ágeis, 2ª edição, seção 5.5, pp. 80–82',visual='chart',
            icons=[dict(emoji='↗',text='Fluxo: o trabalho consegue chegar ao fim?'),dict(emoji='◎',text='Resultado: a entrega ajudou quem precisava?')]),
    dict(id='agile-pattern',kind='insight',eyebrow='Quase lá',title='Seu diagnóstico já consegue enxergar um padrão claro.',
         body='Estamos cruzando suas escolhas sobre prioridades, fluxo, colaboração e adaptação para mostrar seu momento atual.',
         stat='Seu resultado se baseia nas suas respostas, não em quantos termos ágeis você conhece.',visual='sparkle'),
    dict(id='salary-range',kind='question',title='Qual é sua faixa salarial atual?',
         subtitle='Isso nos ajuda a contextualizar seu momento profissional. Não altera sua pontuação.',input='single',
         options=[dict(label=l,value=f'faixa{i}',emoji=e) for i,(l,e) in enumerate([
             ('Até R$ 5.000','💵'),('R$ 5.001 a R$ 10.000','💼'),('R$ 10.001 a R$ 15.000','📈'),
             ('R$ 15.001 a R$ 25.000','🚀'),('Acima de R$ 25.000','🏆')],1)]),
    dict(id='email',kind='email',title='Seu diagnóstico está quase pronto. Qual e-mail devemos usar para liberar o resultado?'),
    dict(id='name',kind='name',title='E como podemos chamar você?'),
    dict(id='processing',kind='processing',title='Seu resultado está sendo gerado.'),
    dict(id='insight-pre-result-guide',kind='insight',eyebrow='PMI | Guia de práticas ágeis',
         title='Agilidade de verdade se revela na prática.',
         body='Seu resultado conecta foco no valor, fluxo, colaboração e aprendizado. Veja onde você já manda bem e escolha um ajuste concreto para começar hoje.',
         source='PMI, Guia de práticas ágeis, 2ª edição, seções 2 e 5',visual='sparkle'),
    dict(id='result',kind='result'),
]

assert len([s for s in steps if s['kind']=='question' and s['id']!='salary-range']) == 15
assert len({s['id'] for s in steps}) == len(steps)
assert len([s for s in steps if s['id'].startswith('agile-context-')]) == 4

path = ROOT/'src/data/gestaoAgil.json'
path.write_text(json.dumps(steps, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'{len(steps)} steps written to {path}')
