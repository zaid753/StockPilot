
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CameraIcon, XMarkIcon, PhotoIcon, CheckIcon, VideoCameraIcon, PlusIcon } from './icons';

interface CameraCaptureProps {
    onCapture: (data: string | string[]) => void;
    onClose: () => void;
    mode?: 'item' | 'invoice' | 'shelf-analysis';
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, mode = 'item' }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<{ type: 'denied' | 'unavailable' | 'other'; message: string } | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    
    // Walkthrough Mode State
    const isWalkthroughMode = mode === 'shelf-analysis';
    const [viewMode, setViewMode] = useState<'camera' | 'review'>('camera');
    const [isRecording, setIsRecording] = useState(false);
    const [recordedFrames, setRecordedFrames] = useState<string[]>([]);
    const recordingIntervalRef = useRef<any>(null);

    const startCamera = useCallback(async (deviceId?: string) => {
        setError(null);
        
        // Stop existing stream if any
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            // If a specific device ID is requested, use it. Otherwise default to environment (back camera).
            const constraints = deviceId 
                ? { video: { deviceId: { exact: deviceId } } } 
                : { video: { facingMode: 'environment' } };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Once we have permission/stream, enumerate devices to get labels
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
            setDevices(videoDevices);

            // Set the selected device ID state
            if (deviceId) {
                setSelectedDeviceId(deviceId);
            } else {
                // If we let the browser choose, try to determine which one it picked
                const track = stream.getVideoTracks()[0];
                const settings = track.getSettings();
                if (settings.deviceId) {
                    setSelectedDeviceId(settings.deviceId);
                }
            }

        } catch (err: any) {
            console.error("Error accessing camera:", err);
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError({
                    type: 'denied',
                    message: 'Camera access was denied.'
                });
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError({
                    type: 'unavailable',
                    message: 'No camera found on this device.'
                });
            } else {
                setError({
                    type: 'other',
                    message: 'Unable to access camera.'
                });
            }
        }
    }, []);

    // Show camera if NOT in review mode (for walkthrough) or if no preview (for single)
    const showCamera = !error && (
        (isWalkthroughMode && viewMode === 'camera') || 
        (!isWalkthroughMode && !previewImage)
    );

    useEffect(() => {
        if (showCamera) {
            startCamera(selectedDeviceId);
        } else {
             if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        };
    }, [startCamera, showCamera]);

    const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDeviceId = e.target.value;
        setSelectedDeviceId(newDeviceId);
        startCamera(newDeviceId);
    };

    const captureFrame = (): string | null => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6); // Lower quality for performance
                return dataUrl.split(',')[1];
            }
        }
        return null;
    };

    // --- Single Item Logic ---
    const handleSingleCapture = () => {
        const base64 = captureFrame();
        if (base64) setPreviewImage(base64);
    };

    const handleRetake = () => {
        setPreviewImage(null);
        setRecordedFrames([]);
        setIsRecording(false);
        setViewMode('camera');
    };

    const handleConfirm = () => {
        if (isWalkthroughMode && recordedFrames.length > 0) {
            onCapture(recordedFrames);
        } else if (previewImage) {
            onCapture(previewImage);
        }
    };

    // --- Walkthrough Logic ---
    const handleManualSnap = () => {
        const frame = captureFrame();
        if (frame) {
            setRecordedFrames(prev => [...prev, frame]);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        } else {
            setIsRecording(true);
            const firstFrame = captureFrame();
            if (firstFrame) setRecordedFrames(prev => [...prev, firstFrame]);

            recordingIntervalRef.current = setInterval(() => {
                const frame = captureFrame();
                if (frame) {
                    setRecordedFrames(prev => {
                        if (prev.length >= 15) { // Limit max frames
                             setIsRecording(false);
                             if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
                             return prev;
                        }
                        return [...prev, frame];
                    });
                }
            }, 800);
        }
    };

    const handleDoneCapturing = () => {
        setIsRecording(false);
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        if (recordedFrames.length > 0) {
            setViewMode('review');
        }
    };

    // New: Handle Manual File Upload for Shelf Doctor
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const readers: Promise<string>[] = [];
            
            // Process multiple files if allowed, or just one
            Array.from(files).forEach(file => {
                readers.push(new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                         const result = reader.result as string;
                         resolve(result.split(',')[1]); // Base64
                    };
                    reader.readAsDataURL(file as Blob);
                }));
            });

            Promise.all(readers).then(base64Frames => {
                if (isWalkthroughMode) {
                    setRecordedFrames(prev => [...prev, ...base64Frames]);
                    setViewMode('review'); // Go straight to review to confirm
                } else {
                    setPreviewImage(base64Frames[0]);
                }
            });
        }
    };

    const isReviewState = previewImage || (isWalkthroughMode && viewMode === 'review');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden max-w-lg w-full relative shadow-2xl flex flex-col max-h-[90vh]">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="relative flex-grow bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
                    {previewImage ? (
                        <img 
                            src={`data:image/jpeg;base64,${previewImage}`} 
                            alt="Preview" 
                            className="w-full h-full object-contain"
                        />
                    ) : isWalkthroughMode && viewMode === 'review' ? (
                         <div className="grid grid-cols-3 gap-2 p-4 w-full h-full overflow-y-auto bg-gray-900">
                             {recordedFrames.map((frame, idx) => (
                                 <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-700">
                                     <img src={`data:image/jpeg;base64,${frame}`} className="w-full h-full object-cover" />
                                     <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1 rounded">#{idx + 1}</div>
                                 </div>
                             ))}
                             <button onClick={() => setViewMode('camera')} className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-white">
                                <PlusIcon className="w-8 h-8" />
                                <span className="text-xs">Add More</span>
                             </button>
                         </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center">
                            <CameraIcon className="w-12 h-12 text-red-500 mb-2" />
                            <p className="mb-4">{error.message}</p>
                            <button onClick={() => startCamera(selectedDeviceId)} className="px-4 py-2 bg-gray-700 rounded">Retry</button>
                        </div>
                    ) : (
                        <>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            
                            {/* Live Strip for Walkthrough */}
                            {isWalkthroughMode && recordedFrames.length > 0 && (
                                <div className="absolute bottom-4 left-0 right-0 px-4 z-20">
                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {recordedFrames.slice().reverse().map((frame, idx) => (
                                            <div key={idx} className="w-12 h-16 flex-shrink-0 border-2 border-white rounded overflow-hidden shadow-lg">
                                                <img src={`data:image/jpeg;base64,${frame}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {devices.length > 1 && (
                                <div className="absolute top-4 left-4 z-20">
                                    <select 
                                        value={selectedDeviceId}
                                        onChange={handleDeviceChange}
                                        className="appearance-none bg-black bg-opacity-50 text-white border border-gray-500 rounded-lg py-1 pl-2 pr-6 text-xs"
                                    >
                                        {devices.map((device, index) => (
                                            <option key={device.deviceId} value={device.deviceId}>
                                                {device.label || `Camera ${index + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {!error && (
                    <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 min-h-[100px]">
                        {isReviewState ? (
                            <div className="flex justify-center gap-6">
                                <button
                                    onClick={handleRetake}
                                    className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium"
                                >
                                    Retake All
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2"
                                >
                                    <CheckIcon className="w-5 h-5" />
                                    Analyze {recordedFrames.length || 1} Frames
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center gap-6">
                                {/* Upload Button - Always Visible for both modes */}
                                <label className="flex flex-col items-center gap-1 cursor-pointer text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                    <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
                                        <PhotoIcon className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs">Upload</span>
                                    {/* Enable multiple files for shelf analysis */}
                                    <input type="file" accept="image/*" multiple={isWalkthroughMode} onChange={handleFileUpload} className="hidden" />
                                </label>

                                {!isWalkthroughMode ? (
                                    <>
                                        <button
                                            onClick={handleSingleCapture}
                                            className="w-16 h-16 rounded-full border-4 border-indigo-600 flex items-center justify-center bg-white shadow-xl active:scale-95 transition-all"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-indigo-600"></div>
                                        </button>
                                        <div className="w-12"></div>
                                    </>
                                ) : (
                                    // Walkthrough Controls
                                    <>
                                        <button
                                            onClick={toggleRecording}
                                            className={`flex flex-col items-center gap-1 ${isRecording ? 'text-red-500' : 'text-gray-500'}`}
                                        >
                                            <div className={`p-3 rounded-full border-2 ${isRecording ? 'border-red-500 bg-red-100' : 'border-gray-300'}`}>
                                                <VideoCameraIcon className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs">{isRecording ? 'Stop' : 'Auto'}</span>
                                        </button>

                                        <button
                                            onClick={handleManualSnap}
                                            disabled={isRecording}
                                            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center bg-white shadow-xl active:scale-95 transition-all ${isRecording ? 'opacity-50' : 'border-indigo-600'}`}
                                        >
                                            <CameraIcon className="w-8 h-8 text-indigo-600" />
                                        </button>

                                        <button
                                            onClick={handleDoneCapturing}
                                            disabled={recordedFrames.length === 0 || isRecording}
                                            className={`flex flex-col items-center gap-1 ${recordedFrames.length === 0 ? 'opacity-30' : 'text-indigo-600'}`}
                                        >
                                            <div className="p-3 rounded-full bg-indigo-100">
                                                <CheckIcon className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs">Review</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraCapture;
