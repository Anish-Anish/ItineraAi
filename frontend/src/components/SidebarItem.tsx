import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
  shortcut?: string;
  isAction?: boolean;
}

const SidebarItem = ({
  icon: Icon,
  label,
  isActive,
  isExpanded,
  onClick,
  shortcut,
  isAction,
}: SidebarItemProps) => {
  const button = (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border
        transition-all duration-200 bg-transparent
        ${
          isActive
            ? "bg-white text-gray-900 border-[#d7e3ff] shadow-[0_8px_20px_rgba(79,141,255,0.12)]"
            : "text-gray-500 border-transparent hover:bg-[#eef3ff] hover:text-gray-900 hover:border-[#d7e3ff]"
        }
        ${!isExpanded ? "justify-center" : ""}
      `}
    >
      {/* Active indicator */}
      {isActive && isExpanded && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#4f8dff] rounded-r-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {/* Icon */}
      <Icon
        className={`w-5 h-5 flex-shrink-0 ${isExpanded ? "" : "mx-auto"}`}
      />

      {/* Label and Shortcut */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between flex-1 min-w-0"
        >
          <span className="text-sm font-medium truncate">{label}</span>
          {shortcut && (
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
              {shortcut}
            </span>
          )}
        </motion.div>
      )}
    </motion.button>
  );

  // Wrap with tooltip when collapsed
  if (!isExpanded) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-white text-gray-900 border border-gray-200 shadow-lg"
          >
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

export default SidebarItem;
