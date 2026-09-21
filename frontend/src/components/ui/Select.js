import React from 'react';

const Select = ({ label, id, value, onChange, options = [], error }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>}
      <select id={id} value={value} onChange={onChange} className="w-full border rounded px-3 py-2">
        <option value="">Seleccione...</option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
        ))}
      </select>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Select;
