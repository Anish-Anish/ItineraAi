import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeft,
  PanelLeftClose,
  Edit,
  Search,
  Library,
  Compass,
  Grid3x3,
  FolderKanban,
  Settings,
  User,
} from "lucide-react";
import SidebarItem from "./SidebarItem";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const [activeItem, setActiveItem] = useState("new-chat");

  const menuItems = [
    { id: "new-chat", icon: Edit, label: "New chat", action: true },
    { id: "search", icon: Search, label: "Search chats", shortcut: "⌘K" },
    { id: "library", icon: Library, label: "Library" },
    { id: "atlas", icon: Compass, label: "Atlas" },
    { id: "gpts", icon: Grid3x3, label: "GPTs" },
    { id: "projects", icon: FolderKanban, label: "Projects" },
  ];

  const recentChats = [
    "Code optimization steps",
    "Job application email guide",
    "DS_Store file platforms",
    "Activate Cursor Premium Fr...",
    "Goa trip planning questions",
    "Employee salary summary",
    "Import TTL into Neo4j",
    "Salt in bcrypt usage",
    "Stranger Things season 5 r...",
    "Auth 🔥",
    "Create summarizer tool",
  ];

  return (
    <motion.div
      initial={false}
      animate={{
        width: isOpen ? "280px" : "70px",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="fixed left-0 top-0 h-screen bg-[#f9fbff] border-r border-[#e4ecff] flex flex-col z-50 shadow-[0_10px_30px_rgba(79,141,255,0.08)] text-gray-800"
    >
      {/* Header with Logo and Toggle */}
      <div className="flex items-center justify-between p-3 border-b border-[#e4ecff]">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="logo-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-[0_6px_16px_rgba(79,141,255,0.18)]">
                <svg
                  className="w-5 h-5 text-[#4f8dff]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-[0_6px_16px_rgba(79,141,255,0.18)]"
            >
              <svg
                className="w-5 h-5 text-[#4f8dff]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={onToggle}
              className="w-8 h-8 rounded-lg hover:bg-[#e9f0ff] flex items-center justify-center transition-colors"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-5 h-5 text-gray-600" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Collapsed Toggle Button */}
      {!isOpen && (
        <div className="p-3 border-b border-[#e4ecff]">
          <button
            onClick={onToggle}
            className="w-full h-10 rounded-lg hover:bg-[#e9f0ff] flex items-center justify-center transition-colors"
            title="Open sidebar"
          >
            <PanelLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin scrollbar-thumb-[#c6d6ff] scrollbar-track-transparent">
        <div className="space-y-1 px-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeItem === item.id}
              isExpanded={isOpen}
              onClick={() => setActiveItem(item.id)}
              shortcut={item.shortcut}
              isAction={item.action}
            />
          ))}
        </div>

        {/* Recent Chats Section */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 px-2"
            >
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">
                Your chats
              </h3>
              <div className="space-y-0.5">
                {recentChats.map((chat, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 rounded-xl border border-transparent hover:border-[#d7e3ff] hover:bg-white text-sm text-gray-600 truncate transition-colors"
                    title={chat}
                  >
                    {chat}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Section - Settings & Profile */}
      <div className="border-t border-[#e4ecff] p-2 space-y-1">
        <SidebarItem
          icon={Settings}
          label="Settings"
          isActive={false}
          isExpanded={isOpen}
          onClick={() => setActiveItem("settings")}
        />
        <SidebarItem
          icon={User}
          label="Profile"
          isActive={false}
          isExpanded={isOpen}
          onClick={() => setActiveItem("profile")}
        />
      </div>
    </motion.div>
  );
};

export default Sidebar;
