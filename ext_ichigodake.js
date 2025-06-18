import { IchigoConnect } from "https://ichigojam.github.io/IchigoTerm/IchigoConnect.js";

export const ctrlIchigoDake = {
  init: async function(ex) {
    this.ic = await IchigoConnect.create();
    this.out = 0;
  },
  setOutput: function(n) {
    if (!this.ic) return;
    if (this.out == n) return;
    console.log("out", n, "bk", this.out);
    this.ic.write("OUT" + n + "\n");
    this.out = n;
  },
};
