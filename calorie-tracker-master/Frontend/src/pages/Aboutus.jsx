import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import SliderImage from '../assets/images/Slider1.jpg';
import SophieImage from '../assets/images/profile-pic.png';  
import DaisyImage from '../assets/images/profile-pic.png';  
import IbrahimImage from '../assets/images/profile-pic.png';  

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="hero bg-cover bg-fixed bg-center relative py-24"
        style={{ backgroundImage: `url(${SliderImage})` }} 
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white text-center">About Us</h1>
        <p className="text-xl max-w-3xl mx-auto text-white">
          We are a dedicated team on a mission to help you achieve your health and nutrition goals through innovative and easy-to-use tools.
        </p>
      </div>

      {/* Our Mission Section */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-6">Our Mission</h2>
        <p className="text-lg text-gray-700 mb-6 text-center max-w-2xl mx-auto">
          Our mission is to empower individuals to make healthier food choices and to take control of their nutrition journey. We believe that everyone deserves access to the tools and resources that can help them lead a healthier, more balanced life.
        </p>
        <div className="flex justify-center">
          <Link to="/signup">
            <Button size="lg" className="px-8 bg-accent text-white">
              Get Started Today
            </Button>
          </Link>
        </div>
      </div>

      {/* The Team Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-8">Meet The Team</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {/* Sophie Olusola - Frontend Developer */}
            <div className="p-6 bg-gray-100 rounded-lg shadow-sm">
              <img src={SophieImage} alt="Sophie Olusola" className="rounded-full w-32 h-32 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-black">Sophie Olusola</h3>
              <p className="text-gray-600">Frontend Developer</p>
              <p className="text-gray-700 mt-4">
                Sophie is a passionate Frontend Developer, responsible for creating intuitive and dynamic user interfaces. She loves building engaging and seamless experiences for users.
              </p>
              <div className="mt-4">
                <a href="https://github.com/Sophiewebstart" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-gray-800 text-white">
                    GitHub Profile
                  </Button>
                </a>
              </div>
            </div>

            {/* Daisy Mwambi - Backend Developer */}
            <div className="p-6 bg-gray-100 rounded-lg shadow-sm">
              <img src={DaisyImage} alt="Daisy Mwambi" className="rounded-full w-32 h-32 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-black">Daisy Mwambi</h3>
              <p className="text-gray-600">Backend Developer</p>
              <p className="text-gray-700 mt-4">
                Daisy specializes in backend development, ensuring that the platform runs efficiently and securely. She enjoys tackling complex problems and optimizing the system for performance.
              </p>
              <div className="mt-4">
                <a href="https://github.com/Shighi" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-gray-800 text-white">
                    GitHub Profile
                  </Button>
                </a>
              </div>
            </div>

            {/* Ibrahim Tunde - Frontend Developer */}
            <div className="p-6 bg-gray-100 rounded-lg shadow-sm">
              <img src={IbrahimImage} alt="Ibrahim Tunde" className="rounded-full w-32 h-32 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-black">Ibrahim Tunde</h3>
              <p className="text-gray-600">Frontend Developer</p>
              <p className="text-gray-700 mt-4">
                Ibrahim is another skilled Frontend Developer, working alongside Sophie to create beautiful and responsive web applications. He is passionate about improving UI/UX for optimal user satisfaction.
              </p>
              <div className="mt-4">
                <a href="https://github.com/teebabs521" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-gray-800 text-white">
                    GitHub Profile
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values Section */}
      <div className="container mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">Our Values</h2>
        <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
          At our core, we are guided by values that put people first, creating a positive and inclusive environment where everyone has the opportunity to succeed in their health journey.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-black mb-3">Health & Wellness</h3>
            <p className="text-gray-600">We focus on helping individuals improve their overall health and wellness, offering personalized nutrition tools to achieve their goals.</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-black mb-3">Innovation</h3>
            <p className="text-gray-600">We are constantly exploring new ways to integrate technology into nutrition and fitness, ensuring we offer cutting-edge solutions.</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-black mb-3">Community</h3>
            <p className="text-gray-600">We foster a supportive community where users can connect, share experiences, and motivate each other on their health journeys.</p>
          </div>
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
