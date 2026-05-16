import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

createApp(App).mount('#app');

let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 320) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false }
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/juggle/service-worker.js').catch(() => {});
  });
}
