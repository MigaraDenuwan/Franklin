import { Video, AlertTriangle, MapPin, Maximize2, Eye } from 'lucide-react';
import DashboardCard from '../../shared/components/ui/DashboardCard';
import BeachMap from '../../shared/components/maps/BeachMap';
import HlsPlayer from '../../shared/components/media/HlsPlayer';
import { Card, CardContent } from '../../shared/components/ui/Card';
import Button from '../../shared/components/ui/Button';

export default function NestMonitoringPage() {
  const videoFeeds = [
    { id: 1, zone: 'Beach Zone A', status: 'active', alerts: 1, nests: 12 },
    { id: 1, zone: 'Beach Zone B', status: 'active', alerts: 0, nests: 15 },
    { id: 1, zone: 'Beach Zone C', status: 'active', alerts: 2, nests: 8 },
    { id: 1, zone: 'Beach Zone D', status: 'active', alerts: 0, nests: 7 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nest Monitoring & Detection</h1>
          <p className="text-gray-600 mt-1">Real-time video surveillance and predator detection</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium text-sm">
            <span className="inline-block h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            All Cameras Online
          </div>
        </div>
      </div>

      {/* Beach Map */}
      <div className="mb-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-teal-100 to-cyan-100 p-3 rounded-xl">
                  <MapPin className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Interactive Beach Map</h3>
                  <p className="text-sm text-gray-600">Real-time tracking of nests, patrols, and threats</p>
                </div>
              </div>
              <Button icon={Maximize2} className="px-4 py-2 text-sm">
                Fullscreen
              </Button>
            </div>
            <BeachMap />
          </CardContent>
        </Card>
      </div>

      {/* Video Feeds */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Video className="h-6 w-6 text-teal-600" />
              <span>Live Camera Feeds</span>
            </h2>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600 font-medium">{videoFeeds.length} Cameras Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoFeeds.map((feed) => (
              <Card
                key={feed.id}
                className="hover:border-teal-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-gray-100"
              >
                <div className="relative aspect-video group cursor-pointer overflow-hidden bg-black">
                  {/* HLS Video Player */}
                  <HlsPlayer
                    src={`http://localhost:8000/streams/camera${feed.id}/stream.m3u8`}
                    className="w-full h-full object-cover"
                  />

                  {/* LIVE Badge */}
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1 animate-pulse">
                    <span className="inline-block h-2 w-2 bg-white rounded-full"></span>
                    <span>LIVE</span>
                  </div>

                  {/* Alerts */}
                  {feed.alerts > 0 && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{feed.alerts} Alert</span>
                    </div>
                  )}

                  {/* Bottom overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-semibold text-sm">{feed.zone}</span>
                      </div>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {feed.nests} nests
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feed stats and fullscreen */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-3 text-center border border-teal-100 shadow-sm">
                      <p className="text-xs text-teal-600 font-medium">Nests</p>
                      <p className="text-lg font-bold text-teal-700">{feed.nests}</p>
                    </div>
                    <div
                      className={`${feed.alerts > 0
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'
                        } rounded-xl p-3 text-center border shadow-sm`}
                    >
                      <p
                        className={`text-xs ${feed.alerts > 0 ? 'text-amber-600' : 'text-green-600'
                          } font-medium`}
                      >
                        Alerts
                      </p>
                      <p
                        className={`text-lg font-bold ${feed.alerts > 0 ? 'text-amber-700' : 'text-green-700'
                          }`}
                      >
                        {feed.alerts}
                      </p>
                    </div>
                  </div>
                  <Button icon={Maximize2} className="mt-3 w-full text-sm py-2.5 space-x-2">
                    View Full Screen
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Detection History */}
          <div className="mt-6">
            <DashboardCard title="Detection History" icon={Video} iconColor="text-cyan-600" iconBg="bg-cyan-100">
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border-l-4 border-teal-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">New nest detected</p>
                      <p className="text-sm text-gray-600 mt-1">Beach Zone C - Camera 3</p>
                      <p className="text-xs text-gray-500 mt-1">15 minutes ago</p>
                    </div>
                    <span className="bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1 rounded-full">
                      CONFIRMED
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-l-4 border-amber-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Predator alert - Dog detected</p>
                      <p className="text-sm text-gray-600 mt-1">Beach Zone A - Camera 1</p>
                      <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                      INVESTIGATING
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-l-4 border-blue-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Turtle nesting activity</p>
                      <p className="text-sm text-gray-600 mt-1">Beach Zone B - Camera 2</p>
                      <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                      LOGGED
                    </span>
                  </div>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <DashboardCard title="Active Alerts" icon={AlertTriangle} iconColor="text-amber-600" iconBg="bg-amber-100">
            <div className="space-y-3">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                    HIGH PRIORITY
                  </span>
                  <span className="text-xs text-red-600">5 min ago</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">Predator detected near nest</p>
                <p className="text-xs text-gray-600 mt-1">Beach Zone A - Nest #234</p>
                <button className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                  Dispatch Team
                </button>
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                    MEDIUM
                  </span>
                  <span className="text-xs text-amber-600">22 min ago</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">Unusual movement detected</p>
                <p className="text-xs text-gray-600 mt-1">Beach Zone C - Nest #189</p>
                <button className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                  Review Footage
                </button>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Today's Summary" icon={Video} iconColor="text-teal-600" iconBg="bg-teal-100">
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Total Nests Monitored</p>
                <p className="text-3xl font-bold text-teal-700">43</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">New Nests Detected</p>
                <p className="text-3xl font-bold text-green-700">3</p>
                <p className="text-xs text-green-600 font-medium mt-1">↑ All confirmed</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Predator Alerts</p>
                <p className="text-3xl font-bold text-amber-700">2</p>
                <p className="text-xs text-amber-600 font-medium mt-1">1 under investigation</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Camera Uptime</p>
                <p className="text-3xl font-bold text-blue-700">99.8%</p>
                <p className="text-xs text-blue-600 font-medium mt-1">Excellent performance</p>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
