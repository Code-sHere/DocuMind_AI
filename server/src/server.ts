import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();



  app.listen(PORT, () => {
    console.log(`🚀 DocuMind AI server running on port ${PORT}`);
    if (!process.env.CLERK_PUBLISHABLE_KEY) {
      throw new Error("CLERK_PUBLISHABLE_KEY is missing in server .env");
    }

    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error("CLERK_SECRET_KEY is missing in server .env");
    }
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
  });
}

startServer();