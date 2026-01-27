import { motion, AnimatePresence } from "framer-motion";
import {
  Hotel,
  MapPin,
  Star,
  ExternalLink,
  Bookmark,
  Globe,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import HotelPayment from "@/components/HotelPayment";

interface Accommodation {
  Name: string;
  Address: string;
  Rating: number;
  Website: string;
  "Google Maps Link": string;
}

interface AccommodationCardProps {
  accommodation: Accommodation;
  index: number;
  total: number;
  isEnhancing?: boolean;
  conversationHistory?: string[];
}

const AccommodationCard = ({
  accommodation,
  index,
  total,
  isEnhancing = false,
  conversationHistory = [],
}: AccommodationCardProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Unified modern gradient color sets
  const bgColors = [
    "bg-gradient-to-br from-purple-50 via-pink-50 to-rose-100",
    "bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-100",
    "bg-gradient-to-br from-amber-50 via-orange-50 to-pink-100",
    "bg-gradient-to-br from-indigo-50 via-purple-50 to-fuchsia-100",
  ];

  const accentColors = [
    "text-purple-600",
    "text-blue-600",
    "text-amber-600",
    "text-indigo-600",
  ];

  const borderColors = [
    "border-purple-200/50",
    "border-blue-200/50",
    "border-amber-200/50",
    "border-indigo-200/50",
  ];

  const shadowColors = [
    "hover:shadow-purple-200/50",
    "hover:shadow-blue-200/50",
    "hover:shadow-amber-200/50",
    "hover:shadow-indigo-200/50",
  ];

  const bgColor = bgColors[index % bgColors.length];
  const accentColor = accentColors[index % accentColors.length];
  const borderColor = borderColors[index % borderColors.length];
  const shadowColor = shadowColors[index % shadowColors.length];

  const handleViewOnMap = () => {
    if (accommodation["Google Maps Link"]) {
      window.open(accommodation["Google Maps Link"], "_blank");
    }
  };

  const handleVisitWebsite = () => {
    if (accommodation.Website) {
      window.open(accommodation.Website, "_blank");
    }
  };

  const handleBookNow = async () => {
    try {
      const hotelPayload = {
        cardIndex: index,
        planData: {
          type: "hotel",
          title: `Hotel: ${accommodation.Name}`,
          hotel: {
            name: accommodation.Name,
            address: accommodation.Address,
            rating: accommodation.Rating,
            website: accommodation.Website,
            google_maps_link: accommodation["Google Maps Link"],
          },
        },
        userInfo: {
          name: "User",
          timestamp: new Date().toISOString(),
        },
        conversationHistory: conversationHistory,
        userQuery:
          conversationHistory.length > 0
            ? conversationHistory[conversationHistory.length - 1]
            : "",
      };

      console.log("Sending hotel data to API:", hotelPayload);

      // Send hotel data to finalize API
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8089'}/api/finalize-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(hotelPayload),
      });

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Hotel booking finalized:", result);

      if (result.success) {
        // Update follow-up questions if available
        if (
          result.follow_up_questions &&
          Array.isArray(result.follow_up_questions)
        ) {
          window.dispatchEvent(
            new CustomEvent("updateFollowUpQuestions", {
              detail: result.follow_up_questions,
            })
          );
        }

        // Show payment modal after successful API call
        setShowPayment(true);
      } else {
        console.error("API returned error:", result);
        alert("Failed to finalize hotel booking. Please try again.");
      }
    } catch (error) {
      console.error("Error finalizing hotel booking:", error);
      alert("Error booking hotel. Please try again.");
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    if (onBook) {
      onBook();
    }
  };

  // Render star rating
  const renderStars = () => {
    const rating = accommodation.Rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "text-gray-300"
              }`}
          />
        ))}
        <span className="text-sm font-semibold ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Convert accommodation data to hotel format for payment
  const hotelData = {
    id: index + 1,
    name: accommodation.Name,
    rating: accommodation.Rating,
    address: accommodation.Address,
    price: 2500, // Default price, can be made dynamic
    image: "", // Default empty, can be added later
    amenities: ["WiFi", "Breakfast", "Parking"],
    website: accommodation.Website,
    mapLink: accommodation["Google Maps Link"],
    description: `Beautiful accommodation in ${accommodation.Address}`,
    reviews: Math.floor(accommodation.Rating * 100),
  };

  const searchData = {
    city: accommodation.Address.split(",")[0] || "City",
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    guests: "2",
    rooms: "1",
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{
          opacity: isEnhancing ? [1, 0.6, 1] : 1,
          x: 0,
        }}
        transition={{
          delay: index * 0.1,
          opacity: isEnhancing
            ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }
            : {},
        }}
        className="flex-shrink-0 w-[320px] h-[400px]"
      >
        <div className="space-y-3">
          <Card
            className={`${bgColor} ${borderColor} ${shadowColor} border-2 hover:shadow-2xl transition-all duration-300 p-4 sm:p-5 relative h-full flex flex-col rounded-2xl overflow-hidden ${isEnhancing
                ? "ring-4 ring-primary ring-offset-2 animate-pulse"
                : ""
              }`}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/30 rounded-full blur-3xl -z-0" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -z-0" />
            {/* Bookmark removed as requested */}

            {/* Hotel Icon & Name */}
            <div className="flex items-start gap-3 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center flex-shrink-0 border border-white/50">
                <Hotel className={`w-6 h-6 ${accentColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg leading-tight mb-1 h-12 flex items-start">
                  <span className="line-clamp-2">{accommodation.Name}</span>
                </div>
                {renderStars()}
              </div>
            </div>

            {/* Address */}
            <div className="mb-4 relative z-10">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground line-clamp-2 overflow-hidden h-10">
                  {accommodation.Address}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-white/50 pt-3 space-y-2 mt-auto relative z-10">
              <Button
                size="sm"
                variant="outline"
                className="w-full rounded-xl text-xs bg-white/60 backdrop-blur-sm border-white/50 hover:bg-white/80 hover:border-white/70 transition-all duration-200 shadow-sm"
                onClick={handleViewOnMap}
                disabled={!accommodation["Google Maps Link"]}
              >
                <MapPin className="w-3 h-3 mr-1" />
                View on Google Maps
              </Button>

              <Button
                size="sm"
                className="w-full rounded-xl text-xs bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-600 hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                onClick={handleVisitWebsite}
                disabled={!accommodation.Website}
              >
                <Globe className="w-3 h-3 mr-1" />
                Visit Website
              </Button>

              {/* Book Now Button */}
              <div className="flex justify-center pt-2">
                <Button
                  size="sm"
                  className="rounded-full px-6 bg-primary hover:bg-primary/90"
                  onClick={handleBookNow}
                >
                  Book Now
                </Button>
              </div>
            </div>

            {/* Card Index */}
            {/* <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            {index + 1}/{total}
          </div>
        </div> */}
          </Card>

          {/* Loading State */}
          <AnimatePresence>
            {isEnhancing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-xl border-2 border-primary/30"
              >
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">
                  Finding better options...
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPayment(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={() => setShowPayment(false)}
              >
                <X className="w-4 h-4" />
              </Button>
              <HotelPayment
                selectedHotel={hotelData}
                searchData={searchData}
                onBack={() => setShowPayment(false)}
                onPaymentSuccess={handlePaymentSuccess}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccommodationCard;
