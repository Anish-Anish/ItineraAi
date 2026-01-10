import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Send,
  Loader2,
  ArrowLeft,
  Heart,
  Scale,
  Map,
  Bus,
  MapPin,
  Plane,
  Menu,
  X,
  Sparkles,
  MessageSquare,
  Bot,
  Hotel,
  Clock,
  PlusSquare,
} from "lucide-react";
import { motion } from "framer-motion";

import ChatMessage from "@/components/ChatMessage";
import ItineraryCard from "@/components/ItineraryCard";
import ItineraryDetailSheet from "@/components/ItineraryDetailSheet";
import AnimatedMapView from "@/components/AnimatedMapView";
import SuccessModal from "@/components/SuccessModal";
import FlightCard from "@/components/FlightCard";
import AccommodationCard from "@/components/AccommodationCard";
import BusCard from "@/components/BusCard";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  type Conversation,
  type Message,
} from "@/lib/localStorage";

// --- START: Define Itinerary Types and Mock Data ---
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

// Map of "Day X" to its route
type OptimizedRoutes = Record<string, OptimizedRoute>;

interface BackendPlan {
  trip_details: {
    trip_name: string;
    itinerary_name: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    destination: string;
  };
  hotel: {
    name: string;
    lat: number;
    lng: number;
    rating: number;
    types: string[];
    open_now: boolean;
  };
  optimized_routes: OptimizedRoutes;
  itinerary: Record<string, OptimizedSpot[]>;
}

// Simplified Itinerary structure for the UI component
interface Itinerary {
  title: string;
  duration: string; // e.g., "5 Days"
  budget?: string; // Placeholder or derived
  short_desc: string; // Derived from trip_details
  highlights: string[]; // Derived from optimized_routes
  optimized_routes: OptimizedRoutes;
  durationDays: number; // For easy use in cards
  trip_details?: BackendPlan["trip_details"];
  hotel?: BackendPlan["hotel"];
}

interface FlightOption {
  // Added FlightOption interface
  id: string;
  carrier: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  origin_iata: string;
  destination_iata: string;
  duration: string;
  price_inr: number;
  is_direct: boolean;
}

interface BusRoute {
  route_no: number;
  bus_type: string;
  start_address: string;
  end_address: string;
  distance: string;
  duration: string;
  estimated_price: string;
}

interface BusResponse {
  origin: string;
  destination: string;
  routes_found: number;
  routes: BusRoute[];
}

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("query") || "";
  const [messages, setMessages] = useState<Message[]>([]);
  // Remove separate card states - integrate into message flow
  const [input, setInput] = useState(initialQuery);
  const [showItineraries, setShowItineraries] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [realItineraries, setRealItineraries] = useState<Itinerary[]>([]);
  const [flightOptions, setFlightOptions] = useState<FlightOption[]>([]);
  const [showFlights, setShowFlights] = useState(false);
  const [busResponse, setBusResponse] = useState<BusResponse | null>(null);
  const [showBusRoutes, setShowBusRoutes] = useState(false);
  const [enhancingBusCards, setEnhancingBusCards] = useState<Set<number>>(
    new Set()
  );
  const [accommodations, setAccommodations] = useState<
    Array<{
      Name: string;
      Address: string;
      Rating: number;
      Website: string;
      "Google Maps Link": string;
    }>
  >([]);
  const [showAccommodations, setShowAccommodations] = useState(false);
  const [enhancingAccommodationCards, setEnhancingAccommodationCards] =
    useState<Set<number>>(new Set());
  const [tripData] = useState({
    destination: "",
    duration: "",
    type: "",
    budget: "",
  });
  const [selectedItinerary, setSelectedItinerary] = useState<number | null>(
    null
  );
  const [selectedItineraryData, setSelectedItineraryData] =
    useState<Itinerary | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [mapViewItineraries, setMapViewItineraries] = useState<Itinerary[]>([]);
  const [likedPlans, setLikedPlans] = useState<number[]>([]);
  const [comparePlans, setComparePlans] = useState<number[]>([]);
  const [likedItineraries, setLikedItineraries] = useState<Itinerary[]>([]);
  const [compareItineraries, setCompareItineraries] = useState<Itinerary[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed by default
  const [trendingScores, setTrendingScores] = useState<Record<string, number>>(
    {}
  );
  const [showLikedPopup, setShowLikedPopup] = useState(false);
  const [showComparePopup, setShowComparePopup] = useState(false);
  const [enhancingCards, setEnhancingCards] = useState<Set<number>>(new Set());
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const baseHotQueries = [
    "5-day adventure in Leh Ladakh",
    "Romantic week in Goa beaches",
    "Cultural tour of Rajasthan",
    "Spiritual journey to Varanasi",
    "Beach paradise in Andaman",
  ];

  const defaultFollowUps = [
    "Plan a weekend trip ✈️",
    "Find flights to spain 💸",
    "Suggest hotels in dubai🏨",
    "Show transport options in dubai 🚌",
  ];

  const hotQueries = [...baseHotQueries].sort(
    (a, b) => (trendingScores[b] || 0) - (trendingScores[a] || 0)
  );

  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([
    "Tell me more about accommodations",
    "What's the best time to visit?",
    "Show transport options",
    "Suggest local foods",
    "Any nearby attractions?",
  ]);

  const loadingMessages = [
    "Translating user language → English...",
    "Understood what you truly wants...",
    "Turning your desires into a day-by-day travel plan...",
    "Making you travel smoother, not longer.",
    "Checking weather for your plan...",
    "Polishing the plan with AI magic.",
    "thinking...",
    "Package everything into a share-worthy final plan",
  ];

  const [dotCount, setDotCount] = useState(0);

  // Fetch conversation history from MongoDB
  const getApiBase = () => {
    const protocol = window.location.protocol;
    const originHost = window.location.hostname;
    return `${protocol}//${originHost}:8089`;
  };
  const fetchConversationsFromDB = async () => {
    try {
      const response = await fetch(
        `${getApiBase()}/api/conversations?limit=20`
      );
      const data = await response.json();

      if (data.success && data.conversations) {
        // Transform MongoDB conversations to match local storage format
        const transformedConversations = data.conversations.map(
          (conv: any) => ({
            id: conv.conversation_id,
            title: conv.preview || "Untitled Conversation",
            messages: [], // Will be loaded when conversation is selected
            createdAt: new Date(conv.created_at).getTime(),
            updatedAt: new Date(conv.updated_at).getTime(),
          })
        );
        setConversations(transformedConversations);
        console.log("Loaded conversation history:", transformedConversations.length);
      }
    } catch (error) {
      console.error("Error fetching conversations from MongoDB:", error);
      // On error, show empty conversations
      setConversations([]);
    }
  };

  useEffect(() => {
    fetchConversationsFromDB();

    const destination = searchParams.get("destination");
    const query = searchParams.get("query");
    const type = searchParams.get("type");

    // Only auto-execute for destination and type params, not for query from landing page
    if (destination || type) {
      const initialQuery = destination || `Plan a ${type} trip`;
      handleSendMessage(initialQuery);
    } else {
      // No welcome message - start with clean chat
    }

    // Conversation ID will be received from backend on first message
    // Don't generate it here - let the backend handle it

    // Listen for follow-up questions updates from card components
    const handleFollowUpUpdate = (event: CustomEvent) => {
      if (event.detail && Array.isArray(event.detail)) {
        setFollowUpQuestions(event.detail);
      }
    };

    window.addEventListener(
      "updateFollowUpQuestions",
      handleFollowUpUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "updateFollowUpQuestions",
        handleFollowUpUpdate as EventListener
      );
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Note: Automatic conversation saving has been disabled
  // Messages are no longer stored to localStorage or database when entered

  const genId = () =>
    (window.crypto && 'randomUUID' in window.crypto)
      ? (window.crypto as any).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: genId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const triggerFollowUp = async (content: string, conversationId?: string | null) => {
    try {
      const payload: any = {
        message: content,
        conversation_id: conversationId ?? currentConversationId,
      };

      // Only trigger follow-up API when we have a valid conversation_id
      if (!payload.conversation_id) {
        setFollowUpLoading(false);
        return;
      }

      setFollowUpLoading(true);
      const resp = await fetch("http://localhost:8089/api/follow_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) return;
      const data = await resp.json();

      if (Array.isArray(data)) {
        setFollowUpQuestions(data as string[]);
      } else if (data && Array.isArray(data.follow_up_questions)) {
        setFollowUpQuestions(data.follow_up_questions as string[]);
      }
    } catch (e) {
      console.error("follow_up fetch error", e);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const addAssistantMessage = (
    content: string,
    options?: { conversationId?: string | null; streamTyping?: boolean }
  ) => {
    const message: Message = {
      id: genId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    // If streaming typing is requested, progressively reveal content and then trigger follow-up
    if (options?.streamTyping) {
      const thisId = message.id;
      let i = 0;
      const chunk = Math.max(1, Math.ceil(content.length / 80));
      const interval = setInterval(() => {
        i = Math.min(content.length, i + chunk);
        const isComplete = i >= content.length;
        const animatedDots = isComplete ? "" : ".".repeat(((i / chunk) % 3) + 1);
        const display = isComplete ? content : `${content.slice(0, i)}${animatedDots}`;
        setMessages((prev) =>
          prev.map((m) => (m.id === thisId ? { ...m, content: display } : m))
        );
        if (i >= content.length) {
          clearInterval(interval);
          // Trigger follow-ups after full text rendered
          triggerFollowUp(content, options?.conversationId ?? currentConversationId);
        }
      }, 25);
      return;
    }

    // Non-streaming: immediately trigger follow-ups
    triggerFollowUp(content, options?.conversationId ?? currentConversationId);
  };

  const handleSendMessage = async (text?: string) => {
    if (isLoading) return;
    const messageText = text || input.trim();
    if (!messageText) return;

    // Check word limit
    const wordCount = messageText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    if (wordCount > 1200) {
      alert("Message exceeds 1200 word limit. Please shorten your message.");
      return;
    }

    addUserMessage(messageText);
    setInput("");

    // Detect if it's an itinerary planning query (not bus/hotel/flight search)
    const isItineraryPlanQuery =
      (messageText.toLowerCase().includes("plan") ||
        messageText.toLowerCase().includes("itinerary") ||
        messageText.toLowerCase().includes("trip")) &&
      !messageText.toLowerCase().includes("bus") &&
      !messageText.toLowerCase().includes("hotel") &&
      !messageText.toLowerCase().includes("flight") &&
      !messageText.toLowerCase().includes("accommodation");

    if (isItineraryPlanQuery) {
      setIsLoading(true);
      setLoadingStep(0);
    } else {
      setIsLoading(true);
      setLoadingStep(-1); // Use -1 to indicate simple loading
    }

    // Keep existing cards visible - don't reset them on new messages

    try {
      let loadingInterval: NodeJS.Timeout | undefined;

      if (isItineraryPlanQuery) {
        // Custom timing for each step
        const stepTimings = [3000, 3000, 2000, 2000, 3000, 4000, 2000]; // [0-3s], [3-6s], [6-8s], [8-10s], [10-13s], [14-18s], [18-20s]
        let currentStepIndex = 0;

        const scheduleNextStep = () => {
          if (currentStepIndex < stepTimings.length - 1) {
            setTimeout(() => {
              setLoadingStep(currentStepIndex + 1);
              currentStepIndex++;
              scheduleNextStep();
            }, stepTimings[currentStepIndex]);
          } else {
            // After step 6 (thinking...), wait then start step 7 with dots
            setTimeout(() => {
              setLoadingStep(7);

              // Start dots animation immediately
              const dotInterval = setInterval(() => {
                setDotCount((prev) => (prev + 1) % 4); // 0, 1, 2, 3 dots
              }, 800); // Normal speed dots

              // Store dot interval to clear it later
              (window as any).dotInterval = dotInterval;
            }, stepTimings[currentStepIndex]);
          }
        };

        // Start the sequence
        scheduleNextStep();
      }

      // Ensure conversation_id exists for this conversation
      const generateId = () =>
        (window.crypto && 'randomUUID' in window.crypto)
          ? window.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const conversationId = currentConversationId || generateId();
      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
      }

      // Per-message run_id (timestamp-based)
      const runId = Date.now().toString();

      // Prepare request body with required fields
      const requestBody: { query: string; conversation_id: string; run_id: string } = {
        query: messageText,
        conversation_id: conversationId,
        run_id: runId,
      };

      console.log("Sending to backend:", requestBody);

      // Use same LAN host as frontend to avoid CORS/loopback issues
      const apiCandidates = [getApiBase()];

      let response: Response | null = null;
      let lastError: any = null;
      for (const base of apiCandidates) {
        try {
          response = await fetch(`${base}/api/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });
          // If fetch succeeds, stop trying others
          if (response) break;
        } catch (e) {
          lastError = e;
          console.warn(`Chat fetch failed for ${base}`, e);
        }
      }

      if (!response) {
        throw lastError || new Error("Failed to fetch from API candidates");
      }

      if (loadingInterval) {
        clearInterval(loadingInterval);
      }

      // Safely parse JSON, or surface non-JSON/text responses for better debugging
      let data: any = null;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseErr: any) {
          const rawText = await response.text().catch(() => "");
          throw new Error(
            `Failed to parse JSON response. Status: ${response.status}. Body: ${rawText?.slice(0, 500)}`
          );
        }
      } else {
        const rawText = await response.text().catch(() => "");
        throw new Error(
          `Non-JSON response from server. Status: ${response.status}. Body: ${rawText?.slice(0, 500)}`
        );
      }

      console.log("Backend Response:", data);

      // Extract and store conversation_id from backend response
      if (data.conversation_id) {
        console.log("Setting conversation_id:", data.conversation_id);
        setCurrentConversationId(data.conversation_id);
      }

      // Check for 429 quota error
      if (
        response.status === 429 ||
        data.error?.includes("429") ||
        data.error?.includes("RESOURCE_EXHAUSTED") ||
        data.error?.includes("Quota exceeded")
      ) {
        addAssistantMessage(
          "⚠️ Translation API Quota Exceeded\n\n" +
          "The Google Translation API has reached its daily quota limit. " +
          "Your trip planning request is being processed, but some translations may be unavailable.\n\n" +
          "💡 The system will continue to work with available data. Please try again later for full translation support."
        );
        return;
      }

      // Check for other errors
      if (!response.ok || data.error) {
        addAssistantMessage(
          `⚠️ Error: ${data.error || "Something went wrong. Please try again."}`
        );
        return;
      }

      // If backend asks a clarification question, show it immediately
      if (data.clarify_question_status && data.clarify_question) {
        addAssistantMessage(data.clarify_question, {
          conversationId: data.conversation_id ?? currentConversationId,
          streamTyping: true,
        });
        // Optionally update follow-up questions if provided
        if (data.follow_up_questions && Array.isArray(data.follow_up_questions)) {
          setFollowUpQuestions(data.follow_up_questions);
        }
        return;
      }

      if (data.follow_up_questions && Array.isArray(data.follow_up_questions)) {
        setFollowUpQuestions(data.follow_up_questions);
      }

      if (data.message) {
        addAssistantMessage(data.message, {
          conversationId: data.conversation_id ?? currentConversationId,
          streamTyping: true,
        });
      } else {
        addAssistantMessage(
          "⚠️ Sorry, I didn't get a clear message from the server."
        );
      }

      if (
        data.response_type === "plans" &&
        data.plans &&
        Array.isArray(data.plans)
      ) {
        const mappedItineraries: Itinerary[] = data.plans
          .filter((plan: BackendPlan) => plan.optimized_routes)
          .map((plan: BackendPlan, index: number) => {
            const days = Object.keys(plan.optimized_routes);
            const durationDays =
              plan.trip_details?.duration_days || days.length;

            const highlights = days.map((dayKey) => {
              const firstSpot =
                plan.optimized_routes[dayKey].optimized_order[0];
              return firstSpot ? `${dayKey}: ${firstSpot.spot_name}` : dayKey;
            });

            return {
              title:
                plan.trip_details?.itinerary_name ||
                `Plan ${index + 1}: ${plan.trip_details?.destination || "Trip"
                }`,
              duration: durationDays
                ? `${durationDays} Days`
                : `${days.length} Days`,
              durationDays: durationDays,
              budget: "Custom",
              short_desc:
                plan.trip_details?.trip_name || "Generated Custom Trip Plan",
              highlights: highlights.slice(0, 4) || [],
              optimized_routes: plan.optimized_routes,
            };
          });

        // Add itinerary cards to the last assistant message
        setRealItineraries(mappedItineraries);
        setShowItineraries(true);

        // Update the last assistant message to include cards
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            const updatedMessage = {
              ...lastMessage,
              content: `📋 Here are ${mappedItineraries.length} itinerary options for you:`,
              cards: {
                type: "itinerary" as const,
                data: mappedItineraries,
              },
            };
            return [...prev.slice(0, -1), updatedMessage];
          }
          return prev;
        });
      } else if (data.response_type === "flights" && data.flight_options) {
        console.log("Flight Data Received:", data.flight_options);

        // Sort flights by duration (shortest first)
        const sortedFlights = [...data.flight_options].sort((a, b) => {
          // Extract hours and minutes from duration string (e.g., "2h 30m")
          const parseTime = (duration: string) => {
            const hours = duration.match(/(\d+)h/)?.[1] || "0";
            const minutes = duration.match(/(\d+)m/)?.[1] || "0";
            return parseInt(hours) * 60 + parseInt(minutes);
          };

          return parseTime(a.duration) - parseTime(b.duration);
        });

        setFlightOptions(sortedFlights);
        setShowFlights(true);

        // Update the last assistant message to include flight cards
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            const updatedMessage = {
              ...lastMessage,
              content: `✈️ Here are ${data.flight_options.length} flight options for you:`,
              cards: {
                type: "flight" as const,
                data: data.flight_options,
              },
            };
            return [...prev.slice(0, -1), updatedMessage];
          }
          return prev;
        });
      } else if (data.response_type === "bookings" && data.travel_bookings) {
        try {
          // Parse travel_bookings if it's a string
          let busData;
          try {
            busData =
              typeof data.travel_bookings === "string"
                ? JSON.parse(data.travel_bookings)
                : data.travel_bookings;
          } catch (parseError) {
            addAssistantMessage("⚠️ Error parsing bus data. Please try again.");
            return;
          }

          // Transform the bus data to match BusCard component interface
          const transformedBusData = {
            routes: Object.entries(busData).map(
              ([routeKey, routeData]: [string, any], index) => {
                // Extract all buses from the route data
                const buses = [];
                let busIndex = 1;

                // Keep adding buses until we don't find any more
                while (routeData[`BUS ${busIndex}`]) {
                  const busData = routeData[`BUS ${busIndex}`];
                  buses.push({
                    operator: busData.name || `Bus ${busIndex}`,
                    from:
                      busData.route?.split(" → ")[0] ||
                      (busIndex === 1 ? routeData.start : "Transfer Point"),
                    to:
                      busData.route?.split(" → ")[1] ||
                      (busIndex === 1
                        ? routeData.destination
                        : "Transfer Point"),
                    trip_time: busData.bus_trip_time || "N/A",
                  });
                  busIndex++;
                }

                // If no buses found, create a default one
                if (buses.length === 0) {
                  buses.push({
                    operator: "Bus Service",
                    from: routeData.start,
                    to: routeData.destination,
                    trip_time: routeData.time_for_trip || "N/A",
                  });
                }

                // Calculate dynamic pricing based on multiple factors
                const calculatePrice = () => {
                  let basePrice = 400;

                  // Factor 1: Duration-based pricing
                  const duration = routeData.time_for_trip || "8 hours";
                  const hours = parseInt(duration.match(/\d+/)?.[0] || "8");
                  basePrice += hours * 12; // ₹12 per hour

                  // Factor 2: Number of buses (more transfers = slightly cheaper)
                  const transferDiscount = Math.max(0, (buses.length - 1) * 25);
                  basePrice -= transferDiscount;

                  // Factor 3: Route variation (different routes have different prices)
                  const routeVariation = [0, 50, -30, 80, -20, 40][index] || 0;
                  basePrice += routeVariation;

                  // Factor 4: Premium operators get higher prices
                  const premiumOperators = ["VRL Travels", "Mannat Holidays"];
                  const hasPremium = buses.some((bus) =>
                    premiumOperators.some((premium) =>
                      bus.operator.includes(premium)
                    )
                  );
                  if (hasPremium) basePrice += 100;

                  // Factor 5: Add some randomness for realism
                  const randomVariation = Math.floor(Math.random() * 60) - 30; // ±30
                  basePrice += randomVariation;

                  // Ensure minimum price and round to nearest 10
                  return Math.max(300, Math.round(basePrice / 10) * 10);
                };

                return {
                  // Properties expected by BusCard
                  route_no: index + 1,
                  bus_type: routeData.type || "Connected Buses",
                  start_address: routeData.start,
                  end_address: routeData.destination,
                  distance: "N/A", // Not provided in backend data
                  duration: routeData.time_for_trip || "8 hours",
                  estimated_price: `₹${calculatePrice()}`,

                  // Additional properties for compatibility
                  id: index + 1,
                  routeName: `${routeData.start} to ${routeData.destination}`,
                  start: routeData.start,
                  destination: routeData.destination,
                  time_for_trip: routeData.time_for_trip,
                  type: routeData.type || "Bus Route",
                  buses: buses,
                };
              }
            ),
          };

          // Validate the transformed data
          if (
            !transformedBusData.routes ||
            transformedBusData.routes.length === 0
          ) {
            addAssistantMessage(
              "Sorry, no bus routes were found for your search."
            );
            return;
          }

          setBusResponse(transformedBusData);
          setShowBusRoutes(true);

          // Add bus cards to the last assistant message
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
              const updatedMessage = {
                ...lastMessage,
                content: `🚌 Here are ${transformedBusData.routes.length} bus route options:`,
                cards: {
                  type: "bus" as const,
                  data: transformedBusData.routes,
                },
              };
              return [...prev.slice(0, -1), updatedMessage];
            }
            return prev;
          });
        } catch (transformError) {
          addAssistantMessage(
            "⚠️ Error processing bus data. Please try again."
          );
        }
      } else if (data.response_type === "acomdation" && data.acomdation) {
        console.log("Accommodation Data Received:", data.acomdation);
        setAccommodations(data.acomdation);
        setShowAccommodations(true);

        // Add cards to the last assistant message instead of creating a new one
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            // Update the last assistant message to include cards
            const updatedMessage = {
              ...lastMessage,
              content: `🏨 Here are ${data.acomdation.length} accommodation options for you:`,
              cards: {
                type: "accommodation" as const,
                data: data.acomdation,
              },
            };
            return [...prev.slice(0, -1), updatedMessage];
          }
          return prev;
        });
      }
    } catch (error: any) {
      console.error("Chat API Error:", error);

      // Check if error message contains quota information
      const errorMessage = error?.message || error?.toString() || "";
      if (
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("Quota exceeded")
      ) {
        addAssistantMessage(
          "⚠️ Translation API Quota Exceeded\n\n" +
          "The Google Translation API has reached its daily quota limit. " +
          "Your trip planning will continue with limited translation support.\n\n" +
          "💡 Please try again tomorrow for full translation features."
        );
      } else {
        // Probe backend /health for better diagnostics
        const apiCandidates = [
          `${getApiBase()}/health`,
        ];
        let healthInfo = "";
        for (const url of apiCandidates) {
          try {
            const res = await fetch(url, { method: "GET" });
            const txt = await res.text();
            healthInfo = `Health check ${res.ok ? "OK" : res.status}: ${txt?.slice(0, 200)}`;
            break;
          } catch (e) {
            // continue
          }
        }

        // Probe preflight OPTIONS on /api/chat to detect CORS issues
        const preflightCandidates = [
          `${getApiBase()}/api/chat`,
        ];
        let preflightInfo = "";
        for (const url of preflightCandidates) {
          try {
            const res = await fetch(url, {
              method: "OPTIONS",
              headers: { "Access-Control-Request-Method": "POST", "Origin": window.location.origin },
            });
            preflightInfo = `Preflight ${res.ok ? "OK" : res.status} on ${new URL(url).host}`;
            break;
          } catch (e) {
            // continue
          }
        }

        const friendly =
          typeof error?.message === "string" && error.message.length > 0
            ? error.message
            : "Connection error. Please ensure Flask server is running.";
        addAssistantMessage(`⚠️ ${friendly}${healthInfo ? `\n\n${healthInfo}` : ""}${preflightInfo ? `\n${preflightInfo}` : ""}`);
      }
    } finally {
      // Faster transition when response arrives
      setTimeout(() => {
        setIsLoading(false);
        setLoadingStep(0);
        setDotCount(0);

        // Clear intervals
        if ((window as any).dotInterval) {
          clearInterval((window as any).dotInterval);
          (window as any).dotInterval = null;
        }
      }, 100); // Quick 100ms delay for smooth transition
    }
  };

  const handleEnhancePlan = async (cardIndex: number, customInput: string) => {
    const planToEnhance = realItineraries[cardIndex];
    if (!planToEnhance) return;

    // Set loading state for this specific card
    setEnhancingCards((prev) => new Set([...prev, cardIndex]));

    try {
      // Convert our itinerary structure to backend expected format
      const planDetails = {
        trip_details: planToEnhance.trip_details || {
          trip_name: planToEnhance.short_desc || planToEnhance.title,
          itinerary_name: planToEnhance.title,
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(
            Date.now() + (planToEnhance.durationDays || 1) * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0],
          duration_days: planToEnhance.durationDays || 1,
          destination: planToEnhance.title,
        },
        hotel: planToEnhance.hotel || null,
        optimized_routes: planToEnhance.optimized_routes || {},
        itinerary: planToEnhance.optimized_routes
          ? Object.fromEntries(
            Object.entries(planToEnhance.optimized_routes).map(
              ([day, route]) => [day, route.optimized_order || []]
            )
          )
          : {},
      };

      const requestBody = {
        plan_details: planDetails,
        query_en: messages.find((m) => m.role === "user")?.content || "",
        user_enhance: customInput,
        card_index: cardIndex,
      };

      console.log("Enhancement Request:", requestBody);

      const response = await fetch("http://127.0.0.1:8089/api/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Enhancement Response:", data);

      // Handle different response formats
      let enhancedPlan;
      if (data && Array.isArray(data) && data.length > 0) {
        // Response is an array
        enhancedPlan = data[0];
      } else if (data && typeof data === "object" && !Array.isArray(data)) {
        // Response is a single object
        enhancedPlan = data;
      } else {
        console.error("Unexpected response format:", data);
        throw new Error("Invalid response format");
      }

      console.log("Enhanced Plan Structure:", enhancedPlan);

      // Process the enhanced plan if we have valid data
      if (enhancedPlan) {
        // Update the specific card with enhanced data
        setRealItineraries((prev) => {
          const updated = [...prev];
          console.log("Updating card at index:", cardIndex);
          console.log("Previous itineraries:", prev);

          // Convert itinerary back to optimized_routes format
          const optimizedRoutes: Record<string, OptimizedRoute> = {};
          if (enhancedPlan.itinerary) {
            Object.entries(enhancedPlan.itinerary).forEach(
              ([day, spots]: [string, OptimizedSpot[]]) => {
                optimizedRoutes[day] = {
                  optimized_order: spots || [],
                  polyline: "",
                };
              }
            );
          } else if (enhancedPlan.optimized_routes) {
            // Handle case where response already has optimized_routes
            Object.assign(optimizedRoutes, enhancedPlan.optimized_routes);
          } else {
            // Keep existing routes if no new ones provided
            Object.assign(
              optimizedRoutes,
              planToEnhance.optimized_routes || {}
            );
          }

          // Map the enhanced plan to our Itinerary structure
          const days = Object.keys(optimizedRoutes);
          const durationDays =
            enhancedPlan.trip_details?.duration_days ||
            days.length ||
            planToEnhance.durationDays;

          const highlights = days.map((dayKey) => {
            const firstSpot = optimizedRoutes[dayKey]?.optimized_order?.[0];
            return firstSpot ? `${dayKey}: ${firstSpot.spot_name}` : dayKey;
          });

          const updatedCard = {
            title:
              enhancedPlan.trip_details?.itinerary_name || planToEnhance.title,
            duration: durationDays
              ? `${durationDays} Days`
              : `${days.length} Days`,
            durationDays: durationDays,
            budget: planToEnhance.budget || "Custom",
            short_desc:
              enhancedPlan.trip_details?.trip_name ||
              "Enhanced Custom Trip Plan",
            highlights:
              highlights.slice(0, 4) || planToEnhance.highlights || [],
            optimized_routes: optimizedRoutes,
            trip_details:
              enhancedPlan.trip_details || planToEnhance.trip_details,
            hotel: enhancedPlan.hotel || planToEnhance.hotel,
          };

          updated[cardIndex] = updatedCard;
          console.log("Updated card:", updatedCard);
          console.log("Updated itineraries:", updated);

          return updated;
        });

        // Force a re-render by updating a timestamp
        setTimeout(() => {
          console.log("Force re-render triggered");
        }, 100);

        // Add success message
        addAssistantMessage(
          `✨ Your plan "${planToEnhance.title}" has been enhanced with your preferences! Check the updated card above.`
        );

        console.log("Enhancement completed successfully");
      } else {
        console.error("No valid enhanced plan data received:", data);
        addAssistantMessage(
          `⚠️ Sorry, I couldn't enhance the plan. ${data.message || "Please try again."
          }`
        );
      }
    } catch (error) {
      console.error("Enhancement API Error:", error);
      addAssistantMessage(
        "⚠️ Connection error during enhancement. Please ensure Flask server is running on http://127.0.0.1:8089."
      );
    } finally {
      // Remove loading state for this card
      setEnhancingCards((prev) => {
        const updated = new Set(prev);
        updated.delete(cardIndex);
        return updated;
      });
    }
  };

  const handleEnhanceBusRoute = async (
    cardIndex: number,
    customInput: string
  ) => {
    if (!busResponse || !busResponse.routes) return;

    const routeToEnhance = busResponse.routes[cardIndex];
    if (!routeToEnhance) return;

    // Set loading state for this specific bus card
    setEnhancingBusCards((prev) => new Set([...prev, cardIndex]));

    try {
      const requestBody = {
        route_details: routeToEnhance,
        user_enhance: customInput,
        card_index: cardIndex,
      };

      console.log("Bus Enhancement Request:", requestBody);

      const response = await fetch("http://127.0.0.1:8089/api/enhance-bus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Bus Enhancement Response:", data);

      if (data && data.enhanced_bus_data) {
        // Update the bus response with enhanced data
        setBusResponse(data.enhanced_bus_data);

        // Add success message
        addAssistantMessage(
          `✨ Your bus route has been enhanced with your preferences!`
        );
      } else {
        addAssistantMessage(
          `⚠️ Sorry, I couldn't enhance the bus route. ${data.message || "Please try again."
          }`
        );
      }
    } catch (error) {
      console.error("Bus Enhancement API Error:", error);
      addAssistantMessage(
        "⚠️ Connection error during bus route enhancement. Please ensure Flask server is running on http://127.0.0.1:8089."
      );
    } finally {
      // Remove loading state for this card
      setEnhancingBusCards((prev) => {
        const updated = new Set(prev);
        updated.delete(cardIndex);
        return updated;
      });
    }
  };

  const handleEnhanceAccommodation = async (
    cardIndex: number,
    customInput: string
  ) => {
    const accommodationToEnhance = accommodations[cardIndex];

    if (!accommodationToEnhance) return;

    // Add to enhancing set
    setEnhancingAccommodationCards((prev) => new Set(prev).add(cardIndex));

    try {
      const enhancePrompt = `Find better hotel accommodations with these preferences: "${customInput}". 
      Current hotel: ${accommodationToEnhance.Name} at ${accommodationToEnhance.Address} 
      with rating ${accommodationToEnhance.Rating}. Please provide better alternatives.`;

      const response = await fetch("http://127.0.0.1:8089/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: enhancePrompt,
          conversation_id: currentConversationId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.response_type === "acomdation" && data.acomdation) {
          setAccommodations(data.acomdation);
          addAssistantMessage(
            `✨ Your accommodation options have been enhanced with your preferences!`
          );
        }
      }
    } catch (error) {
      console.error("Enhancement error:", error);
      addAssistantMessage(
        "⚠️ Connection error during accommodation enhancement. Please try again."
      );
    } finally {
      // Remove from enhancing set after delay
      setTimeout(() => {
        setEnhancingAccommodationCards((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cardIndex);
          return newSet;
        });
      }, 2000);
    }
  };

  const handleClearAllCards = () => {
    setRealItineraries([]);
    setShowItineraries(false);
    setFlightOptions([]);
    setShowBusRoutes(false);
    setBusResponse(null);
    setShowBusRoutes(false);
    setAccommodations([]);
    setShowAccommodations(false);
    addAssistantMessage(
      "✨ All cards have been cleared. You can start fresh with new queries!"
    );
  };

  const handleFinalizePlan = async (cardIndex: number, planData?: any) => {
    console.log("📤 Sending finalize payload:", cardIndex, planData);

    // Use planData if provided, otherwise fallback to realItineraries
    const finalizedPlan = planData || realItineraries[cardIndex];
    console.log("📋 Final Plan Data to send:", finalizedPlan);

    if (!finalizedPlan) {
      console.log("❌ No plan data available");
      addAssistantMessage(
        "❌ I couldn't find the plan details. Please try selecting a plan again."
      );
      return;
    }

    // Add initial AI message
    console.log("💬 Adding initial finalize message...");
    addAssistantMessage(
      `🎯 Great choice! I'm now finalizing your **${finalizedPlan.title}** itinerary. Let me process this for you...`
    );
    console.log("✅ Initial message added");

    try {
      console.log("🔄 Making API call to backend...");

      // Simulate processing delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Send plan details to backend API
      const response = await fetch("http://localhost:8089/api/finalize-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardIndex: cardIndex,
          planData: finalizedPlan,
          userInfo: {
            name: "Anish",
            timestamp: new Date().toISOString(),
            sessionId: currentConversationId || Date.now().toString(),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Plan finalized successfully:", data);

        // Note: Conversation storage disabled - messages are not saved

        // Add detailed success message
        console.log("💬 Adding success message...");
        addAssistantMessage(
          `✅ **Perfect! Your trip has been finalized successfully!**\n\n` +
          `📋 **Trip Summary:**\n` +
          `• **Destination:** ${finalizedPlan.title}\n` +
          `• **Duration:** ${finalizedPlan.totalDays || "N/A"} days\n` +
          `• **Budget:** ${finalizedPlan.budget || "Not specified"}\n\n` +
          `🎉 Your itinerary has been saved and is ready for booking!\n\n` +
          `**Next Steps:**\n` +
          `1. 🏨 Book accommodations\n` +
          `2. ✈️ Reserve flights\n` +
          `3. 🎫 Purchase activity tickets\n` +
          `4. 📱 Download offline maps\n\n` +
          `Would you like me to help you with any of these next steps?`
        );
        console.log("✅ Success message added");
        setShowSuccess(true);
      } else {
        console.error("❌ Failed to finalize plan:", data.error);
        addAssistantMessage(
          `❌ **Oops! Something went wrong.**\n\n` +
          `I encountered an issue while finalizing your plan: ${data.error}\n\n` +
          `Please try again, or let me know if you'd like to modify the itinerary first.`
        );
      }
    } catch (error) {
      console.error("❌ Network error while finalizing plan:", error);
      addAssistantMessage(
        `❌ **Connection Issue**\n\n` +
        `I'm having trouble connecting to the server right now. This could be due to:\n` +
        `• Network connectivity issues\n` +
        `• Server maintenance\n` +
        `• Temporary service disruption\n\n` +
        `Please check your internet connection and try again in a moment. Your plan is still saved locally! 💾`
      );
    }
  };

  const handleTrendingClick = (query: string) => {
    setInput(query);
    setTrendingScores((prev) => ({
      ...prev,
      [query]: (prev[query] || 0) + 1,
    }));
  };

  const handleFollowUpClick = (question: string) => {
    if (isLoading) return;
    setInput(question);
  };

  const handleLikePlan = (index: number, itinerary?: Itinerary) => {
    setLikedPlans((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );

    if (itinerary) {
      setLikedItineraries((prev) => {
        const exists = prev.some((item) => item.title === itinerary.title);
        if (exists) {
          return prev.filter((item) => item.title !== itinerary.title);
        } else {
          return [...prev, itinerary];
        }
      });
    }
  };

  const handleFinalize = async (cardIndex: number, planData: any) => {
    console.log("📤 Finalizing plan...", cardIndex, planData);

    // Add initial AI message
    addAssistantMessage(
      `🎯 Great choice! I'm now finalizing your ${planData.title || "trip"
      } itinerary. Let me process this for you...`
    );

    try {
      // Simulate processing delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Extract user messages for conversation history
      const userMessages = messages
        .filter((msg) => msg.role === "user")
        .map((msg) => msg.content);

      const response = await fetch("http://localhost:8089/api/finalize-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardIndex,
          planData,
          userInfo: {
            name: "Anish",
            timestamp: new Date().toISOString(),
            sessionId: currentConversationId || Date.now().toString(),
          },
          conversationHistory: userMessages,
          userQuery:
            userMessages.length > 0
              ? userMessages[userMessages.length - 1]
              : "",
        }),
      });

      const result = await response.json();
      console.log("🎉 Finalize Response:", result);

      if (result.success) {
        // Update follow-up questions if available
        if (
          result.follow_up_questions &&
          Array.isArray(result.follow_up_questions)
        ) {
          setFollowUpQuestions(result.follow_up_questions);
        }

        // Note: Conversation storage disabled - messages are not saved

        // Add detailed success message
        addAssistantMessage(
          `✅ Perfect! Your trip has been finalized successfully!\n\n` +
          `📋 Trip Summary:\n` +
          `• Destination: ${planData.title || "N/A"}\n` +
          `• Duration: ${planData.totalDays || planData.duration || "N/A"
          } days\n` +
          `• Budget: ${planData.budget || "Not specified"}\n\n` +
          `🎉 Your itinerary has been saved and is ready for booking!\n\n` +
          `Next Steps:\n` +
          `• 🏨 Book accommodations\n` +
          `• ✈️ Reserve flights\n` +
          `• 🎫 Purchase activity tickets\n` +
          `• 📱 Download offline maps\n\n` +
          `Would you like me to help you with any of these next steps?`
        );
        setShowSuccess(true);
      } else {
        addAssistantMessage(
          `❌ **Oops! Something went wrong.**\n\n` +
          `I encountered an issue while finalizing your plan: ${result.error || "Unknown error"
          }\n\n` +
          `Please try again, or let me know if you'd like to modify the itinerary first.`
        );
      }
    } catch (error) {
      console.error("❌ Network error while finalizing plan:", error);
      addAssistantMessage(
        `❌ **Connection Issue**\n\n` +
        `I'm having trouble connecting to the server right now. This could be due to:\n` +
        `• Network connectivity issues\n` +
        `• Server maintenance\n` +
        `• Temporary service disruption\n\n` +
        `Please check your internet connection and try again in a moment. Your plan is still saved locally! 💾`
      );
    }
  };

  const handleComparePlan = (index: number, itinerary?: Itinerary) => {
    setComparePlans((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else if (prev.length < 2) {
        return [...prev, index];
      }
      return prev;
    });

    if (itinerary) {
      setCompareItineraries((prev) => {
        const exists = prev.some((item) => item.title === itinerary.title);
        if (exists) {
          return prev.filter((item) => item.title !== itinerary.title);
        } else if (prev.length < 2) {
          return [...prev, itinerary];
        }
        return prev;
      });
    }
  };

  const handleEnhanceItinerary = async (
    cardIndex: number,
    customInput: string
  ) => {
    // Add card to enhancing set to show loading state
    setEnhancingCards((prev) => new Set(prev).add(cardIndex));

    try {
      // Find the itinerary data from messages
      let itineraryToEnhance = null;
      let messageIndex = -1;

      // Search through messages to find the itinerary
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (
          message.cards?.type === "itinerary" &&
          message.cards.data[cardIndex]
        ) {
          itineraryToEnhance = message.cards.data[cardIndex];
          messageIndex = i;
          break;
        }
      }

      if (!itineraryToEnhance) {
        console.error("Itinerary not found for enhancement");
        return;
      }

      const requestBody = {
        plan_details: itineraryToEnhance,
        query_en: input || "Enhance this itinerary", // Use current input or default
        user_enhance: customInput,
        card_index: cardIndex,
      };

      console.log("Itinerary Enhancement Request:", requestBody);

      const response = await fetch("http://127.0.0.1:8089/api/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Itinerary Enhancement Response:", data);

      if (data && Array.isArray(data) && data.length > 0) {
        // Extract the enhanced plan from the array response
        const enhancedPlan = data[0];
        const responseCardIndex = enhancedPlan.card_index;

        // Transform the backend itinerary to optimized_routes format
        const transformedOptimizedRoutes = {};
        if (enhancedPlan.itinerary) {
          Object.keys(enhancedPlan.itinerary).forEach((dayKey) => {
            const daySpots = enhancedPlan.itinerary[dayKey];
            transformedOptimizedRoutes[dayKey] = {
              optimized_order: daySpots.map((spot) => ({
                spot_name: spot.spot_name,
                lat: parseFloat(spot.lat),
                lng: parseFloat(spot.long),
                description: spot.description,
                estimated_time_spent: spot.estimated_time_spent,
                weather: spot.weather,
              })),
            };
          });
        }

        // Transform the backend response to match our itinerary format
        const transformedItinerary = {
          title:
            enhancedPlan.trip_details?.itinerary_name ||
            enhancedPlan.trip_details?.trip_name ||
            itineraryToEnhance.title,
          durationDays:
            enhancedPlan.trip_details?.duration_days ||
            itineraryToEnhance.durationDays,
          budget: itineraryToEnhance.budget || "Custom",
          short_desc: `Enhanced ${enhancedPlan.trip_details?.destination || "trip"
            } experience`,
          highlights: itineraryToEnhance.highlights || [],
          trip_details: enhancedPlan.trip_details,
          hotel: enhancedPlan.hotel,
          optimized_routes: transformedOptimizedRoutes,
          itinerary: enhancedPlan.itinerary,
        };

        // Update the specific message with enhanced itinerary using the card_index from response
        setMessages((prev) => {
          const newMessages = [...prev];
          if (messageIndex >= 0 && newMessages[messageIndex].cards) {
            const updatedCards = { ...newMessages[messageIndex].cards };
            updatedCards.data = [...updatedCards.data];
            // Use the card_index from the response to update the correct card
            updatedCards.data[responseCardIndex] = transformedItinerary;
            newMessages[messageIndex] = {
              ...newMessages[messageIndex],
              cards: updatedCards,
            };
          }
          return newMessages;
        });

        addAssistantMessage(
          `✨ Your itinerary "${transformedItinerary.title}" has been enhanced with your preferences!`
        );
      } else {
        addAssistantMessage(
          `⚠️ Sorry, I couldn't enhance the itinerary. ${data?.message || "Please try again."
          }`
        );
      }
    } catch (error) {
      console.error("Itinerary Enhancement API Error:", error);
      addAssistantMessage(
        "⚠️ Connection error during itinerary enhancement. Please ensure Flask server is running on http://127.0.0.1:8089."
      );
    } finally {
      // Remove from enhancing set after delay to show completion
      setTimeout(() => {
        setEnhancingCards((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cardIndex);
          return newSet;
        });
      }, 2000);
    }
  };

  const openMapView = () => {
    window.open("/map", "_blank");
  };

  // Handler to load a conversation from history
  const loadConversation = async (conversationId: string) => {
    try {
      console.log("Loading conversation:", conversationId);

      // Fetch messages for this conversation from MongoDB
      const response = await fetch(
        `http://localhost:8089/api/conversations/${conversationId}/messages`
      );
      const data = await response.json();

      if (data.success && data.messages) {
        // Transform MongoDB messages to match local format
        const transformedMessages: Message[] = data.messages.map(
          (msg: any) => ({
            id: msg._id || msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp).getTime(),
            cards: msg.metadata?.cards || msg.cards,
          })
        );

        console.log("Loaded messages:", transformedMessages.length);
        setMessages(transformedMessages);
        setCurrentConversationId(conversationId);

        // Restore cards from messages if they exist
        const lastMessageWithCards = [...transformedMessages]
          .reverse()
          .find(msg => msg.cards);

        if (lastMessageWithCards?.cards) {
          const { type, data: cardData } = lastMessageWithCards.cards;

          switch (type) {
            case 'itinerary':
              setRealItineraries(cardData);
              setShowItineraries(true);
              break;
            case 'flight':
              setFlightOptions(cardData);
              setShowFlights(true);
              break;
            case 'bus':
              setBusResponse({ routes: cardData } as any);
              setShowBusRoutes(true);
              break;
            case 'accommodation':
              setAccommodations(cardData);
              setShowAccommodations(true);
              break;
          }
        }

        // Close sidebar after loading
        setIsSidebarOpen(false);

        console.log("Conversation loaded successfully");
      } else {
        console.warn("No messages found for conversation");
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      // Show user-friendly error
      alert("Failed to load conversation. Please try again.");
    }
  };

  // Handler to start a new conversation
  const handleNewChat = () => {
    // Clear all messages
    setMessages([]);
    // Reset conversation ID - backend will generate a new one on next message
    setCurrentConversationId(null);
    // Clear any displayed cards
    setShowItineraries(false);
    setShowFlights(false);
    setShowBusRoutes(false);
    setShowAccommodations(false);
    setRealItineraries([]);
    setFlightOptions([]);
    setBusResponse(null);
    setAccommodations([]);
    // Close sidebar if open
    setIsSidebarOpen(false);
    console.log("Started new conversation - conversation_id reset");
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 relative overflow-hidden">
        {/* Hamburger Menu Button - Hidden, using collapsed sidebar instead */}

        {/* Mobile Sidebar Backdrop */}
        <div
          className={`lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ease-in-out ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Collapsed Sidebar - Icon Strip (ChatGPT Style) */}
        {!isSidebarOpen && (
          <div className="absolute left-0 top-16 bottom-0 w-16 bg-[#f5f8ff] border-r border-[#e0e9ff] z-40 flex flex-col items-center py-4 gap-1 shadow-[4px_0_18px_rgba(79,141,255,0.08)]">
            {/* Hamburger Menu Icon */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-12 h-12 rounded-lg hover:bg-white flex items-center justify-center transition-colors group mb-2 border border-transparent hover:border-[#d7e3ff]"
              title="Open Sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
            </button>

            {/* Divider */}
            <div className="w-10 h-px bg-[#d7e3ff] my-1"></div>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-12 h-12 rounded-lg hover:bg-white flex items-center justify-center transition-colors group border border-transparent hover:border-[#d7e3ff]"
              title="New Chat"
            >
              <PlusSquare className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
            </button>

            {/* Chat History Icon */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-12 h-12 rounded-lg hover:bg-white flex items-center justify-center transition-colors group border border-transparent hover:border-[#d7e3ff]"
              title="Chat History"
            >
              <MessageSquare className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
            </button>

            {/* Like Icon */}
            <button
              onClick={() => setShowLikedPopup(true)}
              className="w-12 h-12 rounded-lg hover:bg-[#3a3a3a] flex items-center justify-center transition-colors group"
              title="Liked Plans"
            >
              <Heart
                className={`w-5 h-5 ${likedItineraries.length > 0
                  ? "text-red-500 fill-red-500"
                  : "text-gray-500 group-hover:text-gray-900"
                  }`}
              />
            </button>

            {/* Compare Icon */}
            <button
              onClick={() => setShowComparePopup(true)}
              className="w-12 h-12 rounded-lg hover:bg-[#3a3a3a] flex items-center justify-center transition-colors group"
              title="Compare Plans"
            >
              <Scale
                className={`w-5 h-5 ${compareItineraries.length > 0
                  ? "text-blue-500"
                  : "text-gray-500 group-hover:text-gray-900"
                  }`}
              />
            </button>
          </div>
        )}

        {/* Left Sidebar - Expanded */}
        <div
          className={`absolute left-0 top-16 bottom-0 w-80 bg-[#f9fbff] border-r border-[#e0e9ff] shadow-[0_20px_50px_rgba(79,141,255,0.12)] transition-transform duration-300 ease-in-out z-40 flex flex-col overflow-hidden text-gray-800 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          {/* Logo Header */}
          <div className="p-6 border-b border-[#e0e9ff] bg-gradient-to-r from-white via-[#eef4ff] to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-[0_10px_25px_rgba(79,141,255,0.18)] border border-[#d7e3ff]">
                  <svg
                    className="w-6 h-6 text-[#4f8dff]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Trip Planner
                  </h2>
                  <p className="text-xs text-gray-500">AI Travel Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center transition-colors border border-transparent hover:border-[#d7e3ff]"
                title="Close Sidebar"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Chat History Section */}
            <div className="p-2 border-b border-[#e0e9ff] flex flex-col gap-3 h-full">
              {/* Action Buttons Row */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLikedPopup(true)}
                  className="flex-1 p-3 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-[#d7e3ff]"
                  title="Liked Plans"
                >
                  <Heart
                    className={`w-5 h-5 ${likedItineraries.length > 0
                      ? "text-red-500 fill-red-500"
                      : "text-gray-600"
                      }`}
                  />
                  {isSidebarOpen && (
                    <span className="text-xs font-medium text-gray-600">
                      Liked
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowComparePopup(true)}
                  disabled={compareItineraries.length === 0}
                  className="flex-1 p-3 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-[#d7e3ff] disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Compare Plans"
                >
                  <Scale
                    className={`w-5 h-5 ${compareItineraries.length > 0
                      ? "text-blue-500"
                      : "text-gray-600"
                      }`}
                  />
                  {isSidebarOpen && (
                    <span className="text-xs font-medium text-gray-600">
                      Compare
                    </span>
                  )}
                </button>
              </div>

              {/* New Chat Button */}
              <button
                onClick={() => {
                  setMessages([]);
                  setShowItineraries(false);
                  setInput("");
                }}
                className="w-full p-3 rounded-xl transition-colors flex items-center justify-center gap-2 group bg-white border border-[#d7e3ff] shadow-[0_8px_20px_rgba(79,141,255,0.1)] hover:bg-[#f3f7ff]"
                title="New Chat"
              >
                <MessageSquare className="w-5 h-5 text-[#4f8dff]" />
                {isSidebarOpen && (
                  <span className="text-sm text-purple-400 font-medium">
                    New Chat
                  </span>
                )}
              </button>

              {/* Chat History List */}
              {conversations.length > 0 && isSidebarOpen && (
                <div className="space-y-1 flex-1 overflow-y-auto pr-1 pb-2">
                  {conversations.slice(0, 20).map((conv) => (
                    <button
                      key={conv.id}
                      className="w-full text-left px-3 py-2 rounded-xl border border-transparent hover:border-[#d7e3ff] hover:bg-white transition-colors text-xs truncate text-gray-700"
                      onClick={() => loadConversation(conv.id)}
                      title={conv.title}
                    >
                      {conv.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div
          onClick={() => {
            if (window.innerWidth >= 1024 && isSidebarOpen) {
              setIsSidebarOpen(false);
            }
          }}
          style={{
            marginLeft:
              window.innerWidth >= 1024
                ? isSidebarOpen
                  ? "320px"
                  : "64px"
                : "0",
          }}
          className="h-full flex flex-col transition-all duration-300 ease-in-out"
        >
          <div className="flex-1 overflow-y-auto p-6 pt-20 min-h-0">
            <div className="w-full max-w-7xl mx-auto px-4">
              {messages.length === 0 ? (
                /* Sample Questions - Only show when chat is empty */
                <div className="flex flex-col items-center justify-center w-full px-4 min-h-[calc(100vh-16rem)]">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                      How can I help you today?
                    </h2>
                    <p className="text-muted-foreground">
                      Start planning your next adventure
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        handleSendMessage(
                          "Book me a trip to Dubai for 2 days on 26 Dec"
                        )
                      }
                      className="p-6 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 rounded-2xl border-2 border-orange-200/60 hover:border-orange-300 transition-all duration-300 text-left group shadow-lg hover:shadow-xl hover:shadow-orange-200/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Plane className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-orange-700 mb-2 group-hover:text-orange-800">
                            Dubai Weekend Getaway
                          </h3>
                          <p className="text-sm text-orange-600/80 mb-3">
                            Book me a trip to Dubai for 2 days on 26 Dec
                          </p>
                          <div className="flex items-center gap-2 text-xs text-orange-600">
                            <span className="bg-orange-100 px-2 py-1 rounded-full font-medium">
                              2 Days
                            </span>
                            <span className="bg-amber-100 px-2 py-1 rounded-full font-medium">
                              Dec 26
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        handleSendMessage(
                          "Give me 4 days holiday plan for Kerala on 1st week of Jan"
                        )
                      }
                      className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 rounded-2xl border-2 border-green-200/60 hover:border-green-300 transition-all duration-300 text-left group shadow-lg hover:shadow-xl hover:shadow-green-200/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-700 mb-2 group-hover:text-green-800">
                            Kerala Backwaters
                          </h3>
                          <p className="text-sm text-green-600/80 mb-3">
                            Give me 4 days holiday plan for Kerala on 1st week
                            of Jan
                          </p>
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <span className="bg-green-100 px-2 py-1 rounded-full font-medium">
                              4 Days
                            </span>
                            <span className="bg-emerald-100 px-2 py-1 rounded-full font-medium">
                              Jan Week 1
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        handleSendMessage(
                          "Generate trip plan for 8 days to Pattaya"
                        )
                      }
                      className="p-6 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 rounded-2xl border-2 border-cyan-200/60 hover:border-cyan-300 transition-all duration-300 text-left group shadow-lg hover:shadow-xl hover:shadow-cyan-200/50 md:col-span-2 lg:col-span-1"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Hotel className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-cyan-700 mb-2 group-hover:text-cyan-800">
                            Pattaya Beach Holiday
                          </h3>
                          <p className="text-sm text-cyan-600/80 mb-3">
                            Generate trip plan for 8 days to Pattaya
                          </p>
                          <div className="flex items-center gap-2 text-xs text-cyan-600">
                            <span className="bg-cyan-100 px-2 py-1 rounded-full font-medium">
                              8 Days
                            </span>
                            <span className="bg-blue-100 px-2 py-1 rounded-full font-medium">
                              Beach
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Or type your own travel question below 👇
                    </p>
                  </div>
                </div>
              ) : (
                /* Regular Messages */
                messages.map((message) => {
                  // Extract user messages for conversation history
                  const userMessages = messages
                    .filter((msg) => msg.role === "user")
                    .map((msg) => msg.content);

                  return (
                    <ChatMessage
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      cards={message.cards}
                      onLike={handleLikePlan}
                      onCompare={handleComparePlan}
                      onViewDetails={async (index, itinerary) => {
                        console.log("🔍 View Details clicked - Index:", index);
                        console.log("🔍 Itinerary data:", itinerary);

                        const dataToUse = realItineraries[index] || itinerary;
                        console.log("🔍 Data to use:", dataToUse);

                        setSelectedItinerary(index);

                        // Show loading state
                        setShowDetailSheet(true);
                        setSelectedItineraryData(null);

                        try {
                          console.log("🚀 Calling summarize API...");

                          // Call summarize API
                          const response = await fetch(
                            "http://localhost:8089/api/summarize-plan",
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify(dataToUse),
                            }
                          );

                          console.log(
                            "📡 API Response status:",
                            response.status
                          );

                          const result = await response.json();
                          console.log("✅ Summarize API Response:", result);

                          if (result.success && result.response) {
                            // Parse the JSON response from LLM
                            let summarizedData;
                            try {
                              // Clean the response - remove ```json``` wrapper if present
                              let cleanedResponse = result.response.trim();

                              // Remove ```json and ``` markers
                              if (cleanedResponse.startsWith("```json")) {
                                cleanedResponse = cleanedResponse.replace(
                                  /^```json\s*/,
                                  ""
                                );
                              }
                              if (cleanedResponse.startsWith("```")) {
                                cleanedResponse = cleanedResponse.replace(
                                  /^```\s*/,
                                  ""
                                );
                              }
                              if (cleanedResponse.endsWith("```")) {
                                cleanedResponse = cleanedResponse.replace(
                                  /\s*```$/,
                                  ""
                                );
                              }

                              console.log(
                                "🧹 Cleaned response:",
                                cleanedResponse
                              );

                              // Parse the cleaned JSON
                              summarizedData = JSON.parse(cleanedResponse);
                              console.log(
                                "✅ Parsed summarized data:",
                                summarizedData
                              );
                            } catch (e) {
                              console.error(
                                "❌ Failed to parse LLM response:",
                                e
                              );
                              console.error("Raw response:", result.response);
                              summarizedData = dataToUse;
                            }

                            // Merge summarized data with original data
                            const enhancedData = {
                              ...dataToUse,
                              summarized: summarizedData,
                            };

                            setSelectedItineraryData(enhancedData);
                          } else {
                            // Fallback to original data
                            setSelectedItineraryData(dataToUse);
                          }
                        } catch (error) {
                          console.error(
                            "❌ Error calling summarize API:",
                            error
                          );
                          // Fallback to original data
                          setSelectedItineraryData(dataToUse);
                        }
                      }}
                      onViewJourneyFlow={(index, itinerary) => {
                        const dataToUse =
                          message.cards?.data || realItineraries;
                        if (dataToUse && dataToUse.length > 0) {
                          setMapViewItineraries(dataToUse);
                          setShowMapView(true);
                        }
                      }}
                      onEnhance={(index, customInput) => {
                        handleEnhanceItinerary(index, customInput);
                      }}
                      onFinalize={handleFinalize}
                      likedPlans={likedPlans}
                      comparePlans={comparePlans}
                      enhancingCards={enhancingCards}
                      conversationHistory={userMessages}
                    />
                  );
                })
              )}

              {/* Loading indicator as a message */}
              {isLoading && (
                <ChatMessage
                  role="assistant"
                  content={
                    loadingStep === -1
                      ? "Processing your request..."
                      : loadingStep === 0
                        ? "Analyzing your travel preferences..."
                        : loadingStep === 1
                          ? "Searching for the best destinations..."
                          : loadingStep === 2
                            ? "Finding top-rated accommodations..."
                            : loadingStep === 3
                              ? "Checking flight availability..."
                              : loadingStep === 4
                                ? "Optimizing your itinerary routes..."
                                : loadingStep === 5
                                  ? "Calculating budget estimates..."
                                  : loadingStep === 6
                                    ? "Thinking..."
                                    : loadingStep === 7
                                      ? `Finalizing your perfect trip${".".repeat(dotCount)}`
                                      : "Processing..."
                  }
                  isLoading={true}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Follow-up Questions with placeholders and animated reveal */}
          {(followUpLoading || followUpQuestions.length > 0) && (
            <div className="px-4 py-3 border-t border-border bg-background/50">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {(followUpLoading ? defaultFollowUps : followUpQuestions).map(
                  (question, index) => (
                    <motion.button
                      key={`${followUpLoading ? 'placeholder' : 'real'}-${index}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      onClick={() => {
                        setInput(question);
                        handleSendMessage(question);
                      }}
                      className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 rounded-full transition-all duration-200 hover:shadow-md text-gray-700 whitespace-nowrap flex-shrink-0"
                    >
                      {question}
                    </motion.button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-3 p-4 border-t border-border bg-background">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const wordCount = newValue
                    .split(/\s+/)
                    .filter((word) => word.length > 0).length;
                  if (wordCount <= 1200) {
                    setInput(newValue);
                  }
                }}
                placeholder={
                  isLoading
                    ? "Processing your request..."
                    : "Ask me anything about your travel plans..."
                }
                className="flex-1 min-h-[80px] max-h-[200px] resize-none rounded-xl border-2 focus:border-primary pr-20"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <span className="text-xs text-muted-foreground">
                  {input.split(/\s+/).filter((w) => w.length > 0).length}/1200
                </span>
              </div>
            </div>
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              className="h-[80px] px-6 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Liked Plans Popup */}
        {showLikedPopup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
                <h2 className="text-2xl font-bold">❤️ Liked Plans</h2>
                <button
                  onClick={() => setShowLikedPopup(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {likedItineraries.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No liked plans yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {likedItineraries.map((itinerary, index) => (
                      <div
                        key={index}
                        className="p-4 border border-border rounded-xl hover:border-primary transition-colors"
                      >
                        <h3 className="font-semibold text-lg mb-2">
                          {itinerary.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {itinerary.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>⏱️ {itinerary.totalDays} days</span>
                          <span>💰 {itinerary.budget}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compare Plans Popup */}
        {showComparePopup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl max-w-6xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
                <h2 className="text-2xl font-bold">⚖️ Compare Plans</h2>
                <button
                  onClick={() => setShowComparePopup(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {compareItineraries.length === 0 ? (
                  <div className="text-center py-12">
                    <Scale className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No plans selected for comparison
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Select up to 2 plans to compare
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {compareItineraries.map((itinerary, index) => (
                      <div
                        key={index}
                        className="p-6 border-2 border-primary rounded-xl bg-gradient-to-br from-white to-gray-50"
                      >
                        <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          {itinerary.title}
                        </h3>
                        <p className="text-muted-foreground mb-4 text-sm">
                          {itinerary.short_desc || "No description available"}
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                            <span className="font-semibold text-blue-700">
                              📅 Duration:
                            </span>
                            <span className="text-gray-700">
                              {itinerary.durationDays ||
                                itinerary.duration ||
                                "N/A"}{" "}
                              days
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                            <span className="font-semibold text-green-700">
                              💰 Budget:
                            </span>
                            <span className="text-gray-700">
                              {itinerary.budget || "Custom"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                            <span className="font-semibold text-purple-700">
                              📍 Destination:
                            </span>
                            <span className="text-gray-700">
                              {itinerary.trip_details?.destination || "N/A"}
                            </span>
                          </div>
                          {itinerary.highlights &&
                            itinerary.highlights.length > 0 && (
                              <div className="mt-4">
                                <span className="font-semibold text-gray-700 block mb-2">
                                  ✨ Highlights:
                                </span>
                                <ul className="space-y-1">
                                  {itinerary.highlights
                                    .slice(0, 3)
                                    .map((highlight, idx) => (
                                      <li
                                        key={idx}
                                        className="text-sm text-gray-600 flex items-start gap-2"
                                      >
                                        <span className="text-primary">•</span>
                                        {highlight}
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Itinerary Detail Sheet */}
        {showDetailSheet && (
          <ItineraryDetailSheet
            isOpen={showDetailSheet}
            onClose={() => {
              setShowDetailSheet(false);
              setSelectedItineraryData(null);
            }}
            title={selectedItineraryData?.title}
            days={
              selectedItineraryData?.totalDays ||
              selectedItineraryData?.durationDays
            }
            budget={selectedItineraryData?.budget}
            trip_details={selectedItineraryData?.trip_details}
            hotel={selectedItineraryData?.hotel}
            optimized_routes={selectedItineraryData?.optimized_routes}
            summarized={selectedItineraryData?.summarized}
          />
        )}

        {/* Animated Map View */}
        {showMapView && mapViewItineraries.length > 0 && (
          <AnimatedMapView
            itineraries={mapViewItineraries}
            isOpen={showMapView}
            onClose={() => {
              setShowMapView(false);
              setMapViewItineraries([]);
            }}
          />
        )}

        {/* Success Modal */}
        {showSuccess && (
          <SuccessModal
            isOpen={showSuccess}
            onClose={() => setShowSuccess(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage;
