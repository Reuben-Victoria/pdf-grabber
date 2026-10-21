// utils/capture.ts

declare const chrome: {
  debugger: {
    attach: (target: { tabId: number }, protocolVersion: string) => Promise<void>;
    detach: (target: { tabId: number }) => Promise<void>;
    sendCommand: (
      target: { tabId: number },
      method: string,
      params?: Record<string, unknown>,
    ) => Promise<{ data?: string }>;
  };
};

export async function capturePdf(tabId: number): Promise<string> {
  const target = { tabId };
  await chrome.debugger.attach(target, '1.3');
  try {
    const result = await chrome.debugger.sendCommand(target, 'Page.printToPDF', {
      printBackground: true,
      preferCSSPageSize: false,
      paperWidth: 8.27,   // A4
      paperHeight: 11.69,
      marginTop: 0.4,
      marginBottom: 0.4,
      marginLeft: 0.4,
      marginRight: 0.4,
    });
    return result.data ?? ''; // base64 PDF
  } finally {
    await chrome.debugger.detach(target);
  }
}