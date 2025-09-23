import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Play, Eye, Video, Folder, Settings, Plus, Camera } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { FileUpload } from '../components/FileUpload.tsx';
import { NewScanForm } from '../components/NewScanForm.tsx';
import { fileUploadApi } from '../services/api.ts';
import toast from 'react-hot-toast';

// Mock project data for demonstration
const mockProject = {
  id: '1',
  name: 'ITECSA Nave Industrial',
  description: 'Render de sitio de obra para Desarrollo Inmobiliario ITECSA',
  location: 'Playa del Carmen',
  status: 'draft',
  created_at: '2025-08-26',
  scans: [
    {
      id: '1',
      name: 'Scan Principal',
      status: 'completed',
      video_file: 'nave_industrial_360.mp4',
      frames_extracted: 120,
      processing_progress: 100,
      model_ready: true
    }
  ]
};

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'scans' | 'files'>('overview');
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const project = mockProject; // In real app, this would be fetched from API

  const handleCreateScan = (scanData: any) => {
    console.log('Creating new scan:', scanData);
    toast.success('Scan created successfully!');
    setShowNewScanModal(false);
    // In real app, this would call the API
  };

  const handleVideoUpload = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      
      console.log('Uploading video:', file.name, `(${fileSizeMB} MB)`);
      
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        const response = await fileUploadApi.uploadVideo(
          id!, 
          file, 
          (progress) => setUploadProgress(progress)
        );
        
        toast.success(`Video "${file.name}" (${fileSizeMB} MB) uploaded successfully!`);
        console.log('Upload response:', response.data);
        setShowVideoUpload(false);
        
      } catch (error: any) {
        console.error('Upload failed:', error);
        if (error.response?.status === 413) {
          toast.error('File is too large. Maximum size is 1GB.');
        } else if (error.code === 'ECONNABORTED') {
          toast.error('Upload timeout. Please try with a smaller file or check your connection.');
        } else {
          toast.error(`Upload failed: ${error.response?.data?.detail || error.message}`);
        }
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleStartProcessing = (scanId: string) => {
    console.log('Starting COLMAP processing for scan:', scanId);
    toast.success('COLMAP processing started!');
    // In real app, this would call the COLMAP pipeline API
  };

  const handleViewModel = (scanId: string) => {
    navigate(`/viewer/${scanId}`);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Folder },
    { id: 'scans', label: 'Scans', icon: Camera },
    { id: 'files', label: 'Files', icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <p className="text-gray-400 mt-1">{project.description}</p>
              <p className="text-sm text-gray-500 mt-1">{project.location}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium capitalize">
              {project.status}
            </span>
            <button
              onClick={() => setShowNewScanModal(true)}
              className="bg-emerald-400 hover:bg-emerald-500 text-black font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Scan
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project Stats */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Project Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {project.scans.length}
                    </div>
                    <div className="text-sm text-gray-400">Total Scans</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {project.scans.filter(s => s.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {project.scans.reduce((sum, s) => sum + s.frames_extracted, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Total Frames</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {project.scans.filter(s => s.model_ready).length}
                    </div>
                    <div className="text-sm text-gray-400">3D Models</div>
                  </div>
                </div>
              </div>

              {/* Recent Scans */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Scans</h3>
                <div className="space-y-4">
                  {project.scans.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <Camera className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{scan.name}</p>
                          <p className="text-sm text-gray-400">
                            {scan.frames_extracted} frames • {scan.video_file}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          scan.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {scan.status}
                        </span>
                        {scan.model_ready && (
                          <button
                            onClick={() => handleViewModel(scan.id)}
                            className="px-3 py-1 bg-emerald-400 hover:bg-emerald-500 text-black rounded text-sm font-medium transition-colors"
                          >
                            View 3D
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowNewScanModal(true)}
                    className="w-full bg-emerald-400 hover:bg-emerald-500 text-black font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Scan
                  </button>
                  
                  <button
                    onClick={() => setShowVideoUpload(true)}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-700"
                  >
                    <Video className="w-4 h-4" />
                    Upload Video
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Project Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{project.created_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white">{project.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white capitalize">{project.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Project Scans</h2>
              <button
                onClick={() => setShowNewScanModal(true)}
                className="bg-emerald-400 hover:bg-emerald-500 text-black font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Scan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.scans.map((scan) => (
                <div key={scan.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">{scan.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      scan.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {scan.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Video File:</span>
                      <span className="text-white">{scan.video_file}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Frames:</span>
                      <span className="text-white">{scan.frames_extracted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Progress:</span>
                      <span className="text-white">{scan.processing_progress}%</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {scan.status === 'completed' && scan.model_ready ? (
                      <button
                        onClick={() => handleViewModel(scan.id)}
                        className="w-full bg-emerald-400 hover:bg-emerald-500 text-black font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View 3D Model
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartProcessing(scan.id)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Start Processing
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Upload Video for Processing</h3>
              
              {isUploading ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-white font-medium mb-2">Uploading video...</p>
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                    <div 
                      className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">{uploadProgress}% complete</p>
                </div>
              ) : (
                <FileUpload
                  onFileSelect={(file) => handleVideoUpload([file])}
                  disabled={isUploading}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewScanForm
        isOpen={showNewScanModal}
        onClose={() => setShowNewScanModal(false)}
        onSubmit={handleCreateScan}
      />
    </div>
  );
};