
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShelfAnalysisById } from '../services/inventoryService';
import { ShelfAnalysis } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ArrowsRightLeftIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

interface ShelfAnalysisPageProps {
    analysisId?: string;
    onBack?: () => void;
}

const ShelfAnalysisPage: React.FC<ShelfAnalysisPageProps> = ({ analysisId, onBack }) => {
    const { user, userProfile } = useAuth();
    const { analysisId: routeAnalysisId } = useParams<{ analysisId: string }>();
    const activeAnalysisId = analysisId || routeAnalysisId;
    const navigate = useNavigate();

    const [analysis, setAnalysis] = useState<ShelfAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [reportTab, setReportTab] = useState<'ar' | 'simulation'>('ar');
    const [compareSliderValue, setCompareSliderValue] = useState(50);
    const comparisonContainerRef = useRef<HTMLDivElement>(null);
    
    // Multi-frame navigation
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [allFrames, setAllFrames] = useState<string[]>([]);

    const handleBack = () => {
        if (onBack && onBack.toString().replace(/\s/g, '') !== '()=>{}') {
            onBack();
        } else {
            const role = userProfile?.role?.toLowerCase() || 'seller';
            navigate(`/${role}/shelf-doctor`);
        }
    };

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!user || !activeAnalysisId) return;
            try {
                const data = await getShelfAnalysisById(user.uid, activeAnalysisId);
                setAnalysis(data);
                
                // Initialize frames array: priority to capturedFrames array, fallback to single capturedFrame
                if (data) {
                    const frames = data.capturedFrames && data.capturedFrames.length > 0 
                        ? data.capturedFrames 
                        : [data.capturedFrame];
                    setAllFrames(frames);
                    setCurrentFrameIndex(0);
                }
            } catch (error) {
                console.error("Failed to fetch analysis", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, [user, activeAnalysisId]);

    // Helper to handle URL vs Base64
    const getImageSrc = (src: string) => {
        return src?.startsWith('http') ? src : `data:image/jpeg;base64,${src}`;
    };

    const handleNextFrame = () => {
        setCurrentFrameIndex(prev => (prev + 1) % allFrames.length);
    };

    const handlePrevFrame = () => {
        setCurrentFrameIndex(prev => (prev - 1 + allFrames.length) % allFrames.length);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-xl font-semibold text-gray-600 dark:text-gray-300">Loading Report...</div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <p className="text-xl text-red-500 mb-4">Analysis Not Found</p>
                <button onClick={handleBack} className="px-4 py-2 bg-gray-200 rounded-lg">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pb-12">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                            &larr; Dashboard
                        </button>
                        <h1 className="text-xl font-bold">Shelf Doctor Report</h1>
                        <span className="text-sm text-gray-500">{analysis.createdAt.toDate().toLocaleDateString()}</span>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Score Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between md:col-span-2">
                        <div>
                            <h2 className="text-lg font-bold text-gray-500 uppercase tracking-wide">Overall Health</h2>
                            <p className="text-3xl font-bold mt-1">{analysis.score >= 8 ? 'Excellent' : analysis.score >= 5 ? 'Needs Improvement' : 'Critical'}</p>
                            <p className="text-gray-500 mt-2">{analysis.summary}</p>
                        </div>
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg
                            ${analysis.score >= 8 ? 'bg-green-500' : analysis.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                            {analysis.score}
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-xl shadow-lg text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <SparklesIcon className="w-6 h-6 text-yellow-300" />
                            <h3 className="font-bold text-lg">AI Power Move</h3>
                        </div>
                        <p className="text-indigo-100 text-lg leading-relaxed">{analysis.powerMove}</p>
                    </div>
                </div>

                {/* Visualization Controls */}
                <div className="flex gap-4 mb-6">
                    <button 
                        onClick={() => setReportTab('ar')} 
                        className={`flex-1 py-3 rounded-lg font-bold shadow-sm transition-all
                            ${reportTab === 'ar' ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        AR Diagnosis
                    </button>
                    <button 
                        onClick={() => setReportTab('simulation')}
                        disabled={!analysis.improvedFrame}
                        className={`flex-1 py-3 rounded-lg font-bold shadow-sm transition-all
                            ${reportTab === 'simulation' 
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' 
                                : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                    >
                        AI Renovation (3D)
                    </button>
                </div>

                {/* Main Visual Area */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
                    {reportTab === 'ar' && (
                        <div className="relative flex flex-col">
                            {/* Main Frame Viewer */}
                            <div className="relative bg-black min-h-[400px] flex items-center justify-center group">
                                <div className="relative w-full max-h-[70vh]">
                                    <img 
                                        src={getImageSrc(allFrames[currentFrameIndex])} 
                                        className="w-full h-auto object-contain max-h-[70vh] mx-auto" 
                                        alt={`Shelf Analysis Frame ${currentFrameIndex + 1}`} 
                                    />
                                    
                                    {/* Issues Overlay - Filtered by current Frame Index */}
                                    {analysis.visualIssues
                                        .filter(issue => issue.frameIndex === currentFrameIndex)
                                        .map((issue, idx) => {
                                            const [ymin, xmin, ymax, xmax] = issue.box2d;
                                            const style = {
                                                top: `${ymin / 10}%`,
                                                left: `${xmin / 10}%`,
                                                height: `${(ymax - ymin) / 10}%`,
                                                width: `${(xmax - xmin) / 10}%`,
                                            };
                                            return (
                                                <div key={idx} className="absolute group/issue" style={style}>
                                                    <div className={`w-full h-full border-2 border-dashed ${issue.type === 'ghost_spot' ? 'border-red-500 bg-red-500/20' : 'border-orange-500 bg-orange-500/20'} animate-pulse`}></div>
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-white dark:bg-gray-900 p-2 rounded shadow-lg text-xs z-20 hidden group-hover/issue:block">
                                                        <p className="font-bold text-gray-900 dark:text-white">{issue.label}</p>
                                                        <p className="text-gray-500">{issue.suggestion}</p>
                                                    </div>
                                                </div>
                                            );
                                    })}
                                </div>

                                {/* Navigation Arrows */}
                                {allFrames.length > 1 && (
                                    <>
                                        <button onClick={handlePrevFrame} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronDownIcon className="w-6 h-6 rotate-90" />
                                        </button>
                                        <button onClick={handleNextFrame} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronUpIcon className="w-6 h-6 rotate-90" />
                                        </button>
                                    </>
                                )}
                                
                                {/* Frame Counter Overlay */}
                                {allFrames.length > 1 && (
                                    <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        {currentFrameIndex + 1} / {allFrames.length}
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Strip */}
                            {allFrames.length > 1 && (
                                <div className="flex gap-2 p-4 bg-gray-100 dark:bg-gray-900 overflow-x-auto">
                                    {allFrames.map((frame, idx) => {
                                        // Count issues for this frame to show small indicator dot
                                        const issueCount = analysis.visualIssues.filter(i => i.frameIndex === idx).length;
                                        return (
                                            <button 
                                                key={idx}
                                                onClick={() => setCurrentFrameIndex(idx)}
                                                className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all
                                                    ${currentFrameIndex === idx ? 'border-indigo-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                            >
                                                <img src={getImageSrc(frame)} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                                                {issueCount > 0 && (
                                                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {reportTab === 'simulation' && analysis.improvedFrame && (
                        <div className="p-4 bg-gray-900 flex justify-center">
                             <div 
                                className="relative w-full max-w-4xl h-[500px] overflow-hidden rounded-lg shadow-2xl border-4 border-indigo-600 group cursor-col-resize"
                                ref={comparisonContainerRef}
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const percentage = (x / rect.width) * 100;
                                    setCompareSliderValue(percentage);
                                }}
                            >
                                <img 
                                    src={getImageSrc(analysis.capturedFrame)} 
                                    className="absolute inset-0 w-full h-full object-cover" 
                                    alt="Before"
                                />
                                <div className="absolute top-4 left-4 bg-black/60 text-white px-2 py-1 rounded text-xs font-bold z-10">BEFORE</div>

                                <div 
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ width: `${compareSliderValue}%` }}
                                >
                                    <img 
                                        src={getImageSrc(analysis.improvedFrame)} 
                                        className="absolute top-0 left-0 w-full h-[500px] object-cover max-w-none" 
                                        style={{ width: comparisonContainerRef.current?.offsetWidth }}
                                        alt="After"
                                    />
                                    <div className="absolute top-4 right-4 bg-indigo-600/80 text-white px-2 py-1 rounded text-xs font-bold z-10">AFTER (AI)</div>
                                </div>

                                <div 
                                    className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center z-20"
                                    style={{ left: `${compareSliderValue}%` }}
                                >
                                    <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-indigo-600">
                                        <ArrowsRightLeftIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Detailed Issues List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-xl font-bold mb-6">Identified Issues {reportTab === 'ar' && allFrames.length > 1 ? `(Frame ${currentFrameIndex + 1})` : ''}</h3>
                    <div className="space-y-4">
                        {analysis.visualIssues
                            .filter(issue => reportTab === 'ar' ? issue.frameIndex === currentFrameIndex : true)
                            .map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-l-4 border-l-indigo-500">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-white
                                    ${issue.type === 'ghost_spot' ? 'bg-red-500' : 'bg-orange-500'}`}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{issue.label}</h4>
                                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Suggestion: </span>
                                        {issue.suggestion}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {analysis.visualIssues.filter(issue => issue.frameIndex === currentFrameIndex).length === 0 && reportTab === 'ar' && (
                            <p className="text-gray-500 italic">No issues detected in this frame.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShelfAnalysisPage;
