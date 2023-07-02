import { style } from "https://js.sabae.cc/css.js";

const CSS = `
traffic-signal {
  display: inline-block;
  min-width: 90px;
  min-height: 20px;
  height: 30px;
}
traffic-signal .signal {
  border-radius: 50%;
  display: inline-block;
  width: 33%;
  height: 100%;
}
`;

const colors = [0x33ff55, 0xeeee55, 0xff5555];
const offcolor = "#dddddd";

export class TrafficSignal extends HTMLElement {
  constructor() {
    super();
    for (let i = 0; i < 3; i++) {
      const div = document.createElement("div");
      this.appendChild(div);
      div.className = "signal";
      div.style.backgroundColor = offcolor;
    }
    style(CSS);
  }
  setSegments(n) {
    for (let i = 0; i < this.childNodes.length; i++) {
      const div = this.childNodes[i];
      div.style.backgroundColor = n & (1 << i) ? "#" + colors[i].toString(16) : offcolor;
    }
  }
}

customElements.define("traffic-signal", TrafficSignal);
