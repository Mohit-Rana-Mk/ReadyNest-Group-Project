import { toast } from '../components/ui/Toast';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, Video as Vid, VideoOff, PhoneOff, Loader2 } from 'lucide-react';

export default function VideoConsultation() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stream, setStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerConnectionRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        // 1. Get local media
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = currentStream;
                }
                
                // 2. Initialize Socket and WebRTC
                socketRef.current = io(SOCKET_URL);
                
                socketRef.current.emit('join-video-room', { roomId, userId: user.id });

                socketRef.current.on('user-connected', (userId) => {
                    // Other user joined, we should create an offer
                    initiateCall(currentStream);
                });

                socketRef.current.on('webrtc-offer', async (data) => {
                    if (data.userId !== user.id) {
                        await handleReceiveOffer(data.offer, currentStream);
                    }
                });

                socketRef.current.on('webrtc-answer', async (data) => {
                    if (data.userId !== user.id && peerConnectionRef.current) {
                        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                        setIsConnected(true);
                    }
                });

                socketRef.current.on('webrtc-ice-candidate', async (data) => {
                    if (data.userId !== user.id && peerConnectionRef.current) {
                        try {
                            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                        } catch (e) {
                            console.error('Error adding ICE candidate', e);
                        }
                    }
                });

                socketRef.current.on('user-disconnected', () => {
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                    setIsConnected(false);
                });

            }).catch(err => {
                console.error("Failed to get local stream", err);
                toast.error("Failed to access camera/microphone");
            });

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (peerConnectionRef.current) peerConnectionRef.current.close();
            if (socketRef.current) socketRef.current.disconnect();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, user.id]);

    const createPeerConnection = (currentStream) => {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        // Add local tracks
        currentStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, currentStream);
        });

        // Listen for remote tracks
        peerConnection.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
            setIsConnected(true);
        };

        // Send ICE candidates to the other peer
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('webrtc-ice-candidate', {
                    roomId,
                    userId: user.id,
                    candidate: event.candidate
                });
            }
        };

        peerConnectionRef.current = peerConnection;
        return peerConnection;
    };

    const initiateCall = async (currentStream) => {
        const pc = createPeerConnection(currentStream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketRef.current.emit('webrtc-offer', {
            roomId,
            userId: user.id,
            offer
        });
    };

    const handleReceiveOffer = async (offer, currentStream) => {
        const pc = createPeerConnection(currentStream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit('webrtc-answer', {
            roomId,
            userId: user.id,
            answer
        });
    };

    const toggleMute = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const endCall = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (peerConnectionRef.current) peerConnectionRef.current.close();
        if (socketRef.current) socketRef.current.disconnect();
        
        // Navigate back based on role
        if (user.role === 'Doctor') navigate('/doctor');
        else navigate('/patient');
    };

    return (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="HealTrack Logo" className="w-8 h-8 object-contain rounded-lg" />
                    <h1 className="text-white text-xl font-bold tracking-wide">HealTrack Video Consultation</h1>
                </div>
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-sm font-semibold tracking-wide">Connected</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-slate-800/80 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium tracking-wide">Waiting for others...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative w-full h-full">
                {/* Remote Video (Full Screen) */}
                <video 
                    ref={remoteVideoRef}
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover bg-slate-800"
                />
                {!isConnected && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <Vid className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No one else is here</p>
                        <p className="text-sm opacity-80 mt-1">Waiting for the other participant to join...</p>
                    </div>
                )}

                {/* Local Video (Picture in Picture) */}
                <div className="absolute bottom-24 right-6 w-32 md:w-48 aspect-[3/4] md:aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-800 z-20">
                    <video 
                        ref={localVideoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }} 
                    />
                    {isVideoOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                            <VideoOff className="w-8 h-8 text-slate-500" />
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center items-center gap-6 z-50 bg-slate-900/60 p-4 rounded-full backdrop-blur-xl border border-white/10 shadow-2xl">
                <button 
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${isMuted ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-slate-700/80 text-white hover:bg-slate-600'}`}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                
                <button 
                    onClick={endCall}
                    className="w-16 h-16 rounded-full flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white transition shadow-xl shadow-rose-900/50"
                >
                    <PhoneOff className="w-7 h-7" />
                </button>

                <button 
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${isVideoOff ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-slate-700/80 text-white hover:bg-slate-600'}`}
                >
                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Vid className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
}
