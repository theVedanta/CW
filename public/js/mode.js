// HAM 
let ham = document.querySelector(".ham");
let side = document.querySelector(".side");
ham.addEventListener("click", e => {
  ham.classList.toggle("hamActive");
  side.classList.toggle("sideActive");
});

// --------------------- change theme ----------------------------
let btn = document.querySelector(".fa-lightbulb");

let theme = localStorage.getItem("theme");

let changeMode = () => {
  theme = localStorage.getItem("theme");
  if (theme == "dark") {
    document.body.classList.add("light");
    theme = localStorage.setItem("theme", "light");
  } else {
    document.body.classList.remove("light");
    theme = localStorage.setItem("theme", "dark");
  };
};

if (theme == "light") {
  document.body.classList.add("light");
  theme = localStorage.setItem("theme", "light");
} else {
  document.body.classList.remove("light");
  theme = localStorage.setItem("theme", "dark");
}

btn.addEventListener("click", () => {
  changeMode();
});

// PARALLAX -------------------------------------------------
let shapes = document.querySelectorAll(".transparent img");

document.addEventListener("mousemove", e => {
  for (let shape of shapes) {
    let speed = shape.getAttribute("data-speed") ? shape.getAttribute("data-speed") - 0.5 : 3;

    const x = (window.innerWidth + e.pageX * speed)/100;

    shape.style.transform = `translate(${x}px) rotate(var(--r))`
  };
});

// LOADING
let loader = document.querySelector(".loader");
let body = document.body;

let loaded = () => {
  loader.classList.add("loaded");
  body.classList.remove("loading");
};

$(window).on("load", setTimeout(loaded, 1500));
