import React from 'react';
import { 
  ArrowRight, 
  FileCheck2, 
  Cpu, 
  Building2, 
  Clock3, 
  UserCheck, 
  CheckCircle2, 
  ShieldAlert, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function LandingHero({ onGetStarted }) {
  const steps = [
    {
      num: "01",
      title: "Citizen Report",
      desc: "Report issues in your native language via text or voice.",
      icon: MessageSquare,
      color: "from-blue-500 to-civic-600"
    },
    {
      num: "02",
      title: "AI Analysis",
      desc: "Gemini AI parses problem, urgency, and categorization automatically.",
      icon: Cpu,
      color: "from-civic-600 to-indigo-600"
    },
    {
      num: "03",
      title: "Department Routing",
      desc: "Dispatches grievance straight to the responsible municipal bureau.",
      icon: Building2,
      color: "from-indigo-600 to-purple-600"
    },
    {
      num: "04",
      title: "Tracking & Action",
      desc: "Real-time lifecycle tracking until civic officers execute on-site fixes.",
      icon: Clock3,
      color: "from-purple-600 to-amber-600"
    },
    {
      num: "05",
      title: "Citizen Verification",
      desc: "Resolution is only marked complete once you confirm the fix.",
      icon: UserCheck,
      color: "from-emerald-600 to-teal-700"
    }
  ];

  return (
    <div className="space-y-16 py-8">
      
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-navy-900 to-navy-950 text-white p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-civic-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          
          {/* Civic Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-civic-200 text-xs sm:text-sm font-medium">
            <Sparkles className="w-4 h-4 text-civic-400" />
            <span>Google Hackathon • Civic Tech Platform</span>
          </div>

          {/* Project Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Report<span className="text-civic-400">2</span>Resolve
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl font-medium text-civic-100 max-w-2xl mx-auto">
            "From reporting a problem to verified resolution."
          </p>

          {/* Explanation */}
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
            Report2Resolve is an AI-powered civic platform bridging citizens and municipal 
            authorities. Express community grievances in plain everyday language—the platform 
            accurately understands the issue, routes it to the designated department, 
            and ensures resolution is verified directly by citizens.
          </p>

          {/* Primary Action Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-base bg-civic-500 hover:bg-civic-400 text-white shadow-lg shadow-civic-600/40 hover:shadow-civic-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>Report a Problem</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics / Reassurance */}
          <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3">
              <p className="text-2xl font-bold text-white">Multilingual</p>
              <p className="text-xs text-slate-400 mt-0.5">Tamil, English & Regional dialects</p>
            </div>
            <div className="p-3">
              <p className="text-2xl font-bold text-white">Automated</p>
              <p className="text-xs text-slate-400 mt-0.5">Direct Department Routing</p>
            </div>
            <div className="p-3 col-span-2 sm:col-span-1">
              <p className="text-2xl font-bold text-white">Verified</p>
              <p className="text-xs text-slate-400 mt-0.5">Citizen-first closure sign-off</p>
            </div>
          </div>

        </div>
      </section>

      {/* Core Flow Section */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How The Resolution Lifecycle Works
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Transparent accountability from the moment a problem is submitted to its physical on-ground verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx} 
                className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 tracking-wider">
                      STEP {step.num}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
