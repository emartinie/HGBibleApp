
      const ALEPHBET = [
        { letter: "א", name: "Aleph", sound: "Silent / A" },
        { letter: "ב", name: "Bet", sound: "B / V" },
        { letter: "ג", name: "Gimel", sound: "G" },
        { letter: "ד", name: "Dalet", sound: "D" },
        { letter: "ה", name: "He", sound: "H" },
        { letter: "ו", name: "Vav", sound: "V / O / U" },
        { letter: "ז", name: "Zayin", sound: "Z" },
        { letter: "ח", name: "Chet", sound: "Kh" },
        { letter: "ט", name: "Tet", sound: "T" },
        { letter: "י", name: "Yod", sound: "Y" },
        { letter: "כ/ך‎", name: "Kaf", sound: "K / Kh" },
        { letter: "ל", name: "Lamed", sound: "L" },
        { letter: "מ/ם‎", name: "Mem", sound: "M" },
        { letter: "נ/ן", name: "Nun", sound: "N" },
        { letter: "ס", name: "Samekh", sound: "S" },
        { letter: "ע", name: "Ayin", sound: "Silent / NG" },
        { letter: "פ/ף", name: "Pe", sound: "P / F" },
        { letter: "צ/ץ", name: "Tsadi", sound: "Ts" },
        { letter: "ק", name: "Qof", sound: "K" },
        { letter: "ר", name: "Resh", sound: "R" },
        { letter: "ש", name: "Shin", sound: "Sh / S" },
        { letter: "ת", name: "Tav", sound: "T" }
      ];

      (function () {
        let index = 0;
        let audio = null;

        const letterEl = document.getElementById("alephLetter");
        const nameEl = document.getElementById("alephName");
        const soundEl = document.getElementById("alephSound");

        function render() {
          const l = ALEPHBET[index];
          letterEl.textContent = l.letter;
          nameEl.textContent = l.name;
          soundEl.textContent = l.sound;
          if (audio) globalAudio.pause(audio);
          audio = new Audio(l.audio);
        }

        document.getElementById("alephPrev").onclick = () => {
          index = (index - 1 + ALEPHBET.length) % ALEPHBET.length;
          render();
        };

        document.getElementById("alephNext").onclick = () => {
          index = (index + 1) % ALEPHBET.length;
          render();
        };

        document.getElementById("alephPlay").onclick = () => {
          if (audio) globalAudio.play(audio);
        };

        render();

      const audio = new Audio();
      
      document.getElementById("alephAudioBtn")?.addEventListener("click", () => {
        audio.src = "assets/sounds/heart-and-soul.mp3"; //  actual path
        audio.play();
      });
      
      document.getElementById("alephPlay")?.addEventListener("click", () => {
        const letter = document.getElementById("alephName")?.textContent.toLowerCase();
        audio.src = `assets/sounds/letters${letter}.mp3`; // example
        audio.play();
      });            
      })();
