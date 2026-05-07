import { prisma } from "@/lib/prisma";

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        phone: "+1234567890",
        address: "123 Test Street",
        acceptedDisclaimer: true,
        role: "individual",
        name: "Test User",
        dietaryPreferences: ["vegetarian"],
        language: "english",
      },
    });
    console.log("✅ Created user:", user);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();