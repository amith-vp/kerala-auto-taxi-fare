import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
}

const TaxiContent: React.FC<ContentProps> = ({ isExpanded }) => {
  const [formData, setFormData] = useState({
    distance: '5',
    waitingTime: '0',
    isHighCapacity: false,
  });

  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdown>({
    totalFare: 200,
    baseFare: 200,
    distanceCharge: 0,
    waitingCharge: 0,
  });

  const [calculatedDistance, setCalculatedDistance] = useState<number>(5);

  useEffect(() => {
    if (formData.distance) {
      calculateFare();
    }
  }, [formData]);

  const calculateFare = () => {
    const distanceValue = parseFloat(formData.distance);
    setCalculatedDistance(distanceValue);
    const waitingTimeValue = parseFloat(formData.waitingTime) || 0;
    const baseFare = formData.isHighCapacity ? 225 : 200;
    const ratePerKm = formData.isHighCapacity ? 20 : 18;
    let distanceCharge = 0;
    if (distanceValue > 5) {
      const extraDistance = distanceValue - 5;
      distanceCharge = extraDistance * ratePerKm;
    }
    const waitingCharge = Math.min(Math.ceil(waitingTimeValue) * 50, 500);
    const totalFare = baseFare + distanceCharge + waitingCharge;
    setFareBreakdown({
      totalFare,
      baseFare,
      distanceCharge,
      waitingCharge,
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
        Taxi Fare Calculator
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
            <label className="block text-white/90">Waiting Time (hours)</label>
            <input
              type="number"
              name="waitingTime"
              value={formData.waitingTime}
              onChange={handleInputChange}
              min="0"
              step="0.5"
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
              id="isHighCapacity"
              name="isHighCapacity"
              checked={formData.isHighCapacity}
              onChange={handleInputChange}
              label="1500cc and above"
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
                tooltip: formData.isHighCapacity 
                  ? "Base fare for first 5 kilometers (1500cc and above)"
                  : "Base fare for first 5 kilometers (below 1500cc)",
                details: "First 5 KM"
              },
              ...(fareBreakdown.distanceCharge > 0 ? [{
                label: "Distance Charge",
                amount: fareBreakdown.distanceCharge,
                tooltip: formData.isHighCapacity 
                  ? "₹20 per kilometer beyond 5 KM for high capacity taxis"
                  : "₹18 per kilometer beyond 5 KM for standard taxis",
                details: `${(calculatedDistance - 5).toFixed(1)} KM × ₹${formData.isHighCapacity ? '20' : '18'}/KM`
              }] : []),
              ...(fareBreakdown.waitingCharge > 0 ? [{
                label: "Waiting Charge",
                amount: fareBreakdown.waitingCharge,
                tooltip: "₹50 per hour, maximum ₹500 per day",
                details: `${formData.waitingTime} hours × ₹50/hour`
              }] : [])
            ]}
            service="taxi"
          />
        </motion.div>
      </div>
      <div className="mt-auto pt-4 pb-2 text-center space-y-1">
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

export default TaxiContent;
