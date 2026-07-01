import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import CameraCapture from '../CameraCapture';
import { getShelfAnalyses, saveShelfAnalysis, deleteShelfAnalysis } from '../../services/inventoryService';
import { getAi } from '../../services/geminiService';
import { incrementUserUsage } from '../../services/firebase';
import { ShelfAnalysis } from '../../types';
import { CameraIcon, PresentationChartLineIcon, TrashIcon } from '../icons';
import { Timestamp } from 'firebase/firestore';
import Toast from '../Toast';

const ShelfDoctorView: React.FC = () => {
    const { user, userProfile, updateUserProfileState } = useAuth();
    const navigate = useNavigate();
    
    const [history, setHistory] = useState<ShelfAnalysis[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [showCamera, setShowCamera] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        if (user) {
            getShelfAnalyses(user.uid)
                .then(setHistory)
                .finally(() => setLoadingHistory(false));
        }
    }, [user]);

    const handleIncrementUsage = async (feature: 'aiScans') => {
        if (!user || !userProfile) return;
        const newCount = (userProfile.usage?.[feature] || 0) + 1;
        updateUserProfileState({ usage: { ...userProfile.usage, [feature]: newCount } });
        await incrementUserUsage(user.uid, feature);
    };

    const handleDelete = async (e: React.MouseEvent, analysisId: string) => {
        e.stopPropagation();
        if (!user || !window.confirm("Are you sure you want to delete this analysis?")) return;
        
        try {
            await deleteShelfAnalysis(user.uid, analysisId);
            setHistory(prev => prev.filter(a => a.id !== analysisId));
            setToastMessage("Analysis deleted.");
        } catch (error) {
            console.error("Failed to delete analysis", error);
            setToastMessage("Failed to delete analysis.");
        }
    };

    const handleCapture = async (data: string | string[]) => {
        setShowCamera(false);
        setIsAnalyzing(true);
        const frames = Array.isArray(data) ? data : [data];
        
        try {
            const ai = getAi();
            const prompt = `Act as an expert retail merchandiser and shelf analyst. Analyze the provided image(s) of retail shelves.
Your task is to detect and analyze:
1. "ghost_spot" - Empty spots where items should be, or out of stock areas. Identify missed sales opportunities.
2. "misplaced" - Items that are placed on the wrong shelf, mixed with other brands, or in the wrong section.
3. "good" - Properly organized/faced items that follow planogram compliance.
4. "messy" - Items that have fallen over, are pushed too far back, or look disorganized.

Return a JSON object in this exact format (no markdown formatting, just raw JSON):
{
  "score": number(1-10, be critical but fair),
  "summary": "overall summary string focusing on visual appeal and stock levels",
  "powerMove": "key actionable advice string to maximize immediate sales",
  "visualIssues": [
    {
      "label": "Short label (e.g. 'Empty Cola Spot', 'Fallen Chips')",
      "type": "ghost_spot" | "misplaced" | "good" | "messy",
      "frameIndex": 0,
      "box2d": [ymin, xmin, ymax, xmax],
      "suggestion": "Specific restocking or placement advice"
    }
  ],
  "renovationPrompt": "A highly detailed visual prompt (under 80 words) describing THIS EXACT shelf (mention specific products, brands, colors, layout) but perfectly organized, fully stocked, brightly lit, and looking like a premium retail display. Used for AI image generation."
}
Note: "box2d" must be an array of 4 numbers [ymin, xmin, ymax, xmax] on a 0 to 1000 normalized scale representing the bounding box coordinates. Ensure you identify at least 3-5 distinct areas of interest. Do not return any text outside of the JSON object.`;
            
            const imageParts = frames.map(f => ({
                inlineData: { mimeType: 'image/jpeg', data: f }
            }));
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [...imageParts, { text: prompt }]
                },
                config: { responseMimeType: 'application/json' }
            });

            const resultText = response.text;
            let analysisData: any = {};
            try {
                analysisData = JSON.parse(resultText || '{}');
            } catch (e) {
                console.error("JSON parse error", e);
            }

            if (!user) return;
            
            const analysisId = await saveShelfAnalysis({
                userId: user.uid,
                createdAt: Timestamp.now(),
                score: analysisData.score || 5,
                summary: analysisData.summary || "Analysis completed.",
                powerMove: analysisData.powerMove || "Restock empty spots.",
                visualIssues: analysisData.visualIssues || [],
                capturedFrame: frames[0],
                capturedFrames: frames,
                improvedFrame: `https://image.pollinations.ai/prompt/${encodeURIComponent(analysisData.renovationPrompt || 'perfectly stocked and organized retail shelf store aisle brightly lit')}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`,
            });

            await handleIncrementUsage('aiScans');
            navigate(`/seller/analysis/${analysisId}`);
            
        } catch (error) {
            console.error("Shelf analysis failed", error);
            setToastMessage("Analysis failed.");
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8">
            <Toast message={toastMessage} onClose={() => setToastMessage('')} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shelf Doctor</h2>
                    <p className="text-gray-500 dark:text-gray-400">Scan your store shelves for AI-powered merchandising insights.</p>
                </div>
            </div>

            {/* Scan Action */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="max-w-lg">
                    <h3 className="text-2xl font-bold mb-2">Analyze Your Store Display</h3>
                    <p className="text-indigo-100 mb-6">
                        Take a photo or a walkthrough video of your shelves. Our AI will analyze product placement, detect empty gaps, and provide actionable power moves to increase sales.
                    </p>
                    <button 
                        onClick={() => setShowCamera(true)}
                        className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-3 px-8 rounded-full shadow-md transition-transform transform hover:scale-105 flex items-center gap-2"
                    >
                        <CameraIcon className="w-5 h-5" />
                        Start Shelf Scan
                    </button>
                </div>
                <div className="hidden md:block">
                    <PresentationChartLineIcon className="w-32 h-32 text-white/20" />
                </div>
            </div>

            {/* History Section */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Past Analyses</h3>
                
                {loadingHistory ? (
                    <div className="text-gray-500 py-8">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                        <CameraIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No past analyses found. Start your first scan above!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {history.map(analysis => (
                            <div 
                                key={analysis.id} 
                                onClick={() => navigate(`/seller/analysis/${analysis.id}`)}
                                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col"
                            >
                                <img 
                                    src={analysis.capturedFrame.startsWith('http') ? analysis.capturedFrame : `data:image/jpeg;base64,${analysis.capturedFrame}`} 
                                    className="w-full h-40 object-cover" 
                                    alt="Shelf Thumbnail" 
                                />
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${analysis.score >= 8 ? 'bg-green-100 text-green-700' : analysis.score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                            Score: {analysis.score}/10
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">
                                                {analysis.createdAt.toDate().toLocaleDateString()}
                                            </span>
                                            <button 
                                                onClick={(e) => handleDelete(e, analysis.id)}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                                title="Delete Analysis"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mt-1">{analysis.summary}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCamera && (
                <CameraCapture 
                    mode="shelf-analysis" 
                    onCapture={handleCapture} 
                    onClose={() => setShowCamera(false)} 
                />
            )}

            {isAnalyzing && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4 border-t-transparent"></div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">AI is analyzing...</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center max-w-xs">Scanning for empty spots, planogram compliance, and stock layout.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShelfDoctorView;
