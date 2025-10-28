import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MintNFT.css";

const MintNFT = ({ walletAddress }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "0.5",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      setFormData({
        ...formData,
        image: file,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!walletAddress) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!formData.image) {
      alert("Please select an image!");
      return;
    }

    if (!formData.name.trim()) {
      alert("Please enter NFT name!");
      return;
    }

    setLoading(true);

    try {
      // Xử lý mint NFT - sẽ được triển khai với smart contract
      console.log("Minting NFT:", formData);

      // Giả lập quá trình mint
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("NFT minted successfully!");
      navigate("/collection");
    } catch (error) {
      console.error("Error minting NFT:", error);
      alert("Error minting NFT. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="mint-nft">
      <div className="mint-container">
        <div className="mint-header">
          <button className="back-button" onClick={() => navigate("/")}>
            ← Back
          </button>
          <h1>Mint New NFT</h1>
          <p>Create your own digital collectible</p>
        </div>

        <div className="mint-form-container">
          <form onSubmit={handleSubmit} className="mint-form">
            <div className="form-group">
              <label className="form-label">
                Image <span className="required">*</span>
              </label>
              <div
                className="image-upload"
                onClick={() => document.getElementById("image-input").click()}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="image-preview"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📷</div>
                    <p>Click to upload image</p>
                    <span className="upload-hint">
                      PNG, JPG, GIF up to 10MB
                    </span>
                  </div>
                )}
                <input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                NFT Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Digital Art #1"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your NFT..."
                className="form-textarea"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Price (ETH) <span className="required">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.5"
                step="0.01"
                min="0"
                className="form-input"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-mint" disabled={loading}>
                {loading ? "Minting..." : "Mint NFT"}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MintNFT;
