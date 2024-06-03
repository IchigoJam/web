import { SevenSegment } from "./seven-segment.js";
import { TrafficSignal } from "./traffic-signal.js";
import { SimRobo } from "./sim-robo.js";

export class ExternalOut extends HTMLElement {
  constructor() {
    super();
    this.style.display = "inline-block";
    this.signal = new TrafficSignal();
    this.sseg = new SevenSegment();
    this.robo = new SimRobo();
    this.appendChild(this.sseg);
    this.outs = [this.sseg, this.signal, this.robo];
    this.state = 0;
    this.onclick = () => {
      this.state++;
      if (this.state == this.outs.length) this.state = 0;
      this.innerHTML = "";
      this.outs[this.state].setSegments(this.bkn);
      this.appendChild(this.outs[this.state]);
    };
  }
  setSegments(n) {
    this.bkn = n;
    this.outs[this.state].setSegments(n);
  }
}

customElements.define("external-out", ExternalOut);
