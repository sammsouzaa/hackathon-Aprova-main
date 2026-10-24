// O offscreen document não consegue mostrar o pedido de permissão do microfone.
// Esta página pede uma vez; depois disso a extensão inteira tem acesso.
const status = document.getElementById('status');

navigator.mediaDevices.getUserMedia({ audio: true })
  .then((stream) => {
    stream.getTracks().forEach((t) => t.stop());
    status.innerText = 'Permitido! Pode fechar esta aba e iniciar a escuta.';
    chrome.storage.local.set({ micPermitido: true });
    setTimeout(() => window.close(), 1500);
  })
  .catch((e) => {
    status.style.color = '#f87171';
    status.innerText = 'Permissão negada (' + e.name + '). Libere o microfone no ícone de cadeado da barra de endereço e recarregue.';
    chrome.storage.local.set({ micPermitido: false });
  });
