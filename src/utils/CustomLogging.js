class CustomLogging {
  constructor(title) {
    this.title = {
      body: title || "---",
      color: "rgba(0,0,0,0.5)",
      size: "1rem",
      margin: "0.5rem 0",
      before: ">>>",
      after: "$$$",
    };

    this.body = {
      color: "rgba(0,0,0,1)",
      size: "1rem",
      padding: ".5rem 0",
    };
  }

  setTitleStyle({ color, size, margin, padding, before, after }) {
    if (color !== undefined) this.title.color = color;
    if (size !== undefined) this.title.size = size;
    if (margin !== undefined) this.title.margin = margin;
    if (padding !== undefined) this.title.padding = padding;
    if (before !== undefined) this.title.before = before;
    if (after !== undefined) this.title.after = after;
  }

  setBodyStyle({ color, size, margin, padding }) {
    if (color !== undefined) this.body.color = color;
    if (size !== undefined) this.body.size = size;
    if (margin !== undefined) this.body.margin = margin;
    if (padding !== undefined) this.body.padding = padding;
  }

  log(body = "") {
    // the second line is now the body because the first references the content after the first %c for the title
    console.log(
      `${this.title.before} %c${this.title.body} ${this.title.after} %c${body}`,
      `color: ${this.title.color}; font-weight: bold; font-size: ${this.title.size}; margin: ${this.title.margin}; padding: ${this.title.padding};`,
      `color: ${this.body.color}; font-weight: normal; font-size: ${this.body.size};  margin: ${this.body.margin}; padding: ${this.body.padding}; font-family: sans-serif;`
    );
  }

  l(body = "") {
    // the second line is now the body because the first references the content after the first %c for the title
    console.log(
      `%c${this.title.body} ${this.title.after} %c${body}`,
      `color: ${this.title.color}; font-weight: bold; font-size: ${this.title.size}; margin: ${this.title.margin}; padding: ${this.title.padding};`,
      `color: ${this.body.color}; font-weight: normal; font-size: ${this.body.size};  margin: ${this.body.margin}; padding: ${this.body.padding}; font-family: sans-serif;`
    );
  }
  back(body = "") {
    // the second line is now the body because the first references the content after the first %c for the title
    console.log(
      `%c${this.title.body} <<< \n%c${body}`,
      `color: ${this.title.color}; font-weight: bold; font-size: ${this.title.size}; margin: ${this.title.margin}; padding: ${this.title.padding};`,
      `color: ${this.body.color}; font-weight: normal; font-size: ${this.body.size};  margin: ${this.body.margin}; padding: ${this.body.padding}; font-family: sans-serif;`
    );
  }
  forward(body = "") {
    // the second line is now the body because the first references the content after the first %c for the title
    console.log(
      `%c${this.title.body} >>> \n%c${body}`,
      `color: ${this.title.color}; font-weight: bold; font-size: ${this.title.size}; margin: ${this.title.margin}; padding: ${this.title.padding};`,
      `color: ${this.body.color}; font-weight: normal; font-size: ${this.body.size};  margin: ${this.body.margin}; padding: ${this.body.padding}; font-family: sans-serif;`
    );
  }
}

const custom = new CustomLogging();

const error = new CustomLogging("error");
error.setBodyStyle({ color: "red", size: "2rem" });

const special = new CustomLogging("special");
special.setBodyStyle({
  color: "rgba(0,70,255,0.5)",
  size: "1.2rem",
  padding: "1rem",
});
special.setTitleStyle({
  color: "rgba(0,70,255,0.5)",
  size: "1.2rem",
  margin: "0 0 0 0rem",
  after: "!!!",
});

const back = new CustomLogging("back");
back.setBodyStyle({
  color: "rgba(0,70,255,0.5)",
  size: "1rem",
  padding: "1rem",
});
back.setTitleStyle({
  color: "rgba(255,155,70,0.95)",
  size: "1.2rem",
  margin: "0 0 0 0",
});

const forward = new CustomLogging("forward");
forward.setBodyStyle({
  color: "rgba(0,70,255,0.5)",
  size: "1rem",
  padding: "1rem",
});
forward.setTitleStyle({
  color: "rgba(70,205,70,0.95)",
  size: "1.2rem",
  margin: "0 0 0 0",
});

const customStyles = [];
customStyles.push(error, special);
// let customStylesObjects = []
// customStylesObjects.push({"error": error}, {"special": special},{ "back": back}, {"forward": forward})

let customStylesObjects = {
  error: error,
  special: special,
  back: back,
  forward: forward,
};
let c = { error: error, special: special, back: back, forward: forward };

module.exports = { customStyles, customStylesObjects, c };

// export default customStyles;
// export customStylesObjects;
