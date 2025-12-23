"use client";

import { useState } from "react";
import { User, Mail, Lock, Cpu, ChevronRight, ChevronLeft } from "lucide-react";

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

  // Signup form data
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState("");
  const [codingExperience, setCodingExperience] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    // Get stored users
    const storedUsers = localStorage.getItem("users");
    const users = storedUsers ? JSON.parse(storedUsers) : [];

    // Login
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

    // Get stored users
    const storedUsers = localStorage.getItem("users");
    const users = storedUsers ? JSON.parse(storedUsers) : [];

    // Check if user already exists
    if (users.find((u: any) => u.email === email)) {
      setError("User with this email already exists");
      return;
    }

    // Create new user with all signup data
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

    setSignupStep(signupStep + 1);
  };

  const handlePrevStep = () => {
    setError("");
    setSignupStep(signupStep - 1);
  };

  const renderSignupStep = () => {
    switch (signupStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 rounded-full mb-4">
                <span className="text-sky-600">1</span>
              </div>
              <h2 className="text-gray-900 mb-2">How old are you?</h2>
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
                      ? "border-sky-600 bg-sky-50 text-sky-900"
                      : "border-gray-200 hover:border-sky-300 text-gray-700"
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 rounded-full mb-4">
                <span className="text-sky-600">2</span>
              </div>
              <h2 className="text-gray-900 mb-2">What grade are you in?</h2>
              <p className="text-gray-600">We'll customize projects to your level</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                "Elementary (K-5)",
                "Middle School (6-8)",
                "High School (9-12)",
                "College",
                "Home-School",
                "Others",
              ].map((gradeLevel) => (
                <button
                  key={gradeLevel}
                  type="button"
                  onClick={() => setGrade(gradeLevel)}
                  className={`p-4 border-2 rounded-lg transition ${
                    grade === gradeLevel
                      ? "border-sky-600 bg-sky-50 text-sky-900"
                      : "border-gray-200 hover:border-sky-300 text-gray-700"
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 rounded-full mb-4">
                <span className="text-sky-600">3</span>
              </div>
              <h2 className="text-gray-900 mb-2">What's your coding experience?</h2>
              <p className="text-gray-600">No experience required - we'll guide you!</p>
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
                      ? "border-sky-600 bg-sky-50"
                      : "border-gray-200 hover:border-sky-300"
                  }`}
                >
                  <div
                    className={`mb-1 ${
                      codingExperience === item.level ? "text-sky-900" : "text-gray-900"
                    }`}
                  >
                    {item.level}
                  </div>
                  <div
                    className={`text-sm ${
                      codingExperience === item.level ? "text-sky-700" : "text-gray-600"
                    }`}
                  >
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 rounded-full mb-4">
                <span className="text-sky-600">4</span>
              </div>
              <h2 className="text-gray-900 mb-2">Create your account</h2>
              <p className="text-gray-600">Almost there! Let's set up your login</p>
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                    placeholder="Emily Song"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-600 rounded-2xl mb-4">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">Curio.</h1>
          <p className="text-gray-600">Master electronics one project at a time</p>
        </div>

        {/* Login/Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!isSignup ? (
            // Login Form
            <>
              <div className="mb-6">
                <h2 className="text-gray-900 mb-1">Welcome Back</h2>
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
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
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-lg transition"
                >
                  Sign In
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignup(true);
                    setSignupStep(1);
                    setError("");
                  }}
                  className="text-sky-600 hover:text-sky-700 transition"
                >
                  Don't have an account? Sign up
                </button>
              </div>
            </>
          ) : (
            // Multi-step Signup Form
            <>
              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Step {signupStep} of 4</span>
                  <span className="text-sky-600">{Math.round((signupStep / 4) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(signupStep / 4) * 100}%` }}
                  />
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (signupStep < 4) {
                    handleNextStep();
                  } else {
                    handleSignupSubmit(e);
                  }
                }}
              >
                {renderSignupStep()}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
                    {error}
                  </div>
                )}

                {/* Navigation Buttons */}
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
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-sky-800 text-white rounded-lg hover:bg-sky-900 transition"
                  >
                    <span>{signupStep === 4 ? "Create Account" : "Continue"}</span>
                    {signupStep < 4 && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignup(false);
                    setSignupStep(1);
                    setError("");
                    setAge("");
                    setGrade("");
                    setCodingExperience("");
                  }}
                  className="text-sky-600 hover:text-sky-700 transition"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-gray-500 mt-6">Start your journey into Arduino and electronics</p>
      </div>
    </div>
  );
}
