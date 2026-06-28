/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#f5fbff",
        ink: "#24334b",
        softBlue: "#7bc8f6",
        aqua: "#5cd4c8",
        lilac: "#c9c2ff",
        peach: "#ffd8b8",
        offwhite: "#fffdf9",
        success: "#5bbf8a",
        warning: "#f5a35c",
        danger: "#ef7d7d",
        slateBlue: "#5e7ce2",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 50px rgba(87, 125, 179, 0.12)",
        card: "0 12px 30px rgba(73, 103, 145, 0.10)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(123, 200, 246, 0.25), transparent 35%), radial-gradient(circle at bottom right, rgba(201, 194, 255, 0.25), transparent 30%), linear-gradient(180deg, #f7fcff 0%, #fffdf9 100%)",
      },
    },
  },
  plugins: [],
};
