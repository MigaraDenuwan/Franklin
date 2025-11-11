import { Activity, Video, MapPin, Droplets, TrendingUp, AlertCircle } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import StatCard from '../components/StatCard';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring of sea turtle conservation efforts</p>
        </div>
        <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-6 py-3 rounded-xl shadow-lg">
          <p className="text-sm font-medium">System Status</p>
          <p className="text-2xl font-bold">All Systems Operational</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-cyan-500/50">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8" />
            <span className="text-4xl font-bold">127</span>
          </div>
          <p className="text-sm font-medium opacity-90">Turtles Monitored</p>
          <p className="text-xs opacity-75 mt-1">↑ 12% from last month</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-teal-500/50">
          <div className="flex items-center justify-between mb-4">
            <Video className="h-8 w-8" />
            <span className="text-4xl font-bold">43</span>
          </div>
          <p className="text-sm font-medium opacity-90">Active Nests</p>
          <p className="text-xs opacity-75 mt-1">8 new this week</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-amber-500/50">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="h-8 w-8" />
            <span className="text-4xl font-bold">5</span>
          </div>
          <p className="text-sm font-medium opacity-90">Active Alerts</p>
          <p className="text-xs opacity-75 mt-1">3 require attention</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-purple-500/50">
          <div className="flex items-center justify-between mb-4">
            <Droplets className="h-8 w-8" />
            <span className="text-4xl font-bold">234</span>
          </div>
          <p className="text-sm font-medium opacity-90">Hatchlings Tracked</p>
          <p className="text-xs opacity-75 mt-1">↑ 18% survival rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DashboardCard
          title="Turtle Health Monitoring"
          icon={Activity}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        >
          <div className="space-y-3">
            <StatCard label="Turtles Scanned Today" value="23" trend="up" trendValue="+8" />
            <StatCard label="FP Cases Detected" value="3" trend="neutral" trendValue="Stable" />
            <StatCard label="Barnacle Infestations" value="7" trend="down" trendValue="-2" />
            <StatCard label="Healthy Assessments" value="13" trend="up" trendValue="+5" />
          </div>
          <button className="mt-4 w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-105">
            View Health Dashboard
          </button>
        </DashboardCard>

        <DashboardCard
          title="Nest Monitoring & Predators"
          icon={Video}
          iconColor="text-teal-600"
          iconBg="bg-teal-100"
        >
          <div className="mb-4 bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="h-16 w-16 text-white/50" />
            </div>
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              LIVE
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Nests Detected" value="43" />
            <StatCard label="Predator Alerts" value="2" />
          </div>
          <button className="mt-4 w-full bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-105">
            View Live Feeds
          </button>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DashboardCard
          title="Shoreline Risk Assessment"
          icon={MapPin}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        >
          <div className="mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl h-48 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-16 w-16 text-cyan-600/30" />
            </div>
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">High Risk Zones</span>
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">4</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-red-50 rounded-lg p-2 text-center">
              <p className="text-xs text-red-600 font-medium">High Risk</p>
              <p className="text-lg font-bold text-red-700">4</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <p className="text-xs text-amber-600 font-medium">Medium</p>
              <p className="text-lg font-bold text-amber-700">7</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="text-xs text-green-600 font-medium">Low Risk</p>
              <p className="text-lg font-bold text-green-700">32</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-105">
            View Risk Map
          </button>
        </DashboardCard>

        <DashboardCard
          title="Hatchery Monitoring"
          icon={Droplets}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        >
          <div className="space-y-3 mb-4">
            <StatCard label="Baby Turtles Tracked" value="234" trend="up" trendValue="+12" />
            <StatCard label="Abnormal Behavior Alerts" value="1" trend="neutral" trendValue="Low" />
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Species Distribution</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Loggerhead</span>
                <span className="font-bold text-gray-900">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
          <button className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-105">
            View Hatchery Data
          </button>
        </DashboardCard>
      </div>
    </div>
  );
}
