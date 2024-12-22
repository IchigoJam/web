import { SevenSegment } from "./seven-segment.js";
import { TrafficSignal } from "./traffic-signal.js";
import { SimRobo } from "./sim-robo.js";
import { SimLED } from "./sim-led.js";

const modes = ["led", "sseg", "signal", "robo"];

export class ExternalOut extends HTMLElement {
  constructor(mode = "led") {
    super();
    this.style.display = "inline-block";
    this.led = new SimLED();
    this.signal = new TrafficSignal();
    this.sseg = new SevenSegment();
    this.robo = new SimRobo();
    this.outs = [this.led, this.sseg, this.signal, this.robo];
    const nmode = modes.indexOf(mode);
    this.state = nmode < 0 ? 0 : nmode;
    this.appendChild(this.outs[this.state]);
    this.onclick = () => {
      this.state++;
      if (this.state == this.outs.length) this.state = 0;
      this.setExtOut();
    };
  }
  setExtOut() {
    this.innerHTML = "";
    this.outs[this.state].setSegments(this.bkn);
    this.appendChild(this.outs[this.state]);
  }
  setMode(mode) {
    const nmode = modes.indexOf(mode);
    this.state = nmode < 0 ? 0 : nmode;
    this.setExtOut();
  }
  setSegments(n) {
    this.bkn = n;
    this.outs[this.state].setSegments(n);
  }
  setIchigoJamCore(ex) {
    this.outs.forEach(i => {
      if (i.setIchigoJamCore) {
        i.setIchigoJamCore(ex)
      }
    });
  }
}

customElements.define("external-out", ExternalOut);
