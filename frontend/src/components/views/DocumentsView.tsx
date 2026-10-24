import React, { useState } from 'react';
import { 
  FileText, 
  Volume2, 
  Image as ImageIcon, 
  FileCheck, 
  Search, 
  Download, 
  UploadCloud, 
  Eye,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { RawFile, Folder as FolderType } from '../../types';

interface DocumentsViewProps {
  folders: FolderType[];
  files: RawFile[];
  onOpenFileModal: (fileName: string) => void;
  onNavigateToContextWithRule?: (ruleId: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  folders,
  files,
  onOpenFileModal,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mapeamento das abas
  const tabOptions = [
    { id: 'all', label: 'Todos os Documentos', count: files.length },
    ...folders.map(f => ({ id: f.id, label: f.name, count: files.filter(file => file.folderId === f.id).length })),
  ];

  const displayedFiles = files.filter(file => {
    const matchesTab = activeTab === 'all' || file.folderId === activeTab;
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          file.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <Volume2 className="w-4 h-4 text-[#0d787e]" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-[#ba1515]" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-[#0856af]" />;
      default:
        return <FileSpreadsheet className="w-4 h-4 text-[#ea580c]" />;
    }
  };

  const getFormatBadge = (type: string) => {
    switch (type) {
      case 'audio':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e0f6f7] text-[#074a4e] border border-[#14bac4]/30">Áudio</span>;
      case 'pdf':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#ffebeb] text-[#ba1515] border border-[#dc2626]/20">PDF</span>;
      case 'image':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#ebf4ff] text-[#0856af] border border-[#1d74d8]/20">Imagem</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f5f7f7] text-[#404141] border border-[#dee0e0]">Documento</span>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f5f7f7] text-[#1c1c1c] overflow-hidden">
      {/* 1. Cabeçalho Oficial da Página (Aprova ADS: Fundo branco, altura 72px, hierarquia institucional) */}
      <header className="border-b border-[#dee0e0] px-8 py-4 bg-white flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#656666] mb-0.5">
            <span>Instituto Federal do Paraná (IFPR) – Campus Cascavel</span>
            <span className="text-[#cacccc]">/</span>
            <span>Coordenação dos Laboratórios de Ensino</span>
          </div>
          <h1 className="text-lg font-bold text-[#1c1c1c] tracking-tight">
            Repositório de Documentos do Processo
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#868787]" />
            <input
              type="text"
              placeholder="Buscar documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-[#f5f7f7] border border-[#c4cbd1] rounded-lg text-[#1c1c1c] placeholder-[#868787] focus:outline-none focus:bg-white focus:border-[#0d787e] transition-colors"
            />
          </div>

          <button
            onClick={() => onOpenFileModal('Upload')}
            className="flex items-center gap-2 px-3.5 h-9 rounded-lg bg-[#0d787e] hover:bg-[#074a4e] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Adicionar Documento</span>
          </button>
        </div>
      </header>

      {/* 2. Barra de Navegação por Abas Limpas e Corporativas (Estilo ADS Oficial) */}
      <div className="bg-white border-b border-[#dee0e0] px-8 flex items-center gap-2 shrink-0">
        {tabOptions.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'border-[#0d787e] text-[#0d787e] font-semibold'
                  : 'border-transparent text-[#656666] hover:text-[#1c1c1c] hover:border-[#cacccc]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-[#e0f6f7] text-[#074a4e]' : 'bg-[#f5f7f7] text-[#868787]'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Área Principal: Tabela de Documentos Estruturada e Espaçada */}
      <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">
        <div className="max-w-6xl mx-auto space-y-4">
          
          {/* Card Contêiner com Borda Sólida 1px #cacccc (Sem sombras, padrão ADS) */}
          <div className="bg-white rounded-xl border border-[#cacccc] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f5f7f7] border-b border-[#dee0e0] text-[#656666] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-6">Identificação do Documento</th>
                  <th className="py-3.5 px-4">Classificação</th>
                  <th className="py-3.5 px-3">Formato</th>
                  <th className="py-3.5 px-4">Tamanho</th>
                  <th className="py-3.5 px-4">Data de Inclusão</th>
                  <th className="py-3.5 px-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dee0e0]">
                {displayedFiles.map((file) => {
                  const folder = folders.find(f => f.id === file.folderId);

                  return (
                    <tr
                      key={file.id}
                      onClick={() => onOpenFileModal(file.name)}
                      className="hover:bg-[#f6fbfb] transition-colors cursor-pointer group"
                    >
                      {/* Documento e Descrição */}
                      <td className="py-4 px-6 max-w-md">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#f5f7f7] border border-[#dee0e0] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-[#0d787e]/40 transition-colors">
                            {getFileIcon(file.type)}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-[#1c1c1c] group-hover:text-[#0d787e] transition-colors leading-snug">
                              {file.name}
                            </div>
                            <div className="text-[11px] text-[#656666] mt-0.5 leading-relaxed line-clamp-1">
                              {file.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Classificação / Categoria */}
                      <td className="py-4 px-4 text-[#404141]">
                        <span className="text-[11px] font-medium text-[#404141]">
                          {folder ? folder.name : 'Geral'}
                        </span>
                      </td>

                      {/* Formato */}
                      <td className="py-4 px-3">
                        {getFormatBadge(file.type)}
                      </td>

                      {/* Tamanho */}
                      <td className="py-4 px-4 text-[#656666] font-mono text-[11px]">
                        {file.size}
                      </td>

                      {/* Data */}
                      <td className="py-4 px-4 text-[#656666]">
                        {file.uploadDate}
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenFileModal(file.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#f5f7f7] border border-[#868787] text-[#1c1c1c] text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#0d787e]" />
                            <span>Abrir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {displayedFiles.length === 0 && (
              <div className="p-12 text-center text-[#656666]">
                <FileCheck className="w-10 h-10 mx-auto text-[#868787] mb-2 stroke-[1.5]" />
                <p className="text-sm font-semibold text-[#1c1c1c]">Nenhum documento encontrado</p>
                <p className="text-xs text-[#656666] mt-1">Nenhum registro corresponde aos filtros selecionados.</p>
              </div>
            )}
          </div>

          {/* Rodapé informativo de conformidade documental */}
          <div className="px-2 flex items-center justify-between text-[11px] text-[#868787]">
            <span>Exibindo {displayedFiles.length} de {files.length} documentos do contexto</span>
            <span>Contexto carregado do backend · MeuLab</span>
          </div>
        </div>
      </main>
    </div>
  );
};
