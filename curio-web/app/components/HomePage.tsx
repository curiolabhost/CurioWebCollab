import React, { useState } from 'react';
import { Menu, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './ui/ImageWithFallback';

interface HomePageProps {
  onNavigateToLogin: () => void;
  onNavigateToDashboard: () => void;
}

const projects = [
  {
    id: 1,
    title: 'Arduino Basics',
    description: 'Learn the fundamentals of Arduino programming and circuit building. Perfect for absolute beginners.',
    image: 'https://images.unsplash.com/photo-1553408226-42ecf81a214c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmR1aW5vJTIwZWxlY3Ryb25pY3MlMjBib2FyZHxlbnwxfHx8fDE3NjY1OTQyNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    difficulty: 'Beginner',
    category: 'Electronics'
  },
  {
    id: 2,
    title: 'Remote Controlled Car',
    description: 'Build and program your own RC car with wireless control using Arduino and motors.',
    image: 'https://images.unsplash.com/photo-1743495851178-56ace672e545?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2JvdCUyMGNhciUyMHByb2plY3R8ZW58MXx8fHwxNzY2NjAzNjk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    difficulty: 'Intermediate',
    category: 'Robotics'
  },
  {
    id: 3,
    title: 'Smart Speaker System',
    description: 'Create a voice-activated speaker system with sound sensors and audio output capabilities.',
    image: 'https://images.unsplash.com/photo-1686709709573-a877d7012cf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGVha2VyJTIwc291bmQlMjBzeXN0ZW18ZW58MXx8fHwxNzY2NjAzNjk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    difficulty: 'Intermediate',
    category: 'IoT'
  },
  {
    id: 4,
    title: 'Mini Drone',
    description: 'Design and build a programmable mini drone with flight controls and stabilization systems.',
    image: 'https://images.unsplash.com/photo-1699084583993-16958aa157d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcm9uZSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzY2NTY4MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    difficulty: 'Advanced',
    category: 'Robotics'
  },
  {
    id: 5,
    title: 'Smart Home Hub',
    description: 'Automate your home with sensors, relays, and wireless connectivity for modern living.',
    image: 'https://images.unsplash.com/photo-1679356505858-bf4129177392?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMGhvbWUlMjBhdXRvbWF0aW9ufGVufDF8fHx8MTc2NjU1MTAxNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    difficulty: 'Advanced',
    category: 'IoT'
  },
  {
    id: 6,
    title: 'LED Light Show',
    description: 'Program stunning LED animations and interactive light displays with RGB controls.',
    image: 'https://images.unsplash.com/photo-1599380061663-01b03dff42df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWQlMjBsaWdodHMlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NjY2MDM2OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    difficulty: 'Beginner',
    category: 'Electronics'
  },
  {
    id: 7,
    title: 'Weather Station',
    description: 'Monitor temperature, humidity, and pressure with sensors and real-time data displays.',
    image: 'https://images.unsplash.com/photo-1762553025389-a0ee281d6744?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWF0aGVyJTIwc3RhdGlvbiUyMHNlbnNvcnN8ZW58MXx8fHwxNzY2NjAzNjk1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    difficulty: 'Intermediate',
    category: 'IoT'
  },
  {
    id: 8,
    title: 'Robotic Arm',
    description: 'Build a multi-axis robotic arm with precise servo control and programmable movements.',
    image: 'https://images.unsplash.com/photo-1761195696590-3490ea770aa1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2JvdGljJTIwYXJtJTIwbWVjaGFuaWNhbHxlbnwxfHx8fDE3NjY2MDM2OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    difficulty: 'Advanced',
    category: 'Robotics'
  },
  {
    id: 9,
    title: 'Game Controller',
    description: 'Create a custom game controller with buttons, joysticks, and wireless connectivity.',
    image: 'https://images.unsplash.com/photo-1650585680670-4b67e210fe21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1lJTIwY29udHJvbGxlciUyMGpveXN0aWNrfGVufDF8fHx8MTc2NjYwMzY5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    difficulty: 'Intermediate',
    category: 'Electronics'
  }
];

const categories = ['All', 'Electronics', 'Robotics', 'IoT'];

export function HomePage({ onNavigateToLogin, onNavigateToDashboard }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredProjects = selectedCategory === 'All' 
    ? projects 
    : projects.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-primary cursor-pointer">Curio</h1>
              <div className="hidden md:flex items-center gap-6">
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">About us</a>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">CurioLab</a>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">Store</a>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">Blogs</a>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">Curricula</a>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={onNavigateToLogin}
              >
                Log in
              </Button>
              <Button onClick={onNavigateToLogin}>
                Sign up
              </Button>
            </div>

            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              <a href="#" className="block text-gray-600">Studios</a>
              <a href="#" className="block text-gray-600">Blogs</a>
              <a href="#" className="block text-gray-600">About us</a>
              <a href="#" className="block text-gray-600">Curricula</a>
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <Button variant="ghost" className="w-full" onClick={onNavigateToLogin}>
                  Log in
                </Button>
                <Button className="w-full" onClick={onNavigateToLogin}>
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#E8F4A6] to-[#D4E89E] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl mb-4">
              Build. Learn. Create.
            </h1>
            <p className="text-xl md:text-2xl text-gray-700">
              Master engineering through hands-on projects that bring your ideas to life.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="mb-6">
                Curio accelerates your learning!
              </h2>
              <p className="text-gray-600 mb-8">
                Learn with millions of creative learners by building real projects. Get hands-on experience with electronics, coding, and problem solving.
              </p>
              <div className="space-y-4">
                <Button className="w-full sm:w-auto" onClick={onNavigateToLogin}>
                  Get started
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <Button variant="outline" className="w-full sm:w-auto ml-0 sm:ml-4" onClick={onNavigateToDashboard}>
                  Browse projects
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <Button variant="ghost" className="w-full sm:w-auto ml-0 sm:ml-4">
                  For educators
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1759884248009-92c5e957708e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMGxlYXJuaW5nJTIwY29kaW5nfGVufDF8fHx8MTc2NjUyOTMwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Students learning"
                className="rounded-2xl shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Featured Projects</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our collection of step-by-step Arduino projects. From simple circuits to complex robotics, there's something for every skill level.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Project Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div 
                key={project.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                onClick={onNavigateToDashboard}
              >
                <div className="aspect-video overflow-hidden">
                  <ImageWithFallback 
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {project.difficulty}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {project.category}
                    </span>
                  </div>
                  <h3 className="mb-2">{project.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {project.description}
                  </p>
                  <Button variant="outline" className="w-full group">
                    Learn more
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Curio Section */}
      <section className="py-24 bg-gradient-to-br from-[#FFE4E8] to-[#FFC9D1]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="mb-6">Why Curio?</h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            We believe in learning by doing. Our project-based approach helps students develop real-world skills in electronics, programming, and creative problem-solving—all while building awesome projects they can show off.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="mb-4">Curio</h4>
              <p className="text-sm text-gray-600">
                Empowering the next generation of makers and innovators.
              </p>
            </div>
            <div>
              <h4 className="mb-4">Learn</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">Projects</a></li>
                <li><a href="#" className="hover:text-primary">Tutorials</a></li>
                <li><a href="#" className="hover:text-primary">Resources</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Careers</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">Privacy</a></li>
                <li><a href="#" className="hover:text-primary">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            © 2024 Curio. All rights reserved. Made with ❤️ for makers and learners.
          </div>
        </div>
      </footer>
    </div>
  );
}
