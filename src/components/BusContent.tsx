import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FareBreakdown } from './FareBreakdown';
import { MapIcon } from 'lucide-react';
import MapDistance from './MapDistance';

interface ContentProps {
  isExpanded: boolean;
}

interface BusService {
  id: string;
  name: string;
  farePerKm: number;
  minFare: number;
  minDistance: number;
  roundingMultiple?: number;
}

const busServices: BusService[] = [
  { id: "ordinary", name: "Ordinary/Mofussil Services", farePerKm: 1.00, minFare: 10, minDistance: 2.5, roundingMultiple: 1 },
  { id: "cityFast", name: "City Fast Services", farePerKm: 1.03, minFare: 12, minDistance: 2.5, roundingMultiple: 1 },
  { id: "fastPassenger", name: "Fast Passenger Services", farePerKm: 1.05, minFare: 15, minDistance: 5, roundingMultiple: 1 },
  { id: "superFast", name: "Super Fast Services", farePerKm: 1.08, minFare: 22, minDistance: 10, roundingMultiple: 1 },
  { id: "express", name: "Express/Super Express Services", farePerKm: 1.10, minFare: 28, minDistance: 15, roundingMultiple: 5 },
  { id: "superAir", name: "Super Air Express", farePerKm: 1.15, minFare: 35, minDistance: 15, roundingMultiple: 5 },
  { id: "superDeluxe", name: "Super Deluxe/Semi Sleeper Services", farePerKm: 1.20, minFare: 40, minDistance: 15, roundingMultiple: 10 },
  { id: "luxury", name: "Luxury/High-Tech and AC Services", farePerKm: 1.50, minFare: 60, minDistance: 20, roundingMultiple: 10 },
  { id: "singleAxle", name: "Single Axle Services", farePerKm: 1.81, minFare: 60, minDistance: 20, roundingMultiple: 10 },
  { id: "multiAxle", name: "Multi Axle Services", farePerKm: 2.25, minFare: 100, minDistance: 20, roundingMultiple: 10 },
  { id: "lowFloorAC", name: "Low Floor Air Conditioned Services", farePerKm: 1.75, minFare: 26, minDistance: 5, roundingMultiple: 2 },
  { id: "lowFloorNonAC", name: "Low Floor Non-AC Services", farePerKm: 1.00, minFare: 10, minDistance: 2.5, roundingMultiple: 1 },
  { id: "acSleeper", name: "A/C Sleeper Services", farePerKm: 2.50, minFare: 130, minDistance: 20, roundingMultiple: 10 }
];

const BusContent: React.FC<ContentProps> = ({ isExpanded }) => {
  const [selectedService, setSelectedService] = useState<string>("ordinary");
  const [distance, setDistance] = useState<string>("2.5");
  const [calculatedFare, setCalculatedFare] = useState<{
    minFare: number;
    additionalFare: number;
    totalFare: number;
  }>({ minFare: 10, additionalFare: 0, totalFare: 10 });
  const [showMap, setShowMap] = useState(false);

  const calculateFare = () => {
    const service = busServices.find(s => s.id === selectedService)!;
    const distanceValue = parseFloat(distance);
    if (distanceValue <= service.minDistance) {
      setCalculatedFare({
        minFare: service.minFare,
        additionalFare: 0,
        totalFare: service.minFare
      });
      return;
    }
    const additionalDistance = distanceValue - service.minDistance;
    const additionalFare = additionalDistance * service.farePerKm;
    let totalFare = service.minFare + additionalFare;
    let roundedTotalFare = totalFare;
    if (service.roundingMultiple && service.roundingMultiple > 1) {
      roundedTotalFare = Math.ceil(totalFare / service.roundingMultiple) * service.roundingMultiple;
    } else {
      const rupees = Math.floor(totalFare);
      const paise = Math.round((totalFare - rupees) * 100);
      if (paise >= 1 && paise <= 49) {
        roundedTotalFare = rupees;
      } else if (paise >= 50 && paise <= 99) {
        roundedTotalFare = rupees + 1;
      }
    }
    setCalculatedFare({
      minFare: service.minFare,
      additionalFare: roundedTotalFare - service.minFare,
      totalFare: roundedTotalFare
    });
  };

  useEffect(() => {
    calculateFare();
  }, [selectedService, distance]);

  if (!isExpanded) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="pt-2 h-[calc(100%-3rem)] overflow-y-auto flex flex-col"
    >
      <motion.h3 
        className="text-xl font-semibold text-white px-6 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Bus Fare Calculator
      </motion.h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pt-3">
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="space-y-2"
            whileHover={{ scale: 1.005 }}
          >
            <label className="block text-white/90">Distance (KM)</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                step="0.1"
                min="0"
                className="w-[180px] px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
              <span className="text-white/50 text-sm px-1">OR</span>
              <button
                onClick={() => setShowMap(true)}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2 justify-center"
                title="Calculate distance using map"
              >
                <MapIcon className="w-5 h-5" />
                <span>Map</span>
              </button>
            </div>
          </motion.div>
          <div className="space-y-2">
            <label className="block text-white/90">Bus Service Type</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white [&>option]:text-gray-900"
            >
              {busServices.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <FareBreakdown
            fares={[
              {
                label: "Minimum Fare",
                amount: calculatedFare.minFare,
                tooltip: `Base fare for first ${busServices.find(s => s.id === selectedService)?.minDistance} kilometers`,
                details: `₹${calculatedFare.minFare} (up to ${busServices.find(s => s.id === selectedService)?.minDistance} KM)`
              },
              ...(calculatedFare.additionalFare > 0 ? [{
                label: "Additional Distance",
                amount: calculatedFare.additionalFare - (calculatedFare.totalFare - (calculatedFare.minFare + (parseFloat(distance) - busServices.find(s => s.id === selectedService)!.minDistance) * busServices.find(s => s.id === selectedService)!.farePerKm)),
                tooltip: `Fare for distance beyond minimum distance at ₹${busServices.find(s => s.id === selectedService)?.farePerKm.toFixed(2)}/km`,
                details: `${(parseFloat(distance) - (busServices.find(s => s.id === selectedService)?.minDistance || 0)).toFixed(1)} KM × ₹${busServices.find(s => s.id === selectedService)?.farePerKm.toFixed(2)}/km`
              }] : []),
              ...((calculatedFare.additionalFare > 0 && 
                Math.abs(calculatedFare.totalFare - (calculatedFare.minFare + (parseFloat(distance) - busServices.find(s => s.id === selectedService)!.minDistance) * busServices.find(s => s.id === selectedService)!.farePerKm)) > 0.01
              ) ? [{
                label: "Rounding Adjustment",
                amount: calculatedFare.totalFare - (calculatedFare.minFare + (parseFloat(distance) - busServices.find(s => s.id === selectedService)!.minDistance) * busServices.find(s => s.id === selectedService)!.farePerKm),
                tooltip: `Rounded to nearest ${busServices.find(s => s.id === selectedService)?.roundingMultiple === 1 ? 'rupee' : `₹${busServices.find(s => s.id === selectedService)?.roundingMultiple}`}`,
                details: `Rounded from ₹${(calculatedFare.minFare + (parseFloat(distance) - busServices.find(s => s.id === selectedService)!.minDistance) * busServices.find(s => s.id === selectedService)!.farePerKm).toFixed(2)} to ₹${calculatedFare.totalFare}`
              }] : [])
            ]}
            service="bus"
          />
        </motion.div>
      </div>
      {showMap && (
        <MapDistance
          onDistanceCalculated={(distance) => {
            setDistance(distance.toFixed(2));
          }}
          onClose={() => setShowMap(false)}
        />
      )}
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
          href="https://mvd.kerala.gov.in/sites/default/files/Downloads/Stage%20Carriage%20Fare%20Revision_.pdf"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/20 hover:text-white/40 text-[10px] block transition-colors"
        >
          Stage Carriage(Bus)Fare Revision G.O.(P) No.17/2022/TRANS
        </motion.a>
      </div>
    </motion.div>
  );
};

export default BusContent;
