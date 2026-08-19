export class PetSprite {
  constructor(stage, sprite, dots) {
    this.stage = stage;
    this.sprite = sprite;
    this.dots = dots;
  }

  setState(status) {
    this.sprite.classList.remove("is-thinking", "is-happy", "is-sad");
    this.dots.hidden = true;
    const oldSparkle = this.stage.querySelector(".sparkle");
    if (oldSparkle) {
      oldSparkle.remove();
    }

    if (status === "LOADING") {
      this.sprite.classList.add("is-thinking");
      this.dots.hidden = false;
    } else if (status === "SUCCESS") {
      this.sprite.classList.add("is-happy");
      const sparkle = document.createElement("span");
      sparkle.className = "sparkle";
      sparkle.textContent = "✨";
      this.stage.appendChild(sparkle);
    } else if (status === "ERROR") {
      this.sprite.classList.add("is-sad");
    }
  }
}
