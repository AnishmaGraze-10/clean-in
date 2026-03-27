import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { Camera, MapPin, FileText, Upload, Sparkles, Loader2 } from 'lucide-react';

const ReportForm = () => {
  const [form, setForm] = useState({
    wasteType: '',
    description: '',
    latitude: '',
    longitude: '',
    location: '',
    zone: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const hasDetected = useRef(false);

  // Dynamic feature card settings
  const [pointsPerReport, setPointsPerReport] = useState(10);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [photoRequired, setPhotoRequired] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((prev) => ({
          ...prev,
          latitude,
          longitude
        }));
      },
      () => {
        // ignore error, user can fill manually
      }
    );
  }, []);

  // Fetch dynamic settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        // Try to fetch settings from backend
        const res = await api.get('/settings/rewards');
        if (res.data) {
          setPointsPerReport(res.data.pointsPerReport || 10);
          setAiEnabled(res.data.aiEnabled !== false);
          setPhotoRequired(res.data.photoRequired !== false);
        }
      } catch (err) {
        // If API fails, use default values
        console.log('Using default settings, API not available');
        setPointsPerReport(10);
        setAiEnabled(true);
        setPhotoRequired(true);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    
    // Auto-detect waste type when image is uploaded
    if (file && !hasDetected.current && !form.wasteType) {
      await detectWasteTypeFromImage(file);
    }
  };

  const detectWasteTypeFromImage = async (file) => {
    if (!file) return;
    
    setDetecting(true);
    hasDetected.current = true;
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await api.post('/ai/detect-waste', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { detectedType, confidence, allLabels } = res.data;
      
      // Set the detected waste type
      if (detectedType) {
        const wasteTypeKey = detectedType.toLowerCase().replace('-', '');
        setForm(prev => ({ ...prev, wasteType: wasteTypeKey }));
        toast.success(`Detected: ${detectedType} (${Math.round(confidence * 100)}% confidence)`);
        console.log('AI Detection labels:', allLabels);
      }
    } catch (err) {
      console.error('AI detection failed:', err);
      toast.info('Could not auto-detect waste type. Please select manually.');
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.wasteType || !form.latitude || !form.longitude) {
      toast.error('Waste type and location are required');
      return;
    }
    if (!imageFile) {
      toast.error('Please upload an image');
      return;
    }

    const data = new FormData();
    data.append('wasteType', form.wasteType);
    data.append('description', form.description);
    data.append('latitude', String(form.latitude));
    data.append('longitude', String(form.longitude));
    data.append('location', form.location);
    data.append('zone', form.zone);
    data.append('image', imageFile);

    setSubmitting(true);
    try {
      await api.post('/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Report submitted');
      setForm({
        wasteType: '',
        description: '',
        latitude: form.latitude,
        longitude: form.longitude,
        location: '',
        zone: ''
      });
      setImageFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <DashboardLayout title="Report Waste">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Submitting your report...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Report Waste">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Report Illegal Waste Dumping</h2>
          <p className="text-gray-600">Help keep our city clean by reporting waste. Earn points for verified reports!</p>
        </div>

        {/* Points Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Submit Report</p>
                <p className="text-lg font-bold text-emerald-700">+{pointsPerReport} points</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">AI Detection</p>
                <p className="text-lg font-bold text-blue-700">{aiEnabled ? 'Auto-categorize enabled' : 'AI detection disabled'}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Photo {photoRequired ? 'Required' : 'Optional'}</p>
                <p className="text-lg font-bold text-amber-700">{photoRequired ? 'For verification' : 'Recommended'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Upload Waste Photo <span className="text-red-500">*</span>
                </label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    imageFile ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer block">
                    {imageFile ? (
                      <div className="space-y-2">
                        <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                          <Camera className="w-8 h-8 text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-emerald-700">{imageFile.name}</p>
                        <p className="text-xs text-gray-500">Click to change photo</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Click to upload photo</p>
                        <p className="text-xs text-gray-500">JPG, PNG up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
                {detecting && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI is analyzing the image...</span>
                  </div>
                )}
              </div>

              {/* Waste Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Waste Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="wasteType"
                  value={form.wasteType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  required
                >
                  <option value="">Select waste type</option>
                  <option value="plastic">Plastic</option>
                  <option value="organic">Organic</option>
                  <option value="electronic">Electronic</option>
                  <option value="hazardous">Hazardous</option>
                  <option value="mixed">Mixed</option>
                  <option value="other">Other</option>
                </select>
                {form.wasteType && (
                  <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI detected or manually selected
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                  placeholder="Describe the waste and its condition..."
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Location */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-800">Location Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address / Landmark <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                      placeholder="e.g., Near Central Park, Main Road"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zone / Area
                    </label>
                    <input
                      type="text"
                      name="zone"
                      value={form.zone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                      placeholder="e.g., North Zone, District 5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={form.latitude}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        placeholder="Auto-detected"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={form.longitude}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        placeholder="Auto-detected"
                        required
                      />
                    </div>
                  </div>

                  {(form.latitude && form.longitude) && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                      <MapPin className="w-4 h-4" />
                      <span>Location coordinates captured</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      Submit Report
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-gray-500 mt-3">
                  You'll earn 10 points when your report is verified
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ReportForm;

