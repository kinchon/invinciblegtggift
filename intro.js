/* ======================================================
   INTRO ANIMADA — BÓVEDA GTG
   Archivo separado del index.html a propósito. Se encarga de:
   - Mostrar la intro del cofre 1 vez por día (por navegador/dispositivo)
   - Inyectar sus propios estilos y HTML (no hace falta tocar el resto)
   - Reproducir el audio sincronizado con la animación

   RUTAS DE ARCHIVOS que este script espera encontrar en /assets:
     assets/intro-chest-closed.png
     assets/intro-chest-semi.png
     assets/intro-chest-burst.png
     assets/intro-sound.mp3
   ====================================================== */

(function(){

  /* ---------- 1) ¿Ya se mostró hoy? ---------- */
  const STORAGE_KEY = 'gtg_intro_last_shown';
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  let lastShown = null;
  try { lastShown = localStorage.getItem(STORAGE_KEY); } catch(e){}

  /* Estas dos funciones se definen SIEMPRE, incluso si la intro no se
     va a mostrar hoy — si no, resetIntro() nunca llegaría a existir
     el mismo día en que ya se vio, que es justo cuando más falta hace. */
  window.resetIntro = function(){
    try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
    console.log('✅ Intro reiniciada. Recargá la página (F5) para verla de nuevo.');
  };

  window.showIntroState = function(){
    let v = null;
    try { v = localStorage.getItem(STORAGE_KEY); } catch(e){}
    console.log('Última vez que se mostró la intro:', v || '(nunca)');
  };

  if (lastShown === today) {
    return; // ya se vio hoy, no hacer nada más
  }

  /* ---------- 2) Estilos (con prefijo gtgintro- para no chocar con el resto) ---------- */
  const style = document.createElement('style');
  style.textContent = `
    .gtgintro-overlay{
      position:fixed; inset:0;
      background:#070a1f;
      display:flex; align-items:center; justify-content:center;
      z-index:9999;
      overflow:hidden;
    }
    .gtgintro-stage{ position:relative; width:260px; height:260px; }
    .gtgintro-stage img{
      position:absolute; inset:0; width:100%; height:100%;
      object-fit:contain; opacity:0;
    }
    .gtgintro-glow{
      position:absolute; inset:-40%; border-radius:50%;
      background:radial-gradient(circle, rgba(61,245,224,0.55), transparent 70%);
      opacity:0; filter:blur(4px);
    }
    #gtgintro-closed{ animation: gtgintroClosedPhase 4.03s ease forwards; }
    @keyframes gtgintroClosedPhase{
      0%{opacity:1;} 7%{opacity:1;} 10%{opacity:0;} 100%{opacity:0;}
    }
    #gtgintro-semi{
      animation: gtgintroSemiPhase 4.03s ease forwards, gtgintroShake 0.12s ease-in-out infinite;
      animation-delay: 0s, 0.3s;
    }
    @keyframes gtgintroSemiPhase{
      0%{opacity:0;} 7%{opacity:0;} 10%{opacity:1;} 22%{opacity:1;} 25%{opacity:0;} 100%{opacity:0;}
    }
    @keyframes gtgintroShake{
      0%,100%{ transform:translate(0,0) rotate(0deg); }
      25%{ transform:translate(-2px,1px) rotate(-0.6deg); }
      50%{ transform:translate(2px,-1px) rotate(0.6deg); }
      75%{ transform:translate(-1px,-1px) rotate(-0.4deg); }
    }
    .gtgintro-glow{ animation: gtgintroGlowPulse 4.03s ease forwards; }
    @keyframes gtgintroGlowPulse{
      0%{opacity:0; transform:scale(0.8);}
      10%{opacity:0.3; transform:scale(0.9);}
      22%{opacity:0.7; transform:scale(1.05);}
      25%{opacity:1; transform:scale(1.3);}
      40%{opacity:0.5; transform:scale(1.3);}
      96%{opacity:0; transform:scale(1.3);}
      100%{opacity:0;}
    }
    #gtgintro-burst{ animation: gtgintroBurstPhase 4.03s ease forwards; }
    @keyframes gtgintroBurstPhase{
      0%{opacity:0; transform:scale(0.9);}
      24%{opacity:0; transform:scale(0.9);}
      27%{opacity:1; transform:scale(1.08);}
      32%{opacity:1; transform:scale(1);}
      96%{opacity:1; transform:scale(1.02);}
      100%{opacity:0; transform:scale(1.03);}
    }
    .gtgintro-flash{
      position:fixed; inset:0;
      background:radial-gradient(circle, #d8fff8 0%, #3df5e0 35%, rgba(61,245,224,0) 75%);
      opacity:0; transform:scale(0.3);
      z-index:10000;
      animation: gtgintroFlashPhase 4.03s ease forwards;
      pointer-events:none;
    }
    @keyframes gtgintroFlashPhase{
      0%{opacity:0; transform:scale(0.3);}
      23%{opacity:0; transform:scale(0.3);}
      26%{opacity:1; transform:scale(1.5);}
      30%{opacity:1; transform:scale(1.8);}
      40%{opacity:0; transform:scale(2);}
      100%{opacity:0; transform:scale(2);}
    }
    body.gtgintro-lock{ overflow:hidden !important; }
  `;
  document.head.appendChild(style);

  /* ---------- 3) Marcado HTML (inyectado, no vive en index.html) ---------- */
  const overlay = document.createElement('div');
  overlay.className = 'gtgintro-overlay';
  overlay.id = 'gtgintro-overlay';
  overlay.innerHTML = `
    <div class="gtgintro-stage">
      <div class="gtgintro-glow"></div>
      <img id="gtgintro-closed" src="assets/intro-chest-closed.png" alt="">
      <img id="gtgintro-semi" src="assets/intro-chest-semi.png" alt="">
      <img id="gtgintro-burst" src="assets/intro-chest-burst.png" alt="">
    </div>
  `;

  const flash = document.createElement('div');
  flash.className = 'gtgintro-flash';
  flash.id = 'gtgintro-flash';

  const audio = document.createElement('audio');
  audio.id = 'gtgintro-audio';
  audio.src = 'assets/intro-sound.mp3';
  audio.preload = 'auto';

  /* ---------- 4) Mostrar y reproducir ---------- */
  function startIntro(){
    document.body.classList.add('gtgintro-lock');
    document.body.appendChild(overlay);
    document.body.appendChild(flash);
    document.body.appendChild(audio);

    audio.play().catch(() => {
      console.warn('Autoplay de audio bloqueado por el navegador (falta un gesto del usuario). La animación sigue igual.');
    });

    setTimeout(() => {
      overlay.remove();
      flash.remove();
      audio.remove();
      document.body.classList.remove('gtgintro-lock');
    }, 4030);

    try { localStorage.setItem(STORAGE_KEY, today); } catch(e){}
  }

  // Espera a que el resto de la página esté lista antes de mostrar la intro
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startIntro);
  } else {
    startIntro();
  }

})();
