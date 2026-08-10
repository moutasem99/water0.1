import {
  Capacitor,
  SystemBars,
  SystemBarsStyle
} from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';

const isNative = Capacitor.isNativePlatform();

if (isNative) {
  document.documentElement.classList.add('capacitor-native');

  // Modern Android system bars / edge-to-edge support.
  try {
    await SystemBars.setStyle({ style: SystemBarsStyle.Dark });
  } catch (_) {}

  // Hide the native splash as soon as the UI is ready.
  window.addEventListener('load', async () => {
    try { await SplashScreen.hide(); } catch (_) {}
  }, { once: true });

  // Keep the app layout steady when the keyboard appears.
  try {
    Keyboard.addListener('keyboardWillShow', () => {
      document.documentElement.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardDidHide', () => {
      document.documentElement.classList.remove('keyboard-open');
    });
  } catch (_) {}

  // Native-feeling Android back button:
  // 1) close modal
  // 2) return to Sales tab
  // 3) exit if already on Sales
  try {
    App.addListener('backButton', async () => {
      const overlay = document.getElementById('modal-overlay');
      if (overlay) {
        overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return;
      }

      const activeTab = document.querySelector('[data-tab].active');
      if (activeTab && activeTab.dataset.tab !== 'sales') {
        document.querySelector('[data-tab="sales"]')?.click();
        return;
      }

      await App.exitApp();
    });
  } catch (_) {}

  // Haptic feedback on the main POS interactions.
  let lastHaptic = 0;
  document.addEventListener('pointerdown', async (event) => {
    const el = event.target.closest(
      '.btn-prod,.cart-qty .btn-icon-only,.payment-option,.btn-success,.shift-handoff-btn,.nav-item'
    );
    if (!el) return;

    el.classList.add('native-press');
    setTimeout(() => el.classList.remove('native-press'), 95);

    const now = performance.now();
    if (now - lastHaptic < 70) return;
    lastHaptic = now;

    try {
      const strong =
        el.classList.contains('btn-success') ||
        el.classList.contains('shift-handoff-btn');

      await Haptics.impact({
        style: strong ? ImpactStyle.Medium : ImpactStyle.Light
      });
    } catch (_) {}
  }, { passive: true });
}
