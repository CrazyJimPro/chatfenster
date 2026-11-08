// Läuft vor WhatsApp Web im Fenster. Legt eine Hülle um window.Notification:
// - Benachrichtigungen lassen sich in den Einstellungen abschalten
// - auf Wunsch ohne Nachrichtentext (Datenschutz)
// - ein Klick auf die Benachrichtigung holt das Fenster nach vorn
// Die Funktionen werden nur an die Hülle übergeben, nicht global sichtbar gemacht.
const { contextBridge, ipcRenderer } = require('electron');

const bridge = {
  settings: () => ipcRenderer.sendSync('chatfenster:notification-settings'),
  shown: () => ipcRenderer.send('chatfenster:notification-shown'),
  clicked: () => ipcRenderer.send('chatfenster:notification-click'),
};

contextBridge.executeInMainWorld({
  args: [bridge],
  func: (api) => {
    const Original = window.Notification;
    if (!Original || Original.chatfenster) return;

    class ChatfensterNotification extends Original {
      constructor(title, options) {
        let settings = { enabled: true, preview: true };
        try { settings = api.settings(); } catch { /* Standardwerte */ }

        if (!settings.enabled) {
          // Ausgeschaltet: stilles Ersatzobjekt, damit WhatsApp nicht stolpert
          const dummy = new EventTarget();
          dummy.title = String(title);
          dummy.body = (options && options.body) || '';
          dummy.close = () => {};
          return dummy;
        }

        let shownTitle = title;
        const opts = { ...(options || {}) };
        if (!settings.preview) {
          shownTitle = 'Neue Nachricht';
          opts.body = 'Zum Lesen Chatfenster öffnen';
          delete opts.icon;
          delete opts.image;
        }

        super(shownTitle, opts);
        this.addEventListener('click', () => api.clicked());
        api.shown();
      }
    }
    Object.defineProperty(ChatfensterNotification, 'chatfenster', { value: true });
    window.Notification = ChatfensterNotification;
  },
});
