import { execSync, spawn } from 'node:child_process';

class GerenciadorMonitorAudio {
  constructor() {
    this.moduloId = null;
    this.sinkAtual = null;
  }

  obterSinkPadrao() {
    try {
      return execSync('pactl get-default-sink', { encoding: 'utf-8' }).trim();
    } catch (e) {
      console.error('Erro ao obter sink padrão:', e.message);
      return null;
    }
  }

  limparRemapsAntigos() {
    try {
      const lista = execSync('pactl list short modules', { encoding: 'utf-8' });
      for (const linha of lista.split('\n')) {
        if (linha.includes('source_name=Prumo-Reuniao') || linha.includes('Prumo-Reuniao')) {
          const id = linha.split('\t')[0];
          if (id) {
            console.log(`Limpando remap antigo residual (id ${id})...`);
            execSync(`pactl unload-module ${id}`);
          }
        }
      }
    } catch (e) {
      // Ignora erro se não houver remap antigo
    }
  }

  iniciar() {
    this.limparRemapsAntigos();
    const sink = this.obterSinkPadrao();
    if (!sink) {
      console.warn('Nenhum sink encontrado');
      return false;
    }
    this.sinkAtual = sink;
    const master = `${sink}.monitor`;
    console.log(`Carregando remap Prumo-Reuniao para master: ${master}`);
    try {
      const out = execSync(
        `pactl load-module module-remap-source master=${master} source_name=Prumo-Reuniao source_properties=device.description="Prumo-Reuniao"`,
        { encoding: 'utf-8' }
      );
      this.moduloId = out.trim();
      console.log(`Remap criado com sucesso, ID do módulo: ${this.moduloId}`);
      return true;
    } catch (e) {
      console.error('Falha ao carregar module-remap-source:', e.message);
      return false;
    }
  }

  descarregar() {
    if (this.moduloId) {
      try {
        console.log(`Descarregando módulo ${this.moduloId}...`);
        execSync(`pactl unload-module ${this.moduloId}`);
        console.log('Módulo descarregado com sucesso.');
        this.moduloId = null;
      } catch (e) {
        console.error('Erro ao descarregar módulo:', e.message);
      }
    }
  }
}

const g = new GerenciadorMonitorAudio();
const ok = g.iniciar();
console.log('Status de ativação:', ok);

// Conferir fontes
const sources = execSync('pactl list short sources', { encoding: 'utf-8' });
console.log('Fontes no Pulse/PipeWire que contêm Prumo:');
console.log(sources.split('\n').filter(s => s.includes('Prumo')).join('\n'));

// Descarregar e limpar
g.descarregar();
