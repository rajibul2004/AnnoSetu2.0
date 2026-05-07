export interface User {
  id: string
  email: string
  name: string | null
  role: "individual" | "restaurant" | "ngo" | "admin"
  image?: string | null
}