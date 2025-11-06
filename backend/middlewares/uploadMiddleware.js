import multer from "multer";
import path from "path";

// Lưu file tạm trong thư mục temp
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "temp/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

export default upload;
