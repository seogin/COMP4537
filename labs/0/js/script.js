const delay = (ms) => new Promise(res => setTimeout(res, ms));

class Button {
  constructor(label, idSuffix) {
    this.label = label;
    this.id = `button-${idSuffix}`;
    this.element = document.createElement("button");
    this.element.textContent = String(label);
    this.element.id = this.id;
  }

    remove() {
        this.element.remove();
    }
}

class ButtonManager {
    constructor(containerEl) {
        this.buttons = [];
        this.containerEl = containerEl;

        window.addEventListener('resize', () => this._ensurePlayfield());
    }

    clearContainer() {
        this.containerEl.innerHTML = "";
    }

    removeAllButtons() {
        this.buttons.forEach(button => button.remove());
        this.buttons = [];
    }

    hideAllButtons() {
        this.buttons.forEach(button => button.element.style.display = "none");
    }

    hideAllNumbers() {
        this.buttons.forEach(b => b.element.classList.add("num-hidden"));
    }

    onEachClick(handler) {
    // store so we can remove later
    this._listeners ||= new Map();
    this.clearClicks();
    this.buttons.forEach(btn => {
        const h = () => handler(btn);
        this._listeners.set(btn.element, h);
        btn.element.addEventListener("click", h);
    });
    }
    clearClicks() {
    if (!this._listeners) return;
    this._listeners.forEach((h, el) => el.removeEventListener("click", h));
    this._listeners.clear();
    }

      _ensurePlayfield() {
    const top = this.containerEl.getBoundingClientRect().top;
    const h = Math.max(120, window.innerHeight - top - 16); 
    this.containerEl.style.height = `${h}px`;
    if (getComputedStyle(this.containerEl).position === 'static') {
      this.containerEl.style.position = 'relative';
    }
  }

    shuffleButtons(gap = 8, maxTries = 300) {
    this._ensurePlayfield(); 
    const contW = this.containerEl.clientWidth;
    const contH = this.containerEl.clientHeight;

    // randomize placement order
    const order = [...this.buttons];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    const placed = [];
    const overlap = (a, b) =>
      !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);

    order.forEach(btn => {
      const el = btn.element;
      el.style.position = "absolute";
      el.style.transition = "left 300ms ease, top 300ms ease";

      const r = el.getBoundingClientRect();
      const bw = r.width || el.offsetWidth;
      const bh = r.height || el.offsetHeight;

      const maxLeft = Math.max(0, contW - bw);
      const maxTop  = Math.max(0, contH - bh);

      let left, top, ok = false, tries = 0;

      // random placement with collision rejection
      while (tries < maxTries && !ok) {
        left = Math.floor(Math.random() * (maxLeft + 1));
        top  = Math.floor(Math.random() * (maxTop + 1));
        const padRect = { left: left - gap, top: top - gap,
                          right: left + bw + gap, bottom: top + bh + gap };
        ok = placed.every(p => !overlap(p, padRect));
        if (ok) placed.push(padRect);
        tries++;
      }

      // fallback to grid cells if random failed
      if (!ok) {
        const cellW = bw + gap * 2, cellH = bh + gap * 2;
        const cols = Math.max(1, Math.floor(contW / cellW));
        const rows = Math.max(1, Math.floor(contH / cellH));
        outer:
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            left = Math.min(maxLeft, Math.floor(c * cellW));
            top  = Math.min(maxTop,  Math.floor(r * cellH));
            const padRect = { left: left - gap, top: top - gap,
                              right: left + bw + gap, bottom: top + bh + gap };
            if (placed.every(p => !overlap(p, padRect))) {
              placed.push(padRect);
              ok = true;
              break outer;
            }
          }
        }
      }

      el.style.left = `${left}px`;
      el.style.top  = `${top}px`;
    });
  }

    showAllNumbers() {
    this.buttons.forEach(b => b.element.classList.remove("num-hidden"));
    }

    showAllButtons() {
        this.buttons.forEach(button => button.element.style.display = "inline-block");
    }

    createButtons(count) {
        this.clearContainer();
        this.removeAllButtons();

        const numbers = []

        for (let i = 1; i <= count; i++) {
            numbers.push(i);
        }

        numbers.sort(() => Math.random() - 0.5);

        for (let i = 0; i < count; i++) {
            const button = new Button(i + 1, numbers[i]);
            this.buttons.push(button);
            this.containerEl.appendChild(button.element);
        }
    }

}

class Game {
    constructor(createButtons, buttonCount, buttonContainer) {
        this.createButtons = document.getElementById(createButtons);
        this.buttonCount = document.getElementById(buttonCount);
        this.buttonContainer = document.getElementById(buttonContainer);
        this.buttonManager = new ButtonManager(this.buttonContainer);

        this._run();    

    }


    _run() {
        this.createButtons.addEventListener("click", () => this.start());
    }

    beginMemoryGame(n) {
        this.expectedNext = 1;
        this.isGuessing = true;

        this.buttonManager.shuffleButtons();
        this.buttonManager.hideAllNumbers();
        this.buttonManager.onEachClick(btn => this.handleGuess(btn));

    }

    handleGuess(btn) {
        if (!this.isGuessing) return;

        if (btn.label === this.expectedNext) {
            // correct: reveal and lock this one
            btn.element.classList.remove("num-hidden");
            btn.element.disabled = true;
            this.expectedNext += 1;

            if (this.expectedNext > Number(this.buttonCount.value)) {
            alert("Excellent memory!");
            this.endGame();
            }
        } else {
            // wrong: reveal everything & end
            alert("Wrong order!");
            this.buttonManager.showAllNumbers();
            this.endGame();
        }
    }

    async start() {
        // Start the game logic

        if(this.buttonCount.value < 3 || this.buttonCount.value > 7) {
        alert("Please enter a number between 3 and 7.");
        return;
        }

        this.buttonManager.createButtons(this.buttonCount.value);

        await delay(this.buttonCount.value * 1000);

        const n = Number(this.buttonCount.value);
        for (let i = 0; i < n; i++) {
        this.buttonManager.shuffleButtons();
        await delay(2000);
        }

        this.beginMemoryGame(n);


    }
    endGame() {
        this.isGuessing = false;
        this.buttonManager.clearClicks();
    }
}

const game = new Game("createButtons", "buttonCount", "buttonContainer");
