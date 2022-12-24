let JoyCon = null;

let ringconmode = false;

const getAll = () => {
  if (!JoyCon) {
    return [];
  }
  const list = [];
  for (const joyCon of JoyCon.connectedJoyCons.values()) {
    list.push(joyCon);
  }
  return list;
};
const getID = (joyCon) => {
  if (!JoyCon) {
    return -1;
  }
  let id = 0;
  for (const j of JoyCon.connectedJoyCons.values()) {
    if (j == joyCon) {
      return id;
    }
    id++;
  }
  return -1;
};

let gamepad = null;
let tid = null;
let ringcon0 = -1;
if (window.btnjoycon) {
	const connect = async () => {
    JoyCon = await import("https://tomayac.github.io/joy-con-webhid/src/index.js");
    await JoyCon.connectJoyCon();
    if (!tid) {
      tid = setInterval(async () => {
        for (const joyCon of JoyCon.connectedJoyCons.values()) {
          if (joyCon.eventListenerAttached) {
            continue;
          }
          console.log(joyCon.device.productName)
          joyCon.eventListenerAttached = true;
          
          const name = ["a", "b", "left", "right", "up", "down", "plus", "minus"];
          if (!gamepad) {
            const buttons = new Array(name.length);
            for (let i = 0; i < buttons.length; i++) {
              buttons[i] = { value: 0 };
            }
            const axes = new Array(2);
            for (let i = 0; i < axes.length; i++) {
              axes[i] = { value: 0 };
            }
            gamepad = {
              id: "JoyConSupport",
              axes,
              buttons,
            }
          }
          joyCon.addEventListener('hidinput', ({ detail }) => {
            //if (joyCon.device.productName.startsWith("HVC Controller ")) {
              const name = joyCon.device.productName;
              const btn = detail.buttonStatus;
              for (let i = 0; i < name.length; i++) {
                if (btn[name[i]] !== undefined) {
                  gamepad.buttons[i].value = btn[name[i]];
                }
              }
              if (name == "Joy-Con (R)") {
                //console.log(name, gamepad.axes[0], gamepad.axes[1])
                if (ringconmode && detail.ringCon) { // todo detect ringcon
                  const st = detail.ringCon.strain;
                  if (st) {
                    const ana = st / 2500 - 1;
                    const id = getID(joyCon);
                    if (ringcon0 < 0 || ringcon0 == id) {
                      ringcon0 = id;
                      gamepad.axes[0] = ana;
                    } else {
                      gamepad.axes[1] = ana;  
                    }
                  }
                } else {
                  gamepad.axes[0] = -detail.analogStickRight.vertical * 2;
                  gamepad.axes[1] = detail.analogStickRight.horizontal * 2;
                }
              } else if (name == "Joy-Con (L)") {
                gamepad.axes[0] = detail.analogStickLeft.vertical * 2;
                gamepad.axes[1] = -detail.analogStickLeft.horizontal * 2;
              }
            //}
          });
        }
      }, 2000);
    }
	};
	btnjoycon.onclick = async () => connect();

  if (window.btnringcon) {
    btnringcon.onclick = () => {
      ringconmode = true;
      getAll().forEach(joyCon => joyCon.enableRingCon());
    };
  }
}

let bkled = 0;

export class JoyConSupport {
  static update(led, ex) {
    if (bkled != led) {
      getAll().forEach(d => d.setLEDState(led ? 0xf : 0));
    }
    bkled = led;
  }
  static getGamepad() {
    return gamepad;
  }
}
