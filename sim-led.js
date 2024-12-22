import { style } from "https://js.sabae.cc/css.js";
import { cr } from "https://js.sabae.cc/cr.js";

const CSS = `
.led {
  zoom: 40%;
  position: relative;
  width: 50px;
  height: 70px;
  background-color: #600;
  border-radius: 25px 25px 10px 10px;
  margin: 0px auto;
}
.ledon {
  background-color: #ff0000; /* LEDの色 */
}
.led::before {
  content: '';
  position: absolute;
  top: 0px;
  left: 5px;
  width: 40px;
  height: 40px;
  background-color: #f00; /* LEDの光の部分 */
  border-radius: 50%;
  box-shadow: 0 0 20px 10px #f88;
  z-index: -1;
  opacity: 0;
}
.ledon::before {
  opacity: 1;
}
.led-bottom {
  position: absolute;
  bottom: -5px;
  left: 10px;
  width: 30px;
  height: 10px;
  background-color: #808080; /* 足の色 */
  border-radius: 0 0 5px 5px;
}
.leg {
  position: absolute;
  bottom: -35px;
  width: 6px;
  height: 30px;
  background-color: #808080; /* 足の色 */
}
.leg.left {
  left: 12px;
}
.leg.right {
  right: 12px;
  bottom: -30px;
  height: 25px;
}
`;

export class SimLED extends HTMLElement {
  constructor() {
    super();
    this.divled = cr("div", this, "led");
    cr("div", this.divled, "led-bottom");
    cr("div", this.divled, "leg left");
    cr("div", this.divled, "leg right");
    style(CSS);
  }
  setSegments(n) {
    const led = (n & (1 << (7 - 1))) != 0;
    if (led) {
      this.divled.classList.add("ledon");
    } else {
      this.divled.classList.remove("ledon");
    }
  }
}

customElements.define("sim-led", SimLED);
