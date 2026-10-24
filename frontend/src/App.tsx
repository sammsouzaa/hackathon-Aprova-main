import React, { useEffect, useState } from 'react';
import { GeminiSidebar, ActiveNavTab } from './components/GeminiSidebar';
import { DocumentsView } from './components/views/DocumentsView';
import { ClientChannelView } from './components/views/ClientChannelView';
import { ContextMatrixView } from './components/views/ContextMatrixView';
import { CodeAgentView } from './components/views/CodeAgentView';
import { PendingReportModal } from './components/PendingReportModal';
import { FormPreviewModal } from './components/FormPreviewModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { JsonEditorModal } from './components/JsonEditorModal';
import {
  buscarContexto,
  perguntarContextoStream,
  TrocaChat,
  ContextoCompleto,
  PASTAS,
  arquivosParaTela,
  checklistParaRegras,
  checklistParaPerguntas,
} from './api';
import { 
  INITIAL_MISSING_DOCS, 
  INITIAL_CHAT_MESSAGES, 
  INITIAL_CLIENT_MESSAGES,
  INITIAL_AGENT_MESSAGES, 
  INITIAL_DIFF_ITEMS
} from './mock/initialData';
import { Rule, PendingQuestion, MissingDoc, ChatMessage, AgentMessage, DiffItem, RawFile } from './types';

export default function App() {
  // Default to 'documents' to showcase the folder structure
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('documents');

  // Core domain states
  // Contexto real vindo do backend (GET /contextos/{id})
  const [contexto, setContexto] = useState<ContextoCompleto | null>(null);
  const [erroContexto, setErroContexto] = useState<string | null>(null);
  const [files, setFiles] = useState<RawFile[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [missingDocs, setMissingDocs] = useState<MissingDoc[]>(INITIAL_MISSING_DOCS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [iaDigitando, setIaDigitando] = useState(false);
  const [clientMessages, setClientMessages] = useState<ChatMessage[]>(INITIAL_CLIENT_MESSAGES);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>(INITIAL_AGENT_MESSAGES);
  const [diffItems, setDiffItems] = useState<DiffItem[]>(INITIAL_DIFF_ITEMS);

  // Selected state & highlights
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  useEffect(() => {
    buscarContexto()
      .then((ctx) => {
        setContexto(ctx);
        setFiles(arquivosParaTela(ctx.arquivos));
        const regras = checklistParaRegras(ctx.checklist);
        setRules(regras);
        setQuestions(checklistParaPerguntas(ctx.checklist));
        setSelectedRuleId(regras[0]?.id ?? null);
      })
      .catch((e) => setErroContexto(String(e)));
  }, []);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false);
  const [selectedDocumentToView, setSelectedDocumentToView] = useState<string | null>(null);
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);
  const [diffApplied, setDiffApplied] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Percentage calculation
  const unansweredCount = questions.filter(q => !q.answered).length;
  const pendingDocsCount = missingDocs.filter(d => !d.collected).length;
  const totalItems = rules.length + unansweredCount;
  const validationPercentage = totalItems ? Math.round((rules.length / totalItems) * 100) : 0;

  // Chat: a mensagem do implantador vai para a IA de contexto (POST /contextos/{id}/perguntar)
  const agora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'Gabriel (Implantador MeuLab)',
      role: 'Implantador',
      timestamp: agora(),
      text,
      isOutgoing: true
    };
    // Memória: as últimas trocas (pergunta do implantador + resposta da IA) vão junto
    const historico: TrocaChat[] = [];
    chatMessages.forEach((m, i) => {
      const resposta = chatMessages[i + 1];
      if (m.isOutgoing && resposta?.aiProcessed && m.text && resposta.text) {
        historico.push({ pergunta: m.text, resposta: resposta.text });
      }
    });

    setChatMessages(prev => [...prev, newMsg]);
    setIaDigitando(true);

    const idResposta = `msg-${Date.now() + 1}`;
    let criada = false;
    perguntarContextoStream(text, historico.slice(-8), (acumulado) => {
      // Os três pontinhos somem quando o primeiro pedaço chega; daí o texto vai crescendo
      if (!criada) {
        criada = true;
        setIaDigitando(false);
        setChatMessages(prev => [...prev, {
          id: idResposta,
          sender: 'IA de Contexto · MeuLab',
          role: 'Assistente de implantação',
          timestamp: agora(),
          text: acumulado,
          aiProcessed: true,
        }]);
      } else {
        setChatMessages(prev => prev.map(m => (m.id === idResposta ? { ...m, text: acumulado } : m)));
      }
    })
      .catch(() => showToast('Não foi possível falar com a IA de Contexto (backend fora do ar?).'))
      .finally(() => setIaDigitando(false));
  };

  // Billing trigger
  const handleSendCobrança = () => {
    const billingText = 'Quais pendências ainda bloqueiam a configuração das regras da agenda?';
    handleSendMessage(billingText);
    showToast('Pergunta de pendências enviada para a IA de Contexto.');
  };

  const handleCobrarDoc = (docTitle: string) => {
    const text = `Aviso de Bloqueio de Implantação: Solicitamos prioridade no envio do documento "${docTitle}" para não impactar o piloto de fevereiro.`;
    handleSendMessage(text);
    showToast(`Cobrança de "${docTitle}" enviada com sucesso.`);
  };

  const handleCopyQuestionToChat = (questionText: string) => {
    handleSendMessage(questionText);
    setActiveTab('chat');
  };

  const handleAnswerQuestion = (questionId: string, answerText: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answered: true, selectedOption: answerText } : q));

    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      title: question.question.replace(/\?$/, ''),
      definition: `Definição deliberada: ${answerText}.`,
      sources: [
        {
          id: `src-${Date.now()}`,
          label: 'Reunião de alinhamento',
          type: 'audio',
          detail: `Confirmado com o cliente (${question.targetRole})`
        }
      ],
      status: 'validated',
      category: question.targetRole,
      dateValidated: 'Agora mesmo',
      impactScore: 'Alto',
      appliedToForm: false
    };

    setRules(prev => [newRule, ...prev]);
    setSelectedRuleId(newRule.id);
    showToast(`Dúvida resolvida! Regra promovida ao Bloco A (${validationPercentage}% validado).`);
  };

  const handleToggleMissingDoc = (docId: string) => {
    setMissingDocs(prev => prev.map(d => {
      if (d.id === docId) {
        const next = !d.collected;
        if (next) showToast(`Documento marcado como recebido.`);
        return { ...d, collected: next };
      }
      return d;
    }));
  };

  const handleSendToAgentDiff = (rule: Rule) => {
    const userPrompt = `Agente, adicione uma regra condicional no formulário para a regra: "${rule.title}"`;
    handleSendCommand(userPrompt);
    setActiveTab('code');
  };

  const handleSendCommand = (cmd: string) => {
    const userMsg: AgentMessage = {
      id: `agent-msg-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      text: cmd
    };

    setAgentMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      let agentReply = '';
      let newDiffs: DiffItem[] = [];

      if (cmd.includes('todas as regras') || cmd.includes('regras validadas')) {
        agentReply = 'Varri a Matriz Viva de Regras do IFPR Cascavel. As regras confirmadas foram integradas à configuração do MeuLab. Gerei o changeset consolidado #CS-9102.';
        newDiffs = [
          ...diffItems,
          {
            id: `diff-${Date.now()}`,
            action: 'added',
            label: 'Cálculo automático de consumo por grupo',
            details: 'Quantidade por grupo × número de grupos, validada contra o estoque antes da aprovação',
            fieldName: 'regra_consumo_por_grupo',
            category: 'Insumos'
          }
        ];
        setDiffItems(newDiffs);
      } else if (cmd.includes('diferenças') || cmd.includes('Modelo')) {
        agentReply = 'Relatório de divergências contra a configuração padrão do MeuLab: antecedência de reserva, tempo de preparo por tipo de prática, bloqueios de TCC e aprovação dupla para reagentes controlados.';
      } else {
        agentReply = `Compreendido o comando: "${cmd}". Compilei as novas rotas de validação no schema JSON.`;
      }

      const agentMsg: AgentMessage = {
        id: `agent-msg-${Date.now() + 1}`,
        role: 'agent',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        text: agentReply,
        diffItems: newDiffs.length > 0 ? newDiffs : diffItems,
        diffId: 'CS-' + Math.floor(1000 + Math.random() * 9000),
        diffApplied: false
      };

      setAgentMessages(prev => [...prev, agentMsg]);
      showToast('O Agente Construtor gerou uma proposta de alteração.');
    }, 1200);
  };

  const handleApplyDiff = (diffId: string) => {
    setDiffApplied(true);
    setAgentMessages(prev => prev.map(m => m.diffId === diffId ? { ...m, diffApplied: true } : m));
    showToast(`Changeset #${diffId} aprovado e gravado no Form Builder!`);
  };

  const handleRevertDiff = (diffId: string) => {
    setDiffApplied(false);
    setAgentMessages(prev => prev.map(m => m.diffId === diffId ? { ...m, diffApplied: false } : m));
    showToast(`Changeset #${diffId} recusado.`);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#f5f7f7] text-[#1c1c1c] font-sans">
      {/* 1. Lateral Navigation Sidebar (Aprova ADS Style) */}
      <GeminiSidebar
        contexto={contexto}
        erroContexto={erroContexto}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenFormPreview={() => setIsFormPreviewOpen(true)}
      />

      {/* 2. Main Canvas (Switches based on activeTab like Gemini / Aprova Workspace) */}
      <main className="flex-1 h-full min-w-0 overflow-hidden relative">
        {activeTab === 'documents' && (
          <DocumentsView
            folders={PASTAS}
            files={files}
            onOpenFileModal={(fileName) => setSelectedDocumentToView(fileName)}
          />
        )}

        {activeTab === 'cliente' && (
          <ClientChannelView
            title="Chat com o Cliente"
            subtitle="Profa. Helena (Coordenação) · Marcos (Almoxarifado) · Prof. Rafael · Luana (TI)"
            placeholder="Escreva para a equipe do cliente..."
            messages={clientMessages}
            onSendMessage={(text) => setClientMessages(prev => [...prev, {
              id: `cli-${Date.now()}`,
              sender: 'Gabriel (Implantador MeuLab)',
              role: 'Implantador',
              timestamp: agora(),
              text,
              isOutgoing: true,
            }])}
            onSendCobrança={() => {}}
            onOpenFileModal={(fileName) => setSelectedDocumentToView(fileName)}
            onNavigateToContextWithRule={() => {}}
          />
        )}

        {activeTab === 'chat' && (
          <ClientChannelView
            title="Chat do Contexto"
            variant="ia"
            typing={iaDigitando}
            quickQuestions={contexto?.perguntas_rapidas ?? []}
            subtitle="IA que responde com base nos documentos do cliente"
            placeholder="Pergunte algo sobre o cliente (ex.: quem aprova as práticas?)"
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onSendCobrança={handleSendCobrança}
            onOpenFileModal={(fileName) => setSelectedDocumentToView(fileName)}
            onNavigateToContextWithRule={(ruleId) => {
              setSelectedRuleId(ruleId);
              setActiveTab('context');
            }}
          />
        )}

        {activeTab === 'context' && (
          <ContextMatrixView
            rules={rules}
            questions={questions}
            missingDocs={missingDocs}
            selectedRuleId={selectedRuleId}
            onSelectRule={(id) => setSelectedRuleId(id)}
            onCopyQuestionToChat={handleCopyQuestionToChat}
            onAnswerQuestion={handleAnswerQuestion}
            onToggleMissingDoc={handleToggleMissingDoc}
            onCobrarDoc={handleCobrarDoc}
            onOpenFileModal={(fileName) => setSelectedDocumentToView(fileName)}
            onSendToAgentDiff={handleSendToAgentDiff}
          />
        )}

        {activeTab === 'code' && (
          <CodeAgentView
            messages={agentMessages}
            onSendCommand={handleSendCommand}
            onApplyDiff={handleApplyDiff}
            onRevertDiff={handleRevertDiff}
            onOpenJsonEditor={() => setIsJsonEditorOpen(true)}
          />
        )}
      </main>

      {/* Floating Toast Notification (ADS Alert Component: 355px, raio 10px, sombra 2px 5px 15px rgba(0,0,0,.2)) */}
      {toastMessage && (
        <div 
          role="status"
          className="fixed bottom-6 right-20 z-50 w-[355px] p-4 rounded-[10px] bg-white border border-[#eeeeee] shadow-[2px_5px_15px_rgba(0,0,0,0.2)] flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 text-[#1c1c1c]"
        >
          <div className="w-6 h-6 rounded-full bg-[#eefff9] text-[#10b981] flex items-center justify-center shrink-0 mt-0.5 border border-[#19bf8b]/30">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#1c1c1c] leading-tight">
              Aviso do Sistema
            </div>
            <p className="text-xs font-medium text-[#656666] mt-0.5 leading-snug line-clamp-2">
              {toastMessage}
            </p>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-[#656666] hover:text-[#1c1c1c] p-0.5"
            title="Fechar"
          >
            ×
          </button>
        </div>
      )}

      {/* Floating Chat Launcher (Aprova Portal Official: 56px #10838a, sombra float) */}
      <button
        onClick={() => setActiveTab(activeTab === 'chat' ? 'context' : 'chat')}
        title={activeTab === 'chat' ? 'Alternar para Matriz de Regras' : 'Abrir Chat do Contexto'}
        className="fixed bottom-6 right-6 z-40 aprova-chat-launcher group cursor-pointer"
        aria-label="Atendimento Aprova"
      >
        <span className="relative flex items-center justify-center">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00dae7] border-2 border-[#10838a]" />
        </span>
      </button>

      {/* Auxiliary Modals (Aprova ADS Style) */}
      <PendingReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        rules={rules}
        questions={questions}
        missingDocs={missingDocs}
        diffItems={diffItems}
      />

      <FormPreviewModal
        isOpen={isFormPreviewOpen}
        onClose={() => setIsFormPreviewOpen(false)}
        diffApplied={diffApplied}
      />

      <DocumentViewerModal
        file={files.find(f => f.name === selectedDocumentToView || f.apiName === selectedDocumentToView) ?? null}
        fileName={selectedDocumentToView}
        onClose={() => setSelectedDocumentToView(null)}
      />

      <JsonEditorModal
        isOpen={isJsonEditorOpen}
        onClose={() => setIsJsonEditorOpen(false)}
        diffItems={diffItems}
        onSaveJson={() => showToast('Esquema JSON atualizado e validado pelo motor.')}
      />
    </div>
  );
}
