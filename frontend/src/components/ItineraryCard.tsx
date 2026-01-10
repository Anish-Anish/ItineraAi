import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sparkles, Eye, Heart, Scale, Loader2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface OptimizedSpot {
  spot_name: string;
  lat: number;
  long: number;
  description: string;
  estimated_time_spent: string;
  weather: string;
}

interface OptimizedRoute {
  optimized_order: OptimizedSpot[];
  polyline: string;
}

interface ItineraryCardProps {
  title: string;
  totalDays: number | string;
  budget?: string;
  short_desc: string;
  optimized_routes?: Record<string, OptimizedRoute>;
  trip_details?: any;
  onViewDetails?: () => void;
  onViewJourneyFlow?: () => void;
  onFinalize?: (cardIndex: number, planData: any) => void;
  onEnhance: (cardIndex: number, customInput: string) => void;
  cardIndex: number;
  isLiked?: boolean;
  isCompared?: boolean;
  onLike?: () => void;
  onCompare?: () => void;
  isEnhancing?: boolean;
  hotel?: any;
}

const ItineraryCard = ({
  title,
  totalDays,
  budget,
  short_desc,
  optimized_routes,
  trip_details,
  onViewDetails,
  onViewJourneyFlow,
  onFinalize,
  onEnhance,
  cardIndex,
  isLiked,
  isCompared,
  onLike,
  onCompare,
  isEnhancing,
  hotel,
}: ItineraryCardProps) => {
  const [showEnhanceInput, setShowEnhanceInput] = useState(false);
  const [enhanceText, setEnhanceText] = useState("");

  const displayDays =
    totalDays ||
    trip_details?.duration_days ||
    (optimized_routes ? Object.keys(optimized_routes).length : 0);

  const displayBudget = budget || "Custom";
  const displayTitle =
    title ||
    trip_details?.itinerary_name ||
    trip_details?.trip_name ||
    "Trip Plan";

  const handleEnhance = () => {
    if (enhanceText.trim()) {
      setShowEnhanceInput(false);
      onEnhance(cardIndex, enhanceText);
      setEnhanceText("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
      }}
      className="w-full"
    >
      <div className="space-y-3">
        <Card
          className={`h-[500px] flex flex-col p-6 shadow-lg border-0 rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-visible transition-all duration-300 hover:shadow-2xl hover:shadow-purple-300/50 ${
            isEnhancing ? "ring-4 ring-primary ring-offset-2" : ""
          }`}
        >
          {/* Enhancing Overlay */}
          {isEnhancing && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-4 px-6">
                {/* AI Avatar with thinking animation */}
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </motion.div>

                {/* Animated dots */}
                <div className="flex gap-2">
                  <motion.div
                    className="w-3 h-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-3 h-3 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>

                {/* Status text */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-800 mb-1">
                    AI is thinking...
                  </p>
                  <p className="text-xs text-gray-600">
                    Updating your plan with preferences
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Icons */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onLike}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isLiked ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCompare}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompared
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              <Scale className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Header */}
          <div className="mb-4 pb-4 border-b border-purple-200/50">
            <h3 className="text-xl font-bold line-clamp-2 mb-3 text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text">
              {displayTitle}
            </h3>

            <div className="flex items-center gap-3 text-sm">
              <div className="bg-purple-100 flex items-center gap-1 px-3 py-1 rounded-full text-purple-800 font-semibold">
                <Clock className="w-4 h-4" />
                {displayDays} Days
              </div>

              <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-bold">
                {displayBudget}
              </div>
            </div>
          </div>

          {/* Itinerary */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {optimized_routes &&
              Object.keys(optimized_routes).map((dayKey) => (
                <div
                  key={dayKey}
                  className="bg-white/70 rounded-xl p-3 space-y-2 border border-purple-200/50"
                >
                  <div className="font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {dayKey}
                  </div>
                  {optimized_routes[dayKey].optimized_order.map((spot, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-2 shadow-sm border border-purple-100"
                    >
                      <div className="font-semibold text-sm">
                        {idx + 1}. {spot.spot_name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {spot.description}
                      </div>
                      <div className="text-[10px] mt-1 flex gap-2">
                        ⏱ {spot.estimated_time_spent}
                        🌤 {spot.weather}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <Button
              onClick={onViewJourneyFlow}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
            >
              <Map className="w-4 h-4 mr-2" /> View Journey Flow
            </Button>

            <Button
              onClick={() => {
                console.log("🎯 View Detailed Plan button clicked!");
                console.log("🎯 onViewDetails function:", onViewDetails);
                if (onViewDetails) {
                  onViewDetails();
                } else {
                  console.error("❌ onViewDetails is undefined!");
                }
              }}
              className="w-full rounded-xl bg-primary text-white"
            >
              <Eye className="w-4 h-4 mr-2" /> View Detailed Plan
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowEnhanceInput(!showEnhanceInput)}
                variant="outline"
                className="rounded-xl border-primary"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Enhance
              </Button>

              <Button
                onClick={() => {
                  const fullPlanData = {
                    title,
                    totalDays,
                    budget,
                    short_desc,
                    optimized_routes,
                    trip_details,
                    hotel,
                  };
                  onFinalize?.(cardIndex, fullPlanData);
                }}
                variant="outline"
                className="rounded-xl border-secondary"
              >
                Finalize Plan
              </Button>
            </div>
          </div>
        </Card>

        {/* Enhance Input */}
        <AnimatePresence>
          {showEnhanceInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2"
            >
              <Input
                value={enhanceText}
                onChange={(e) => setEnhanceText(e.target.value)}
                placeholder="Add custom changes..."
                className="rounded-xl"
                onKeyPress={(e) => e.key === "Enter" && handleEnhance()}
              />
              <Button onClick={handleEnhance} className="rounded-xl">
                Add
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ItineraryCard;
