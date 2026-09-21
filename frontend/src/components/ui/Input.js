import React from 'react';

const Input = ({ label, id, type = 'text', value, onChange, error, maxLength, placeholder }) => {
  return (
    <div className="field-group">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        className="field-input"
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default Input;
