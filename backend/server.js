import 'dotenv/config';
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import nftRoutes from "./routes/nftRoutes.js";
import nftIndex from "./routes/nftIndex.js";
import connectDB from './db/connect.js';
import { startEventListener } from './services/indexer.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/nft', nftIndex);
// Routes
app.use("/api/nft", nftRoutes);

const startServer = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    startEventListener();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  } catch(error) {
    console.error('❌ Lỗi khởi động server:', error.message);
    process.exit(1);
  }
}

startServer();

