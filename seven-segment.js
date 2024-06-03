import { style } from "https://js.sabae.cc/css.js";

const CSS = `
seven-segment {
	display: inline-block;
	margin: 4px;
}
seven-segment div {
	width: 10px;
	height: 6px;
	border: 4px solid #ed2020;
	border-radius: 3px;
}
seven-segment div:first-child {
	border-bottom: none;
	height: 8px;
}
`;

export class SevenSegment extends HTMLElement {
  constructor() {
    super();
    this.div1 = document.createElement("div");
    this.appendChild(this.div1);
    this.div2 = document.createElement("div");
    this.appendChild(this.div2);
    style(CSS);
    this.setSegments(0);
  }
  setSegments(n) {
    const on = "#ed2020";
    const off = "#eee";
    this.div1.style.borderTopColor = n & 1 ? on : off;
    this.div1.style.borderRightColor = n & 2 ? on : off;
    this.div2.style.borderRightColor = n & 4 ? on : off;
    this.div2.style.borderBottomColor = n & 8 ? on : off;
    this.div2.style.borderLeftColor = n & 16 ? on : off;
    this.div1.style.borderLeftColor = n & 32 ? on : off;
    this.div2.style.borderTopColor = n & 64 ? on : off;
  }
}

customElements.define("seven-segment", SevenSegment);
