import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import ItineraryCard from "./ItineraryCard";
import FlightCard from "./FlightCard";
import BusCard from "./BusCard";
import AccommodationCard from "./AccommodationCard";
import MarkdownRenderer from "./MarkdownRenderer";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  cards?: {
    type: "itinerary" | "flight" | "bus" | "accommodation";
    data: any[];
  };
  onLike?: (index: number, itinerary?: any) => void;
  onCompare?: (index: number, itinerary?: any) => void;
  onViewDetails?: (index: number, itinerary?: any) => void;
  onViewJourneyFlow?: (index: number, itinerary?: any) => void;
  onEnhance?: (index: number, customInput: string) => void;
  onFinalize?: (index: number, planData?: any) => void;
  likedPlans?: number[];
  comparePlans?: number[];
  enhancingCards?: Set<number>;
  conversationHistory?: string[];
  isLoading?: boolean;
}

const ChatMessage = ({
  role,
  content,
  cards,
  onLike,
  onCompare,
  onViewDetails,
  onViewJourneyFlow,
  onEnhance,
  onFinalize,
  likedPlans = [],
  comparePlans = [],
  enhancingCards = new Set(),
  conversationHistory = [],
  isLoading = false,
}: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className="mb-4">
      {/* Message Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-end gap-2 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {/* Bot Avatar */}
        {!isUser && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-emerald-200"
          >
            <Bot className="w-5 h-5 text-white" />
          </motion.div>
        )}

        {/* Message Bubble */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`${
            isUser ? "max-w-[85%]" : "max-w-[90%]"
          } px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm ${
            isUser
              ? "bg-gradient-to-br from-purple-100 via-pink-50 to-rose-50 text-gray-800 rounded-br-md border border-purple-200/50"
              : "bg-gradient-to-br from-white via-gray-50 to-slate-50 text-gray-800 rounded-bl-md border border-gray-200/50"
          }`}
        >
          {isLoading && !isUser ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <motion.div
                  className="w-2 h-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: 0,
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: 0.2,
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: 0.4,
                  }}
                />
              </div>
              <span className="text-gray-500 text-xs">AI is thinking...</span>
            </div>
          ) : (
            <MarkdownRenderer
              content={content}
              className="prose prose-sm max-w-none text-gray-800"
            />
          )}
        </motion.div>

        {/* User Avatar */}
        {isUser && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-purple-200"
          >
            <User className="w-5 h-5 text-white" />
          </motion.div>
        )}
      </motion.div>

      {/* Cards Section - Only for assistant messages */}
      {!isUser && cards && (
        <div className="mt-3 ml-11">
          {/* Grid for itineraries (multi-row) */}
          {cards.type === "itinerary" && (
            <div className="grid gap-4 pb-4 pt-2 sm:grid-cols-2 xl:grid-cols-3">
              {cards.data.map((itinerary, index) => (
                <ItineraryCard
                  key={index}
                  title={itinerary.title}
                  totalDays={itinerary.durationDays}
                  budget={itinerary.budget || "Custom"}
                  short_desc={itinerary.short_desc}
                  highlights={itinerary.highlights || []}
                  {...itinerary}
                  cardIndex={index}
                  isLiked={likedPlans.includes(index)}
                  isCompared={comparePlans.includes(index)}
                  onLike={() => onLike?.(index, itinerary)}
                  onCompare={() => onCompare?.(index, itinerary)}
                  onViewDetails={() => onViewDetails?.(index, itinerary)}
                  onViewJourneyFlow={() =>
                    onViewJourneyFlow?.(index, itinerary)
                  }
                  onEnhance={(cardIndex, customInput) =>
                    onEnhance?.(cardIndex, customInput)
                  }
                  onFinalize={(cardIndex, planData) => {
                    console.log(
                      "🔥 ChatMessage onFinalize - cardIndex:",
                      cardIndex
                    );
                    console.log(
                      "🔥 ChatMessage onFinalize - planData:",
                      planData
                    );
                    // Pass through the planData from ItineraryCard (or use itinerary as fallback)
                    onFinalize?.(cardIndex, planData || itinerary);
                  }}
                  isEnhancing={enhancingCards.has(index)}
                />
              ))}
            </div>
          )}

          {/* Horizontal scroll row for flight cards */}
          {cards.type === "flight" && (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 pr-2">
              {cards.data.map((flight, index) => (
                <FlightCard
                  key={index}
                  flight={flight}
                  index={index}
                  total={cards.data.length}
                  conversationHistory={conversationHistory}
                />
              ))}
            </div>
          )}

          {/* Keep bus as-is (vertical or grid in future if needed) */}
          {cards.type === "bus" && (
            <div className="grid gap-4 pb-4 pt-2 sm:grid-cols-2 xl:grid-cols-3">
              {cards.data.map((busRoute, index) => (
                <BusCard
                  key={index}
                  route={busRoute}
                  routeName={busRoute.routeName || `Route ${index + 1}`}
                  index={index}
                  total={cards.data.length}
                  isEnhancing={false}
                  onEnhance={() => console.log("Enhance bus route:", index)}
                  conversationHistory={conversationHistory}
                />
              ))}
            </div>
          )}

          {/* Horizontal scroll row for accommodation (hotel) cards */}
          {cards.type === "accommodation" && (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 pr-2">
              {cards.data.map((accommodation, index) => (
                <AccommodationCard
                  key={index}
                  accommodation={accommodation}
                  index={index}
                  total={cards.data.length}
                  isEnhancing={false}
                  conversationHistory={conversationHistory}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
