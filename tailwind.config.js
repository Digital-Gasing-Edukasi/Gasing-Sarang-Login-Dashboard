export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Base desktop KEDUA. Desktop punya 2 resolusi patokan:
      //   • lg  (1024px+) → base 1366×768  (form 380px)
      //   • fhd (1728px+) → base 1920×1080 (form 480px)
      // Ambang 1728px (bukan 1920) supaya monitor 1920 yang viewport-nya
      // menyusut oleh scrollbar (~1903px) tetap kena base FHD. Layar 1600/1680
      // sengaja tetap di base 1366. Nilai ini satu-satunya knob kalau mau geser.
      screens: {
        fhd: '1728px',
      },
      fontFamily: {
        sans: ['"Poppins"', 'sans-serif'],
        display: ['"Poppins"', 'sans-serif'],
        'cera-pro': ['"Cera Pro"', '"Poppins"', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        link: "hsl(var(--link))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
