import { useState } from "react";
import { Button } from "../components/ui/button";
import HeroImage from "../assets/images/Slider3.jpg"; 

export default function ContactUs() {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.message) {
      setError("All fields are required.");
      return false;
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    setError("");  // Clear error if form is valid
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(""); // Clear previous error if any

    try {
      // Replace with your API endpoint
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Something went wrong. Please try again later.");
      }

      // On successful submission
      setIsSubmitted(true);
      setFormData({ name: "", email: "", message: "" }); // Clear form fields
    } catch (error) {
      setError(error.message); // Display error message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="hero bg-cover bg-fixed bg-center relative py-24"
        style={{ backgroundImage: `url(${HeroImage})` }} 
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white text-center">Contact Us</h1>
        <p className="text-xl max-w-3xl mx-auto text-white">
          Have questions or need assistance? We're here to help! Reach out to us and we will respond as soon as possible.
        </p>
      </div>

      {/* Contact Details Section */}
      <div className="container mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">Get in Touch</h2>
        <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
          If you have any questions, concerns, or feedback, feel free to reach out to us using the contact form below. You can also contact us through the following channels:
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-black">Email</h3>
            <p className="text-gray-600">support@NutriTrack.com</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-black">Phone</h3>
            <p className="text-gray-600">+1 800 123 4567</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-black">Address</h3>
            <p className="text-gray-600">123 Nutrition Blvd, Health City, 12345</p>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">Send Us a Message</h2>

          {isSubmitted ? (
            <div className="bg-green-100 p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-xl font-semibold text-green-600">Thank you for reaching out!</h3>
              <p className="text-gray-600">We have received your message and will get back to you as soon as possible.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
              {/* Name Input */}
              <div className="mb-6">
                <label
                  htmlFor="name"
                  className="block text-lg font-medium text-left text-gray-700 mb-2"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Email Input */}
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-lg font-medium text-left text-gray-700 mb-2"
                >
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Message Input */}
              <div className="mb-6">
                <label
                  htmlFor="message"
                  className="block text-lg font-medium text-left text-gray-700 mb-2"
                >
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="6"
                  className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-sm mb-6">
                  <p>{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  className={`px-8 ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-accent text-white"}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <div className="bg-gray-800 text-white py-8">
        <div className="container text-center">
          <p>&copy; {new Date().getFullYear()} NutriTrack. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
