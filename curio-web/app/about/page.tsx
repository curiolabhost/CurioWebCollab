export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="bg-gradient-to-br from-[#4996ff] to-[#D4E89E] py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-semibold mb-6">About Curio</h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto">
            Curio is an interactive learning platform where students build real projects with guided,
            step by step support. It is designed to be equitable, affordable, and truly helpful for
            beginners through advanced learners.
          </p>
        </div>
      </section>

      {/* WHAT CURIO IS */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-semibold mb-4">What Curio Is</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Curio was created for students who are curious and capable, but do not always have access
              to the kind of support that makes learning feel possible.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Students do not just watch videos or read instructions. They actively build one step at a
              time, complete real tasks, and get help exactly when it matters. Curio focuses on project
              based learning across a wide range of programming topics, from Arduino and electronics to
              Python and beyond.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Curio is designed to feel like</h3>
            <ul className="space-y-3 text-gray-700">
              <li>• A guided path that keeps students moving forward</li>
              <li>• A build first experience that teaches by doing</li>
              <li>• Help that strengthens understanding, not shortcuts</li>
              <li>• A platform built for access, not exclusivity</li>
            </ul>
          </div>
        </div>
      </section>

      {/* HOW CURIO IS DIFFERENT */}
      <section className="py-20 border-t">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">How Curio Is Different</h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Curio is not a platform where students passively consume lessons. It is built around active,
              hands on progress, where students build projects one piece at a time and get support while
              they are working.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Not just videos</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Students learn by doing, not by watching. Each lesson guides them through building and testing
                real features so concepts stick through action.
              </p>
            </div>

            <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Not just reading</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Students move through clear steps with checkpoints that confirm understanding. They can practice,
                try again, and build confidence without feeling lost.
              </p>
            </div>

            <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Project based building</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Every path leads to something real. Students build projects that feel meaningful, from electronics
                and embedded systems to software projects in languages like Python.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SAFE AI HELPER */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">A Safe AI Helper Built for Learning</h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Curio includes a safe AI helper that supports students while they build. It helps students understand,
              debug, and keep going without taking away ownership of the work.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Explains step by step</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Students get explanations that connect directly to what they are building. Concepts are broken into
                smaller pieces, with examples that match the project in front of them.
              </p>
            </div>

            <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Helps without replacing</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Curio does not just hand students answers. It provides hints, reasoning, and debugging guidance so students
                learn how to solve problems and grow independence over time.
              </p>
            </div>

            <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Meets every level</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Each project is designed so beginners can succeed and advanced coders can still feel challenged. Students
                can build at the level that fits them and progress into more complex work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CURIOLAB MENTORSHIP */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
          <div className="bg-gradient-to-br from-[#FFE4E8] to-[#FFC9D1] rounded-2xl p-8">
            <h2 className="text-3xl font-semibold mb-4">CurioLab mentorship and community</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Curio grew from CurioLab, where students learn through hands on building with supportive guidance. CurioLab
              mentorship is rooted in encouragement, patient explanations, and helping students build confidence through
              real progress.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Curio brings that CurioLab mentorship experience online so more students can access structured support,
              while mentors can focus on encouragement, deeper questions, and personal growth.
            </p>
          </div>

          <div className="border rounded-2xl p-8">
            <h2 className="text-3xl font-semibold mb-4">Wide variety of projects</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Curio is not limited to one niche. Students can explore Arduino, electronics, embedded programming, Python,
              and other programming paths that match their interests.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The same platform supports students who are starting from zero and students who want real challenge. Every
              project includes a clear beginner friendly path, with room to grow into advanced building and deeper problem
              solving.
            </p>
          </div>
        </div>
      </section>

      {/* HOW STUDENTS LEARN */}
      <section className="py-20 border-t">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-10 text-center">How students learn on Curio</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Guided projects</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Students build real projects with a clear sequence of steps so learning feels organized, achievable, and
                rewarding.
              </p>
            </div>

            <div className="border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Practice and checkpoints</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Practice moments and checkpoints help students confirm understanding before they move on, so they do not
                get stuck later.
              </p>
            </div>

            <div className="border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Support when it matters</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                When students hit a wall, Curio gives targeted help that teaches them how to debug, rethink, and keep going.
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
            Curio exists to make high quality engineering learning more accessible through project based building, guided
            support, and a safe AI helper that helps students grow with confidence.
          </p>
        </div>
      </section>
    </div>
  );
}
