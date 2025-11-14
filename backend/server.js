import 'dotenv/config';
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import nftRoutes from "./routes/nftRoutes.js";
import nftIndex from "./routes/nftIndex.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/nft", nftIndex);
// Routes
app.use("/api/nft", nftRoutes);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
