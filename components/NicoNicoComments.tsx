'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Flame } from 'lucide-react';

// Advanced comment structure
interface NicoComment {
  id: number;
  text: string;
  top: number;
  duration: number;
  type: 'default' | 'special' | 'highlight';
  icon?: React.ReactNode;
  avatar: string;
}

// More complex mock data source
const commentBank = [
  "This scene is iconic!", "LOL I can't believe he said that", "Masterpiece cinema", "🔥 🔥 🔥",
  "Wait, what just happened?", "I did NOT see that coming", "The cinematography is insane",
  "YOOOOOOO", "Literally the best part", "This is where it gets crazy"
];

const userAvatars = ['User1', 'User2', 'User3', 'User4', 'User5'].map(seed => `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`);

// A hook to manage the live comment stream, adding significant logic
const useCommentStream = (active: boolean, density: number) => {
  const [comments, setComments] = useState<NicoComment[]>([]);
  const lastLane = useRef(0);

  const generateComment = useCallback(() => {
    // A simple lane-based collision avoidance system
    const lane = (lastLane.current + 1) % 10;
    lastLane.current = lane;

    const type: NicoComment['type'] = Math.random() > 0.95 ? 'highlight' : Math.random() > 0.8 ? 'special' : 'default';
    const duration = 8 + Math.random() * 4;
    const newComment: NicoComment = {
      id: Date.now() + Math.random(),
      text: commentBank[Math.floor(Math.random() * commentBank.length)],
      top: (lane * 9) + 5, // Position based on lane
      duration,
      type,
      avatar: userAvatars[Math.floor(Math.random() * userAvatars.length)],
      icon: type === 'highlight' ? <Flame/> : type === 'special' ? <Heart/> : undefined,
    };
    return newComment;
  }, []);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setComments(prev => {
        const newComments = [...prev, generateComment()];
        // Keep the DOM clean by trimming old comments
        return newComments.slice(-50);
      });
    }, 1000 / density);
    return () => clearInterval(interval);
  }, [active, density, generateComment]);

  return comments;
};

// Component to render a single comment with complex styling and animation
const Comment = ({ comment }: { comment: NicoComment }) => {
  const styles = {
    default: "text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]",
    special: "text-3xl font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(250,204,21,0.8)]",
    highlight: "text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 drop-shadow-[0_4px_8px_rgba(239,68,68,0.8)]",
  };

  return (
    <motion.div
      key={comment.id}
      initial={{ x: '100vw' }}
      animate={{ x: '-100vw' }}
      transition={{ duration: comment.duration, ease: 'linear' }}
      onAnimationComplete={() => { /* In a production app, you might remove the element here */ }}
      className={`absolute whitespace-nowrap flex items-center gap-3 ${styles[comment.type]}`}
      style={{ top: `${comment.top}%` }}
    >
      <img src={comment.avatar} className="w-8 h-8 rounded-full border-2 border-white/50" />
      {comment.icon}
      <span>{comment.text}</span>
    </motion.div>
  );
};

export function NicoNicoComments({ active, density = 2 }: { active: boolean; density?: number }) {
  const comments = useCommentStream(active, density);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-2xl">
      {comments.map(c => <Comment key={c.id} comment={c} />)}
    </div>
  );
}
