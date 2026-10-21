// entrypoints/background.ts
import { capturePdf } from '@/utils/capture';

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'CAPTURE_ACTIVE') {
      (async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || typeof tab.id !== 'number') {
          sendResponse({ ok: false, error: 'No active tab found.' });
          return;
        }

        if (msg.clean) {
          await cleanPageForCapture(tab.id);
        }

        const base64 = await capturePdf(tab.id);
        await chrome.downloads.download({
          url: `data:application/pdf;base64,${base64}`,
          filename: makeFilename(tab),
          saveAs: false,
        });

        sendResponse({ ok: true });
      })().catch((e) => {
        sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
      });

      return true;
    }

    return false;
  });
});

async function cleanPageForCapture(tabId: number) {
  await chrome.scripting.insertCSS({
    target: { tabId },
    css: `
      header, nav, footer, aside,
      [role="navigation"],
      [class*="cookie"], [id*="cookie"],
      [class*="banner"], [class*="advert"],
      [class*="sidebar"], [class*="modal"],
      [id*="google_ads"], [id*="ad_"],
      [data-testid*="cookie"], [data-testid*="banner"] {
        display: none !important;
      }
      body { overflow: visible !important; }
      * { position: static !important; }
      img, figure, table, pre, code {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    `,
  });

  await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      const maxScrolls = 12;
      let currentScrolls = 0;

      const scrollPage = () =>
        new Promise<void>((resolve) => {
          const nextStep = () => {
            window.scrollBy({ top: 600, left: 0, behavior: 'auto' });
            currentScrolls += 1;

            if (currentScrolls >= maxScrolls || window.innerHeight + window.scrollY >= document.body.scrollHeight) {
              window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
              resolve();
              return;
            }

            setTimeout(nextStep, 150);
          };

          nextStep();
        });

      await scrollPage();
    },
  });
}

function makeFilename(tab: chrome.tabs.Tab) {
  const clean = (tab.title ?? 'page').replace(/[\\/:*?"<>|]/g, '').slice(0, 80).trim();
  const date = new Date().toISOString().slice(0, 10);
  return `${clean || 'page'} - ${date}.pdf`;
}