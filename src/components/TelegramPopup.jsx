import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightFromBracket,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { ArrowUpRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const HOUR_IN_MS = 60 * 60 * 1000;

const TelegramBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState(20);
  const bannerRef = useRef(null);

  useEffect(() => {
    const checkAndShowPopup = () => {
      const lastClosedTime = localStorage.getItem('telegramPopupLastClosed');
      
      if (!lastClosedTime || Date.now() - parseInt(lastClosedTime) >= HOUR_IN_MS) {
        setTimeout(() => {
          setIsVisible(true);
        }, 2000);
      }
    };

    checkAndShowPopup();

    const updatePosition = () => {
      if (!bannerRef.current) return;
      
      const footer = document.querySelector('footer');
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const footerTop = footerRect.top;
      
      // If footer is in viewport
      if (footerTop <= viewportHeight) {
        const newBottom = viewportHeight - footerTop + 20; // 20px gap
        setPosition(newBottom);
      } else {
        setPosition(20); // Default position
      }
    };

    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    // Initial position
    updatePosition();

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('telegramPopupLastClosed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={bannerRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ 
          type: "spring",
          damping: 20,
          stiffness: 300,
        }}
        style={{ 
          position: 'fixed',
          left: '16px',
          bottom: `${position}px`,
          zIndex: 50
        }}
        className="hidden md:block"
      >
        <div className="w-[300px] rounded-lg border bg-background shadow-sm">
          <div className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Наш канал в Telegram</p>
                </div>
                <p className="text-xs text-muted-foreground/80 mb-3">
                Cоздание собственной корпорации с нуля. Следите за нашей историей 
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-muted-foreground/50 hover:text-muted-foreground -mt-1 -mr-1 p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Button
              asChild
              variant="default"
              size="sm"
              className="w-full h-7 text-xs hover:bg-black/90"
            >
              <a
                href="https://t.me/+Rr1lANKiKEwwOWYx"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1.5"
              >
                Подписаться
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TelegramBanner;  