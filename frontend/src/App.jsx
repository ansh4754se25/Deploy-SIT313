import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Banner from "./components/Banner";
import About from "./components/About";
import Projects from "./components/Projects";
import Gallery from "./components/Gallery";
import Contact from "./components/Contact";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PricingPage from "./pages/PricingPage";
import PostPage from "./pages/PostPage";
import "./App.css";

function HomePage() {
  return <><Banner /><About /><Projects /><Gallery /><Contact /></>;
}

export default function App() {
  return <BrowserRouter><AuthProvider>
    <Navbar />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/post" element={<PostPage />} />
    </Routes>
  </AuthProvider></BrowserRouter>;
}
