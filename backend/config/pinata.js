import dotenv from "dotenv";
dotenv.config();

export const pinataConfig = {
  apiKey: process.env.PINATA_JWT,
};
