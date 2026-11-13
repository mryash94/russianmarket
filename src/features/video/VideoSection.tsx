import { useState, useEffect } from 'react'
import { Play, Eye, Calendar, X } from 'lucide-react'
import { storeEngine } from '../../services/storeEngine'
import type { VideoItem } from '../../data/seedVideos'

export function VideoSection() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    storeEngine.getVideos().then(setVideos)
  }, [])

  const categories = ['all', 'Master Class', 'Limited Edition', 'Tutorial', 'Documentary']

  const filtered = videos.filter(
    (v) => activeCategory === 'all' || v.collection === activeCategory,
  )

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div>
        <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-1">
          VIDEO GUIDES
        </span>
        <h2 className="font-cinzel text-xl md:text-2xl font-bold text-white">
          Video Guides & Tutorials
        </h2>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Demonstrations, collector tutorials, and edition showcases.
        </p>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-space text-xs font-semibold tracking-wider transition-all border ${
              activeCategory === cat
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                : 'bg-white/5 text-slate-400 hover:text-white border-white/5'
            }`}
          >
            {cat === 'all' ? 'All Videos' : cat}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((video) => (
          <div
            key={video.id}
            className="group glass-panel hover:glass-panel-glow rounded-3xl p-4 border border-white/10 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Video Thumbnail with Play Button Overlay */}
            <div
              onClick={() => setSelectedVideo(video)}
              className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 cursor-pointer border border-white/10 group-hover:border-cyan-400/50 transition-all shadow-lg flex items-center justify-center"
            >
              {/* Geometric Background Artwork for Thumbnail */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center opacity-90">
                <div className="w-32 h-32 rounded-full border border-cyan-500/20 animate-pulse" />
                <div className="w-48 h-48 rounded-full border border-violet-500/10 absolute" />
              </div>

              {/* Play Button Icon */}
              <div className="relative z-10 w-14 h-14 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-400/60 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] group-hover:scale-110 group-hover:bg-cyan-500 transition-all group-hover:text-black text-cyan-300">
                <Play className="w-6 h-6 ml-0.5 fill-current" />
              </div>

              {/* Duration Badge */}
              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 font-mono-code text-[10px] text-white font-bold backdrop-blur-sm border border-white/10">
                {video.duration}
              </span>

              {/* Category Badge */}
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 font-mono-code text-[9px] font-bold uppercase backdrop-blur-sm border border-cyan-500/30">
                {video.badge}
              </span>
            </div>

            {/* Video Metadata */}
            <div className="mt-3.5 space-y-2">
              <div className="flex items-center gap-3 text-[11px] font-mono-code text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  {video.views.toLocaleString()} Views
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {video.date}
                </span>
              </div>

              <h3
                onClick={() => setSelectedVideo(video)}
                className="font-space font-bold text-base text-white group-hover:text-cyan-300 transition-colors cursor-pointer line-clamp-1"
              >
                {video.title}
              </h3>

              <p className="text-xs text-slate-400 font-sans line-clamp-2 leading-relaxed">
                {video.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Video Playback Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl glass-panel-glow rounded-3xl p-4 md:p-6 border border-white/20 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-900 border border-white/20 text-white hover:text-cyan-400 active:scale-90 transition-all z-20"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 mb-4">
              <video
                src={selectedVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full font-mono-code text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {selectedVideo.collection}
                </span>
                <span className="font-mono-code text-xs text-slate-400">
                  {selectedVideo.duration} • {selectedVideo.date}
                </span>
              </div>
              <h3 className="font-space font-bold text-lg text-white">
                {selectedVideo.title}
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {selectedVideo.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
