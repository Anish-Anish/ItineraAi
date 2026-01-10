import { useState } from "react";
import { motion } from "framer-motion";
import { Bus, Search, Calendar, ArrowRight, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BusPage = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    from: "",
    to: "",
    departure: "",
  });

  const handleSearch = () => {
    // Navigate to chat page with bus search query
    const query = `Find bus routes from ${searchData.from} to ${searchData.to} on ${searchData.departure}`;
    navigate(`/chat?query=${encodeURIComponent(query)}`);
  };

  const popularRoutes = [
    { from: "Delhi", to: "Jaipur", duration: "5-6 hours", price: "₹450" },
    { from: "Mumbai", to: "Pune", duration: "3-4 hours", price: "₹350" },
    { from: "Bangalore", to: "Chennai", duration: "6-7 hours", price: "₹550" },
    { from: "Delhi", to: "Agra", duration: "3-4 hours", price: "₹400" },
    { from: "Chennai", to: "Bangalore", duration: "6-7 hours", price: "₹600" },
    { from: "Kolkata", to: "Darjeeling", duration: "10-12 hours", price: "₹800" },
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <Bus className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              Book Bus Tickets
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find and compare bus routes across India. Travel comfortably at affordable prices.
            </p>
          </motion.div>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl shadow-xl p-8 mb-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* From */}
              <div>
                <label className="block text-sm font-medium mb-2">From</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Delhi"
                    value={searchData.from}
                    onChange={(e) => setSearchData({ ...searchData, from: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* To */}
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Jaipur"
                    value={searchData.to}
                    onChange={(e) => setSearchData({ ...searchData, to: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors"
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
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={!searchData.from || !searchData.to || !searchData.departure}
              className="w-full md:w-auto px-8 py-6 text-lg rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Bus Routes
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
                  className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border-2 border-green-200/50 hover:border-green-300 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-lg">{route.from}</span>
                    <ArrowRight className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-lg">{route.to}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>{route.duration}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Starting from</div>
                  <div className="text-2xl font-bold text-green-600">{route.price}</div>
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
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Bus className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Multiple Operators</h3>
              <p className="text-sm text-muted-foreground">
                Compare buses from various operators
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-xl text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Live Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Track your bus in real-time
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-xl text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Flexible Booking</h3>
              <p className="text-sm text-muted-foreground">
                Easy cancellation and rescheduling
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BusPage;
