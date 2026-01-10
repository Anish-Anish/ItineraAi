import { useState } from "react";
import { motion } from "framer-motion";
import { Plane, Search, Calendar, Users, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FlightsPage = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    from: "",
    to: "",
    departure: "",
    passengers: "1",
    class: "economy",
  });

  const handleSearch = () => {
    // Navigate to chat page with flight search query
    const query = `Find flights from ${searchData.from} to ${searchData.to} on ${searchData.departure} for ${searchData.passengers} passenger(s) in ${searchData.class} class`;
    navigate(`/chat?query=${encodeURIComponent(query)}`);
  };

  const popularRoutes = [
    { from: "Delhi", to: "Mumbai", price: "₹3,899" },
    { from: "Bangalore", to: "Goa", price: "₹4,299" },
    { from: "Mumbai", to: "Dubai", price: "₹12,999" },
    { from: "Delhi", to: "Singapore", price: "₹15,499" },
    { from: "Chennai", to: "Bangalore", price: "₹2,999" },
    { from: "Kolkata", to: "Delhi", price: "₹4,599" },
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
              <Plane className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Find Your Perfect Flight
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Search and compare flights from multiple airlines. Get the best deals for your journey.
            </p>
          </motion.div>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl shadow-xl p-8 mb-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* From */}
              <div>
                <label className="block text-sm font-medium mb-2">From</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Delhi"
                    value={searchData.from}
                    onChange={(e) => setSearchData({ ...searchData, from: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* To */}
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={searchData.to}
                    onChange={(e) => setSearchData({ ...searchData, to: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Departure Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Departure</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="date"
                    value={searchData.departure}
                    onChange={(e) => setSearchData({ ...searchData, departure: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Passengers */}
              <div>
                <label className="block text-sm font-medium mb-2">Passengers</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <select
                    value={searchData.passengers}
                    onChange={(e) => setSearchData({ ...searchData, passengers: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium mb-2">Class</label>
                <select
                  value={searchData.class}
                  onChange={(e) => setSearchData({ ...searchData, class: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors appearance-none"
                >
                  <option value="economy">Economy</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={!searchData.from || !searchData.to || !searchData.departure}
              className="w-full md:w-auto px-8 py-6 text-lg rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Flights
            </Button>
          </motion.div>

          {/* Popular Routes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-6">Popular Routes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularRoutes.map((route, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => {
                    setSearchData({
                      ...searchData,
                      from: route.from,
                      to: route.to,
                    });
                  }}
                  className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border-2 border-blue-200/50 hover:border-blue-300 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-lg">{route.from}</span>
                    <ArrowRight className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-lg">{route.to}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Starting from</div>
                  <div className="text-2xl font-bold text-blue-600">{route.price}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FlightsPage;
