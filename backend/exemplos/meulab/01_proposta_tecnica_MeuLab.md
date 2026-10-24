# PROPOSTA TÉCNICA DE IMPLANTAÇÃO — MeuLab
**Documento:** PT-2026-031 · versão 1.2 (PDF, 9 páginas)
**Cliente:** Instituto Federal do Paraná (IFPR) – Campus Cascavel
**Fornecedor:** MeuLab Tecnologia Ltda.
**Data:** 03/10/2026

---

## 1. Objetivo
Implantar a plataforma MeuLab para centralizar a gestão de uso dos laboratórios de ensino da área de Ciências da Saúde e Exatas, substituindo o controle atual feito por planilha compartilhada, e-mails e cadernos de reserva nas salas técnicas.

## 2. Problema relatado pelo cliente
- Conflitos frequentes de horário entre docentes no mesmo laboratório.
- Pedidos de material chegando ao almoxarifado no dia da aula, sem tempo de preparo.
- Falta de reagentes descoberta somente na montagem da bancada.
- Nenhum histórico de quem usou o quê, nem de quanto resíduo foi gerado.

## 3. Módulos da plataforma
| Módulo | Descrição resumida | Fase |
|---|---|---|
| A. Agenda Inteligente | Calendário em tempo real, reserva integrada, reagendamento | Fase 1 |
| B. Insumos e Almoxarifado | Catálogo padronizado, cálculo de consumo por grupo, validação de estoque | Fase 1 |
| C. Repositório de Práticas | Biblioteca de roteiros e reutilização de práticas | Fase 2 (a definir) |
| D. Workflow de Aprovação | Aprovação pelo técnico, auditoria e permissões | Fase 1 (parcial) |

> Observação: o escopo exato da Fase 2 depende da validação com a Coordenação de Laboratórios.

## 4. Perfis de acesso previstos
- **Docente:** solicita reservas e acompanha o status.
- **Técnico de laboratório:** aprova práticas e movimenta estoque.
- **Administrador:** gerencia regras globais e cadastro de laboratórios.

## 5. Laboratórios no escopo (levantamento preliminar)
Química Geral, Química Orgânica, Microbiologia, Bioquímica, Anatomia e Física Experimental.
*Total preliminar: 6 laboratórios — confirmar se o Laboratório de Anatomia entra na Fase 1, pois não usa reagentes de bancada.*

## 6. Premissas
- Acesso dos usuários com e-mail institucional @ifpr.edu.br.
- O cliente fornece a lista inicial de reagentes e vidrarias para o catálogo.
- Integração com sistemas acadêmicos **não está incluída** nesta proposta; pode ser orçada à parte.

## 7. Cronograma macro (estimado)
| Etapa | Prazo estimado |
|---|---|
| Kickoff e levantamento | Outubro/2026 |
| Configuração e carga do catálogo | Novembro/2026 |
| Piloto com 2 laboratórios | Fevereiro/2027 (início do semestre) |
| Expansão para todos os laboratórios | A definir após piloto |

## 8. Itens a definir com o cliente
- Regras de antecedência mínima para reserva.
- Política de prioridade para TCC e projetos de pesquisa.
- Responsável pela aprovação final das práticas.
