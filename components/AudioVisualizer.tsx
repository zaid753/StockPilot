
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    stream: MediaStream | null;
    isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!stream || !isActive || !canvasRef.current) {
            return;
        }

        // Initialize Audio Context for visualization
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');

        if (!canvasCtx || !ctx) return;

        // Create Analyser
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 64; // Low bin count for chunky bars
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Connect Source
        try {
            sourceRef.current = ctx.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);
        } catch (e) {
            console.error("Visualizer connection error", e);
            return;
        }

        const draw = () => {
            if (!analyserRef.current) return;

            animationFrameRef.current = requestAnimationFrame(draw);

            analyserRef.current.getByteFrequencyData(dataArray);

            // Clear canvas
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            const width = canvas.width;
            const height = canvas.height;
            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            // Center alignment calc
            const totalWidth = bufferLength * barWidth;
            x = (width - totalWidth) / 2;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2; // Scale down

                // Draw bars with rounded tips
                canvasCtx.fillStyle = `rgba(99, 102, 241, ${0.4 + (barHeight / 150)})`; // indigo-500 with dynamic opacity
                
                // Draw top rounded rect
                canvasCtx.beginPath();
                canvasCtx.roundRect(x, height / 2 - barHeight / 2, barWidth - 2, barHeight || 4, 4);
                canvasCtx.fill();

                x += barWidth;
            }
        };

        draw();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }
            // We do not close the context here to avoid rapid open/close issues, 
            // but in a larger app we might want to cleanup.
        };
    }, [stream, isActive]);

    return (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0">
            <canvas 
                ref={canvasRef} 
                width={200} 
                height={60} 
                className="opacity-80"
            />
        </div>
    );
};

export default AudioVisualizer;
