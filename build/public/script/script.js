"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buttonEL = document.querySelector(".clicker");
const headingEl = document.querySelector(".heading");
console.log("script module in loop");
buttonEL?.addEventListener("click", function (e) {
    console.log("runs script");
    if (!headingEl)
        return;
    headingEl.style.color = "#4e4e";
});
