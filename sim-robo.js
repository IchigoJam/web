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
    this.img.posx = innerWidth / 2 - this.img.width / 2;
    this.img.posy = innerWidth / 2 - this.img.height / 2;
    this.img.style.left = this.img.posx + "px";
    this.img.style.top = this.img.posy + "px";
    this.img.style.position = "absolute";
    this.motorr = 0;
    this.motorl = 0;
    this.speed = 2;
    this.speeddir = 2; // deg
    this.direction = 0;
    this.t = null;

    const img2 = create();
    img2.style.filter = "grayscale(100%)";
    img2.width = img2.width / 2;
    img2.height = img2.height / 2;
    this.appendChild(img2);
    
    this.activeflg = false;
    setInterval(() => {
      if (this.activeflg) {
        if (!this.parentElement) {
          document.body.removeChild(this.img);
          this.activeflg = false;
        }
      } else {
        if (this.parentElement) {
          document.body.appendChild(this.img);
          this.activeflg = true;
        }
      }
    }, 200);
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
    const move = this.motorl || this.motorr;
    if (!this.t && move) {
      this.t = setInterval(() => {
        this.direction += (this.motorl - this.motorr) * this.speeddir;
        const step = (this.motorr + this.motorl) * this.speed;
        const th = -(this.direction / 180 * Math.PI) - Math.PI / 2;
        const dx = Math.cos(th) * step;
        const dy = -Math.sin(th) * step;
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
        this.img.style.transform = `rotate(${this.direction}deg)`;
        this.img.style.transformOrigin = `center center`;
      }, 100);
    } else if (this.t && !move) {
      clearInterval(this.t);
      this.t = null;
    }
  }
  setSegments(n) {
    this.out(n);
  }
}

customElements.define("sim-robo", SimRobo);
