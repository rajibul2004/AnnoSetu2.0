# 🌱 Annosetu — Food Sharing Platform

Annosetu is a modern full-stack web application that connects restaurants, home cooks, and individuals to **share surplus food**, reduce waste, and help communities in need.

---

## 🚀 Features

* 🔍 **Smart Search** — Find food items quickly
* 🎯 **Dynamic Filters** — Sort by distance, type (donation/discount), etc.
* 🌙 **Dark/Light Mode** — Seamless theme switching
* 🌐 **Multi-language Support** — English, Hindi, Bengali (i18n-ready)
* 📊 **Animated Stats Dashboard** — Modern landing page UI
* ⚡ **Fast & Responsive** — Built with performance in mind

---

## 🛠️ Tech Stack

### Frontend

* Next.js 16 (App Router)
* TypeScript
* Tailwind CSS
* Framer Motion (animations)
* next-themes (theme handling)

### Backend (if applicable)

* Node.js / Express
* MongoDB / Mongoose

---

## 📁 Project Structure

```
app/
  [locale]/        → Multi-language routing
  page.tsx         → Homepage
  layout.tsx       → Root layout
components/
  ui/              → Reusable UI components
  provider/        → Theme provider
lib/
  utils/           → Helper functions
```

---

## 🌍 Internationalization (i18n)

Supports:

* 🇬🇧 English (`en`)
* 🇮🇳 Hindi (`hi`)
* 🇮🇳 Bengali (`bn`)

Routing example:

```
/en → English
/hi → Hindi
/bn → Bengali
```

---

## ⚙️ Installation

```bash
# Clone repo
git clone https://github.com/your-username/annosetu.git

# Go to project
cd annosetu

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 🧪 Development Notes

* Uses **App Router (Next.js 16)**
* Avoid SSR/client mismatch using:

  * `mounted` state
  * `suppressHydrationWarning`
* Animations handled via **Framer Motion**
* Responsive UI built with Tailwind

---

## 📸 Screens (Optional)

*Add screenshots here*

---

## 🚧 Future Improvements

* 🔐 Authentication (JWT / OAuth)
* 📍 Location-based search (Google Maps API)
* 📦 Real-time food availability
* 📱 Mobile app version
* 🤖 AI-based food recommendation

---

## 🤝 Contributing

Contributions are welcome!

```bash
# Create branch
git checkout -b feature-name

# Commit changes
git commit -m "Added feature"

# Push
git push origin feature-name
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 💡 Inspiration

Built to reduce food waste and support communities by connecting people with surplus food resources.

---

## 👨‍💻 Author

**Your Name**
GitHub: https://github.com/your-username

---

⭐ If you like this project, consider giving it a star!
