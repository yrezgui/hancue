const typefaces = {
  serif: { label: "Serif", source: "Nanum Myeongjo", family: "HanCue Serif", file: "HanCueSerif-Regular", license: "NanumMyeongjo-OFL.txt" },
  sans: { label: "Sans", source: "Nanum Gothic", family: "HanCue Sans", file: "HanCueSans-Regular", license: "NanumGothic-OFL.txt" },
  script: { label: "Script", source: "Nanum Pen Script", family: "HanCue Script", file: "HanCueScript-Regular", license: "NanumPenScript-OFL.txt" },
};

const input = document.querySelector("#korean-text");
const specimen = document.querySelector("#specimen-text");
const size = document.querySelector("#font-size");
const copyButton = document.querySelector("#copy");
const fontStatus = document.querySelector("#font-status");
let currentSample = "한국어";
let currentStyle = "serif";
let fontRequest = 0;
let copyTimer;

function syncTypefaceControls(style) {
  document.querySelectorAll("[data-typeface-option]").forEach((radio) => {
    radio.checked = radio.value === style;
  });
}

function updateText() {
  // The font supplies every reading. Keep the actual text plain Korean.
  const text = input.value.normalize("NFC");
  specimen.textContent = text;
  document.querySelector("#empty-message").hidden = text.trim().length > 0;
  const count = [...text.replace(/\n/g, "")].length;
  document.querySelector("#character-count").textContent = `${count} character${count === 1 ? "" : "s"}`;
  document.querySelectorAll("[data-sample]").forEach((button) => {
    const active = button.dataset.sample === text;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function updateFeatures() {
  specimen.style.fontFeatureSettings = `"ss01" ${document.querySelector("#show-cues").checked ? 0 : 1}`;
}

function updateSize() {
  document.documentElement.style.setProperty("--size", `${size.value}px`);
  document.querySelector("#size-value").innerHTML = `${Number(size.value)} <span>px</span>`;
}

async function selectTypeface(style) {
  if (!Object.hasOwn(typefaces, style)) return;
  const face = typefaces[style];
  const request = ++fontRequest;
  fontStatus.textContent = `Loading ${face.source}…`;
  fontStatus.style.color = "";
  syncTypefaceControls(style);
  try {
    const faces = await document.fonts.load(`40px "${face.family}"`, "한글");
    if (!faces.length) throw new Error("Font unavailable");
    if (request !== fontRequest) return;
    currentStyle = style;
    document.documentElement.dataset.typeface = style;
    document.documentElement.style.setProperty("--reading-font", `"${face.family}"`);
    document.querySelectorAll("[data-selected-font]").forEach((label) => {
      label.textContent = `${face.label} / ${face.source}`;
    });
    document.querySelectorAll("[data-download-format]").forEach((link) => {
      const format = link.dataset.downloadFormat;
      link.href = `fonts/${face.file}.${format}?v=0.3.1`;
      link.setAttribute("aria-label", `Download ${face.label.toLowerCase()} font (${format})`);
    });
    document.querySelector("#font-license").href = `fonts/${face.license}`;
    fontStatus.textContent = `${face.source} / Regular`;
    try { localStorage.setItem("hancue-typeface", style); } catch { /* Optional preference. */ }
  } catch {
    if (request !== fontRequest) return;
    fontStatus.textContent = `Could not load ${face.source}. Please reload to try again.`;
    fontStatus.style.color = "var(--red)";
    syncTypefaceControls(currentStyle);
  }
}

document.querySelectorAll("[data-typeface-option]").forEach((radio) => {
  radio.addEventListener("change", () => selectTypeface(radio.value));
});
document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    currentSample = button.dataset.sample;
    input.value = currentSample;
    updateText();
  });
});
input.addEventListener("input", updateText);
size.addEventListener("input", updateSize);
document.querySelector("#show-cues").addEventListener("change", updateFeatures);
document.querySelector("#clear").addEventListener("click", () => {
  input.value = "";
  updateText();
  input.focus();
});
document.querySelector("#reset").addEventListener("click", () => {
  input.value = currentSample;
  updateText();
});
copyButton.addEventListener("click", async () => {
  clearTimeout(copyTimer);
  try {
    await navigator.clipboard.writeText(input.value.normalize("NFC"));
    copyButton.textContent = "Copied!";
  } catch {
    input.focus();
    input.select();
    copyButton.textContent = "Select text to copy";
  }
  copyTimer = setTimeout(() => { copyButton.textContent = "Copy Korean text"; }, 2500);
});

// Keep the specimen comfortable on narrow screens; the slider still controls
// the actual font size, without a separate CSS cap overriding its value.
if (window.matchMedia("(max-width: 760px)").matches) size.value = "80";
let initialStyle = "serif";
try {
  const stored = localStorage.getItem("hancue-typeface");
  if (Object.hasOwn(typefaces, stored)) initialStyle = stored;
} catch { /* Storage can be unavailable in private or embedded browsers. */ }
updateText();
updateFeatures();
updateSize();
selectTypeface(initialStyle);
