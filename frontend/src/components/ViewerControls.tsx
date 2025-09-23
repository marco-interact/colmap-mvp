import React, { useState } from 'react';
import { 
  RotateCcw, 
  Grid, 
  Lightbulb, 
  Settings, 
  Download,
  Share2,
  Maximize2
} from 'lucide-react';

export const ViewerControls: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [controls, setControls] = useState({
    autoRotate: false,
    showGrid: true,
    showAxes: true,
    showStats: false,
    environment: 'studio',
    lighting: 'default',
  });

  const handleControlChange = (key: string, value: any) => {
    setControls(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetView = () => {
    // This would reset the camera position in the 3D viewer
    console.log('Reset view');
  };

  const downloadModel = () => {
    // This would trigger model download
    console.log('Download model');
  };

  const shareModel = () => {
    // This would open share dialog
    console.log('Share model');
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={resetView}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-5 h-5 text-gray-600" />
        </button>
        
        <button
          onClick={() => handleControlChange('showGrid', !controls.showGrid)}
          className={`p-2 rounded-lg transition-colors ${
            controls.showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-5 h-5" />
        </button>
        
        <button
          onClick={downloadModel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Download Model"
        >
          <Download className="w-5 h-5 text-gray-600" />
        </button>
        
        <button
          onClick={shareModel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Share Model"
        >
          <Share2 className="w-5 h-5 text-gray-600" />
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Settings Button */}
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${
            showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
            <h4 className="font-medium text-gray-900 mb-3">Viewer Settings</h4>
            
            <div className="space-y-3">
              {/* Auto Rotate */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Auto Rotate</label>
                <input
                  type="checkbox"
                  checked={controls.autoRotate}
                  onChange={(e) => handleControlChange('autoRotate', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              {/* Show Grid */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Show Grid</label>
                <input
                  type="checkbox"
                  checked={controls.showGrid}
                  onChange={(e) => handleControlChange('showGrid', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              {/* Show Axes */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Show Axes</label>
                <input
                  type="checkbox"
                  checked={controls.showAxes}
                  onChange={(e) => handleControlChange('showAxes', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              {/* Show Stats */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Show Stats</label>
                <input
                  type="checkbox"
                  checked={controls.showStats}
                  onChange={(e) => handleControlChange('showStats', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              {/* Environment */}
              <div>
                <label className="text-sm text-gray-700 mb-1 block">Environment</label>
                <select
                  value={controls.environment}
                  onChange={(e) => handleControlChange('environment', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="studio">Studio</option>
                  <option value="sunset">Sunset</option>
                  <option value="dawn">Dawn</option>
                  <option value="night">Night</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="forest">Forest</option>
                  <option value="apartment">Apartment</option>
                  <option value="city">City</option>
                  <option value="park">Park</option>
                  <option value="lobby">Lobby</option>
                </select>
              </div>

              {/* Lighting */}
              <div>
                <label className="text-sm text-gray-700 mb-1 block">Lighting</label>
                <select
                  value={controls.lighting}
                  onChange={(e) => handleControlChange('lighting', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="default">Default</option>
                  <option value="bright">Bright</option>
                  <option value="soft">Soft</option>
                  <option value="dramatic">Dramatic</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


