/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DadosMensagemItemMarcado,
  DadosMensagemContradicao,
  DadosMensagemCompromisso,
  DadosMensagemResumo
} from '../types';

export interface EfeitoFalaGravada {
  falaId: number;
  tipoAcao?: 'marcar_item' | 'alerta_contradicao' | 'criar_compromisso' | 'pausar_roteiro' | 'resumo_final';
  itemMarcado?: DadosMensagemItemMarcado & { regraLocal?: boolean };
  alertaContradicao?: DadosMensagemContradicao;
  novoCompromisso?: DadosMensagemCompromisso;
  resumoFinal?: DadosMensagemResumo;
  mensagemTexto?: string;
  devePausarRoteiro?: boolean;
}

export const EFEITOS_FALAS_GRAVADAS: Record<number, EfeitoFalaGravada> = {
  4: {
    falaId: 4,
    tipoAcao: 'marcar_item',
    itemMarcado: {
      itemId: 'CHK-05',
      itemTitulo: 'Taxa de ocupação máxima na ZR2',
      valor: '58% do lote',
      evidencia: 'Na ZR2 é 58% do lote.'
    }
  },
  6: {
    falaId: 6,
    tipoAcao: 'marcar_item',
    itemMarcado: {
      itemId: 'CHK-06',
      itemTitulo: 'Coeficiente de aproveitamento na ZR2',
      valor: '1,35 na ZR2',
      evidencia: 'É 1,35 na ZR2.'
    }
  },
  8: {
    falaId: 8,
    tipoAcao: 'alerta_contradicao',
    devePausarRoteiro: true,
    alertaContradicao: {
      itemId: 'CHK-07',
      itemTitulo: 'Recuo frontal mínimo na ZR2',
      falaCliente: 'Aqui a gente usa 3 metros de recuo frontal.',
      docId: 'DOC-02',
      docTitulo: 'Plano Diretor (modelo, fictício)',
      docArtigo: 'Art. 14, §2º',
      docTexto: 'O recuo frontal mínimo na ZR2 é de 4,50 m.',
      valorCliente: '3,00 m',
      valorModelo: '4,50 m'
    }
  },
  10: {
    falaId: 10,
    tipoAcao: 'marcar_item',
    itemMarcado: {
      itemId: 'CHK-10',
      itemTitulo: 'Parecer em área de preservação',
      valor: 'Exige parecer prévio do Conselho do Meio Ambiente',
      evidencia: 'em área de preservação, o projeto precisa de parecer do Conselho do Meio Ambiente antes da análise.',
      regraLocal: true
    }
  },
  11: {
    falaId: 11,
    tipoAcao: 'criar_compromisso',
    novoCompromisso: {
      compromissoId: 'CMP-01',
      titulo: 'Planta de zoneamento atualizada',
      responsavel: 'Helena Prado (Prefeitura)',
      prazo: 'Quinta-feira, 29/10/2026',
      confirmado: false
    }
  },
  12: {
    falaId: 12,
    tipoAcao: 'pausar_roteiro',
    devePausarRoteiro: true,
    mensagemTexto: 'Atenção: A reunião chegou a uma possível conclusão antecipada. Você pode revisar as lacunas pendentes clicando em "Encerrar reunião" ou continuar a coleta com o próximo ponto.'
  },
  14: {
    falaId: 14,
    tipoAcao: 'marcar_item',
    itemMarcado: {
      itemId: 'CHK-08',
      itemTitulo: 'Taxa do alvará residencial',
      valor: 'R$ 3,85 por m²',
      evidencia: 'A taxa é igual à do modelo, R$ 3,85 por metro quadrado.'
    }
  },
  15: {
    falaId: 15,
    tipoAcao: 'criar_compromisso',
    novoCompromisso: {
      compromissoId: 'CMP-02',
      titulo: 'Confirmar prazo de análise técnica com secretário',
      responsavel: 'Helena Prado (Prefeitura)',
      prazo: 'Sexta-feira, 30/10/2026',
      confirmado: false
    }
  },
  16: {
    falaId: 16,
    tipoAcao: 'resumo_final',
    resumoFinal: {
      cobertura: '9/10 itens analisados',
      regrasLocais: 2,
      compromissos: 2
    }
  }
};
