import React from 'react';
import './Toggle.css';

interface ToggleProps {
  id: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}

const Toggle: React.FC<ToggleProps> = ({ id, name, checked, onChange, label }) => {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
      <div className="switch shrink-0">
        <input
          className="toggle"
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={onChange}
        />
        <span className="slider"></span>
        <span className="card-side"></span>
      </div>
      {label && <span className="text-white/80 select-none text-sm leading-tight">{label}</span>}
    </label>
  );
};

export default Toggle;
