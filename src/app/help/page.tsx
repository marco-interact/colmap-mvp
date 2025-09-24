export default function HelpPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-6">Help & Support</h1>
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-medium text-white mb-4">Getting Started</h2>
            <div className="space-y-3 text-white/80">
              <p>1. Create a new project from the dashboard</p>
              <p>2. Upload a video file for 3D reconstruction</p>
              <p>3. Wait for COLMAP processing to complete</p>
              <p>4. Explore your 3D model in the viewer</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-medium text-white mb-4">Supported Formats</h2>
            <div className="text-white/80">
              <p><strong>Video:</strong> MP4, MOV, AVI (up to 100MB)</p>
              <p><strong>Output:</strong> PLY, OBJ, GLTF point clouds and meshes</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-medium text-white mb-4">Contact</h2>
            <p className="text-white/80">For technical support, please contact the development team.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
