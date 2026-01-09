export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="bg-gradient-to-br from-[#4996ff] to-[#D4E89E] py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-semibold mb-6">About Curio</h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto">
            Curio is guided online support for learning engineering—built to be equitable,
            affordable, and genuinely helpful for students at every pace.
          </p>
        </div>
      </section>

      {/* WHAT CURIO IS */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-semibold mb-4">What Curio Is</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Curio was created for students who are curious and capable—but don’t always have
              access to the kind of support that makes learning feel possible.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We combine structured, project-based lessons with guided help that explains
              concepts clearly, adapts to a student’s pace, and supports learning without
              taking away ownership of the work.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Curio is designed to feel like:</h3>
            <ul className="space-y-3 text-gray-700">
              <li>• A supportive guide, not a confusing textbook</li>
              <li>• A step-by-step path, not a giant leap</li>
              <li>• Help that teaches, not answers that replace learning</li>
              <li>• A platform built for access, not exclusivity</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SAFE AI HELPER */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">A Safe AI Helper — Built for Learning</h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Curio includes a safe AI helper that understands what a student is trying to do and
              supports them in a way that builds real understanding—without rushing, overwhelming,
              or doing the work for them.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Explains, Step by Step</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Students get explanations that make concepts click—broken down into smaller pieces
                and connected back to what they’re building.
              </p>
            </div>

            <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Adapts to Their Pace</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Curio supports different learning speeds and styles. If a student needs extra time,
                extra examples, or a different explanation, Curio can meet them there.
              </p>
            </div>

            <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Supports Without Replacing</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                The goal isn’t shortcuts—it’s skill-building. Curio helps students think, debug, and
                learn how to solve problems independently over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EQUITY + AFFORDABILITY */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
          <div className="bg-gradient-to-br from-[#FFE4E8] to-[#FFC9D1] rounded-2xl p-8">
            <h2 className="text-3xl font-semibold mb-4">Equitable by Design</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Curio is built around the belief that access should not determine potential.
              Students shouldn’t need private tutoring, expensive programs, or “insider knowledge”
              to learn engineering.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We focus on clarity, structure, and support so students can learn confidently—no matter
              their background or prior experience.
            </p>
          </div>

          <div className="border rounded-2xl p-8">
            <h2 className="text-3xl font-semibold mb-4">Affordable and Practical</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Curio is designed to be affordable for families and scalable for schools and programs.
              We aim to reduce the time and resources typically required for high-quality mentorship
              while keeping the learning experience personal and supportive.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The result: more students can build real skills, with less barrier to entry—and mentors
              can focus on encouragement and deeper growth.
            </p>
          </div>
        </div>
      </section>

      {/* HOW STUDENTS LEARN */}
      <section className="py-20 border-t">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-10 text-center">How Students Learn on Curio</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Guided Projects</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Students learn by building real things—electronics, code, and systems—through
                structured project paths that teach fundamentals naturally.
              </p>
            </div>

            <div className="border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Practice + Checkpoints</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Short practice moments and checkpoints help students verify understanding before moving
                on—so they don’t feel stuck later.
              </p>
            </div>

            <div className="border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Support When It Matters</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                When students get stuck, Curio helps them recover with explanations, hints, and debugging
                guidance that builds long-term confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-semibold mb-4">Curiosity should be supported, not gated.</h3>
          <p className="text-gray-700 leading-relaxed">
            Curio exists to make high-quality engineering learning more accessible—through guided lessons,
            equitable design, and safe, supportive tools that help students grow at the pace they need.
          </p>
        </div>
      </section>
    </div>
  );
}
