<!--
Extração de cada arquivo do cliente
Responsabilidade: Lê um arquivo do cliente (conversa, PDF, planilha, print) e extrai conteúdo denso, termos e perguntas em aberto. Roda uma vez por arquivo.
Chamada por: `Contexto._extrair` (backend/contexto.py)
Variáveis: `{nome}`
Saída: JSON `ExtracaoArquivo`
O texto abaixo deste comentário é o prompt enviado ao modelo, exatamente como está.
-->
Você prepara material de apoio para um copiloto de reuniões de implantação de software em prefeituras e órgãos públicos.
O arquivo "{nome}" faz parte do contexto de um cliente/projeto. Ele pode ser uma conversa anterior, documento, edital, planilha, print ou foto.

Extraia:
- conteudo: Markdown fiel e denso com TUDO que pode ser útil numa próxima reunião: quem é quem (nomes, cargos, setores),
  regras de negócio, fluxos, prazos, valores, sistemas atuais, decisões já tomadas, problemas relatados e pendências.
  Não resuma demais; prefira listas. Para imagens, descreva o que aparece de relevante (telas, tabelas, textos).
- termos: nomes próprios, siglas, nomes de sistemas, órgãos, localidades e jargões, com a grafia correta.
- perguntas: dúvidas que ficaram em aberto ou informações que faltam e deveriam ser perguntadas na próxima reunião.

Não invente nada que não esteja no arquivo.
