import { getDistanceFromWall } from "./util2d.js";

export class SimRobo extends HTMLElement {
  constructor() {
    super();
    const create = () => {
      const img = new Image();
      img.src = "./sim-robo.png"; // 612x540
      img.width = 306 / 4;
      img.height = 270 / 4;
      return img;
    };
    this.img = create();
    this.img.style.position = "absolute";
    this.motorr = 0;
    this.motorl = 0;
    this.speed = 2;
    this.speeddir = 2; // deg
    this.direction = 90;
    this.t = null;
    this.reset();

    const img2 = create();
    img2.style.filter = "grayscale(100%)";
    img2.width = img2.width / 2;
    img2.height = img2.height / 2;
    this.appendChild(img2);

    // drag
    this.dragging = false;
    let offsetX, offsetY;
    const img = this.img;
    img.addEventListener('mousedown', (e) => {
      this.dragging = true;
      offsetX = e.clientX - img.offsetLeft;
      offsetY = e.clientY - img.offsetTop;
      img.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (this.dragging) {
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        img.style.left = `${x}px`;
        img.style.top = `${y}px`;
        img.posx = x;
        img.posy = y;
        this.calcDistanceFromWall();
      }
    });
    document.addEventListener('mouseup', () => {
      if (this.dragging) {
        this.dragging = false;
        img.style.cursor = 'move';
      }
    });
    //
    
    this.activeflg = false;
    setInterval(() => {
      if (this.activeflg) {
        if (!this.parentElement) {
          document.body.removeChild(this.img);
          this.activeflg = false;
        }
      } else {
        if (this.parentElement) {
          this.reset();
          document.body.appendChild(this.img);
          this.activeflg = true;
        }
      }
    }, 200);
  }
  reset() {
    this.img.posx = innerWidth / 2 - this.img.width / 2;
    this.img.posy = innerWidth / 2 - this.img.height / 2;
    this.img.style.left = this.img.posx + "px";
    this.img.style.top = this.img.posy + "px";
    this.calcDistanceFromWall();
  }
  out(n) {
    if (n & 1) {
      this.motorr = -1;
    } else if (n & 2) {
      this.motorr = 1;
    } else {
      this.motorr = 0;
    }
    if (n & 16) {
      this.motorl = 1;
    } else if (n & 32) {
      this.motorl = -1;
    } else {
      this.motorl = 0;
    }
    this.move();
  }
  move() {
    const move = this.motorl != 0 || this.motorr != 0;
    if (!this.t && move) {
      this.t = setInterval(() => {
        if (this.dragging) return;
        this.direction += (this.motorl - this.motorr) * this.speeddir;
        const step = (this.motorr + this.motorl) * this.speed;
        const th = this.direction / 180 * Math.PI;
        const dx = Math.cos(th) * step;
        const dy = Math.sin(th) * step;
        this.img.posx += dx;
        this.img.posy += dy;
        if (this.img.posx > innerWidth - this.img.width) {
          this.img.posx = innerWidth - this.img.width;
        } else if (this.img.posx < 0) {
          this.img.posx = 0;
        }
        if (this.img.posy > innerHeight - this.img.height) {
          this.img.posy = innerHeight - this.img.height;
        } else if (this.img.posy < 0) {
          this.img.posy = 0;
        }
        this.img.style.left = (this.img.posx + dx) + "px";
        this.img.style.top = (this.img.posy + dy) + "px";
        this.img.style.transform = `rotate(${this.direction - 90}deg)`;
        this.img.style.transformOrigin = `center center`;

        this.calcDistanceFromWall();
        if (this.ex) {
          this.ex.setStateIN(2, this.distancesensor);
        }
      }, 100);
    } else if (this.t && !move) {
      clearInterval(this.t);
      this.t = null;
    }
  }
  calcDistanceFromWall() {
    const x = this.img.posx;
    const y = this.img.posy;
    const th = this.direction / 180 * Math.PI + Math.PI;
    const len = getDistanceFromWall(x, y, th, 0, 0, innerWidth, innerHeight);
    this.distance = len;
    this.distancesensor = Math.max(Math.floor(1023 - len * 10), 0);
    //console.log(len, this.direction, this.distancesensor);
  }
  setSegments(n) {
    // pwm
    let pwmmode = false;
    { 
			const v = this.ex.getPWMValue(2);
			const len = this.ex.getPWMLen(2);
      if (len > 0) {
        this.motorr = (v > len ? len : v) / len;
        pwmmode = true;
      }
    }
    {
			const v = this.ex.getPWMValue(5);
			const len = this.ex.getPWMLen(5);
      if (len > 0) {
        this.motorl = (v > len ? len : v) / len;
        pwmmode = true;
      }
    }
    if (!pwmmode) {
      this.out(n);
    }
    this.move();
  }
  setIchigoJamCore(ex) {
    this.ex = ex;
  }
}

customElements.define("sim-robo", SimRobo);
