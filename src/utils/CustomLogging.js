class CustomLogging {
  constructor(title) {
    this.title = {
      body: title || "---",
      color: "rgba(0,0,0,0.5)",
      weight: "bold",
      size: "1rem",
      margin: "0.5rem 0",
      before: ">>>",
      after: "$$$",
    };

    this.body = {
      color: "rgba(0,0,0,1)",
      size: "1rem",
      padding: "0 1rem 1rem 0",
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
      `%c${this.title.before} ${this.title.body} ${this.title.after} %c${body}`,
      `color: ${this.title.color}; font-weight: ${this.title.weight}; font-size: ${this.title.size}; margin: ${this.title.margin}; padding: ${this.title.padding};`,
      `color: ${this.body.color}; font-weight: normal; font-size: ${this.body.size};  margin: ${this.body.margin}; padding: ${this.body.padding}; font-family: sans-serif;`
    );
  }
}
let color;

const up = new CustomLogging("up");
color = "rgba(0,170,255,0.95)";
up.setTitleStyle({
  color: color,
  size: "1.2rem",
  margin: "0",
  before: "!!!",
  after: "!!!\n",
});
up.setBodyStyle({
  color: color,
  size: "1.2rem",
  padding: "0 1rem 1rem 0",
});

const back = new CustomLogging("back");
color = "rgba(150,70,55,0.95)";
back.setTitleStyle({
  color: color,
  size: "1.2rem",
  margin: "0 0 0 0",
  before: "<<<",
  after: "<<<\n",
});
back.setBodyStyle({
  color: color,
  size: "1rem",
  padding: "1rem",padding: "0 1rem 1rem 0",});


const forward = new CustomLogging("forward");
color = "rgba(150,70,255,0.95)";
forward.setTitleStyle({
  color: color,
  size: "1.2rem",
  margin: "0 0 0 0",
  before: ">>>",
  after: ">>>\n",
});
forward.setBodyStyle({
  color: color,
  size: "1rem",
  padding: "0 1rem 1rem 0",
});


const crumbs = new CustomLogging("crumbs");
color = "rgba(90,70,255,1)";
crumbs.setTitleStyle({
  color: color,
  size: "1.2rem",
  margin: "0 0 0 0",
  before: ">>>",
  after: ">>>\n",
});
crumbs.setBodyStyle({
  color: color,
  size: "1rem",
  padding: "0 1rem 1rem 0",
});

const error = new CustomLogging("error");
color = "rgba(255,70,70,0.95)";
error.setTitleStyle({
  color: color,
  size: "1.2rem",
  margin: "0 0 0 0",
  before: ">>>",
  after: ">>>\n",
});
error.setBodyStyle({
  color: color,
  size: "1rem",
  padding: "0 1rem 1rem 0",
});


const data = new CustomLogging("data");
color = "rgba(255,70,70,0.95)";
data.setTitleStyle({
  color: color,
  weight: "normal",
  size: "1.2rem",
  margin: "0 0 0 0",
  before: ">>>",
  after: ">>>\n",
});
data.setBodyStyle({
  color: color,
  size: "1rem",
  padding: "0 1rem 1rem 0",
});

let customStylesObjects = {
  error: error,
  up: up,
  back: back,
  forward: forward,
  crumbs: crumbs,
  data: data
};

module.exports = { customStylesObjects };

// export default customStyles;
// export customStylesObjects;
