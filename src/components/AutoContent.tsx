import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { FareBreakdown } from './FareBreakdown';
import Toggle from './Toggle';

interface ContentProps {
  isExpanded: boolean;
}

interface FareBreakdown {
  totalFare: number;
  baseFare: number;
  distanceCharge: number;
  waitingCharge: number;
  nightTimeCharge: number;
  specifiedRegionCharge: number;
}

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block">
    <HelpCircle className="w-4 h-4 text-white/50 inline-block ml-1 cursor-help" />
    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-sm rounded-lg py-2 px-3 absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 pointer-events-none backdrop-blur-sm before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-black/80">
      {text}
    </div>
  </div>
);

const AutoContent: React.FC<ContentProps> = ({ isExpanded }) => {
  const [formData, setFormData] = useState({
    distance: '1.5',
    waitingTime: '0',
    isNightTime: false,
    isReturnJourney: false,
    isMajorCity: false
  });

  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdown>({
    totalFare: 30,
    baseFare: 30,
    distanceCharge: 0,
    waitingCharge: 0,
    nightTimeCharge: 0,
    specifiedRegionCharge: 0
  });

  const [calculatedDistance, setCalculatedDistance] = useState<number>(1.5);

  useEffect(() => {
    if (formData.distance) {
      calculateFare();
    }
  }, [formData]);

  const calculateFare = () => {
    const distanceValue = parseFloat(formData.distance);
    setCalculatedDistance(distanceValue);
    const waitingTimeValue = parseFloat(formData.waitingTime) || 0;
    const baseFare = 30;
    let extraDistance = 0;
    let distanceCharge = 0;
    if (distanceValue > 1.5) {
      extraDistance = distanceValue - 1.5;
      const ratePer100Meters = 1.50;
      distanceCharge = Math.ceil(extraDistance * 10) * ratePer100Meters;
    }
    const waitingCharge = Math.min(Math.ceil(waitingTimeValue / 15) * 10, 250);
    let totalFare = baseFare + distanceCharge + waitingCharge;
    let nightTimeCharge = 0;
    let specifiedRegionCharge = 0;
    if (formData.isNightTime) {
      nightTimeCharge = totalFare * 0.5;
      totalFare += nightTimeCharge;
    } else if (!formData.isReturnJourney && !formData.isMajorCity) {
      specifiedRegionCharge = (distanceCharge) * 0.5;
      distanceCharge += specifiedRegionCharge;
      totalFare = baseFare + distanceCharge + waitingCharge;
    }
    setFareBreakdown({
      totalFare,
      baseFare,
      distanceCharge,
      waitingCharge,
      nightTimeCharge,
      specifiedRegionCharge
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isExpanded) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pt-2 h-[calc(100%-3rem)] overflow-y-auto flex flex-col"
    >
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-xl font-semibold text-white px-6 mb-2"
      >
        Auto Rickshaw Fare Calculator
      </motion.h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pt-3">
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="space-y-2"
            whileHover={{ scale: 1.005 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <label className="block text-white/90">Distance (KM)</label>
            <input
              type="number"
              name="distance"
              value={formData.distance}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </motion.div>
          <motion.div 
            className="space-y-2"
            whileHover={{ scale: 1.005 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <label className="block text-white/90">Waiting Time (minutes)</label>
            <input
              type="number"
              name="waitingTime"
              value={formData.waitingTime}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </motion.div>
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Toggle
              id="isMajorCity"
              name="isMajorCity"
              checked={formData.isMajorCity}
              onChange={handleInputChange}
              label="Major City (Thiruvananthapuram, Kollam, Kochi, Thrissur, Kozhikode, Kannur, Palakkad, or Kottayam)"
            />
            <Toggle
              id="isNightTime"
              name="isNightTime"
              checked={formData.isNightTime}
              onChange={handleInputChange}
              label="Night Time (10 PM - 5 AM)"
            />
            <Toggle
              id="isReturnJourney"
              name="isReturnJourney"
              checked={formData.isReturnJourney}
              onChange={handleInputChange}
              label="Includes Return Journey"
            />
          </motion.div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <FareBreakdown
            fares={[
              {
                label: "Minimum Fare",
                amount: fareBreakdown.baseFare,
                tooltip: "Base fare charged for the first 1.5 kilometers of travel",
                details: "1.5 KM"
              },
              ...(fareBreakdown.distanceCharge > 0 ? [{
                label: "Distance Charge",
                amount: fareBreakdown.distanceCharge,
                tooltip: formData.isMajorCity ? 
                  "Major City: ₹15 per kilometer beyond the first 1.5 KM" :
                  "Rural Area: ₹15 per kilometer beyond the first 1.5 KM + 50% additional charge for one-way trips (5 AM - 10 PM)",
                details: calculatedDistance > 1.5 ? 
                  `(${(calculatedDistance - 1.5).toFixed(1)} KM × ₹15/KM)${!formData.isMajorCity && !formData.isNightTime && !formData.isReturnJourney ? ' × 1.5' : ''}` : undefined
              }] : []),
              ...(fareBreakdown.waitingCharge > 0 ? [{
                label: "Waiting Charge",
                amount: fareBreakdown.waitingCharge,
                tooltip: `₹10 charged for every 15 minutes of waiting time (Maximum: ₹250)`,
                details: `₹10 per 15 minutes`
              }] : []),
              ...(fareBreakdown.nightTimeCharge > 0 ? [{
                label: "Night Time Charge",
                amount: fareBreakdown.nightTimeCharge,
                tooltip: "50% additional charge for travel between 10:00 PM and 5:00 AM",
                details: `(₹${fareBreakdown.baseFare}${
                  fareBreakdown.distanceCharge ? ` + ₹${fareBreakdown.distanceCharge}` : ''
                }${
                  fareBreakdown.waitingCharge ? ` + ₹${fareBreakdown.waitingCharge}` : ''
                }) × 0.5`
              }] : [])
            ]}
            service="auto"
          />
        </motion.div>
      </div>
      <div className="mt-auto pt-4 pb-2 text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <motion.a
            href="https://amithv.xyz"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/30 hover:text-white/50 text-xs transition-colors"
          >
            by Amith
          </motion.a>
          <span className="text-white/30">•</span>
          <motion.a
            href="https://github.com/amith-vp/kerala-auto-taxi-fare"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/30 hover:text-white/50 text-xs transition-colors"
          >
            GitHub
          </motion.a>
        </div>
        <motion.a
          href="https://mvd.kerala.gov.in/sites/default/files/Downloads/G.O.P.No_.14-2022-TRANS.pdf"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/20 hover:text-white/40 text-[10px] block transition-colors"
        >
          Based on Kerala MVD fare notification (G.O.P No. 14/2022/TRANS)
        </motion.a>
      </div>
    </motion.div>
  );
};

export default AutoContent;
