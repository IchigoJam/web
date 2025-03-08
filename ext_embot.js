import { Webembot } from "https://code4fukui.github.io/Webembot/Webembot.js";

let emb = null;
let bkled = [0, 0, 0];

const setLED = (n, b) => {
  if (bkled[n] !== b) {
    emb.led(n + 1, b);
    bkled[n] = b;
  }
};

export const ctrlEmbot = {
  init: async (ex) => {
    emb = await Webembot.create();
    emb.addKeyEventListener(() => {
      for (;;) {
        const c = emb.getKey();
        if (!c) break;
        const code = c.charCodeAt(0);
        ex.key_putc(code);
      }
    });
  },
  led: (b) => {
    if (!emb) return false;
    setLED(2, !!b);
    return true;
  },
  setOutput: (n) => {
    if (!emb) return false;
    //setLED(0, (n & 1) != 0 || (n & 64) != 0);
    setLED(0, (n & 1) != 0);
    setLED(1, (n & 2) != 0);
  },
};
