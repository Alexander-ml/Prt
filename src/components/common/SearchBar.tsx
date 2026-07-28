import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = ''
}) => {
  return (
    <div className={`position-relative ${className}`}>
      <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
      <input
        type="text"
        className="form-control ps-5 pe-4 py-2 border-secondary-subtle rounded-3 shadow-none"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted text-decoration-none me-2"
          onClick={() => onChange('')}
          type="button"
        >
          <i className="bi bi-x-circle-fill"></i>
        </button>
      )}
    </div>
  );
};
