"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Cpu,
  ChevronRight,
  ChevronLeft,
  Menu,
} from "lucide-react";

import { Button } from "./ui/button";
import { ImageWithFallback } from "./ui/ImageWithFallback";

interface LoginPageProps {
  onLogin: (user: { email: string; name: string }) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Signup form data
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState("");
  const [codingExperience, setCodingExperience] = useState("");

  const resetToLogin = () => {
    setIsSignup(false);
    setSignupStep(1);
    setError("");
    setMobileMenuOpen(false);
  };

  const resetToSignup = () => {
    setIsSignup(true);
    setSignupStep(1);
    setError("");
    setMobileMenuOpen(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const storedUsers = localStorage.getItem("users");
    const users = storedUsers ? JSON.parse(storedUsers) : [];

    const user = users.find((u: any) => u.email === email && u.password === password);
    if (!user) {
      setError("Invalid email or password");
      return;
    }

    onLogin({ email, name: user.name });
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !name) {
      setError("Please fill in all fields");
      return;
    }

    const storedUsers = localStorage.getItem("users");
    const users = storedUsers ? JSON.parse(storedUsers) : [];

    if (users.find((u: any) => u.email === email)) {
      setError("User with this email already exists");
      return;
    }

    const newUser = {
      email,
      password,
      name,
      age,
      grade,
      codingExperience,
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    onLogin({ email, name });
  };

  const handleNextStep = () => {
    setError("");

    if (signupStep === 1 && !age) {
      setError("Please select your age");
      return;
    }
    if (signupStep === 2 && !grade) {
      setError("Please select your grade");
      return;
    }
    if (signupStep === 3 && !codingExperience) {
      setError("Please select your coding experience level");
      return;
    }

    setSignupStep((s) => s + 1);
  };

  const handlePrevStep = () => {
    setError("");
    setSignupStep((s) => s - 1);
  };

  const renderSignupStep = () => {
    switch (signupStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <span className="text-indigo-600 font-semibold">1</span>
              </div>
              <h2 className="text-gray-900 text-2xl font-semibold mb-2">How old are you?</h2>
              <p className="text-gray-600">Help us personalize your learning experience</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {["Under 10", "10-12", "13-15", "16-18", "19-25", "26+"].map((ageRange) => (
                <button
                  key={ageRange}
                  type="button"
                  onClick={() => setAge(ageRange)}
                  className={`p-4 border-2 rounded-lg transition ${
                    age === ageRange
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                      : "border-gray-200 hover:border-indigo-300 text-gray-700"
                  }`}
                >
                  {ageRange}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <span className="text-indigo-600 font-semibold">2</span>
              </div>
              <h2 className="text-gray-900 text-2xl font-semibold mb-2">What grade are you in?</h2>
              <p className="text-gray-600">We&apos;ll customize projects to your level</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                "Elementary (K-5)",
                "Middle School (6-8)",
                "High School (9-12)",
                "College",
                "Graduate School",
                "Not in School",
              ].map((gradeLevel) => (
                <button
                  key={gradeLevel}
                  type="button"
                  onClick={() => setGrade(gradeLevel)}
                  className={`p-4 border-2 rounded-lg transition ${
                    grade === gradeLevel
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                      : "border-gray-200 hover:border-indigo-300 text-gray-700"
                  }`}
                >
                  {gradeLevel}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <span className="text-indigo-600 font-semibold">3</span>
              </div>
              <h2 className="text-gray-900 text-2xl font-semibold mb-2">What&apos;s your coding experience?</h2>
              <p className="text-gray-600">No experience required — we&apos;ll guide you!</p>
            </div>

            <div className="space-y-3">
              {[
                { level: "No Experience", description: "I'm completely new to programming and electronics" },
                { level: "Beginner", description: "I've tried some basic coding or Arduino before" },
                { level: "Intermediate", description: "I've built a few projects and understand the basics" },
                { level: "Advanced", description: "I'm comfortable with programming and electronics" },
              ].map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setCodingExperience(item.level)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition ${
                    codingExperience === item.level
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <div className={`mb-1 ${codingExperience === item.level ? "text-indigo-900" : "text-gray-900"}`}>
                    {item.level}
                  </div>
                  <div className={`text-sm ${codingExperience === item.level ? "text-indigo-700" : "text-gray-600"}`}>
                    {item.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <span className="text-indigo-600 font-semibold">4</span>
              </div>
              <h2 className="text-gray-900 text-2xl font-semibold mb-2">Create your account</h2>
              <p className="text-gray-600">Almost there! Let&apos;s set up your login</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="block text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="signup-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="signup-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    id="signup-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    // ✅ Match Figma background (use gray-50 instead of pure white)
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header/nav: Curio click goes to /account-setup */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link
                href="/account-setup"
                className="text-primary text-xl font-semibold hover:opacity-90 transition"
              >
                Curio
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  About us
                </a>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  CurioLab
                </a>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  Store
                </a>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  Blogs
                </a>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  Curriculum
                </a>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={resetToLogin}>
                Log in
              </Button>
              <Button onClick={resetToSignup}>Sign up</Button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen((v) => !v)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              <a href="#" className="block text-gray-600">
                About us
              </a>
              <a href="#" className="block text-gray-600">
                CurioLab
              </a>
              <a href="#" className="block text-gray-600">
                Store
              </a>
              <a href="#" className="block text-gray-600">
                Blogs
              </a>
              <a href="#" className="block text-gray-600">
                Curriculum
              </a>

              <div className="pt-3 border-t border-gray-200 space-y-2">
                <Button variant="ghost" className="w-full" onClick={resetToLogin}>
                  Log in
                </Button>
                <Button className="w-full" onClick={resetToSignup}>
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* ✅ If your image is in /public/homepageMain.png, this works.
                    If it's inside /app/assets, move it to /public or import it. */}
                <ImageWithFallback
                  src="/homepageMain.png"
                  alt="Student learning electronics"
                  className="rounded-2xl shadow-2xl w-full"
                />

                <div className="absolute -bottom-6 -left-6 bg-indigo-600 text-white p-6 rounded-xl shadow-xl max-w-xs">
                  <div className="flex items-center gap-3 mb-2">
                    <Cpu className="w-8 h-8" />
                    <h3 className="text-white text-lg font-semibold">Build Amazing Projects</h3>
                  </div>
                  <p className="text-indigo-100 text-sm">
                    Join thousands of students learning Arduino and bringing their ideas to life.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                {!isSignup ? (
                  <>
                    <div className="mb-6">
                      <h2 className="text-gray-900 text-2xl font-semibold mb-1">Welcome Back</h2>
                      <p className="text-gray-600">Sign in to continue learning</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition"
                      >
                        Sign In
                      </button>
                    </form>

                    <div className="mt-6 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignup(true);
                          setSignupStep(1);
                          setError("");
                        }}
                        className="text-indigo-600 hover:text-indigo-700 transition"
                      >
                        Don&apos;t have an account? Sign up
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Step {signupStep} of 4</span>
                        <span className="text-indigo-600">{Math.round((signupStep / 4) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(signupStep / 4) * 100}%` }}
                        />
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (signupStep < 4) handleNextStep();
                        else handleSignupSubmit(e);
                      }}
                    >
                      {renderSignupStep()}

                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
                          {error}
                        </div>
                      )}

                      <div className="flex gap-3 mt-6">
                        {signupStep > 1 && (
                          <button
                            type="button"
                            onClick={handlePrevStep}
                            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Back</span>
                          </button>
                        )}

                        <button
                          type="submit"
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          <span>{signupStep === 4 ? "Create Account" : "Continue"}</span>
                          {signupStep < 4 && <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </form>

                    <div className="mt-6 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignup(false);
                          setSignupStep(1);
                          setError("");
                          setAge("");
                          setGrade("");
                          setCodingExperience("");
                        }}
                        className="text-indigo-600 hover:text-indigo-700 transition"
                      >
                        Already have an account? Sign in
                      </button>
                    </div>
                  </>
                )}
              </div>

              <p className="text-center text-gray-500 mt-6">
                Start your journey into Arduino and electronics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
