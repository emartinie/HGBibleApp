const GREEK_ALPHABET = [
  { letter: "Α", name: "Alpha", sound: "A" },
  { letter: "Β", name: "Beta", sound: "B" },
  { letter: "Γ", name: "Gamma", sound: "G" },
  { letter: "Δ", name: "Delta", sound: "D" },
  { letter: "Ε", name: "Epsilon", sound: "E" },
  { letter: "Ζ", name: "Zeta", sound: "Z" },
  { letter: "Η", name: "Eta", sound: "Ē" },
  { letter: "Θ", name: "Theta", sound: "Th" },
  { letter: "Ι", name: "Iota", sound: "I" },
  { letter: "Κ", name: "Kappa", sound: "K" },
  { letter: "Λ", name: "Lambda", sound: "L" },
  { letter: "Μ", name: "Mu", sound: "M" },
  { letter: "Ν", name: "Nu", sound: "N" },
  { letter: "Ξ", name: "Xi", sound: "X" },
  { letter: "Ο", name: "Omicron", sound: "O" },
  { letter: "Π", name: "Pi", sound: "P" },
  { letter: "Ρ", name: "Rho", sound: "R" },
  { letter: "Σ", name: "Sigma", sound: "S" },
  { letter: "Τ", name: "Tau", sound: "T" },
  { letter: "Υ", name: "Upsilon", sound: "U" },
  { letter: "Φ", name: "Phi", sound: "Ph" },
  { letter: "Χ", name: "Chi", sound: "Ch" },
  { letter: "Ψ", name: "Psi", sound: "Ps" },
  { letter: "Ω", name: "Omega", sound: "O" }
];

(function () {

  let index = 0;
  let audio = new Audio();

  const letterEl = document.getElementById("greekLetter");
  const nameEl = document.getElementById("greekName");
  const soundEl = document.getElementById("greekSound");

  function render() {
    const l = GREEK_ALPHABET[index];

    if (!l) return;

    letterEl.textContent = l.letter;
    nameEl.textContent = l.name;
    soundEl.textContent = l.sound;

    audio.pause();
  }

  document.getElementById("greekPrev")?.addEventListener("click", () => {
    index = (index - 1 + GREEK_ALPHABET.length) % GREEK_ALPHABET.length;
    render();
  });

  document.getElementById("greekNext")?.addEventListener("click", () => {
    index = (index + 1) % GREEK_ALPHABET.length;
    render();
  });

  document.getElementById("greekPlay")?.addEventListener("click", () => {
    const letter = GREEK_ALPHABET[index].letter;
    audio.src = `assets/sounds/greek/${letter}.mp3`;
    audio.play();
  });

  document.getElementById("greekAudioBtn")?.addEventListener("click", () => {
    audio.src = "assets/sounds/greek/greek-alphabet.mp3";
    audio.play();
  });

  render();

})();
