import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const NotFound = () => (
  <div className="min-h-screen bg-[#0B0F10]">
    <Navbar />
    <main className="max-w-xl mx-auto px-6 py-28 text-center">
      <h1 className="font-display text-4xl font-semibold text-[#EDEFEF] mb-3">Page not found</h1>
      <p className="text-[#8B9494] mb-8">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-6 py-3 rounded-md hover:bg-[#4FE8A5] transition-colors">
        Back to home
      </Link>
    </main>
    <Footer />
  </div>
);

export default NotFound;
