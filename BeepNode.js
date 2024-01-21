export class BeepNode extends AudioWorkletNode {
  static async create(context) {
    await context.audioWorklet.addModule("beep-processor.js");
    return new BeepNode(context);
  }
  constructor(context) {
    super(context, "beep-processor");
    this.freq = -1;
    this.vol = -1;
  }
  setVolume(vol) {
    if (vol == this.vol) return;
    this.vol = vol;
    this.port.postMessage({ vol });
  }
  setFreq(freq) {
    if (freq == this.freq) return;
    this.freq = freq;
    this.port.postMessage({ freq });
  }
  setFreqVolume(freq, vol) {
    if (vol == this.vol && freq == this.freq) return;
    this.vol = vol;
    this.freq = freq;
    this.port.postMessage({ freq, vol });
  }
};
