"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Play, Pause, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

interface AudioRecorderProps {
  minDuration?: number; // Minimum recording duration in seconds
  maxDuration?: number; // Maximum recording duration in seconds
  onTranscript: (transcript: string) => void;
  onRecordingComplete?: (audioBlob: Blob) => void;
}

export function AudioRecorder({
  minDuration = 30,
  maxDuration = 180,
  onTranscript,
  onRecordingComplete,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        setRecordedBlob(audioBlob);
        setRecordedUrl(audioUrl);
        onRecordingComplete?.(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Process with STT
        await processTranscript(audioBlob);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Unable to access microphone. Please check permissions.");
    }
  }, [maxDuration, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const processTranscript = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch("/api/entry-tests/stt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      setTranscript(data.transcript);
      onTranscript(data.transcript);
    } catch (err) {
      console.error("Transcription error:", err);
      setError("Unable to transcribe audio. Your response was recorded.");
      // Still allow submission even if transcription fails
      onTranscript("[Audio recorded - transcription unavailable]");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setTranscript(null);
    setDuration(0);
    setError(null);
  };

  const togglePlayback = () => {
    if (!recordedUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(recordedUrl);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = (duration / maxDuration) * 100;
  const meetsMinDuration = duration >= minDuration;

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg">
        {!recordedBlob ? (
          // Recording state
          <>
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              onClick={isRecording ? stopRecording : startRecording}
              className="h-16 w-16 rounded-full"
            >
              {isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>

            {isRecording ? (
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-600 animate-pulse">Recording...</span>
                  <span className="font-mono">{formatTime(duration)}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {!meetsMinDuration
                    ? `Speak for at least ${formatTime(minDuration)}`
                    : "Click stop when finished"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click to start recording
              </p>
            )}
          </>
        ) : (
          // Playback state
          <>
            {isProcessing ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing audio...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">
                    Recording complete ({formatTime(duration)})
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={togglePlayback}>
                    {isPlaying ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isPlaying ? "Pause" : "Play Back"}
                  </Button>
                  <Button variant="outline" onClick={resetRecording}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-record
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Your response:</h4>
          <p className="text-sm">{transcript}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        Speak clearly and naturally. Your response will be evaluated on fluency,
        pronunciation, vocabulary, and grammar.
      </p>
    </div>
  );
}
