import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SquareArrowOutUpRight } from 'lucide-react';
import AutoContent from './components/AutoContent';
import BusContent from './components/BusContent';
import TaxiContent from './components/TaxiContent';

const icons: { [key: string]: string } = {
  auto: "vehicles/auto.svg",
  bus:  "vehicles/bus.svg",
  taxi: "vehicles/car.svg"
};

const iconSizes: { [key: string]: string } = {
  auto: "w-44 h-56 [filter:drop-shadow(0_-4px_6px_rgba(255,255,255,0))_drop-shadow(0_10px_8px_rgba(255,255,255,0.1))]",
  bus:  "w-44 h-64 [filter:drop-shadow(0_-4px_6px_rgba(255,255,255,0))_drop-shadow(0_10px_8px_rgba(255,255,255,0.1))]",
  taxi: "w-44 h-48 [filter:drop-shadow(0_-4px_6px_rgba(255,255,255,0))_drop-shadow(0_10px_8px_rgba(255,255,255,0.1))]"
};

function modulo(m: number, n: number) {
  return ((m % n) + n) % n;
}

function App() {
  const [front, setFront] = useState(0);
  const [swipeKeyframes, setSwipeKeyframes] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [headerText, setHeaderText] = useState('Auto Rickshaw');
  const [prevFront, setPrevFront] = useState(0);
  const [animateSvg, setAnimateSvg] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);

  const scrollAccumulator = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isAnimating = useRef(false);
  const isDragging = useRef(false);

  const cards = [
    {
      title: "Auto Rikshaw",
      type: "auto",
      color: "bg-gradient-to-br from-white/20 to-white/10",
      expandedColor: "bg-gradient-to-br from-white/15 to-white/5",
      borderColor: "border-white/20"
    },
    {
      title: "Bus",
      type: "bus",
      color: "bg-gradient-to-br from-white/20 to-white/10",
      expandedColor: "bg-gradient-to-br from-white/15 to-white/5",
      borderColor: "border-white/20"
    },
    {
      title: "Taxi",
      type: "taxi",
      color: "bg-gradient-to-br from-white/20 to-white/10",
      expandedColor: "bg-gradient-to-br from-white/15 to-white/5",
      borderColor: "border-white/20"
    }
  ];

  const cardsLength = cards.length;

  useEffect(() => {
    setHeaderText(cards[front].title);
  }, [front]);

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (event: any, info: any) => {
    if (!isExpanded && Math.abs(info.velocity.x) > 10) {
      const direction = info.velocity.x < 0 ? 1 : -1;
      setPrevFront(front);
      setFront((front + direction + cardsLength) % cardsLength);
      setSwipeKeyframes(direction * 150);
      setAnimateSvg(true);
    }
      isDragging.current = false;
      setDragDistance(0);
  };

  const handleCardClick = (diff: number) => {
    if (isDragging.current) return;
    
    if (!isExpanded && diff === 0) {
      setIsExpanded(true);
      setActiveTab(front);
    }
    if (!isExpanded) {
      setPrevFront(front);
      if (diff === cardsLength - 1) {
        setFront((front - 1 + cardsLength) % cardsLength);
      } else if (diff === 1) {
        setFront((front + 1) % cardsLength);
      }
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    setFront(index);
  };

  const getContentComponent = (type: string) => {
    switch (type) {
      case 'auto':
        return <AutoContent isExpanded={isExpanded} />;
      case 'bus':
        return <BusContent isExpanded={isExpanded} />;
      case 'taxi':
        return <TaxiContent isExpanded={isExpanded} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const tutorialShown = localStorage.getItem('tutorialShown');
    if (!tutorialShown) {
      setTimeout(() => {
        setTutorialVisible(true);
        setTimeout(() => {
          setTutorialVisible(false);
          setShowTutorial(false);
          localStorage.setItem('tutorialShown', 'true');
        }, 3000);
      }, 1500);
    } else {
      setShowTutorial(false);
    }
  }, []);

  useEffect(() => {
    const handleWheelEvent = (e: WheelEvent) => {
      if (!isExpanded) {
        e.preventDefault();
        scrollAccumulator.current += e.deltaY;
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
        scrollTimeout.current = setTimeout(() => {
          const direction = Math.sign(scrollAccumulator.current);
          if (Math.abs(scrollAccumulator.current) > 50) {
            setPrevFront(prev => prev);
            setFront(prev => modulo(prev + direction, cardsLength));
            setSwipeKeyframes(direction * 150);
            setAnimateSvg(true);
            isAnimating.current = true;
            setTimeout(() => {
              setAnimateSvg(false);
              isAnimating.current = false;
            }, 1);
          }
          scrollAccumulator.current = 0;
        }, 100);
      }
    };
    document.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheelEvent);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [isExpanded, cardsLength]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-screen fixed inset-0 bg-[#0b0f14] p-4 md:p-8 flex flex-col"
      >
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: tutorialVisible ? 1 : 0,
              x: tutorialVisible ? [50, -50] : 0,
              y: tutorialVisible ? [0, -20, 0] : 0
            }}
            transition={{
              opacity: { duration: 0.3 },
              x: { duration: 1.5, ease: "easeInOut" },
              y: { duration: 1.5, ease: "easeInOut" }
            }}
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className="flex items-center gap-4 text-white/90">
              <motion.div
                animate={{ 
                  x: [20, -20],
                  y: [0, -9, 0]
                }}
                transition={{ 
                  duration: 1.5, 
                  ease: "easeInOut"
                }}
                className="w-4 h-4 bg-white rounded-full"
              />
              <span className="text-lg font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                Swipe
              </span>
            </div>
          </motion.div>
        )}
        <div className="relative w-full max-w-4xl mx-auto h-full">
          <div className="absolute inset-0 backdrop-blur-sm"></div>
          <div className="relative h-full flex flex-col">
            {!isExpanded && (
              <motion.div 
                className="text-center"
                initial={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80  tracking-wide mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                  Kerala Auto Taxi Fare Calculator 
                </h1>
                <p className="text-xl text-white/90  max-w-2xl mx-auto leading-relaxed mb-4 drop-shadow-sm backdrop-blur-[2px]">
                  Calculate the fare for your Auto Rikshaw, Bus, or Taxi ride in Kerala.
                </p>
              </motion.div>
            )}
            <div className={`flex-1 flex justify-center ${isExpanded ? 'pt-0' : 'pt-8'}`}>
              <motion.div 
                className="relative"
                animate={{
                  width: isExpanded ? '100%' : '18rem',
                  height: isExpanded ? 'calc(100vh - 120px)' : '20rem'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {cards.map((card, index) => {
                  const diff = modulo(index - front, cardsLength);
                  const isCenter = diff === 0;
                  const isLeft = diff === cardsLength - 1;
                  const isRight = diff === 1;
                  if (isExpanded && !isCenter) return null;
                  return (
                    <motion.div 
                      key={card.title}
                      initial={false}
                      layout
                      layoutId={`card-${index}`}
                      animate={{
                        zIndex: isExpanded 
                          ? 30 
                          : (() => {
                              const isMovingCard = prevFront === index;
                              if (isCenter) return 30;
                              if (isMovingCard) return 20;
                              return 10;
                            })(),
                        x: isExpanded 
                          ? 0 
                          : (isLeft ? -180 : isRight ? 180 : 0),
                        y: isExpanded 
                          ? (diff * 60) 
                          : (isCenter ? 0 : 20),
                        height: isExpanded ? '90vh' : '20rem',
                        scale: isExpanded ? (isCenter ? 1 : 0.9) : (isCenter ? 1 : 0.9),
                        rotate: isExpanded 
                          ? 0 
                          : (isLeft ? -15 : isRight ? 15 : 0),
                        opacity: isExpanded ? (isCenter ? 1 : 0) : (isCenter ? 1 : 0.7),
                        width: isExpanded ? '100%' : '18rem',
                        position: 'absolute',
                        top: isExpanded ? 0 : 'auto',
                        left: isExpanded ? 0 : 'auto',
                        pointerEvents: isExpanded && !isCenter ? 'none' : 'auto'
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400, 
                        damping: 40,  
                        layout: {
                          duration: 0, 
                          type: "keyframes"
                        }
                      }}
                      drag={!isExpanded && isCenter ? "x" : false}
                      dragConstraints={{ left: -100, right: 100 }}
                      dragElastic={0.1}
                      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                      whileDrag={{
                        cursor: "grabbing",
                        scale: 1.02
                      }}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleCardClick(diff)}
                      onDrag={(event, info) => {
                        setDragDistance(info.offset.x);
                      }}
                      dragSnapToOrigin
                      className={`
                        absolute select-none
                        ${!isCenter ? 'cursor-pointer' : 
                          isExpanded ? 'cursor-default' : 'cursor-grab'
                        }
                        ${isExpanded ? card.expandedColor : 'bg-white/15'} 
                        border border-white/[0.18]
                        rounded-[10px]
                        shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
                        backdrop-blur-[6px]
                        [-webkit-backdrop-filter:blur(6px)]
                        overflow-hidden
                        flex flex-col
                        origin-center
                        transition-colors duration-300
                      `}
                    >
                      <div className={`shrink-0 flex items-center px-6 ${isExpanded ? 'h-12' : 'h-10'}`}>
                        {isExpanded ? (
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl font-bold text-white drop-shadow-lg">
                                {card.title}
                              </h2>
                              <img 
                                src={icons[card.type]} 
                                alt={card.title} 
                                className="h-8 w-auto"
                              />
                            </div>
                            <button
                              onClick={handleClose}
                              className="p-2 rounded-full transition-colors hover:bg-white/20 text-white/90 hover:text-white"
                            >
                              <X size={25} />
                            </button>
                          </div>
                        ) : (
                          <h2 className="text-xl font-bold text-white drop-shadow-lg w-full text-center">
                            {card.title}
                          </h2>
                        )}
                      </div>
                      <div className={`flex-1 flex items-center justify-center ${isExpanded ? 'hidden' : ''}`}>
                        <motion.img 
                          src={icons[card.type]} 
                          alt={card.title}
                          className={`${iconSizes[card.type]} select-none pointer-events-none`}
                          animate={animateSvg && isCenter ? {
                            scale: [1, 1.01, 1],
                            rotate: [0, -1, 1, 0]
                          } : {}}
                          transition={{
                            duration: 0.5,
                            ease: "easeInOut"
                          }}
                        />
                      </div>
                      {!isExpanded && isCenter && (
                        <div className="absolute bottom-4 right-4">
                          <motion.div 
                            whileHover={{ scale: 1.1, y: 2 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <SquareArrowOutUpRight className="w-6 h-6 text-white/90" />
                          </motion.div>
                        </div>
                      )}
                      {getContentComponent(card.type)}
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default App;