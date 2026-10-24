import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Gerenciador de fonte monitor automatizada no PipeWire/PulseAudio.
 * - Usa execFile com array de argumentos (sem shell, imune a injeção de comandos).
 * - Operações assíncronas para não bloquear o loop de eventos principal.
 * - Ciclo de vida sob demanda: ativado apenas na fonte "Ao vivo" ou ao iniciar reunião.
 * - Descarregado ao encerrar reunião e na saída do app.
 * - Limpeza preventiva de remaps órfãos na partida (sobrevivência a kill -9).
 */
export class GerenciadorMonitorAudio {
  constructor() {
    this.moduloId = null;
    this.sinkAtual = null;
    this.ativo = false;
    this.processoSubscribe = null;
    this.onSinkAlterado = null;

    // Garantir limpeza síncrona de emergência no encerramento bruto do processo
    process.on('exit', () => {
      this.descarregarSync();
    });
  }

  async obterSinkPadrao() {
    try {
      const { stdout } = await execFileAsync('pactl', ['get-default-sink'], { timeout: 3000 });
      return stdout.trim();
    } catch (err) {
      console.warn('[prumo:audio] Falha ao obter sink padrão via pactl:', err.message);
      return null;
    }
  }

  obterSinkPadraoSync() {
    try {
      const { execFileSync } = require('node:child_process');
      return execFileSync('pactl', ['get-default-sink'], { encoding: 'utf-8', timeout: 2000 }).trim();
    } catch {
      return null;
    }
  }

  async limparRemapsResiduais() {
    try {
      const { stdout } = await execFileAsync('pactl', ['list', 'short', 'modules'], { timeout: 3000 });
      const linhas = stdout.split('\n');
      for (const linha of linhas) {
        if (linha.includes('source_name=Prumo-Reuniao') || linha.includes('Prumo-Reuniao')) {
          const partes = linha.split('\t');
          const id = partes[0]?.trim();
          if (id) {
            try {
              await execFileAsync('pactl', ['unload-module', id], { timeout: 3000 });
              console.log(`[prumo:audio] Remap órfão residual ${id} removido.`);
            } catch {}
          }
        }
      }
    } catch {}
  }

  async ativar() {
    if (this.ativo && this.moduloId) {
      // Verificar se o sink mudou
      const sinkAtual = await this.obterSinkPadrao();
      if (sinkAtual === this.sinkAtual) {
        return this.obterStatus();
      }
      // Se mudou, recriar
      await this.desativar();
    }

    await this.limparRemapsResiduais();
    const sink = await this.obterSinkPadrao();
    if (!sink) {
      console.warn('[prumo:audio] Nenhum sink de áudio disponível. Operando em modo 1 canal (apenas microfone).');
      this.ativo = false;
      this.moduloId = null;
      return this.obterStatus();
    }

    this.sinkAtual = sink;
    const master = `${sink}.monitor`;
    try {
      // Execução sem shell com argumentos separados
      const { stdout } = await execFileAsync(
        'pactl',
        [
          'load-module',
          'module-remap-source',
          `master=${master}`,
          'source_name=Prumo-Reuniao',
          'source_properties=device.description="Prumo-Reuniao"'
        ],
        { timeout: 4000 }
      );

      this.moduloId = stdout.trim();
      this.ativo = true;
      console.log(`[prumo:audio] Remap sob demanda criado (id ${this.moduloId}) para ${master}`);
      this.iniciarMonitoramentoSink();
      return this.obterStatus();
    } catch (err) {
      console.warn(`[prumo:audio] Não foi possível ativar monitor (${err.message}). Degradação graciosa para 1 canal.`);
      this.ativo = false;
      this.moduloId = null;
      return this.obterStatus();
    }
  }

  async desativar() {
    this.pararMonitoramentoSink();
    if (this.moduloId) {
      const idParaRemover = this.moduloId;
      this.moduloId = null;
      this.ativo = false;
      try {
        await execFileAsync('pactl', ['unload-module', idParaRemover], { timeout: 3000 });
        console.log(`[prumo:audio] Remap ${idParaRemover} descarregado.`);
      } catch (err) {
        console.warn(`[prumo:audio] Aviso ao descarregar remap: ${err.message}`);
      }
    }
    return this.obterStatus();
  }

  descarregarSync() {
    if (this.moduloId) {
      try {
        const { execFileSync } = require('node:child_process');
        execFileSync('pactl', ['unload-module', String(this.moduloId)], { timeout: 2000 });
      } catch {}
      this.moduloId = null;
      this.ativo = false;
    }
  }

  iniciarMonitoramentoSink() {
    if (this.processoSubscribe) return;
    try {
      this.processoSubscribe = spawn('pactl', ['subscribe'], { stdio: ['ignore', 'pipe', 'ignore'] });
      this.processoSubscribe.stdout.on('data', async (dados) => {
        const texto = dados.toString('utf-8');
        if (texto.includes('sink') || texto.includes('server')) {
          const novoSink = await this.obterSinkPadrao();
          if (novoSink && novoSink !== this.sinkAtual) {
            console.log(`[prumo:audio] Mudança de sink detectada (${this.sinkAtual} -> ${novoSink}). Recriando remap...`);
            await this.ativar();
            if (typeof this.onSinkAlterado === 'function') {
              this.onSinkAlterado(this.obterStatus());
            }
          }
        }
      });
      this.processoSubscribe.on('error', () => {
        this.processoSubscribe = null;
      });
    } catch {}
  }

  pararMonitoramentoSink() {
    if (this.processoSubscribe) {
      try {
        this.processoSubscribe.kill();
      } catch {}
      this.processoSubscribe = null;
    }
  }

  obterStatus() {
    return {
      ativo: this.ativo,
      sinkPadrao: this.sinkAtual,
      nomeDispositivo: 'Prumo-Reuniao',
      moduloId: this.moduloId
    };
  }
}
