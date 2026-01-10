import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Search, Calendar, Users, MapPin, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HotelsPage = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    location: "",
    checkIn: "",
    checkOut: "",
    guests: "2",
  });

  const handleSearch = () => {
    // Navigate to chat page with hotel search query
    const query = `Find hotels in ${searchData.location} from ${searchData.checkIn} to ${searchData.checkOut} for ${searchData.guests} guests`;
    navigate(`/chat?query=${encodeURIComponent(query)}`);
  };

  const popularDestinations = [
    { name: "Goa", hotels: "500+", rating: 4.5, image: "🏖️" },
    { name: "Dubai", hotels: "800+", rating: 4.7, image: "🏙️" },
    { name: "Jaipur", hotels: "300+", rating: 4.4, image: "🏰" },
    { name: "Kerala", hotels: "400+", rating: 4.6, image: "🌴" },
    { name: "Manali", hotels: "250+", rating: 4.3, image: "🏔️" },
    { name: "Udaipur", hotels: "200+", rating: 4.5, image: "🏛️" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Find Your Perfect Stay
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover and book hotels, resorts, and accommodations worldwide. Comfort meets convenience.
            </p>
          </motion.div>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl shadow-xl p-8 mb-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Location */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Where are you going?"
                    value={searchData.location}
                    onChange={(e) => setSearchData({ ...searchData, location: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Check-in Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Check-in</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="date"
                    value={searchData.checkIn}
                    onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Check-out Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Check-out</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="date"
                    value={searchData.checkOut}
                    onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium mb-2">Guests</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <select
                    value={searchData.guests}
                    onChange={(e) => setSearchData({ ...searchData, guests: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={!searchData.location || !searchData.checkIn || !searchData.checkOut}
              className="w-full md:w-auto px-8 py-6 text-lg rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Hotels
            </Button>
          </motion.div>

          {/* Popular Destinations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-6">Popular Destinations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularDestinations.map((destination, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => {
                    setSearchData({
                      ...searchData,
                      location: destination.name,
                    });
                  }}
                  className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border-2 border-purple-200/50 hover:border-purple-300 transition-all text-left"
                >
                  <div className="text-4xl mb-3">{destination.image}</div>
                  <h3 className="font-bold text-xl mb-2">{destination.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{destination.rating}</span>
                    <span className="text-sm text-muted-foreground">• {destination.hotels} hotels</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="p-6 bg-card border border-border rounded-xl text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Best Price Guarantee</h3>
              <p className="text-sm text-muted-foreground">
                Find the lowest prices on hotels
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-xl text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Verified Reviews</h3>
              <p className="text-sm text-muted-foreground">
                Read genuine guest reviews
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-xl text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Free Cancellation</h3>
              <p className="text-sm text-muted-foreground">
                Cancel anytime with full refund
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HotelsPage;
