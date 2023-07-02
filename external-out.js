import { SevenSegment } from "./seven-segment.js";
import { TrafficSignal } from "./traffic-signal.js";

export class ExternalOut extends HTMLElement {
  constructor() {
    super();
    this.style.display = "inline-block";
    this.flgsignal = true;
    this.signal = new TrafficSignal();
    this.sseg = new SevenSegment();
    this.appendChild(this.signal);
    this.onclick = () => {
      this.flgsignal = !this.flgsignal;
      this.innerHTML = "";
      this.appendChild(this.flgsignal ? this.signal : this.sseg);
    };
  }
  setSegments(n) {
    this.signal.setSegments(n);
    this.sseg.setSegments(n);
  }
}

customElements.define("external-out", ExternalOut);
