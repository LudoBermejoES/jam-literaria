import React, { useEffect, useRef } from 'react';
import './TextArea.css';

const TextArea = ({ 
  id, 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  minHeight = '120px',
  maxHeight = '300px'
}) => {
  const textareaRef = useRef(null);
  
  // Auto-resize function to expand the textarea as content grows
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set new height based on scrollHeight, with min and max constraints
    const newHeight = Math.max(
      parseInt(minHeight), 
      Math.min(parseInt(maxHeight), textarea.scrollHeight)
    );
    
    textarea.style.height = `${newHeight}px`;
  };
  
  // Call autoResize when value changes
  useEffect(() => {
    autoResize();
  }, [value]);
  
  return (
    <div className="textarea-container">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`auto-resize-textarea ${disabled ? 'disabled' : ''}`}
        style={{ minHeight, maxHeight }}
        onInput={autoResize}
      />
    </div>
  );
};

export default TextArea; 