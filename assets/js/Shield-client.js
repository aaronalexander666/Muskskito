/*  Checks shield hash every 4 h  */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
  setInterval(() => {
    navigator.serviceWorker.controller?.postMessage({type:'CHECK_SHIELD'});
  }, 4 * 3600 * 1000);

  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data.type === 'SHIELD_MISMATCH') {
      alert('Dragon-Shield rules mismatch – refresh or audit now.');
    }
  });
}
