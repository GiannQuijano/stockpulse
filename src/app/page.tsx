import Link from "next/link"
import {
  Activity,
  TrendingDown,
  Bell,
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
  Package,
  AlertTriangle,
  Clock,
  LineChart,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            <span className="text-lg font-bold tracking-tight">StockPulse</span>
            <span className="text-[10px] font-medium bg-white/10 text-white/60 px-2 py-0.5 rounded-full ml-2">
              by Flight Performance Co
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/70">Built for performance marketers</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
            Never kill a winning ad
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              because of stockouts
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            StockPulse monitors your clients&apos; inventory in real-time, forecasts stockouts before
            they happen, and alerts your team — so you never have to pause a profitable campaign.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3.5 rounded-lg transition-colors text-base"
            >
              Start Tracking Inventory
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-8 py-3.5 rounded-lg transition-colors text-base"
            >
              See How It Works
            </Link>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto mt-16 pt-10 border-t border-white/10">
            <div>
              <p className="text-3xl font-bold text-emerald-400">4hr</p>
              <p className="text-sm text-white/40 mt-1">Sync Intervals</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">30s</p>
              <p className="text-sm text-white/40 mt-1">Alert Speed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">7-day</p>
              <p className="text-sm text-white/40 mt-1">Forecasting</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-white/5 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-red-400 mb-3 uppercase tracking-wider">The Problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Stockouts are the silent performance killer
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-lg">
              Your team spends weeks finding winning creatives and scaling profitably — then the client
              runs out of stock and you&apos;re forced to pause everything.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingDown,
                title: "Lost momentum",
                description:
                  "Pausing a winning ad resets the algorithm. When you restart, CPMs are higher and performance rarely recovers to the same level.",
                color: "text-red-400",
                bgColor: "bg-red-400/10",
              },
              {
                icon: AlertTriangle,
                title: "Zero visibility",
                description:
                  "Your team has no idea how much stock the client has. By the time they tell you, it's too late — the damage is done.",
                color: "text-amber-400",
                bgColor: "bg-amber-400/10",
              },
              {
                icon: Clock,
                title: "Wasted spend",
                description:
                  "Ads running to out-of-stock products means wasted budget, poor customer experience, and lost trust.",
                color: "text-orange-400",
                bgColor: "bg-orange-400/10",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6"
              >
                <div className={`inline-flex p-2.5 rounded-lg ${item.bgColor} mb-4`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-emerald-400 mb-3 uppercase tracking-wider">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              From blind spots to full visibility in minutes
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-lg">
              Connect your client&apos;s store, and StockPulse handles the rest.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                icon: Package,
                title: "Connect",
                description: "Link Shopify, WooCommerce, or upload CSV. Takes 60 seconds per brand.",
              },
              {
                step: "02",
                icon: LineChart,
                title: "Track",
                description: "Inventory syncs automatically every 4 hours. See stock levels across all SKUs.",
              },
              {
                step: "03",
                icon: BarChart3,
                title: "Forecast",
                description: "Our velocity engine calculates sell-through rates and predicts exactly when stock runs out.",
              },
              {
                step: "04",
                icon: Bell,
                title: "Alert",
                description: "Get Slack and email alerts days before a stockout — so you can plan, not panic.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <item.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="text-xs font-mono text-emerald-400/60 mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="border-t border-white/5 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-emerald-400 mb-3 uppercase tracking-wider">The Dashboard</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              One screen. Every brand. Total clarity.
            </h2>
          </div>

          {/* Mock Dashboard */}
          <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            {/* Mock Top Bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0a0a0a]">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="mx-auto bg-white/5 rounded-md px-4 py-1 text-xs text-white/30 font-mono">
                stockpulse.app/dashboard
              </div>
            </div>
            <div className="p-6 sm:p-8">
              {/* Mock Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Active Brands", value: "5", color: "text-blue-400" },
                  { label: "Total SKUs", value: "847", color: "text-white" },
                  { label: "Warning", value: "12", color: "text-amber-400" },
                  { label: "Critical", value: "3", color: "text-red-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/[0.03] rounded-lg p-4">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-white/30 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Mock Table */}
              <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm font-medium text-white/70">Urgent SKUs</p>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {[
                    { name: "Classic Hoodie - Black / M", brand: "UrbanThread", stock: 23, velocity: "8.2/day", days: "2.8 days", status: "critical", statusColor: "bg-red-500/20 text-red-400" },
                    { name: "Summer Dress - Floral / S", brand: "Bloom Studio", stock: 45, velocity: "5.1/day", days: "8.8 days", status: "warning", statusColor: "bg-amber-500/20 text-amber-400" },
                    { name: "Running Short - Navy / L", brand: "PaceFit", stock: 0, velocity: "12.4/day", days: "Stockout", status: "stockout", statusColor: "bg-white/10 text-white" },
                    { name: "Cropped Tank - White / XS", brand: "UrbanThread", stock: 67, velocity: "4.7/day", days: "14 days", status: "warning", statusColor: "bg-amber-500/20 text-amber-400" },
                  ].map((row) => (
                    <div key={row.name} className="px-4 py-3 flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 truncate">{row.name}</p>
                        <p className="text-white/30 text-xs">{row.brand}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-8 text-white/40 text-xs">
                        <span className="w-16 text-right">{row.stock} units</span>
                        <span className="w-16 text-right">{row.velocity}</span>
                        <span className="w-20 text-right">{row.days}</span>
                      </div>
                      <span className={`ml-4 text-xs font-medium px-2 py-1 rounded-full ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-emerald-400 mb-3 uppercase tracking-wider">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for agencies that run ads, not warehouses
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Velocity Engine",
                description: "7-day rolling average sell-through rate per SKU. Detects restocks automatically so the math stays clean.",
              },
              {
                icon: BarChart3,
                title: "Stockout Forecasting",
                description: "Calculates days remaining at current sell rate. Color-coded: green, yellow, red — you know instantly what needs attention.",
              },
              {
                icon: Bell,
                title: "Slack & Email Alerts",
                description: "Configurable per brand. Warning at 14 days, critical at 7 days. Cooldown periods prevent alert fatigue.",
              },
              {
                icon: Package,
                title: "Multi-Platform Sync",
                description: "Shopify GraphQL, WooCommerce REST, or CSV upload. Covers 95% of fashion and apparel brands.",
              },
              {
                icon: Shield,
                title: "Brand-Level Control",
                description: "Each client gets their own thresholds, alert channels, and credentials. Your team sees everything in one dashboard.",
              },
              {
                icon: LineChart,
                title: "30-Day Inventory Charts",
                description: "Visual history per SKU. Spot trends, see restocks, and understand sell-through patterns at a glance.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/10 rounded-xl p-6 transition-all"
              >
                <feature.icon className="h-5 w-5 text-emerald-400 mb-4" />
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flight Performance Section */}
      <section className="border-t border-white/5 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
              <span className="text-sm text-white/70">A Flight Performance Co Product</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Why we built this
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              At Flight Performance Co, we manage millions in ad spend for scaling e-commerce brands.
              We kept running into the same problem — a campaign would be printing money, and then the
              client would run out of a hero SKU with zero warning. We&apos;d have to kill the ad, reset the
              algorithm, and start from scratch.
            </p>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              StockPulse is the tool we wished existed. Now every brand we manage has real-time inventory
              visibility built into our workflow. No more guessing. No more wasted spend. No more
              killing winners.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mt-12 text-left">
              {[
                {
                  stat: "$40M+",
                  label: "Ad Spend Managed",
                  description: "Protecting performance at scale",
                },
                {
                  stat: "85%",
                  label: "Avg Client Growth",
                  description: "In the first 90 days",
                },
                {
                  stat: "0",
                  label: "Missed Stockouts",
                  description: "Since launching StockPulse",
                },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                  <p className="text-2xl font-bold text-emerald-400">{item.stat}</p>
                  <p className="text-sm font-medium text-white/80 mt-1">{item.label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="relative bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-12 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Stop guessing. Start forecasting.
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto mb-8">
                Connect your first brand in under 2 minutes. See exactly how much runway every SKU has left.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3.5 rounded-lg transition-colors text-base"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-white/30">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400/60" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400/60" />
                  Shopify & WooCommerce
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400/60" />
                  Slack & email alerts
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              <span className="font-bold">StockPulse</span>
            </div>
            <p className="text-sm text-white/30">
              Built by{" "}
              <a
                href="https://www.flightperformance.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
              >
                Flight Performance Co
              </a>
              {" "}&middot; Inventory intelligence for performance teams
            </p>
            <div className="flex items-center gap-4 text-sm text-white/30">
              <Link href="/login" className="hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="hover:text-white transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
